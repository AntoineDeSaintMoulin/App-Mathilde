// ============================================================
// App.tsx — Composant racine de l'application 1MA
// Gère l'état global, la navigation, la sauvegarde et les backups
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Layers, 
  CalendarDays, 
  LayoutDashboard, 
  Sparkles, 
  Settings,
  GraduationCap,
  FileText,
  Shuffle,
  Download,
  Upload
} from 'lucide-react';
import { AppData, Student, Activity, Evaluation, WeeklyComment, AIReport, Note } from './types';
import { loadData, saveData } from './utils/storage';

// Composants de chaque onglet
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

// Utilitaires
import { usePresence } from './utils/usePresence';   // Détection des sessions simultanées
import { keepAlive } from './utils/keepAlive';        // Ping Supabase pour éviter la mise en pause

// Liste de tous les onglets disponibles dans la navigation
type Tab = 'dashboard' | 'activites' | 'eleves' | 'hebdo' | 'teacher' | 'ia' | 'notes' | 'lottery';

const App: React.FC = () => {

  // ============================================================
  // ÉTAT GLOBAL
  // ============================================================

  // Toutes les données de l'app (élèves, activités, évaluations, etc.)
  const [data, setData] = useState<AppData>({
    students: [], activities: [], evaluations: [], weeklyComments: [], aiReports: [], notes: []
  });

  // Indique si le chargement initial depuis Supabase est terminé
  // Bloque toute sauvegarde tant que les données ne sont pas chargées
  const [isLoaded, setIsLoaded] = useState(false);

  // Statut de la dernière sauvegarde : 'saving' | 'saved' | 'error'
  // Affiché via le bouton sync en haut à gauche
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Bloque les clics multiples sur le bouton sync pour éviter des rechargements simultanés
  const [isSyncing, setIsSyncing] = useState(false);

  // Onglet actuellement affiché
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Activité sélectionnée pour ouvrir la modale d'évaluation
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // Élève sélectionné pour ouvrir sa fiche de profil
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Référence cachée pour déclencher l'import de fichier JSON
  const importRef = useRef<HTMLInputElement>(null);

  // Détection des sessions simultanées (conflict = true si une autre session est active)
  const { conflict, sessionCount, otherNames } = usePresence();

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================

  useEffect(() => {
    // Ping Supabase pour éviter la mise en pause automatique (plan gratuit)
    keepAlive();

    // Chargement des données depuis Supabase
    // isLoaded passe à true seulement après le chargement réussi
    // ce qui empêche toute sauvegarde prématurée avec des données vides
    loadData().then(d => {
      setData(d);
      setIsLoaded(true);
    });
  }, []);

  // ============================================================
  // SAUVEGARDE AUTOMATIQUE
  // Se déclenche à chaque modification des données
  // ============================================================

  useEffect(() => {
    // Bloque si les données ne sont pas encore chargées
    if (!isLoaded) return;

    // Bloque si le chargement a rencontré une erreur Supabase
    // (ex: base en pause, réseau coupé)
    if ((data as any)._loadError) {
      setSaveStatus('error');
      return;
    }

    // Sauvegarde normale — le bouton sync passe en jaune pendant la sauvegarde
    // puis en vert si succès, rouge si erreur
    setSaveStatus('saving');
    saveData(data)
      .then(() => setSaveStatus('saved'))
      .catch(() => setSaveStatus('error'));
  }, [data, isLoaded]);

  // ============================================================
  // BACKUP AUTOMATIQUE QUOTIDIEN
  // Télécharge un fichier JSON si aucun backup n'a été fait depuis 24h
  // ============================================================

  useEffect(() => {
    // Bloque si les données ne sont pas encore chargées
    if (!isLoaded) return;

    // Bloque si le chargement a échoué — on ne veut pas sauvegarder des données vides
    if ((data as any)._loadError) return;

    const LAST_BACKUP_KEY = 'last_auto_backup';
    const lastBackup = localStorage.getItem(LAST_BACKUP_KEY);
    const now = Date.now();

    // Déclenche le backup uniquement si aucun backup depuis 24h
    if (!lastBackup || now - parseInt(lastBackup) > 24 * 60 * 60 * 1000) {
      const date = new Date().toISOString().split('T')[0];
      const backup = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        data
      };
      const backupContent = JSON.stringify(backup, null, 2);

      // Création et déclenchement du téléchargement du fichier JSON
      const blob = new Blob([backupContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `backup-1MA-auto-${date}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // On mémorise la date du dernier backup dans le localStorage
      localStorage.setItem(LAST_BACKUP_KEY, now.toString());
    }
  }, [isLoaded]);

  // ============================================================
  // GESTION DES ÉLÈVES
  // ============================================================

  // Ajoute un nouvel élève avec un ID aléatoire
  const addStudent = (s: Omit<Student, 'id'>) => {
    const newStudent = { ...s, id: Math.random().toString(36).substr(2, 9) };
    setData(prev => ({ ...prev, students: [...prev.students, newStudent] }));
  };

  // Met à jour un élève existant en remplaçant l'entrée correspondante
  const updateStudent = (updated: Student) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === updated.id ? updated : s)
    }));
  };

  // Supprime un élève et toutes ses données associées (évaluations, commentaires, rapports)
  const deleteStudent = (id: string) => {
    setData(prev => ({
      ...prev,
      students: prev.students.filter(s => s.id !== id),
      evaluations: prev.evaluations.filter(e => e.studentId !== id),
      weeklyComments: prev.weeklyComments.filter(c => c.studentId !== id),
      aiReports: prev.aiReports.filter(r => r.studentId !== id)
    }));
  };

  // ============================================================
  // GESTION DES ACTIVITÉS
  // ============================================================

  // Ajoute une nouvelle activité avec un ID aléatoire
  const addActivity = (a: Omit<Activity, 'id'>) => {
    const newActivity = { ...a, id: Math.random().toString(36).substr(2, 9) };
    setData(prev => ({ ...prev, activities: [...prev.activities, newActivity] }));
  };

  // Met à jour une activité existante
  const updateActivity = (updated: Activity) => {
    setData(prev => ({
      ...prev,
      activities: prev.activities.map(a => a.id === updated.id ? updated : a)
    }));
  };

  // Supprime une activité et toutes ses évaluations associées
  const deleteActivity = (id: string) => {
    setData(prev => ({
      ...prev,
      activities: prev.activities.filter(a => a.id !== id),
      evaluations: prev.evaluations.filter(e => e.activityId !== id)
    }));
  };

  // ============================================================
  // GESTION DES ÉVALUATIONS
  // ============================================================

  // Sauvegarde les évaluations d'une activité
  // Remplace toutes les évaluations existantes pour cette activité
  const saveEvaluations = (evals: Evaluation[]) => {
    setData(prev => {
      const otherEvals = prev.evaluations.filter(e => e.activityId !== selectedActivity?.id);
      return { ...prev, evaluations: [...otherEvals, ...evals] };
    });
  };

  // ============================================================
  // GESTION DES COMMENTAIRES HEBDOMADAIRES
  // ============================================================

  // Sauvegarde un commentaire hebdomadaire (un seul par élève/cycle/semaine)
  const saveWeeklyComment = (comment: WeeklyComment) => {
    setData(prev => {
      const otherComments = prev.weeklyComments.filter(c => 
        !(c.studentId === comment.studentId && c.cycle === comment.cycle && c.week === comment.week)
      );
      return { ...prev, weeklyComments: [...otherComments, comment] };
    });
  };

  // ============================================================
  // GESTION DES RAPPORTS IA
  // ============================================================

  // Sauvegarde un rapport IA (un seul par élève/cycle)
  const saveAIReport = (report: AIReport) => {
    setData(prev => {
      const otherReports = prev.aiReports.filter(r => 
        !(r.studentId === report.studentId && r.cycle === report.cycle)
      );
      return { ...prev, aiReports: [...otherReports, report] };
    });
  };

  // ============================================================
  // GESTION DES NOTES
  // ============================================================

  // Ajoute une nouvelle note avec un ID aléatoire et la date de création
  const addNote = (n: Omit<Note, 'id' | 'updatedAt'>) => {
    const newNote: Note = { 
      ...n, 
      id: Math.random().toString(36).substr(2, 9), 
      updatedAt: new Date().toISOString() 
    };
    setData(prev => ({ ...prev, notes: [...prev.notes, newNote] }));
  };

  // Met à jour une note existante
  const updateNote = (updated: Note) => {
    setData(prev => ({
      ...prev,
      notes: prev.notes.map(n => n.id === updated.id ? updated : n)
    }));
  };

  // Supprime une note
  const deleteNote = (id: string) => {
    setData(prev => ({
      ...prev,
      notes: prev.notes.filter(n => n.id !== id)
    }));
  };

  // ============================================================
  // SYNCHRONISATION MANUELLE
  // Recharge les données depuis Supabase en cas de conflit
  // ============================================================

  const handleSyncClick = async () => {
    // Ne fait rien si pas de conflit ou si une synchro est déjà en cours
    if (conflict && !isSyncing) {
      setIsSyncing(true);
      const freshData = await loadData();
      setData(freshData);
      setSaveStatus('saved');
      setIsSyncing(false);
    }
  };

  // ============================================================
  // EXPORT JSON MANUEL
  // Télécharge un fichier JSON complet de toutes les données
  // ============================================================

  const handleExportJSON = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `backup-1MA-${date}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ============================================================
  // IMPORT JSON
  // Restaure les données depuis un fichier JSON de backup
  // ============================================================

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const importedData: AppData = parsed.data || parsed;

        // Vérifie que le fichier est bien un backup 1MA valide
        if (!importedData.students || !importedData.activities) {
          alert('Fichier invalide — ce fichier ne semble pas être un backup 1MA.');
          return;
        }

        // Demande confirmation avant d'écraser toutes les données actuelles
        if (confirm(`Restaurer la sauvegarde du ${new Date(parsed.exportedAt).toLocaleDateString('fr-FR')} ? Toutes les données actuelles seront remplacées.`)) {
          setData(importedData);
        }
      } catch {
        alert('Erreur — impossible de lire ce fichier JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ============================================================
  // INDICATEUR DE SYNCHRONISATION (bouton sync)
  // Couleur, label et tooltip selon l'état actuel
  // ============================================================

  // Couleur du rond : rouge si conflit ou erreur, jaune si en cours, vert si OK
  const syncColor = conflict
    ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
    : saveStatus === 'saving'
    ? 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.8)]'
    : saveStatus === 'error'
    ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
    : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]';

  // Texte sous le rond
  const syncLabel = conflict
    ? `⚠️ ${sessionCount}`
    : saveStatus === 'saving'
    ? 'Sync...'
    : saveStatus === 'error'
    ? 'Erreur'
    : 'Sync';

  // Couleur du texte
  const syncTextColor = conflict || saveStatus === 'error'
    ? 'text-red-400'
    : saveStatus === 'saving'
    ? 'text-yellow-400'
    : 'text-emerald-500';

  // Tooltip au survol — affiche les noms des autres sessions actives si conflit
  const syncTitle = conflict
    ? `${sessionCount} sessions actives — ${otherNames.join(', ')}`
    : saveStatus === 'error'
    ? 'Erreur de sauvegarde'
    : 'Synchronisé';

  // ============================================================
  // ÉCRAN DE CHARGEMENT
  // Affiché pendant le chargement initial depuis Supabase
  // ============================================================

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
  // RENDU PRINCIPAL
  // ============================================================

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden text-slate-900">

      {/* ======================================================
          NAVIGATION LATÉRALE
          ====================================================== */}
      <nav className="w-full md:w-64 bg-slate-900 text-slate-400 p-6 flex flex-col shrink-0">

        {/* Logo + bouton sync */}
        <div className="flex items-center gap-3 text-white mb-10 px-2">
          <div className="bg-blue-600 p-2 rounded-xl">
            <GraduationCap size={24} />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-2xl leading-tight tracking-tighter">1MA</h1>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Mathilde Lits</p>
          </div>

          {/* Bouton sync — vert/jaune/rouge selon l'état
              Cliquer dessus recharge les données depuis Supabase en cas de conflit */}
          <button
            onClick={handleSyncClick}
            disabled={isSyncing}
            title={syncTitle}
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
          >
            <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${syncColor}`} />
            <span className={`text-[8px] font-bold uppercase tracking-wider ${syncTextColor}`}>
              {syncLabel}
            </span>
          </button>
        </div>

        {/* Onglets de navigation */}
        <div className="space-y-1 flex-1">
          <NavItem
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard size={20} />}
            label="Synthèse"
          />
          <NavItem
            active={activeTab === 'eleves'}
            onClick={() => setActiveTab('eleves')}
            icon={<Users size={20} />}
            label="Élèves"
          />
          <NavItem
            active={activeTab === 'activites'}
            onClick={() => setActiveTab('activites')}
            icon={<Layers size={20} />}
            label="Activités"
          />
          <NavItem
            active={activeTab === 'hebdo'}
            onClick={() => setActiveTab('hebdo')}
            icon={<CalendarDays size={20} />}
            label="Suivi Hebdo"
          />

          {/* Séparateur — outils pédagogiques */}
          <div className="pt-4 mt-4 border-t border-slate-800">
            <NavItem
              active={activeTab === 'teacher'}
              onClick={() => setActiveTab('teacher')}
              icon={<GraduationCap size={20} />}
              label="Suivi Prof"
            />
          </div>

          <NavItem
            active={activeTab === 'lottery'}
            onClick={() => setActiveTab('lottery')}
            icon={<Shuffle size={20} />}
            label="Loterie"
          />
          <NavItem
            active={activeTab === 'notes'}
            onClick={() => setActiveTab('notes')}
            icon={<FileText size={20} />}
            label="Notes"
          />

          {/* Séparateur — Assistant IA */}
          <div className="pt-4 mt-4 border-t border-slate-800">
            <NavItem
              active={activeTab === 'ia'}
              onClick={() => setActiveTab('ia')}
              icon={<Sparkles size={20} className="text-purple-400" />}
              label="Assistant IA"
              color="text-purple-400"
            />
          </div>
        </div>

        {/* Bas de la nav — boutons backup/restaurer + profil */}
        <div className="mt-auto pt-6 border-t border-slate-800 space-y-3">

          {/* Boutons de sauvegarde manuelle */}
          <div className="flex gap-2 px-2">
            {/* Backup — télécharge un JSON complet de toutes les données */}
            <button
              onClick={handleExportJSON}
              title="Exporter une sauvegarde complète JSON"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-wider"
            >
              <Download size={12} /> Backup
            </button>

            {/* Restaurer — importe un JSON de backup pour restaurer les données */}
            <button
              onClick={() => importRef.current?.click()}
              title="Restaurer depuis un fichier JSON"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-wider"
            >
              <Upload size={12} /> Restaurer
            </button>

            {/* Input caché déclenché par le bouton Restaurer */}
            <input
              ref={importRef}
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </div>

          {/* Profil de l'enseignante */}
          <div className="flex items-center gap-3 px-2 text-xs">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white shrink-0">
              <Settings size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">Mathilde Lits</p>
              <p className="text-slate-500 italic">Enseignante 1MA</p>
            </div>
          </div>
        </div>
      </nav>

      {/* ======================================================
          CONTENU PRINCIPAL — Affiche l'onglet actif
          ====================================================== */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">

          {/* Tableau de synthèse avec moyennes par matière */}
          {activeTab === 'dashboard' && <SynthesisView data={data} />}

          {/* Gestionnaire des fiches activités */}
          {activeTab === 'activites' && (
            <ActivityManager
              activities={data.activities}
              onAdd={addActivity}
              onUpdate={updateActivity}
              onDelete={deleteActivity}
              onSelect={setSelectedActivity}
            />
          )}

          {/* Liste des élèves */}
          {activeTab === 'eleves' && (
            <StudentList
              students={data.students}
              onAdd={addStudent}
              onUpdate={updateStudent}
              onDelete={deleteStudent}
              onViewStudent={setViewingStudent}
            />
          )}

          {/* Suivi hebdomadaire — commentaires par élève et par semaine */}
          {activeTab === 'hebdo' && (
            <WeeklyTracker
              students={data.students}
              comments={data.weeklyComments}
              onSaveComment={saveWeeklyComment}
            />
          )}

          {/* Suivi Prof — progression par domaine de compétence */}
          {activeTab === 'teacher' && (
            <TeacherDashboard data={data} />
          )}

          {/* Notes personnelles */}
          {activeTab === 'notes' && (
            <NotesManager
              notes={data.notes}
              onAdd={addNote}
              onUpdate={updateNote}
              onDelete={deleteNote}
            />
          )}

          {/* Assistant IA — génération de rapports par élève */}
          {activeTab === 'ia' && (
            <AssistantIA
              students={data.students}
              data={data}
              onSaveReport={saveAIReport}
              existingReports={data.aiReports}
            />
          )}

          {/* Loterie — tirage aléatoire d'élèves */}
          {activeTab === 'lottery' && (
            <LotteryManager
              students={data.students}
              activities={data.activities}
              evaluations={data.evaluations}
            />
          )}
        </div>
      </main>

      {/* ======================================================
          MODALES
          ====================================================== */}

      {/* Modale d'évaluation — s'ouvre quand on clique sur une activité */}
      {selectedActivity && (
        <EvaluationModal
          activity={selectedActivity}
          students={data.students}
          evaluations={data.evaluations.filter(e => e.activityId === selectedActivity.id)}
          onSave={saveEvaluations}
          onClose={() => setSelectedActivity(null)}
        />
      )}

      {/* Modale de profil élève — s'ouvre quand on clique sur un élève */}
      {viewingStudent && (
        <StudentProfileModal
          student={viewingStudent}
          data={data}
          onClose={() => setViewingStudent(null)}
          onUpdateReport={saveAIReport}
        />
      )}
    </div>
  );
};

// ============================================================
// COMPOSANT NavItem — Bouton de navigation réutilisable
// Affiché actif (fond sombre + point bleu) ou inactif
// ============================================================
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
      active
        ? 'bg-slate-800 text-white shadow-inner'
        : 'hover:bg-slate-800/50 hover:text-slate-200'
    }`}
  >
    <span className={active ? (color || 'text-blue-500') : 'text-slate-500'}>
      {icon}
    </span>
    <span className="font-bold text-sm">{label}</span>
    {/* Point bleu lumineux affiché uniquement sur l'onglet actif */}
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
  </button>
);

export default App;
