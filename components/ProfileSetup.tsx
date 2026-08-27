import React, { useState } from 'react';
import { GraduationCap, BookOpen, Calculator, Globe, FlaskConical, Clock, Map, Trophy } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

interface Props {
  userId: string;
  onComplete: () => void;
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

const ProfileSetup: React.FC<Props> = ({ userId, onComplete }) => {
  const [fullName, setFullName] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedPrimaryYears, setSelectedPrimaryYears] = useState<number[]>([]);
  const [selectedSecondaryYears, setSelectedSecondaryYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      setError('Veuillez entrer votre nom complet.');
      return;
    }
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

    const years = [
      ...selectedPrimaryYears.map(y => `P${y}`),
      ...selectedSecondaryYears.map(y => `S${y}`),
    ];

    const { error } = await supabase.from('profiles').insert({
      id: userId,
      full_name: fullName.trim(),
      subjects: selectedSubjects,
      years,
    });

    if (error) {
      setError('Erreur lors de la création du profil. Veuillez réessayer.');
      setLoading(false);
      return;
    }

    onComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-2xl flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="font-black text-2xl text-slate-900 tracking-tighter">Créez votre profil</h1>
          <p className="text-slate-400 text-sm text-center">Ces informations permettront de personnaliser votre espace.</p>
        </div>

        {/* Nom complet */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">
            Votre nom complet
          </label>
          <input
            type="text"
            placeholder="Ex: Marie Dupont"
            className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-sm"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
          />
        </div>

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

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        {/* Bouton */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
        >
          {loading ? 'Création en cours...' : 'Créer mon profil →'}
        </button>
      </div>
    </div>
  );
};

export default ProfileSetup;
