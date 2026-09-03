import React, { useState } from 'react';
import { GraduationCap, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { createClass, deleteClass, fetchClasses } from '../utils/storage';

interface ClassInfo {
  id: string;
  name: string;
  level: string;
  subject: string;
}

interface ClassEntry {
  id?: string;
  year: string;
  subject: string;
  isNew: boolean;
}

interface Props {
  userId: string;
  fullName: string;
  existingClasses: ClassInfo[];
  onProfileUpdated: () => void;
  onClose: () => void;
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

const getClassName = (year: string, subject: string) => {
  const level = year.startsWith('P')
    ? `${year.slice(1)}ère Primaire`
    : `${year.slice(1)}ère Secondaire`;
  return `${level} — ${subject}`;
};

const ProfileEditModal: React.FC<Props> = ({ userId, fullName, existingClasses, onProfileUpdated, onClose }) => {
  const [classes, setClasses] = useState<ClassEntry[]>(
    existingClasses.map(c => ({
      id: c.id,
      year: c.level,
      subject: c.subject.charAt(0).toUpperCase() + c.subject.slice(1),
      isNew: false,
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  const addClass = () => {
    setClasses(prev => [...prev, { year: 'P1', subject: 'Général', isNew: true }]);
  };

  const removeClass = (index: number) => {
    const c = classes[index];
    if (!c.isNew) {
      // Demande confirmation avant de supprimer une classe existante
      setPendingDelete(index);
    } else {
      setClasses(prev => prev.filter((_, i) => i !== index));
    }
  };

  const confirmDelete = async () => {
    if (pendingDelete === null) return;
    const c = classes[pendingDelete];
    if (c.id) await deleteClass(c.id);
    setClasses(prev => prev.filter((_, i) => i !== pendingDelete));
    setPendingDelete(null);
  };

  const updateClass = (index: number, field: keyof ClassEntry, value: string) => {
    setClasses(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const handleSave = async () => {
    if (classes.length === 0) {
      setError('Veuillez avoir au moins une classe.');
      return;
    }

    setLoading(true);
    setError(null);

    // Créer les nouvelles classes
    for (const c of classes.filter(c => c.isNew)) {
      await createClass(
        userId,
        getClassName(c.year, c.subject),
        c.year,
        c.subject.toLowerCase()
      );
    }

    setLoading(false);
    onProfileUpdated();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8 flex flex-col gap-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl">
                <GraduationCap size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-black text-xl text-slate-900">Modifier mes classes</h2>
                <p className="text-slate-400 text-sm">{fullName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Classes */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
              Vos classes
            </label>

            {classes.map((c, index) => (
              <div
                key={index}
                className={`flex gap-3 items-center p-4 rounded-2xl border ${
                  c.isNew ? 'bg-blue-50 border-blue-200' : 'bg-slate-50'
                }`}
              >
                <div className="flex-1 flex gap-3">
                  {/* Année */}
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Année</label>
                    <select
                      className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-bold"
                      value={c.year}
                      onChange={e => updateClass(index, 'year', e.target.value)}
                      disabled={!c.isNew}
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
                      disabled={!c.isNew}
                    >
                      {SUBJECTS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Badge nouvelle classe */}
                {c.isNew && (
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest shrink-0">
                    Nouvelle
                  </span>
                )}

                {/* Supprimer */}
                <button
                  onClick={() => removeClass(index)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {/* Ajouter */}
            <button
              onClick={addClass}
              className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all font-bold text-sm flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Ajouter une classe
            </button>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
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

      {/* Modale de confirmation suppression */}
      {pendingDelete !== null && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4">
            <h3 className="font-black text-lg text-slate-900">Supprimer cette classe ?</h3>
            <p className="text-slate-500 text-sm">
              La classe <span className="font-bold text-slate-700">
                {getClassName(classes[pendingDelete].year, classes[pendingDelete].subject)}
              </span> et toutes ses données (élèves, activités, évaluations) seront supprimées définitivement.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 transition-all"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileEditModal;
