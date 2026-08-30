import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users, Layers, CalendarDays, LayoutDashboard,
  Sparkles, Settings, GraduationCap, FileText,
  Shuffle, Download, Upload, LogOut, ChevronDown,
} from 'lucide-react';
import { AppData, Student, Activity, Evaluation, WeeklyComment, AIReport, Note } from './types';
import {
  fetchAll, fetchClasses, createClass, uploadBackup, ClassInfo,
  dbAddStudent, dbUpdateStudent, dbDeleteStudent,
  dbAddActivity, dbUpdateActivity, dbDeleteActivity,
  dbSaveEvaluation, dbDeleteEvaluationsForActivity, dbDeleteEvaluationsForStudent,
  dbSaveWeeklyComment, dbDeleteWeeklyCommentsForStudent,
  dbSaveAIReport, dbDeleteAIReportsForStudent,
  dbAddNote, dbUpdateNote, dbDeleteNote,
} from './utils/storage';
import { supabase } from './utils/supabaseClient';
import { keepAlive } from './utils/keepAlive';
import ProfileEditModal from './components/ProfileEditModal';

import StudentList from './components/StudentList';
import ActivityManager from './components/ActivityManager';
import EvaluationModal from './components/EvaluationModal';
import WeeklyTracker from './components/WeeklyTracker';
import SynthesisView from './components/SynthesisView';
import AssistantIA from './components/AssistantIA';
import StudentProfileModal from './components/StudentProfileModal';
import NotesManager from './components/NotesManager';
import LotteryManager from './components/LotteryManager';
import TeacherDashboard from './components/TeacherDashboard';
import AuthScreen from './components/AuthScreen';
import ProfileSetup from './components/ProfileSetup';
import DevPage from './components/DevPage';
import AppS1Math from './components/s1math/AppS1Math';

type Tab = 'dashboard' | 'activites' | 'eleves' | 'hebdo' | 'teacher' | 'ia' | 'notes' | 'lottery';

interface UserProfile {
  id: string;
  fullName: string;
  subjects: string[];
  years: string[];
}

const EMPTY_DATA: AppData = {
  students: [], activities: [], evaluations: [],
  weeklyComments: [], aiReports: [], notes: [],
};

const isFirstPrimary = (profile: UserProfile) => {
  return profile.years.includes('P1') && profile.subjects.some(s =>
    ['général', 'mathématiques', 'français'].includes(s)
  );
};

const isS1Math = (profile: UserProfile) => {
  return profile.years.includes('S1') && profile.subjects.includes('mathématiques');
};

