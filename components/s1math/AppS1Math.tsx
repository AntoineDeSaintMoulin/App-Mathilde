import React, { useState, useRef } from 'react';
import {
  Users, Layers, CalendarDays, LayoutDashboard,
  Sparkles, Settings, GraduationCap, FileText,
  Shuffle, Download, Upload, LogOut, ChevronDown,
} from 'lucide-react';
import { AppData, Student, Activity, Evaluation, WeeklyComment, AIReport, Note } from '../../types';
import { exportJSON } from '../../utils/storage';
import { supabase } from '../../utils/supabaseClient';
import ProfileEditModal from '../ProfileEditModal';

import SynthesisViewS1Math from './SynthesisViewS1Math';
import ActivityManagerS1Math from './ActivityManagerS1Math';
import EvaluationModalS1Math from './EvaluationModalS1Math';
import TeacherDashboardS1Math from './TeacherDashboardS1Math';
import WeeklyTracker from '../WeeklyTracker';
import StudentList from '../StudentList';
import NotesManager from '../NotesManager';
import LotteryManager from '../LotteryManager';
import AssistantIA from '../AssistantIA';
import StudentProfileModal from '../StudentProfileModal';
import DevPage from '../DevPage';

interface UserProfile {
  id: string;
  fullName: string;
  subjects: string[];
  years: string[];
}

interface ClassInfo {
  id: string;
  name: string;
  level: string;
  subject: string;
}

interface Props {
  profile: UserProfile;
  data: AppData;
  userId: string;
  classes: ClassInfo[];
  activeClass: ClassInfo;
  onChangeClass: (c: ClassInfo) => void;
  onLogout: () => void;
  onLoadProfile: () => void;
  addStudent: (s: Omit<Student, 'id'>) => void;
  updateStudent: (s: Student) => void;
  deleteStudent: (id: string) => void;
  addActivity: (a: Omit<Activity, 'id'>) => void;
  updateActivity: (a: Activity) => void;
  deleteActivity: (id: string) => void;
  saveEvaluations: (evals: Evaluation[]) => void;
  saveWeeklyComment: (comment: WeeklyComment) => void;
  saveAIReport: (report: AIReport) => void;
  addNote: (n: Omit<Note, 'id' | 'updatedAt'>) => void;
  updateNote: (n: Note) => void;
  deleteNote: (id: string) => void;
  handleImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

type Tab = 'dashboard' | 'activites' | 'eleves' | 'hebdo' | 'teacher' | 'ia' | 'notes' | 'lottery';

const AppS1Math: React.FC<Props> = ({
  profile, data, userId, classes, activeClass, onChangeClass, onLogout, onLoadProfile,
  addStudent, updateStudent, deleteStudent,
  addActivity, updateActivity, deleteActivity,
  saveEvaluations, saveWeeklyComment, saveAIReport,
  addNote, updateNote, deleteNote, handleImportJSON,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showClassSelector, setShowClassSelector] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const ClassSelector = () => (
    <div className="relative">
      <button
        onClick={() => setShowClassSelector(!showClassSelector)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all w-full"
      >
        <div className="flex-1 text-left">
          <p className="text-white font-bold text-xs truncate">{activeClass.name}</p>
        </div>
        <ChevronDown size={14} className="text-slate-400 shrink-0" />
      </button>
      {showClassSelector && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden z-50">
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => {
                onChangeClass(c);
                setShowClassSelector(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm font-bold transition-all ${
                activeClass.id === c.id
                  ? 'bg-purple-600 text-white'
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden text-slate-900">
      <nav className="w-full md:w-64 bg-slate-900 text-slate-400 p-6 flex flex-col shrink-0">
        <div className="flex items-center gap-3 text-white mb-10 px-2">
          <div className="bg-purple-600 p-2 rounded-xl">
            <GraduationCap size={24} />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-2xl leading-tight tracking-tighter">1S Math</h1>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{profile.fullName}</p>
          </div>
        </div>

        {classes.length > 1 && (
          <div className="mb-6">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Classe active</p>
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
            <button
              onClick={() => exportJSON(data)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-wider"
            >
              <Download size={12} /> Backup
            </button>
            <button
              onClick={() => importRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-wider"
            >
              <Upload size={12} /> Restaurer
            </button>
            <input ref={importRef} type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </div>
          <div className="flex items-center gap-3 px-2 text-xs">
            <button
              onClick={() => setShowProfileEdit(true)}
              className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white shrink-0 hover:bg-slate-600 transition-colors"
              title="Modifier mon profil"
            >
              <Settings size={14} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">{profile.fullName}</p>
              <p className="text-slate-500 italic">1ère Secondaire Maths</p>
            </div>
            <button
              onClick={onLogout}
              className="shrink-0 p-2 text-slate-500 hover:text-red-400 transition-colors"
              title="Se déconnecter"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <SynthesisViewS1Math data={data} />}
          {activeTab === 'activites' && (
            <ActivityManagerS1Math
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
          {activeTab === 'teacher' && <TeacherDashboardS1Math data={data} />}
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
        <EvaluationModalS1Math
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
    <span className={active ? (color || 'text-purple-500') : 'text-slate-500'}>{icon}</span>
    <span className="font-bold text-sm">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />}
  </button>
);

export default AppS1Math;
