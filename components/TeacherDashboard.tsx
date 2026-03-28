import React, { useState } from 'react';
import { BarChart3, BookOpen, Calculator } from 'lucide-react';
import { AppData, Subject } from '../types';
import { DOMAINS, getGradeConfig } from '../constants';

interface Props {
  data: AppData;
}

const MAIN_SUBJECTS: { value: Subject; label: string; color: string; bgLight: string; icon: React.ReactNode }[] = [
  { value: 'mathématiques', label: 'Mathématiques', color: 'bg-orange-500', bgLight: 'bg-orange-50', icon: <Calculator size={18} /> },
  { value: 'français', label: 'Français', color: 'bg-sky-400', bgLight: 'bg-sky-50', icon: <BookOpen size={18} /> },
];

const MAX_ACTIVITIES = 10;

const TeacherDashboard: React.FC<Props> = ({ data }) => {
  const [selectedCycle, setSelectedCycle] = useState<number | 'all'>('all');

  const getActivitiesForDomain = (subject: Subject, domain: string) => {
    return data.activities.filter(a => {
      if (a.subject !== subject || a.domain !== domain) return false;
      if (selectedCycle === 'all') return true;
      // Filtre par trimestre — on utilise les évaluations pour déterminer le cycle
      // On considère que toutes les activités sont dans le même cycle pour simplifier
      // En pratique on filtre par date approximative (trimestre 1 = mois 9-12, 2 = 1-3, 3 = 4-6)
      const month = new Date(a.date).getMonth() + 1;
      if (selectedCycle === 1) return month >= 9 || month <= 12;
      if (selectedCycle === 2) return month >= 1 && month <= 3;
      if (selectedCycle === 3) return month >= 4 && month <= 6;
      return true;
    });
  };

  const getClassAverageForDomain = (subject: Subject, domain: string) => {
    const activities = getActivitiesForDomain(subject, domain);
    if (activities.length === 0) return null;

    const allEvals = activities.flatMap(a =>
      data.evaluations.filter(e => e.activityId === a.id && e.isPresent && e.grade > 0)
    );

    if (allEvals.length === 0) return null;
    return parseFloat((allEvals.reduce((acc, e) => acc + e.grade, 0) / allEvals.length).toFixed(1));
  };

  const getProgressColor = (count: number) => {
    const ratio = count / MAX_ACTIVITIES;
    if (ratio === 0) return 'bg-slate-200';
    if (ratio < 0.3) return 'bg-red-400';
    if (ratio < 0.6) return 'bg-orange-400';
    if (ratio < 1) return 'bg-yellow-400';
    return 'bg-emerald-500';
  };

  const getProgressLabel = (count: number) => {
    const ratio = count / MAX_ACTIVITIES;
    if (ratio === 0) return 'Non démarré';
    if (ratio < 0.3) return 'Débuté';
    if (ratio < 0.6) return 'En cours';
    if (ratio < 1) return 'Avancé';
    return 'Complet';
  };

  const getProgressTextColor = (count: number) => {
    const ratio = count / MAX_ACTIVITIES;
    if (ratio === 0) return 'text-slate-400';
    if (ratio < 0.3) return 'text-red-500';
    if (ratio < 0.6) return 'text-orange-500';
    if (ratio < 1) return 'text-yellow-600';
    return 'text-emerald-600';
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2 text-slate-800">
            <BarChart3 className="text-blue-600" /> Suivi Prof
          </h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Progression par domaine de compétence — {MAX_ACTIVITIES} activités max par domaine
          </p>
        </div>

        {/* Sélecteur trimestre */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCycle('all')}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              selectedCycle === 'all' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Toute l'année
          </button>
          {[1, 2, 3].map(c => (
            <button
              key={c}
              onClick={() => setSelectedCycle(c)}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                selectedCycle === c ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              T{c}
            </button>
          ))}
        </div>
      </div>

      {/* Grille matières */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MAIN_SUBJECTS.map(subject => {
          const domains = DOMAINS[subject.value] || [];
          const totalActivities = domains.reduce((acc, domain) =>
            acc + getActivitiesForDomain(subject.value, domain).length, 0
          );
          const totalMax = domains.length * MAX_ACTIVITIES;
          const globalRatio = totalActivities / totalMax;

          return (
            <div key={subject.value} className="bg-white rounded-2xl border shadow-sm overflow-hidden">

              {/* En-tête matière */}
              <div className={`${subject.color} p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-white">
                    {subject.icon}
                    <h3 className="font-black text-lg">{subject.label}</h3>
                  </div>
                  <div className="bg-white/20 px-3 py-1 rounded-xl">
                    <span className="text-white font-black text-sm">{totalActivities}/{totalMax}</span>
                  </div>
                </div>

                {/* Barre de progression globale */}
                <div className="bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all duration-500"
                    style={{ width: `${Math.min(globalRatio * 100, 100)}%` }}
                  />
                </div>
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mt-1">
                  {Math.round(globalRatio * 100)}% de la couverture annuelle
                </p>
              </div>

              {/* Domaines */}
              <div className="divide-y">
                {domains.map(domain => {
                  const activities = getActivitiesForDomain(subject.value, domain);
                  const count = activities.length;
                  const ratio = count / MAX_ACTIVITIES;
                  const classAvg = getClassAverageForDomain(subject.value, domain);
                  const avgConfig = classAvg !== null ? getGradeConfig(classAvg) : null;

                  return (
                    <div key={domain} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-700">{domain}</span>
                          <span className={`text-[10px] font-black uppercase ${getProgressTextColor(count)}`}>
                            {getProgressLabel(count)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {classAvg !== null && (
                            <span className={`text-[10px] font-black text-white px-2 py-0.5 rounded-lg ${avgConfig?.color}`}>
                              moy. {classAvg}/10
                            </span>
                          )}
                          <span className="text-xs font-black text-slate-400">
                            {count}/{MAX_ACTIVITIES}
                          </span>
                        </div>
                      </div>

                      {/* Barre de progression domaine */}
                      <div className="bg-slate-100 rounded-full h-2">
                        <div
                          className={`${getProgressColor(count)} rounded-full h-2 transition-all duration-500`}
                          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                        />
                      </div>

                      {/* Pastilles activités */}
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {Array.from({ length: MAX_ACTIVITIES }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-4 h-4 rounded-sm transition-all ${
                              i < count ? getProgressColor(count) : 'bg-slate-100'
                            }`}
                            title={i < count ? activities[i]?.title : 'Non fait'}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherDashboard;
