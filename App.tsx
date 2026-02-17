
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Layers, 
  CalendarDays, 
  LayoutDashboard, 
  Sparkles, 
  Settings,
  GraduationCap
} from 'lucide-react';
import { AppData, Student, Activity, Evaluation, WeeklyComment, AIReport } from './types';
import { loadData, saveData } from './utils/storage';

// Lazy load components for performance
import StudentList from './components/StudentList';
import ActivityManager from './components/ActivityManager';
import EvaluationModal from './components/EvaluationModal';
import WeeklyTracker from './components/WeeklyTracker';
import SynthesisView from './components/SynthesisView';
import AssistantIA from './components/AssistantIA';
import StudentProfileModal from './components/StudentProfileModal';

type Tab = 'dashboard' | 'activites' | 'eleves' | 'hebdo' | 'ia';

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const addStudent = (s: Omit<Student, 'id'>) => {
    const newStudent = { ...s, id: Math.random().toString(36).substr(2, 9) };
    setData(prev => ({ ...prev, students: [...prev.students, newStudent] }));
  };

  const updateStudent = (updated: Student) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === updated.id ? updated : s)
    }));
  };

  const deleteStudent = (id: string) => {
    setData(prev => ({
      ...prev,
      students: prev.students.filter(s => s.id !== id),
      evaluations: prev.evaluations.filter(e => e.studentId !== id),
      weeklyComments: prev.weeklyComments.filter(c => c.studentId !== id),
      aiReports: prev.aiReports.filter(r => r.studentId !== id)
    }));
  };

  const addActivity = (a: Omit<Activity, 'id'>) => {
    const newActivity = { ...a, id: Math.random().toString(36).substr(2, 9) };
    setData(prev => ({ ...prev, activities: [...prev.activities, newActivity] }));
  };

  const updateActivity = (updated: Activity) => {
    setData(prev => ({
      ...prev,
      activities: prev.activities.map(a => a.id === updated.id ? updated : a)
    }));
  };

  const deleteActivity = (id: string) => {
    setData(prev => ({
      ...prev,
      activities: prev.activities.filter(a => a.id !== id),
      evaluations: prev.evaluations.filter(e => e.activityId !== id)
    }));
  };

  const saveEvaluations = (evals: Evaluation[]) => {
    setData(prev => {
      const otherEvals = prev.evaluations.filter(e => e.activityId !== selectedActivity?.id);
      return { ...prev, evaluations: [...otherEvals, ...evals] };
    });
  };

  const saveWeeklyComment = (comment: WeeklyComment) => {
    setData(prev => {
      const otherComments = prev.weeklyComments.filter(c => 
        !(c.studentId === comment.studentId && c.cycle === comment.cycle && c.week === comment.week)
      );
      return { ...prev, weeklyComments: [...otherComments, comment] };
    });
  };

  const saveAIReport = (report: AIReport) => {
    setData(prev => {
      const otherReports = prev.aiReports.filter(r => 
        !(r.studentId === report.studentId && r.cycle === report.cycle)
      );
      return { ...prev, aiReports: [...otherReports, report] };
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden text-slate-900">
      <nav className="w-full md:w-64 bg-slate-900 text-slate-400 p-6 flex flex-col shrink-0">
        <div className="flex items-center gap-3 text-white mb-10 px-2">
          <div className="bg-blue-600 p-2 rounded-xl">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="font-bold text-2xl leading-tight tracking-tighter">1MA</h1>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Mathilde Lits</p>
          </div>
        </div>

        <div className="space-y-1 flex-1">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard size={20} />} 
            label="Synthèse" 
          />
          <NavItem 
            active={activeTab === 'activites'} 
            onClick={() => setActiveTab('activites')} 
            icon={<Layers size={20} />} 
            label="Activités" 
          />
          <NavItem 
            active={activeTab === 'eleves'} 
            onClick={() => setActiveTab('eleves')} 
            icon={<Users size={20} />} 
            label="Élèves" 
          />
          <NavItem 
            active={activeTab === 'hebdo'} 
            onClick={() => setActiveTab('hebdo')} 
            icon={<CalendarDays size={20} />} 
            label="Suivi Hebdo" 
          />
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

        <div className="mt-auto pt-6 border-t border-slate-800 flex items-center gap-3 px-2 text-xs">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white">
            <Settings size={14} />
          </div>
          <div>
            <p className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">Mathilde Lits</p>
            <p className="text-slate-500 italic">Enseignante 1MA</p>
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

          {activeTab === 'ia' && (
            <AssistantIA 
              students={data.students}
              data={data}
              onSaveReport={saveAIReport}
              existingReports={data.aiReports}
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
      active 
        ? 'bg-slate-800 text-white shadow-inner' 
        : 'hover:bg-slate-800/50 hover:text-slate-200'
    }`}
  >
    <span className={active ? (color || 'text-blue-500') : 'text-slate-500'}>
      {icon}
    </span>
    <span className="font-bold text-sm">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
  </button>
);

export default App;
