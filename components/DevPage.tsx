import React, { useState } from 'react';
import { GraduationCap, Construction, LogOut, Edit3, BookOpen, Calculator, Globe, FlaskConical, Clock, Map, Trophy } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

interface Props {
  userId: string;
  fullName: string;
  subjects: string[];
  years: string[];
  onProfileUpdated: () => void;
  inModal?: boolean;
}

const SUBJECTS = [
  { value: 'général', label: 'Général', icon: <GraduationCap size={18} /> },
  { value: 'mathématiques', label: 'Mathématiques', icon: <Calculator size={18} /> },
  { value: 'français', label: 'Français', icon: <BookOpen size={18} /> },
  { value: 'néerlandais', label: 'Néerlandais', icon: <Globe size={18} /> },
  { value: 'sciences', label: 'Sciences', icon: <FlaskConical size={18} /> },
  { value: 'histoire', label: 'Histoire', icon: <Clock size={18} /> },
  { value: 'géographie', label: 'Géographie', icon: <Map size={18} /> },
  { value: 'sport', label: 'Sport', icon: <Trophy size={18} /> },
];

const PRIMARY_YEARS = [1, 2, 3, 4, 5, 6];
const SECONDARY_YEARS = [1, 2, 3, 4, 5, 6];

const DevPage: React.FC<Props> = ({ userId, fullName, subjects, years, onProfileUpdated, inModal = false }) => {
  const [showEdit, setShowEdit] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(subjects);
  const [selectedPrimaryYears, setSelectedPrimaryYears] = useState<number[]>(
    years.filter(y => y.startsWith('P')).map(y => parseInt(y.slice(1)))
  );
  const [selectedSecondaryYears, setSelectedSecondaryYears] = useState<number[]>(
    years.filter(y => y.startsWith('S')).map(y => parseInt(y.slice(1)))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const toggleSubject = (value: string) => {
    setSelectedSubjects(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
    );
  };

  const togglePrimaryYear = (year: number) => {
    setSelectedPrimaryYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const toggleSecondaryYear = (year: number) => {
    setSelectedSecondaryYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const handleSave = async () => {
    if (selectedSubjects.length === 0) {
      setError('Veuillez sélectionner au moins une matière.');
      return;
    }
    if (selectedPrimaryYears.length === 0 && selectedSecondaryYears.length === 0) {
      setError('Veuillez sélectionner au moins une année.');
      return;
    }

    setLoading(true);
    setError(null);

    const newYears = [
      ...selectedPrimaryYears.map(y => `P${y}`),
      ...selectedSecondaryYears.map(y => `S${y}`),
    ];

    const { error } = await supabase.from('profiles').update({
      subjects: selectedSubjects,
      years: newYears,
    }).eq('id', userId);

    if (error) {
      setError('Erreur lors de la mise à jour du profil.');
      setLoading(false);
      return;
    }

    setShowEdit(false);
    setLoading(false);
    onProfileUpdated();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-lg flex flex-col items-center gap-8">

        <div className="w-20 h-20 bg-yellow-100 rounded-2xl flex items-center justify-center">
          <Construction size={40} className="text-yellow-500" />
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-black text-2xl text-slate-900 tracking-tighter">
            Page en développement
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Bonjour <span className="font-bold text-slate-700">{fullName}</span> ! Votre espace pour{' '}
            <span className="font-bold text-slate-700">{subjects.join(', ')}</span>{' '}
            en <span className="font-bold text-slate-700">{years.join(', ')}</span> est en cours de création.
          </p>
          <p className="text-slate-400 text-xs">
            Revenez bientôt — nous travaillons activement sur votre espace.
          </p>
        </div>

        <div className="flex items-center gap-2 text-slate-300">
          <GraduationCap size={20} />
          <span className="font-black text-sm tracking-tighter">1MA.app</span>
        </div>

        {!inModal && (
  <div className="flex flex-col gap-3 w-full">
    <button
      onClick={() => setShowEdit(true)}
      className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all text-sm shadow-md"
    >
      <Edit3 size={16} /> Modifier mon profil
    </button>
    <button
      onClick={handleLogout}
      className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
    >
      <LogOut size={16} /> Se déconnecter
    </button>
  </div>
)}
      </div>

      {/* Modale de modification */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-black text-xl text-slate-900">Modifier mon profil</h2>

            {/* Matières */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Vos matières
              </label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => toggleSubject(s.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      selectedSubjects.includes(s.value)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Années primaire */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Années — Primaire
              </label>
              <div className="flex gap-2">
                {PRIMARY_YEARS.map(y => (
                  <button
                    key={y}
                    onClick={() => togglePrimaryYear(y)}
                    className={`w-12 h-12 rounded-xl font-black text-sm transition-all ${
                      selectedPrimaryYears.includes(y)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {y}P
                  </button>
                ))}
              </div>
            </div>

            {/* Années secondaire */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Années — Secondaire
              </label>
              <div className="flex gap-2">
                {SECONDARY_YEARS.map(y => (
                  <button
                    key={y}
                    onClick={() => toggleSecondaryYear(y)}
                    className={`w-12 h-12 rounded-xl font-black text-sm transition-all ${
                      selectedSecondaryYears.includes(y)
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {y}S
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setShowEdit(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevPage;
