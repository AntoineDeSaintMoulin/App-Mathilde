import React, { useState, useEffect } from 'react';
import { X, Sparkles, Activity as ActivityIcon, Calendar, Target, MessageSquare, Phone, Cake, Edit3, Save } from 'lucide-react';
import { Student, AppData, Subject, Activity, Evaluation, AIReport } from '../types';
import { DOMAINS, getGradeConfig } from '../constants';

interface Props {
  student: Student;
  data: AppData;
  onClose: () => void;
  onUpdateReport?: (report: AIReport) => void;
}

const MAIN_SUBJECTS: { value: Subject; label: string; color: string }[] = [
  { value: 'mathématiques', label: 'Mathématiques', color: 'bg-[#B39EB5]' },
  { value: 'français', label: 'Français', color: 'bg-[#B3EBF2]' },
];

const StudentProfileModal: React.FC<Props> = ({ student, data, onClose, onUpdateReport }) => {
  const [selectedCycle, setSelectedCycle] = useState(1);
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
    const evals = data.evaluations.filter(e => {
      if (e.studentId !== student.id || !e.isPresent || e.grade <= 0) return false;
      const activity = data.activities.find(a => a.id === e.activityId);
      return activity?.subject === subject;
    });
    if (evals.length === 0) return null;
    return parseFloat((evals.reduce((acc, e) => acc + e.grade, 0) / evals.length).toFixed(1));
  };

  const getDomainAverage = (subject: Subject, domain: string) => {
    const evals = data.evaluations.filter(e => {
      if (e.studentId !== student.id || !e.isPresent || e.grade <= 0) return false;
      const activity = data.activities.find(a => a.id === e.activityId);
      return activity?.subject === subject && activity?.domain === domain;
    });
    if (evals.length === 0) return null;
    return parseFloat((evals.reduce((acc, e) => acc + e.grade, 0) / evals.length).toFixed(1));
  };

  const getActivitiesForDomain = (subject: Subject, domain: string) => {
    return data.activities
      .filter(a => a.subject === subject && a.domain === domain)
      .map(activity => {
        const evaluation = data.evaluations.find(e => e.activityId === activity.id && e.studentId === student.id);
        return { activity, evaluation };
      })
      .filter(({ evaluation }) => evaluation)
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
      <div className="bg-white w-full max-w-6xl max-h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="p-8 border-b bg-slate-50 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg text-3xl font-black">
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
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">

          {/* Commentaire IA */}
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
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl shadow-inner flex flex-col gap-4">
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
                  <p className="text-[10px] text-purple-500 font-bold uppercase tracking-widest">Assistant IA</p>
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

          {/* Détail des activités en 2 colonnes */}
          <section>
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 mb-4">
              <ActivityIcon className="text-blue-600" size={20} /> Détails des Activités
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MAIN_SUBJECTS.map(subject => {
                const subjectAvg = getSubjectAverage(subject.value);
                const subjectConfig = subjectAvg !== null ? getGradeConfig(subjectAvg) : null;
                const domains = DOMAINS[subject.value] || [];

                return (
                  <div key={subject.value} className="bg-white border rounded-2xl overflow-hidden shadow-sm">

                    {/* En-tête colonne matière */}
                    <div className={`${subject.color} p-4 flex items-center justify-between`}>
                      <h4 className="font-black text-white text-base">{subject.label}</h4>
                      {subjectAvg !== null && (
                        <div className="bg-white/20 px-3 py-1 rounded-xl">
                          <span className="text-white font-black text-sm">{subjectAvg}/10</span>
                        </div>
                      )}
                    </div>

                    {/* Domaines de compétences */}
                    <div className="divide-y">
                      {domains.map(domain => {
                        const domainAvg = getDomainAverage(subject.value, domain);
                        const domainConfig = domainAvg !== null ? getGradeConfig(domainAvg) : null;
                        const activities = getActivitiesForDomain(subject.value, domain);

                        return (
                          <div key={domain} className="p-4">
                            {/* En-tête domaine */}
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-black uppercase tracking-widest text-slate-500">{domain}</span>
                              {domainAvg !== null && (
                                <span className={`text-[10px] font-black text-white px-2 py-0.5 rounded-lg ${domainConfig?.color}`}>
                                  {domainAvg}/10
                                </span>
                              )}
                            </div>

                            {/* Activités du domaine */}
                            {activities.length > 0 ? (
                              <div className="space-y-2">
                                {activities.map(({ activity, evaluation }) => {
                                  const config = evaluation ? getGradeConfig(evaluation.grade) : null;
                                  return (
                                    <div key={activity.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-bold text-slate-700 truncate">{activity.title}</p>
                                          <p className="text-[10px] text-slate-400">
                                            {new Date(activity.date).toLocaleDateString('fr-FR')}
                                          </p>
                                        </div>
                                        {evaluation && evaluation.grade > 0 && (
                                          <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-black text-white ${config?.color}`}>
                                            {evaluation.grade}
                                          </div>
                                        )}
                                      </div>
                                      {evaluation?.comment && (
                                        <p className="mt-2 text-[11px] text-slate-500 italic border-t border-slate-100 pt-2">
                                          "{evaluation.comment}"
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-300 italic">Aucune activité</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
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
