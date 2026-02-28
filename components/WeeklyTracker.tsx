import React, { useState } from 'react';
import { CalendarDays, Save } from 'lucide-react';
import { Student, WeeklyComment } from '../types';

interface Props {
  students: Student[];
  comments: WeeklyComment[];
  onSaveComment: (comment: WeeklyComment) => void;
}

const WeeklyTracker: React.FC<Props> = ({ students, comments, onSaveComment }) => {
  const [selectedCycle, setSelectedCycle] = useState(1);
  const [editingComment, setEditingComment] = useState<{sid: string, week: number, content: string} | null>(null);
  const [sortAlpha, setSortAlpha] = useState(true);

  const getComment = (sid: string, week: number) => {
    return comments.find(c => c.studentId === sid && c.cycle === selectedCycle && c.week === week)?.content || '';
  };

  const cycles = [1, 2, 3];
  const weeks = Array.from({ length: 13 }, (_, i) => i + 1);

  const sortedStudents = [...students].sort((a, b) =>
    sortAlpha
      ? `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
      : `${b.lastName} ${b.firstName}`.localeCompare(`${a.lastName} ${a.firstName}`)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-3">
          <CalendarDays className="text-blue-500" />
          <h2 className="text-lg font-bold">Suivi Hebdomadaire (3 Cycles de 13 semaines)</h2>
        </div>
        <div className="flex gap-2">
          {cycles.map(cycle => (
            <button
              key={cycle}
              onClick={() => setSelectedCycle(cycle)}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${
                selectedCycle === cycle ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Trimestre {cycle}
            </button>
          ))}
          <button
            onClick={() => setSortAlpha(prev => !prev)}
            className="px-4 py-2 rounded-xl font-bold transition-all bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-2 text-sm"
          >
            A→Z {sortAlpha ? '↑' : '↓'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-black">
              <th className="p-4 border-r sticky left-0 bg-slate-50 z-10 w-48">Élève</th>
              {weeks.map(w => (
                <th key={w} className="p-4 border-r text-center w-40">S.{w}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedStudents.map(student => (
              <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 border-r sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <span className="font-bold text-slate-800 whitespace-nowrap text-sm">
                      {student.firstName} {student.lastName}
                    </span>
                  </div>
                </td>
                {weeks.map(week => (
                  <td key={week} className="p-2 border-r align-top">
                    <div className="group relative h-24">
                      {editingComment?.sid === student.id && editingComment?.week === week ? (
                        <div className="flex flex-col h-full gap-1">
                          <textarea
                            autoFocus
                            className="flex-1 p-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none resize-none bg-white shadow-inner"
                            value={editingComment.content}
                            onChange={e => setEditingComment({...editingComment, content: e.target.value})}
                          />
                          <button
                            onClick={() => {
                              onSaveComment({ studentId: student.id, cycle: selectedCycle, week, content: editingComment.content });
                              setEditingComment(null);
                            }}
                            className="bg-blue-600 text-white p-1 rounded-md flex items-center justify-center hover:bg-blue-700 transition-colors"
                          >
                            <Save size={14} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => setEditingComment({ sid: student.id, week, content: getComment(student.id, week) })}
                          className={`h-full p-2 text-[11px] leading-snug transition-all rounded-xl border border-transparent ${
                            getComment(student.id, week)
                              ? 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-200 italic'
                              : 'text-transparent hover:bg-slate-50 hover:text-slate-300'
                          }`}
                        >
                          {getComment(student.id, week) || 'Ajouter...'}
                        </div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={14} className="p-12 text-center text-slate-400 italic">Ajoutez d'abord des élèves dans l'onglet Élèves.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklyTracker;
