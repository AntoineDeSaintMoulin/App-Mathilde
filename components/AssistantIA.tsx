
import React, { useState, useEffect } from 'react';
import { Wand2, Sparkles, Copy, RefreshCw, AlertCircle, Quote, Edit3, Save } from 'lucide-react';
import { Student, WeeklyComment, AIReport, AppData, Subject } from '../types';
import { generateReport, ToneType } from '../services/geminiService';
import { SUBJECTS, getGradeConfig } from '../constants';

interface Props {
  students: Student[];
  data: AppData;
  onSaveReport: (report: AIReport) => void;
  existingReports: AIReport[];
}

const AssistantIA: React.FC<Props> = ({ students, data, onSaveReport, existingReports }) => {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedCycle, setSelectedCycle] = useState(1);
  const [tone, setTone] = useState<ToneType>('neutre');
  const [report, setReport] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Charger le rapport existant si on change d'élève ou de trimestre
    const existing = existingReports.find(r => r.studentId === selectedStudent && r.cycle === selectedCycle);
    if (existing) {
      setReport(existing.content);
    } else {
      setReport('');
    }
    setIsEditing(false);
  }, [selectedStudent, selectedCycle, existingReports]);

  const getAcademicResultsString = (sid: string) => {
    return SUBJECTS.map(s => {
      const evals = data.evaluations.filter(e => {
        const act = data.activities.find(a => a.id === e.activityId);
        return e.studentId === sid && e.isPresent && act?.subject === s.value;
      });
      if (evals.length === 0) return null;
      
      const counts = evals.reduce((acc, curr) => {
        const label = getGradeConfig(curr.grade).label;
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return `${s.label}: ${Object.entries(counts).map(([lvl, n]) => `${n}x ${lvl}`).join(', ')}`;
    }).filter(Boolean).join('\n');
  };

  const handleGenerate = async () => {
    if (!selectedStudent) return;
    
    setIsLoading(true);
    setError(null);

    const student = students.find(s => s.id === selectedStudent);
    const comments = Array.from({ length: 13 }).map((_, i) => {
      return data.weeklyComments.find(c => c.studentId === selectedStudent && c.cycle === selectedCycle && c.week === i + 1)?.content || '';
    }).filter(c => c.length > 0);

    const academicResults = getAcademicResultsString(selectedStudent);

    if (comments.length === 0 && !academicResults) {
      setError("Données insuffisantes pour générer une synthèse.");
      setIsLoading(false);
      return;
    }

    try {
      const generated = await generateReport(
        `${student?.firstName} ${student?.lastName}`, 
        comments, 
        academicResults || "Aucune note saisie", 
        tone
      );
      const content = generated || "";
      setReport(content);
      setIsEditing(false);
      onSaveReport({
        studentId: selectedStudent,
        cycle: selectedCycle,
        content: content,
        generatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSave = () => {
    if (!selectedStudent) return;
    onSaveReport({
      studentId: selectedStudent,
      cycle: selectedCycle,
      content: report,
      generatedAt: new Date().toISOString()
    });
    setIsEditing(false);
    alert("Commentaire mis à jour !");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(report);
    alert("Commentaire copié !");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
            <Wand2 className="text-purple-600" /> Assistant Bulletins
          </h3>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Choisir un élève</label>
            <select 
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-50 outline-none"
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
            >
              <option value="">Sélectionner...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Trimestre</label>
            <select 
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-50 outline-none"
              value={selectedCycle}
              onChange={e => setSelectedCycle(parseInt(e.target.value))}
            >
              {[1, 2, 3].map(c => <option key={c} value={c}>Trimestre {c}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Ton du commentaire</label>
            <div className="flex gap-2">
              {(['bienveillant', 'neutre', 'structuré'] as ToneType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${
                    tone === t ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={!selectedStudent || isLoading}
            className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <RefreshCw className="animate-spin" /> : <Sparkles size={18} />}
            Générer avec l'IA
          </button>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white p-8 rounded-3xl border shadow-sm min-h-[400px] flex flex-col relative">
          <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-xl text-slate-800">Commentaire de Bulletin</h3>
             {report && !isLoading && (
               <button 
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors"
               >
                 {isEditing ? 'Annuler' : <><Edit3 size={16}/> Modifier manuellement</>}
               </button>
             )}
          </div>
          
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-sm border border-red-100">{error}</div>}

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <p className="font-medium">Analyse et rédaction en cours...</p>
            </div>
          ) : report ? (
            <div className="flex-1 flex flex-col space-y-6">
              {isEditing ? (
                <textarea 
                  className="flex-1 p-6 rounded-2xl bg-slate-50 border border-blue-200 text-slate-700 leading-relaxed text-lg outline-none focus:ring-2 focus:ring-blue-500 min-h-[250px] shadow-inner"
                  value={report}
                  onChange={e => setReport(e.target.value)}
                  placeholder="Écrivez ou modifiez le commentaire ici..."
                />
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed text-lg italic shadow-inner">
                  "{report}"
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                {isEditing ? (
                  <button 
                    onClick={handleManualSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl shadow hover:bg-green-700 transition-all"
                  >
                    <Save size={18} /> Enregistrer les modifications
                  </button>
                ) : (
                  <button onClick={copyToClipboard} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow hover:bg-slate-800 transition-all">
                    <Copy size={18} /> Copier pour le bulletin
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 text-center">
              <Quote size={64} className="mb-4 opacity-10" />
              <p>Sélectionnez un élève et cliquez sur <br/> "Générer avec l'IA" pour lancer la synthèse.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssistantIA;
