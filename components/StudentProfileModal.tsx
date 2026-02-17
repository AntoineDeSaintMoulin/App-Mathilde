
import React, { useState, useEffect } from 'react';
import { X, Sparkles, ChevronDown, Activity as ActivityIcon, Calendar, Target, MessageSquare, Phone, Cake, Edit3, Save } from 'lucide-react';
import { Student, AppData, Subject, Activity, Evaluation, AIReport } from '../types';
import { SUBJECTS, getGradeConfig } from '../constants';

interface Props {
  student: Student;
  data: AppData;
  onClose: () => void;
  onUpdateReport?: (report: AIReport) => void;
}

const StudentProfileModal: React.FC<Props> = ({ student, data, onClose, onUpdateReport }) => {
  const [selectedCycle, setSelectedCycle] = useState(1);
  const [expandedSubject, setExpandedSubject] = useState<Subject | null>(null);
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [editedReportContent, setEditedReportContent] = useState('');

  const currentReport = data.aiReports.find(r => r.studentId === student.id && r.cycle === selectedCycle);

  useEffect(() => {
    if (currentReport) {
      setEditedReportContent(currentReport.content);
    } else {
      setEditedReportContent('');
    }
    setIsEditingReport(false);
  }, [selectedCycle, currentReport]);

  const getSubjectAverage = (subject: Subject) => {
    const studentEvals = data.evaluations.filter(e => {
      if (e.studentId !== student.id || !e.isPresent) return false;
      const activity = data.activities.find(a => a.id === e.activityId);
      return activity?.subject === subject;
    });

    if (studentEvals.length === 0) return null;

    const totalScore = studentEvals.reduce((acc, curr) => acc + curr.grade, 0);
    return parseFloat((totalScore / studentEvals.length).toFixed(1));
  };

  const getActivitiesForSubject = (subject: Subject) => {
    return data.activities
      .filter(a => a.subject === subject)
      .map(activity => {
        const evaluation = data.evaluations.find(e => e.activityId === activity.id && e.studentId === student.id);
        return { activity, evaluation };
      })
      .sort((a, b) => new Date(b.activity.date).getTime() - new Date(a.activity.date).getTime());
  };

  const handleSaveReport = () => {
    if (onUpdateReport) {
      onUpdateReport({
        studentId: student.id,
        cycle: selectedCycle,
        content: editedReportContent,
        generatedAt: new Date().toISOString()
      });
      setIsEditingReport(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 border-b bg-slate-50 flex justify-between items-start">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 text-3xl font-black">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900">{student.firstName} {student.lastName}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <span className="bg-slate-900 text-white text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-widest">Classe 1MA</span>
                {student.birthDate && (
                  <span className="text-sm text-slate-500 flex items-center gap-2 bg-white px-3 py-1 rounded-full border">
                    <Cake size={14} className="text-pink-400" /> Né(e) le {new Date(student.birthDate).toLocaleDateString('fr-FR')}
                  </span>
                )}
                {student.parentPhones && (
                  <span className="text-sm text-slate-500 flex items-center gap-2 bg-white px-3 py-1 rounded-full border">
                    <Phone size={14} className="text-green-500" /> {student.parentPhones}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Sparkles className="text-purple-600" size={20} /> Commentaire Final IA
              </h3>
              <div className="flex gap-2">
                {[1, 2, 3].map(c => (
                  <button 
                    key={c}
                    onClick={() => setSelectedCycle(c)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedCycle === c ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  >
                    Trimestre {c}
                  </button>
                ))}
              </div>
            </div>
            
            {currentReport || isEditingReport ? (
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl shadow-inner relative flex flex-col gap-4">
                {isEditingReport ? (
                  <textarea 
                    className="w-full p-4 rounded-xl bg-white border border-blue-300 text-slate-700 leading-relaxed text-sm h-40 outline-none focus:ring-2 focus:ring-blue-500"
                    value={editedReportContent}
                    onChange={e => setEditedReportContent(e.target.value)}
                  />
                ) : (
                  <p className="text-slate-700 leading-relaxed italic text-lg">"{currentReport?.content}"</p>
                )}
                
                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                   <div className="flex items-center gap-2">
                      <p className="text-[10px] text-purple-500 font-bold uppercase tracking-widest">Assistant IA</p>
                   </div>
                   <div className="flex gap-3">
                     {isEditingReport ? (
                        <button 
                          onClick={handleSaveReport}
                          className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700"
                        >
                          <Save size={14} /> Sauvegarder
                        </button>
                     ) : (
                       <button 
                        onClick={() => setIsEditingReport(true)}
                        className="flex items-center gap-2 text-slate-400 hover:text-blue-600 text-[10px] font-bold uppercase tracking-widest transition-colors"
                       >
                         <Edit3 size={14} /> Modifier manuellement
                       </button>
                     )}
                   </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-10 rounded-2xl text-center">
                <p className="text-slate-400 text-sm font-medium italic">Commentaire non généré pour ce trimestre.</p>
                <p className="text-[10px] text-slate-300 mt-1 uppercase font-bold tracking-widest">Allez dans l'onglet Assistant IA pour le créer</p>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 mb-4">
              <ActivityIcon className="text-blue-600" size={20} /> Détails des Activités
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUBJECTS.map(subject => {
                const average = getSubjectAverage(subject.value);
                const isExpanded = expandedSubject === subject.value;
                const subjectActivities = getActivitiesForSubject(subject.value);
                const gradeConfig = average !== null ? getGradeConfig(average) : null;

                return (
                  <div 
                    key={subject.value} 
                    className={`border rounded-2xl transition-all ${isExpanded ? 'ring-2 ring-blue-500 border-transparent shadow-md' : 'hover:border-blue-200 bg-white'}`}
                  >
                    <button 
                      onClick={() => setExpandedSubject(isExpanded ? null : subject.value)}
                      className="w-full p-5 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`${subject.color} p-2.5 rounded-xl text-white shadow-sm`}>
                          {subject.icon}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{subject.label}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">{subjectActivities.length} activités</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {average !== null && (
                          <div className={`px-3 py-1 rounded-lg text-sm font-black text-white ${gradeConfig?.color}`}>
                            {Math.round(average)}/10
                          </div>
                        )}
                        <ChevronDown size={18} className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 space-y-3 border-t bg-slate-50/50">
                        {subjectActivities.length > 0 ? (
                          subjectActivities.map(({ activity, evaluation }) => {
                            const config = evaluation ? getGradeConfig(evaluation.grade) : null;
                            return (
                              <div key={activity.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-700">{activity.title}</p>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">{activity.domain}</span>
                                  </div>
                                  {evaluation && (
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white ${config?.color}`}>
                                      {evaluation.grade}
                                    </div>
                                  )}
                                </div>
                                {evaluation?.comment && (
                                  <div className="mt-3 p-3 bg-slate-50 rounded-lg text-slate-600 border border-slate-100 italic text-[11px] shadow-inner">
                                    "{evaluation.comment}"
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-center py-4 text-xs text-slate-400 italic">Aucune donnée pour cette matière.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileModal;
