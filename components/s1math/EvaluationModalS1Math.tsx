
import React, { useState, useEffect } from 'react';
import { X, Save, UserCheck, UserX } from 'lucide-react';
import { Student, Activity, Evaluation } from '../../types';
import { getGradeConfigS1 } from '../../constants/s1math';

interface Props {
  activity: Activity;
  students: Student[];
  evaluations: Evaluation[];
  onSave: (evals: Evaluation[]) => void;
  onClose: () => void;
}

const EvaluationModalS1Math: React.FC<Props> = ({ activity, students, evaluations, onSave, onClose }) => {
  const [localEvals, setLocalEvals] = useState<Evaluation[]>([]);

  useEffect(() => {
    const initial = students.map(student => {
      const existing = evaluations.find(e => e.studentId === student.id);
      return existing || {
        studentId: student.id,
        activityId: activity.id,
        isPresent: true,
        grade: 0,
        comment: '',
      };
    });
    setLocalEvals(initial);
  }, [students, evaluations, activity.id]);

  const updateEval = (studentId: string, updates: Partial<Evaluation>) => {
    setLocalEvals(prev =>
      prev.map(e => e.studentId === studentId ? { ...e, ...updates } : e)
    );
  };

  const handleSave = () => {
    onSave(localEvals);
    onClose();
  };

  const presentCount = localEvals.filter(e => e.isPresent).length;
  const classAverage = () => {
    const gradedEvals = localEvals.filter(e => e.isPresent && e.grade > 0);
    if (gradedEvals.length === 0) return null;
    return (gradedEvals.reduce((acc, e) => acc + e.grade, 0) / gradedEvals.length).toFixed(1);
  };
  const avg = classAverage();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b bg-slate-50 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900">{activity.title}</h2>
            <p className="text-sm text-slate-500 mt-1">{activity.domain} — {new Date(activity.date).toLocaleDateString('fr-FR')}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-slate-400 font-bold">{presentCount}/{students.length} présents</span>
              {avg && (
                <span className={`text-xs font-black text-white px-2 py-0.5 rounded-lg ${getGradeConfigS1(parseFloat(avg)).color}`}>
                  Moyenne : {avg}/20
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Liste élèves */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {students.map(student => {
            const eval_ = localEvals.find(e => e.studentId === student.id);
            if (!eval_) return null;
            const gradeConfig = eval_.isPresent && eval_.grade > 0 ? getGradeConfigS1(eval_.grade) : null;

            return (
              <div key={student.id} className={`p-4 rounded-2xl border transition-all ${eval_.isPresent ? 'bg-white' : 'bg-slate-50 opacity-60'}`}>
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Nom */}
                  <div className="w-36 shrink-0">
                    <p className="font-bold text-slate-800 text-sm">{student.firstName} {student.lastName}</p>
                  </div>

                  {/* Présence */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => updateEval(student.id, { isPresent: true })}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        eval_.isPresent ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <UserCheck size={14} /> Présent
                    </button>
                    <button
                      onClick={() => updateEval(student.id, { isPresent: false, grade: 0 })}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        !eval_.isPresent ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <UserX size={14} /> Absent
                    </button>
                  </div>

                  {/* Note sur 20 */}
                  {eval_.isPresent && (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        placeholder="Note /20"
                        className={`w-24 p-2 border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 text-center ${
                          gradeConfig ? `${gradeConfig.lightColor} border-transparent` : 'bg-slate-50'
                        }`}
                        value={eval_.grade || ''}
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          updateEval(student.id, { grade: isNaN(val) ? 0 : Math.min(20, Math.max(0, val)) });
                        }}
                      />
                      {gradeConfig && (
                        <span className={`text-xs font-black px-2 py-0.5 rounded-lg text-white ${gradeConfig.color}`}>
                          {gradeConfig.label}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Commentaire */}
                {eval_.isPresent && (
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Commentaire (optionnel)..."
                      className="w-full p-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                      value={eval_.comment}
                      onChange={e => updateEval(student.id, { comment: e.target.value })}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">
            Annuler
          </button>
          <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg">
            <Save size={16} /> Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationModalS1Math;
