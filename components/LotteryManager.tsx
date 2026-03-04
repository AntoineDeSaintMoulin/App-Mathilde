import React, { useState } from 'react';
import { Shuffle, Users, List, LayoutGrid, X, Plus, Trophy } from 'lucide-react';
import { Student, Activity, Evaluation } from '../types';

interface Props {
  students: Student[];
  activities: Activity[];
  evaluations: Evaluation[];
}

type Mode = 'single' | 'sequence' | 'groups';

const LotteryManager: React.FC<Props> = ({ students, activities, evaluations }) => {
  const [mode, setMode] = useState<Mode>('single');
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [excludedManual, setExcludedManual] = useState<string[]>([]);
  const [nbGroups, setNbGroups] = useState(2);
  const [nbPerGroup, setNbPerGroup] = useState(3);
  const [result, setResult] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Élèves déjà notés pour l'activité sélectionnée
  const alreadyGraded = selectedActivityId
    ? evaluations
        .filter(e => e.activityId === selectedActivityId && e.isPresent && e.grade > 0)
        .map(e => e.studentId)
    : [];

  // Statut de chaque élève
  const getStudentStatus = (studentId: string): { included: boolean; reason?: string } => {
    if (excludedManual.includes(studentId)) return { included: false, reason: 'Manuel' };
    if (alreadyGraded.includes(studentId)) return { included: false, reason: 'Déjà noté' };
    return { included: true };
  };

  const eligibleStudents = students.filter(s => getStudentStatus(s.id).included);

  const toggleManual = (studentId: string) => {
    if (alreadyGraded.includes(studentId)) return; // Ne peut pas modifier les "déjà notés"
    setExcludedManual(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
    setResult(null);
  };

  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const draw = () => {
    if (eligibleStudents.length === 0) return;
    setIsAnimating(true);
    setResult(null);

    setTimeout(() => {
      if (mode === 'single') {
        const picked = eligibleStudents[Math.floor(Math.random() * eligibleStudents.length)];
        setResult({ type: 'single', student: picked });
      } else if (mode === 'sequence') {
        setResult({ type: 'sequence', students: shuffle(eligibleStudents) });
      } else if (mode === 'groups') {
        const shuffled = shuffle(eligibleStudents);
        const groups: Student[][] = Array.from({ length: nbGroups }, () => []);
        shuffled.forEach((s, i) => groups[i % nbGroups].push(s));
        setResult({ type: 'groups', groups });
      }
      setIsAnimating(false);
    }, 600);
  };

  const reset = () => {
    setResult(null);
    setExcludedManual([]);
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Panneau principal */}
      <div className="flex-1 space-y-6">

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h2 className="text-xl font-black flex items-center gap-2 text-slate-800 mb-6">
            <Shuffle className="text-blue-600" /> Loterie des élèves
          </h2>

          {/* Mode */}
          <div className="flex gap-3 mb-6">
            {([
              { value: 'single', label: 'Un élève', icon: <Users size={16} /> },
              { value: 'sequence', label: 'Séquence', icon: <List size={16} /> },
              { value: 'groups', label: 'Groupes', icon: <LayoutGrid size={16} /> },
            ] as { value: Mode; label: string; icon: React.ReactNode }[]).map(m => (
              <button
                key={m.value}
                onClick={() => { setMode(m.value); setResult(null); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  mode === m.value ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {/* Activité (optionnel) */}
          <div className="mb-6">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
              Lier à une activité (optionnel)
            </label>
            <select
              className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              value={selectedActivityId}
              onChange={e => { setSelectedActivityId(e.target.value); setResult(null); }}
            >
              <option value="">Aucune activité liée</option>
              {activities.map(a => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>

          {/* Options groupes */}
          {mode === 'groups' && (
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                  Nombre de groupes
                </label>
                <input
                  type="number" min={2} max={10}
                  className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  value={nbGroups}
                  onChange={e => setNbGroups(Math.max(2, parseInt(e.target.value) || 2))}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                  Élèves par groupe
                </label>
                <input
                  type="number" min={1} max={10}
                  className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  value={nbPerGroup}
                  onChange={e => setNbPerGroup(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              onClick={draw}
              disabled={eligibleStudents.length === 0 || isAnimating}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-xl shadow-lg hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Shuffle size={18} className={isAnimating ? 'animate-spin' : ''} />
              {isAnimating ? 'Tirage...' : 'Tirer au sort'}
            </button>
            <button
              onClick={reset}
              className="px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Résultat */}
        {result && !isAnimating && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm animate-in fade-in zoom-in duration-300">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Résultat</h3>

            {result.type === 'single' && (
              <div className="flex items-center gap-4 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl">
                  {result.student.firstName[0]}{result.student.lastName[0]}
                </div>
                <div>
                  <p className="font-black text-2xl text-slate-800">{result.student.firstName} {result.student.lastName}</p>
                  <p className="text-blue-500 text-sm font-bold">Élève sélectionné 🎉</p>
                </div>
              </div>
            )}

            {result.type === 'sequence' && (
              <div className="space-y-2">
                {result.students.map((s: Student, i: number) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border">
                    <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-bold text-slate-700">{s.firstName} {s.lastName}</span>
                  </div>
                ))}
              </div>
            )}

            {result.type === 'groups' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {result.groups.map((group: Student[], i: number) => (
                  <div key={i} className="bg-slate-50 rounded-2xl border p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                        {i + 1}
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Groupe {i + 1}</span>
                    </div>
                    <div className="space-y-1.5">
                      {group.map(s => (
                        <div key={s.id} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 text-[10px] font-black flex items-center justify-center shrink-0">
                            {s.firstName[0]}{s.lastName[0]}
                          </div>
                          {s.firstName} {s.lastName}
                        </div>
                      ))}
                      {group.length === 0 && <p className="text-xs text-slate-300 italic">Vide</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panneau élèves */}
      <div className="w-64 shrink-0">
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden sticky top-0">
          <div className="p-4 border-b bg-slate-50">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Élèves ({eligibleStudents.length}/{students.length})
            </p>
          </div>
          <div className="divide-y max-h-[70vh] overflow-y-auto">
            {students.map(student => {
              const status = getStudentStatus(student.id);
              return (
                <div
                  key={student.id}
                  className={`p-3 flex items-center justify-between gap-2 transition-colors ${
                    status.included ? 'bg-white' : 'bg-red-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${
                      status.included ? 'text-blue-600' : 'text-red-400'
                    }`}>
                      {student.firstName} {student.lastName}
                    </p>
                    {!status.included && status.reason && (
                      <p className="text-[10px] text-red-300 italic">{status.reason}</p>
                    )}
                  </div>
                  {status.reason !== 'Déjà noté' && (
                    <button
                      onClick={() => toggleManual(student.id)}
                      className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        status.included
                          ? 'bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500'
                          : 'bg-red-100 hover:bg-blue-100 text-red-400 hover:text-blue-500'
                      }`}
                    >
                      {status.included ? <X size={12} /> : <Plus size={12} />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotteryManager;