// Génère les classes à partir du profil
const generateClasses = (profile: UserProfile): { name: string; level: string; subject: string }[] => {
  return profile.years.map(year => {
    const levelLabel = year.startsWith('P')
      ? `${year.slice(1)}ère Primaire`
      : `${year.slice(1)}ère Secondaire`;
    const subject = profile.subjects[0] || 'général';
    return {
      name: levelLabel,
      level: year,
      subject,
    };
  });
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [activeClass, setActiveClass] = useState<ClassInfo | null>(null);
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showClassSelector, setShowClassSelector] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // AUTH
  // ============================================================
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else {
        setProfile(null);
        setAuthLoading(false);
        setData(EMPTY_DATA);
        setIsLoaded(false);
        setClasses([]);
        setActiveClass(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      setProfile(null);
      setAuthLoading(false);
      return;
    }

    const userProfile: UserProfile = {
      id: data.id,
      fullName: data.full_name,
      subjects: data.subjects || [],
      years: data.years || [],
    };
    setProfile(userProfile);

    // Charge les classes existantes
    let existingClasses = await fetchClasses(userId);

// Synchronise les classes avec le profil
const expectedLevels = userProfile.years;
const existingLevels = existingClasses.map(c => c.level);

// Supprime les classes qui ne sont plus dans le profil
for (const c of existingClasses) {
  if (!expectedLevels.includes(c.level)) {
    await supabase.from('classes').delete().eq('id', c.id);
  }
}

// Crée les classes manquantes
for (const year of expectedLevels) {
  if (!existingLevels.includes(year)) {
    const levelLabel = year.startsWith('P') ? `${year.slice(1)}ère Primaire` : `${year.slice(1)}ère Secondaire`;
    const subject = userProfile.subjects[0] || 'général';
    const created = await createClass(userId, levelLabel, year, subject);
    if (created) existingClasses.push(created);
  }
}

// Refiltre après synchronisation
existingClasses = existingClasses.filter(c => expectedLevels.includes(c.level));

    setClasses(existingClasses);
    setActiveClass(existingClasses[0] || null);
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setData(EMPTY_DATA);
    setIsLoaded(false);
    setClasses([]);
    setActiveClass(null);
  };

  // ============================================================
  // CHARGEMENT DONNÉES + REALTIME
  // ============================================================
  const loadAll = useCallback(async () => {
    if (!activeClass) return;
    const result = await fetchAll(activeClass.id);
    setData({
      students: result.students,
      activities: result.activities,
      evaluations: result.evaluations,
      weeklyComments: result.weeklyComments,
      aiReports: result.aiReports,
      notes: result.notes,
    });
    setIsLoaded(true);
  }, [activeClass]);

  useEffect(() => {
    if (!profile || !activeClass) return;

    setIsLoaded(false);
    keepAlive();
    loadAll();

    const channel = supabase
      .channel(`class_${activeClass.id}_realtime`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evaluations' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_comments' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_reports' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, loadAll)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile, activeClass, loadAll]);

  // ============================================================
  // BACKUP AUTOMATIQUE
  // ============================================================
  useEffect(() => {
    if (!isLoaded) return;
    const LAST_BACKUP_KEY = `last_auto_backup_${activeClass?.id}`;
    const lastBackup = localStorage.getItem(LAST_BACKUP_KEY);
    const now = Date.now();
    if (!lastBackup || now - parseInt(lastBackup) > 24 * 60 * 60 * 1000) {
      uploadBackup(data, profile.fullName, activeClass?.name || 'inconnu');
      localStorage.setItem(LAST_BACKUP_KEY, now.toString());
    }
  }, [isLoaded]);

  const userId = session?.user?.id || '';
  const classId = activeClass?.id || '';

  // ============================================================
  // ÉLÈVES
  // ============================================================
  const addStudent = async (s: Omit<Student, 'id'>) => {
    const newStudent = { ...s, id: Math.random().toString(36).substr(2, 9) };
    await dbAddStudent(newStudent, userId, classId);
  };
  const updateStudent = async (updated: Student) => { await dbUpdateStudent(updated); };
  const deleteStudent = async (id: string) => {
    await dbDeleteEvaluationsForStudent(id);
    await dbDeleteWeeklyCommentsForStudent(id);
    await dbDeleteAIReportsForStudent(id);
    await dbDeleteStudent(id);
  };

  // ============================================================
  // ACTIVITÉS
  // ============================================================
  const addActivity = async (a: Omit<Activity, 'id'>) => {
    const newActivity = { ...a, id: Math.random().toString(36).substr(2, 9) };
    await dbAddActivity(newActivity, userId, classId);
  };
  const updateActivity = async (updated: Activity) => { await dbUpdateActivity(updated); };
  const deleteActivity = async (id: string) => {
    await dbDeleteEvaluationsForActivity(id);
    await dbDeleteActivity(id);
  };

  // ============================================================
  // ÉVALUATIONS
  // ============================================================
  const saveEvaluations = async (evals: Evaluation[]) => {
    for (const eval_ of evals) await dbSaveEvaluation(eval_, userId, classId);
  };

  // ============================================================
  // COMMENTAIRES
  // ============================================================
  const saveWeeklyComment = async (comment: WeeklyComment) => {
    await dbSaveWeeklyComment(comment, userId, classId);
  };

  // ============================================================
  // RAPPORTS IA
  // ============================================================
  const saveAIReport = async (report: AIReport) => {
    await dbSaveAIReport(report, userId, classId);
  };

  // ============================================================
  // NOTES
  // ============================================================
  const addNote = async (n: Omit<Note, 'id' | 'updatedAt'>) => {
    const newNote: Note = {
      ...n,
      id: Math.random().toString(36).substr(2, 9),
      updatedAt: new Date().toISOString(),
    };
    await dbAddNote(newNote, userId, classId);
  };
  const updateNote = async (updated: Note) => {
    await dbUpdateNote({ ...updated, updatedAt: new Date().toISOString() });
  };
  const deleteNote = async (id: string) => { await dbDeleteNote(id); };

  // ============================================================
  // IMPORT JSON
  // ============================================================
  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const importedData: AppData = parsed.data || parsed;
        if (!importedData.students || !importedData.activities) {
          alert('Fichier invalide.');
          return;
        }
        if (!confirm(`Restaurer la sauvegarde du ${new Date(parsed.exportedAt).toLocaleDateString('fr-FR')} ?`)) return;
        for (const s of importedData.students) await dbAddStudent(s, userId, classId);
        for (const a of importedData.activities) await dbAddActivity(a, userId, classId);
        for (const e of importedData.evaluations) await dbSaveEvaluation(e, userId, classId);
        for (const c of importedData.weeklyComments) await dbSaveWeeklyComment(c, userId, classId);
        for (const r of importedData.aiReports) await dbSaveAIReport(r, userId, classId);
        for (const n of importedData.notes) await dbAddNote(n, userId, classId);
        alert('Restauration terminée !');
      } catch {
        alert('Erreur — impossible de lire ce fichier JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ============================================================
  // SÉLECTEUR DE CLASSE
  // ============================================================
  const ClassSelector = () => (
    <div className="relative">
      <button
        onClick={() => setShowClassSelector(!showClassSelector)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all w-full"
      >
        <div className="flex-1 text-left">
          <p className="text-white font-bold text-xs truncate">{activeClass?.name || 'Choisir une classe'}</p>
        </div>
        <ChevronDown size={14} className="text-slate-400 shrink-0" />
      </button>

      {showClassSelector && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden z-50">
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setActiveClass(c);
                setShowClassSelector(false);
                setIsLoaded(false);
                setData(EMPTY_DATA);
              }}
              className={`w-full text-left px-4 py-3 text-sm font-bold transition-all ${
                activeClass?.id === c.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ============================================================
  // ROUTING
  // ============================================================
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-sm uppercase tracking-widest">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  if (!profile) return (
    <ProfileSetup
      userId={session.user.id}
      onComplete={() => loadProfile(session.user.id)}
    />
  );

  // Classe S1 Math active
  if (activeClass && activeClass.level === 'S1' && activeClass.subject === 'mathématiques') {
    if (!isLoaded) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-sm uppercase tracking-widest">Chargement...</p>
        </div>
      </div>
    );
    return (
      <AppS1Math
        profile={profile}
        data={data}
        userId={userId}
        classes={classes}
        activeClass={activeClass}
        onChangeClass={(c) => {
          setActiveClass(c);
          setIsLoaded(false);
          setData(EMPTY_DATA);
        }}
        onLogout={handleLogout}
        onLoadProfile={() => loadProfile(session.user.id)}
        addStudent={addStudent}
        updateStudent={updateStudent}
        deleteStudent={deleteStudent}
        addActivity={addActivity}
        updateActivity={updateActivity}
        deleteActivity={deleteActivity}
        saveEvaluations={saveEvaluations}
        saveWeeklyComment={saveWeeklyComment}
        saveAIReport={saveAIReport}
        addNote={addNote}
        updateNote={updateNote}
        deleteNote={deleteNote}
        handleImportJSON={handleImportJSON}
      />
    );
  }

  // Classe P1 active
  if (activeClass && activeClass.level === 'P1') {
    if (!isLoaded) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-sm uppercase tracking-widest">Chargement...</p>
        </div>
      </div>
    );
  }

  // Page en développement si classe non supportée
  if (activeClass && activeClass.level !== 'P1') {
    return (
      <DevPage
        userId={profile.id}
        fullName={profile.fullName}
        subjects={profile.subjects}
        years={profile.years}
        onProfileUpdated={() => loadProfile(session.user.id)}
      />
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-sm uppercase tracking-widest">Chargement...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // APP PRINCIPALE — 1ère Primaire
  // ============================================================
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden text-slate-900">
      <nav className="w-full md:w-64 bg-slate-900 text-slate-400 p-6 flex flex-col shrink-0">
        <div className="flex items-center gap-3 text-white mb-6 px-2">
          <div className="bg-blue-600 p-2 rounded-xl">
            <GraduationCap size={24} />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-2xl leading-tight tracking-tighter">1MA</h1>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{profile.fullName}</p>
          </div>
        </div>

        {/* Sélecteur de classe */}
        {classes.length > 1 && (
          <div className="mb-6 px-0">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 px-2">Classe active</p>
            <ClassSelector />
          </div>
        )}

        <div className="space-y-1 flex-1">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Synthèse" />
          <NavItem active={activeTab === 'eleves'} onClick={() => setActiveTab('eleves')} icon={<Users size={20} />} label="Élèves" />
          <NavItem active={activeTab === 'activites'} onClick={() => setActiveTab('activites')} icon={<Layers size={20} />} label="Activités" />
          <NavItem active={activeTab === 'hebdo'} onClick={() => setActiveTab('hebdo')} icon={<CalendarDays size={20} />} label="Suivi Hebdo" />
          <div className="pt-4 mt-4 border-t border-slate-800">
            <NavItem active={activeTab === 'teacher'} onClick={() => setActiveTab('teacher')} icon={<GraduationCap size={20} />} label="Suivi Prof" />
          </div>
          <NavItem active={activeTab === 'lottery'} onClick={() => setActiveTab('lottery')} icon={<Shuffle size={20} />} label="Loterie" />
          <NavItem active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={<FileText size={20} />} label="Notes" />
          <div className="pt-4 mt-4 border-t border-slate-800">
            <NavItem active={activeTab === 'ia'} onClick={() => setActiveTab('ia')} icon={<Sparkles size={20} className="text-purple-400" />} label="Assistant IA" color="text-purple-400" />
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-800 space-y-3">
          <div className="flex gap-2 px-2">
            <button onClick={() => uploadBackup(data, profile.fullName, activeClass?.name || 'inconnu')} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-wider">
              <Download size={12} /> Backup
            </button>
            <button onClick={() => importRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-wider">
              <Upload size={12} /> Restaurer
            </button>
            <input ref={importRef} type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </div>
          <div className="flex items-center gap-3 px-2 text-xs">
            <button
              onClick={() => setShowProfileEdit(true)}
              className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white shrink-0 hover:bg-slate-600 transition-colors"
            >
              <Settings size={14} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">{profile.fullName}</p>
              <p className="text-slate-500 italic">Enseignant(e)</p>
            </div>
            <button onClick={handleLogout} className="shrink-0 p-2 text-slate-500 hover:text-red-400 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <SynthesisView data={data} />}
          {activeTab === 'activites' && (
            <ActivityManager
              activities={data.activities}
              onAdd={addActivity}
              onUpdate={updateActivity}
              onDelete={deleteActivity}
              onSelect={setSelectedActivity}
            />
          )}
          {activeTab === 'eleves' && (
            <StudentList
              students={data.students}
              onAdd={addStudent}
              onUpdate={updateStudent}
              onDelete={deleteStudent}
              onViewStudent={setViewingStudent}
            />
          )}
          {activeTab === 'hebdo' && (
            <WeeklyTracker
              students={data.students}
              comments={data.weeklyComments}
              onSaveComment={saveWeeklyComment}
            />
          )}
          {activeTab === 'teacher' && <TeacherDashboard data={data} />}
          {activeTab === 'notes' && (
            <NotesManager
              notes={data.notes}
              onAdd={addNote}
              onUpdate={updateNote}
              onDelete={deleteNote}
            />
          )}
          {activeTab === 'ia' && (
            <AssistantIA
              students={data.students}
              data={data}
              onSaveReport={saveAIReport}
              existingReports={data.aiReports}
            />
          )}
          {activeTab === 'lottery' && (
            <LotteryManager
              students={data.students}
              activities={data.activities}
              evaluations={data.evaluations}
            />
          )}
        </div>
      </main>

      {selectedActivity && (
        <EvaluationModal
          activity={selectedActivity}
          students={data.students}
          evaluations={data.evaluations.filter(e => e.activityId === selectedActivity.id)}
          onSave={saveEvaluations}
          onClose={() => setSelectedActivity(null)}
        />
      )}
      {viewingStudent && (
        <StudentProfileModal
          student={viewingStudent}
          data={data}
          onClose={() => setViewingStudent(null)}
          onUpdateReport={saveAIReport}
        />
      )}

      {showProfileEdit && (
  <ProfileEditModal
    userId={profile.id}
    fullName={profile.fullName}
    subjects={profile.subjects}
    years={profile.years}
    onProfileUpdated={() => loadProfile(session.user.id)}
    onClose={() => setShowProfileEdit(false)}
  />
)}
    </div>
  );
};

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color?: string;
}

const NavItem: React.FC<NavItemProps> = ({ active, onClick, icon, label, color }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active ? 'bg-slate-800 text-white shadow-inner' : 'hover:bg-slate-800/50 hover:text-slate-200'
    }`}
  >
    <span className={active ? (color || 'text-blue-500') : 'text-slate-500'}>{icon}</span>
    <span className="font-bold text-sm">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
  </button>
);

export default App;
