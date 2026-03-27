import React, { useState, useRef, useCallback } from 'react';
import { CalendarDays, Save, X } from 'lucide-react';
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
  const colWidthsRef = useRef<Record<number, number>>({});
  const thRefs = useRef<Record<number, HTMLTableCellElement | null>>({});

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
    const currentWidth = colWidthsRef.current[week] || 160;
    resizingCol.current = { week, startX: e.clientX, startWidth: currentWidth };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingCol.current) return;
      const diff = moveEvent.clientX - resizingCol.current.startX;
      const newWidth = Math.max(80, resizingCol.current.startWidth + diff);
      colWidthsRef.current = { ...colWidthsRef.current, [resizingCol.current.week]: newWidth };
      const th = thRefs.current[resizingCol.current.week];
      if (th) th.style.width = `${newWidth}px`;
    };

    const handleMouseUp = () => {
      if (resizingCol.current) {
        setColWidths({ ...colWidthsRef.current });
      }
      resizingCol.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleSave = () => {
    if (!editingComment) return;
    onSaveComment({
      studentId: editingComment.sid,
      cycle: selectedCycle,
      week: editingComment.week,
      content: editingComment.content
    });
    setEditingComment(null);
  };

  const editingStudent = editingComment
    ? sortedStudents.find(s => s.id === editingComment.sid)
    : null;

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

      {/* Modale plein écran */}
      {editingComment && editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="bg-white w-full md:max-w-lg md:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col"
            style={{ maxHeight: '90vh' }}
          >
            {/* Header modale */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                  Semaine {editingComment.week} — Trimestre {selectedCycle}
                </p>
                <h3 className="font-black text-lg text-slate-800">
                  {editingStudent.firstName} {editingStudent.lastName}
                </h3>
              </div>
              <button
                onClick={() => setEditingComment(null)}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Zone de texte */}
            <div className="flex-1 p-6 overflow-y-auto">
              <textarea
                autoFocus
                className="w-full h-64 p-4 text-sm text-slate-700 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none resize-none bg-slate-50 leading-relaxed"
                placeholder="Écrivez votre commentaire ici..."
                value={editingComment.content}
                onChange={e => setEditingComment({ ...editingComment, content: e.target.value })}
              />
            </div>

            {/* Footer modale */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setEditingComment(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <Save size={16} /> Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

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
                  ref={el => thRefs.current[w] = el}
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
                {weeks.map(week => {
                  const comment = getComment(student.id, week);
                  return (
                    <td key={week} className="p-2 border-r align-top" style={{ width: colWidths[week] || 160 }}>
                      <div
                        onClick={() => setEditingComment({ sid: student.id, week, content: comment })}
                        className={`tracker-scroll h-24 p-2 text-[11px] leading-snug transition-all rounded-xl border border-transparent overflow-y-auto cursor-pointer ${
                          comment
                            ? 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-200 italic'
                            : 'hover:bg-slate-50 hover:border-slate-100'
                        }`}
                      >
                        {comment || (
                          <span className="text-slate-200 not-italic">Ajouter...</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={14} className="p-12 text-center text-slate-400 italic">
                  Ajoutez d'abord des élèves dans l'onglet Élèves.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklyTracker;
