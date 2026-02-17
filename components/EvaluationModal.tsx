
import React from 'react';
import { X, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { Activity, Student, Evaluation } from '../types';
import { getGradeConfig } from '../constants';

interface Props {
  activity: Activity;
  students: Student[];
  evaluations: Evaluation[];
  onSave: (evals: Evaluation[]) => void;
  onClose: () => void;
}

const EvaluationModal: React.FC<Props> = ({ activity, students, evaluations, onSave, onClose }) => {
  const [localEvals, setLocalEvals] = React.useState<Evaluation[]>(evaluations);

  const updateEval = (studentId: string, updates: Partial<Evaluation>) => {
    setLocalEvals(prev => {
      const existing = prev.find(e => e.studentId === studentId);
      if (existing) {
        return prev.map(e => e.studentId === studentId ? { ...e, ...updates } : e);
      } else {
        return [...prev, {
          activityId: activity.id,
          studentId,
          isPresent: true,
          grade: 5,
          comment: '',
          ...updates
        }];
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-bold">{activity.title}</h2>
            <p className="text-slate-500">Évaluation des élèves • {new Date(activity.date).toLocaleDateString('fr-FR')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                <th className="pb-4 pl-4">Élève</th>
                <th className="pb-4 text-center">Présence</th>
                <th className="pb-4">Note / 10</th>
                <th className="pb-4">Commentaire</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map(student => {
                const evalItem = localEvals.find(e => e.studentId === student.id) || {
                  isPresent: true,
                  grade: 0,
                  comment: ''
                };
                
                const gradeConfig = getGradeConfig(evalItem.grade);

                return (
                  <tr key={student.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 pl-4">
                      <p className="font-bold text-slate-800">{student.firstName} {student.lastName}</p>
                    </td>
                    <td className="py-4 text-center">
                      <button 
                        onClick={() => updateEval(student.id, { isPresent: !evalItem.isPresent })}
                        className={`p-2 rounded-xl transition-all ${evalItem.isPresent ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}
                      >
                        {evalItem.isPresent ? <CheckCircle size={20} /> : <XCircle size={20} />}
                      </button>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <input 
                          type="number" min="0" max="10" step="1"
                          disabled={!evalItem.isPresent}
                          className={`w-14 p-2 text-center font-black rounded-lg border-2 transition-all outline-none focus:ring-2 focus:ring-blue-400 ${
                            !evalItem.isPresent ? 'opacity-20 border-slate-200' : `${gradeConfig.textColor} ${gradeConfig.lightColor} border-transparent`
                          }`}
                          value={evalItem.grade}
                          onChange={e => updateEval(student.id, { grade: Math.min(10, Math.max(0, parseInt(e.target.value) || 0)) })}
                        />
                        {evalItem.isPresent && (
                          <div className="flex gap-1">
                            {[0, 2, 4, 6, 8, 10].map(val => (
                              <button 
                                key={val}
                                onClick={() => updateEval(student.id, { grade: val })}
                                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all border ${
                                  evalItem.grade === val ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-300 border-slate-100 hover:border-slate-300'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <input 
                        disabled={!evalItem.isPresent}
                        placeholder="Observation rapide..."
                        className="w-full p-2 border rounded-lg text-sm bg-transparent focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-30"
                        value={evalItem.comment}
                        onChange={e => updateEval(student.id, { comment: e.target.value })}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t bg-slate-50 flex justify-between items-center">
          <p className="text-sm text-slate-500 font-medium">{students.length} élèves • 1MA</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 text-slate-600 font-medium">Fermer sans sauver</button>
            <button 
              onClick={() => { onSave(localEvals); onClose(); }} 
              className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              Valider les évaluations <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationModal;
