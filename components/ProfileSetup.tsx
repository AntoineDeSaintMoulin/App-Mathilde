import React, { useState } from 'react';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { createClass } from '../utils/storage';

interface ClassEntry {
  year: string;
  subject: string;
}

interface Props {
  userId: string;
  onComplete: () => void;
}

const PRIMARY_YEARS = [1, 2, 3, 4, 5, 6];
const SECONDARY_YEARS = [1, 2, 3, 4, 5, 6];

const SUBJECTS = [
  'Général',
  'Mathématiques',
  'Français',
  'Néerlandais',
  'Sciences',
  'Histoire',
  'Géographie',
  'Sport',
];

const ProfileSetup: React.FC<Props> = ({ userId, onComplete }) => {
  const [fullName, setFullName] = useState('');
  const [classes, setClasses] = useState<ClassEntry[]>([{ year: 'P1', subject: 'Général' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addClass = () => {
    setClasses(prev => [...prev, { year: 'P1', subject: 'Général' }]);
  };

  const removeClass = (index: number) => {
    setClasses(prev => prev.filter((_, i) => i !== index));
  };

  const updateClass = (index: number, field: keyof ClassEntry, value: string) => {
    setClasses(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const getClassName = (year: string, subject: string) => {
    const level = year.startsWith('P')
      ? `${year.slice(1)}ère Primaire`
      : `${year.slice(1)}ère Secondaire`;
    return `${level} — ${subject}`;
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      setError('Veuillez entrer votre nom complet.');
      return;
    }
    if (classes.length === 0) {
      setError('Veuillez ajouter au moins une classe.');
      return;
    }

    setLoading(true);
    setError(null);

    // Créer le profil
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      full_name: fullName.trim(),
    });

    if (profileError) {
      setError('Erreur lors de la création du profil.');
      setLoading(false);
      return;
    }

    // Créer chaque classe
    for (const c of classes) {
      await createClass(
        userId,
        getClassName(c.year, c.subject),
        c.year,
        c.subject.toLowerCase()
      );
    }

    onComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-2xl flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="font-black text-2xl text-slate-900 tracking-tighter">Créez votre profil</h1>
          <p className="text-slate-400 text-sm text-center">Ajoutez vos classes pour personnaliser votre espace.</p>
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

        {/* Classes */}
        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">
            Vos classes
          </label>

          {classes.map((c, index) => (
            <div key={index} className="flex gap-3 items-center bg-slate-50 p-4 rounded-2xl border">
              <div className="flex-1 flex gap-3">
                {/* Année */}
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Année</label>
                  <select
                    className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-bold"
                    value={c.year}
                    onChange={e => updateClass(index, 'year', e.target.value)}
                  >
                    <optgroup label="Primaire">
                      {PRIMARY_YEARS.map(y => (
                        <option key={`P${y}`} value={`P${y}`}>{y}ère Primaire</option>
                      ))}
                    </optgroup>
                    <optgroup label="Secondaire">
                      {SECONDARY_YEARS.map(y => (
                        <option key={`S${y}`} value={`S${y}`}>{y}ère Secondaire</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Matière */}
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Matière</label>
                  <select
                    className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-bold"
                    value={c.subject}
                    onChange={e => updateClass(index, 'subject', e.target.value)}
                  >
                    {SUBJECTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Aperçu */}
              <div className="hidden md:block text-xs text-slate-400 italic w-40 text-center">
                {getClassName(c.year, c.subject)}
              </div>

              {/* Supprimer */}
              {classes.length > 1 && (
                <button
                  onClick={() => removeClass(index)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}

          {/* Ajouter une classe */}
          <button
            onClick={addClass}
            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all font-bold text-sm flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Ajouter une classe
          </button>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

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
