import React, { useState, useRef, useCallback } from 'react';
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
  const [colWidths, setColWidths] = useState<Record<number, number>>({});
  const resizingCol = useRef<{ week: number; startX: number; startWidth: number } | null>(null);

  const getComment = (sid: string, week: number) => {
    return comments.find(c => c.studentId === sid && c.cycle === selectedCycle && c.week === week)?.content || '';
  };

  const cycles = [1, 2, 3];
  const weeks = Array.from({ length: 13 }, (_, i) => i + 1);

  const sortedStudents = [...students].sort((a, b) =>
    sortAlpha
      ? `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      : `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`)
  );

  const handleMouseDown = useCallback((e: React.MouseEvent, week: number) => {
    e.preventDefault();
    const currentWidth = colWidths[week] || 160;
    resizingCol.current = { week, startX: e.clientX, startWidth: currentWidth };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingCol.current) return;
      const diff = moveEvent.clientX - resizingCol.current.startX;
      const newWidth = Math.max(80, resizingCol.current.startWidth + diff);
      setColWidths(prev => ({ ...prev, [resizingCol.current!.week]: newWidth }));
    };

    const handleMouseUp = () => {
      resizingCol.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [colWidths]);

  return (
    <div className="space-y-6">
      <style>{`
        .tracker-scroll::-webkit-scrollbar {
          height: 0px;
          width: 4px;
        }
        .tracker-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .tracker-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .tracker-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .resize-handle {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          cursor: col-resize;
          opacity: 0;
          background: #3b82f6;
          border-radius: 3px;
          transition: opacity 0.2s;
        }
        th:hover .resize-handle {
          opacity: 1;
        }
      `}</style>

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

      <div className="tracker-scroll overflow-x-auto overflow-y-auto rounded-2xl border shadow-sm bg-white">
        <table className="text-left border-collapse" style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}>
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-black">
              <th className="p-4 border-r sticky left-0 bg-slate-50 z-10" style={{ width: 192 }}>Élève</th>
              {weeks.map(w => (
                <th
                  key={w}
                  className="p-4 border-r text-center relative"
                  style={{ width: colWidths[w] || 160 }}
                >
                  S.{w}
                  <div
                    className="resize-handle"
                    onMouseDown={(e) => handleMouseDown(e, w)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedStudents.map(student => (
              <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 border-r sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]" style={{ width: 192 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase shrink-0">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <span className="font-bold text-slate-800 whitespace-nowrap text-sm">
                      {student.firstName} {student.lastName}
                    </span>
                  </div>
                </td>
                {weeks.map(week => (
                  <td key={week} className="p-2 border-r align-top" style={{ width: colWidths[week] || 160 }}>
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
                          className={`tracker-scroll h-full p-2 text-[11px] leading-snug transition-all rounded-xl border border-transparent overflow-y-auto ${
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
