import React, { useState } from 'react';
import { BarChart3, FileDown, TrendingUp, Search, Sparkles, ArrowUpDown } from 'lucide-react';
import { AppData, Subject } from '../types';
import { SUBJECTS, getGradeConfig } from '../constants';
import { exportToCSV } from '../utils/storage';

interface Props {
  data: AppData;
}

type SortOption = 'alpha-asc' | 'alpha-desc' | 'grade-asc' | 'grade-desc';

const SynthesisView: React.FC<Props> = ({ data }) => {
  const [selectedCycle, setSelectedCycle] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('alpha-asc');

  const getStudentAverage = (studentId: string, subject: Subject) => {
    const studentEvals = data.evaluations.filter(e => {
      if (e.studentId !== studentId || !e.isPresent) return false;
      const activity = data.activities.find(a => a.id === e.activityId);
      return activity?.subject === subject;
    });
    if (studentEvals.length === 0) return null;
    const totalScore = studentEvals.reduce((acc, curr) => acc + curr.grade, 0);
    return parseFloat((totalScore / studentEvals.length).toFixed(1));
  };

  const getGlobalAverage = (studentId: string) => {
    const allEvals = data.evaluations.filter(e => e.studentId === studentId && e.isPresent);
    if (allEvals.length === 0) return null;
    const total = allEvals.reduce((acc, curr) => acc + curr.grade, 0);
    return parseFloat((total / allEvals.length).toFixed(1));
  };

  const handleExport = () => {
    const exportData = data.students.map(student => {
      const studentReport = data.aiReports.find(r => r.studentId === student.id && r.cycle === selectedCycle);
      const row: any = {
        'Élève': `${student.firstName} ${student.lastName}`,
        'Moyenne Globale': getGlobalAverage(student.id) ?? '-',
        'Commentaire Global IA': studentReport?.content || 'Non généré',
      };
      SUBJECTS.forEach(s => {
        const avg = getStudentAverage(student.id, s.value);
        row[s.label] = avg !== null ? `${avg}/10` : '-';
      });
      return row;
    });
    exportToCSV(exportData, `synthese-1MA-trimestre-${selectedCycle}`);
  };

  const sortedAndFilteredStudents = data.students
    .filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortOption === 'alpha-asc') {
        return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
      }
      if (sortOption === 'alpha-desc') {
        return `${b.lastName} ${b.firstName}`.localeCompare(`${a.lastName} ${a.firstName}`);
      }
      const avgA = getGlobalAverage(a.id) ?? -1;
      const avgB = getGlobalAverage(b.id) ?? -1;
      if (sortOption === 'grade-asc') return avgA - avgB;
      return avgB - avgA;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2 text-slate-800">
            <BarChart3 className="text-blue-600" /> Pilotage 1MA
          </h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Moyennes par trimestre</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Chercher..."
              className="pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-40 bg-slate-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tri */}
          <div className="flex items-center gap-2 bg-slate-50 border rounded-lg px-3 py-2">
            <ArrowUpDown size={14} className="text-slate-400" />
            <select
              className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
            >
              <option value="alpha-asc">A → Z</option>
              <option value="alpha-desc">Z → A</option>
              <option value="grade-desc">Meilleurs en premier</option>
              <option value="grade-asc">Plus faibles en premier</option>
            </select>
          </div>

          <select
            className="p-2 border rounded-lg text-sm bg-blue-50 font-bold text-blue-800 outline-none"
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(parseInt(e.target.value))}
          >
            {[1, 2, 3].map(c => <option key={c} value={c}>Trimestre {c}</option>)}
          </select>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all shadow-md"
          >
            <FileDown size={14} /> Exporter .CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-widest font-black">
                <th className="p-4 sticky left-0 bg-slate-900 z-10 w-48 border-r border-slate-800">Élève</th>
                <th className="p-4 w-96 min-w-[300px] border-r border-slate-800">Commentaire global</th>
                {SUBJECTS.map(s => (
                  <th key={s.value} className="p-4 text-center whitespace-nowrap min-w-[80px]">
                    <div className="flex flex-col items-center gap-1">
                      {s.icon}
                      <span className="text-[9px]">{s.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {sortedAndFilteredStudents.map(student => {
                const studentReport = data.aiReports.find(r => r.studentId === student.id && r.cycle === selectedCycle);
                const globalAvg = getGlobalAverage(student.id);
                const globalConfig = globalAvg !== null ? getGradeConfig(globalAvg) : null;
                return (
                  <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-4 font-bold text-slate-700 sticky left-0 bg-white group-hover:bg-blue-50/30 z-10 border-r border-slate-100">
                      <div className="flex flex-col gap-1">
                        <span>{student.firstName} {student.lastName}</span>
                        {globalAvg !== null && (
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-white text-[10px] font-black ${globalConfig?.color} w-fit`}>
                            <TrendingUp size={10} /> {globalAvg}/10
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 align-top border-r border-slate-50">
                      {studentReport ? (
                        <p className="text-[11px] text-slate-600 line-clamp-2 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                          "{studentReport.content}"
                        </p>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-300 text-[10px] italic">
                          <Sparkles size={12} />
                          <span>À générer...</span>
                        </div>
                      )}
                    </td>
                    {SUBJECTS.map(s => {
                      const avg = getStudentAverage(student.id, s.value);
                      const config = avg !== null ? getGradeConfig(avg) : null;
                      return (
                        <td key={s.value} className="p-4 text-center">
                          {avg !== null ? (
                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-xs text-white ${config?.color} shadow-sm`}>
                              {Math.round(avg)}
                            </div>
                          ) : (
                            <span className="text-slate-100 text-xs">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SynthesisView;
