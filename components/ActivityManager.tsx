import React, { useState } from 'react';
import { Plus, Calendar, BookOpen, Target, List, Trash2, Edit3, Search } from 'lucide-react';
import { Activity, Subject } from '../types';
import { SUBJECTS, DOMAINS } from '../constants';

interface Props {
  activities: Activity[];
  onAdd: (a: Omit<Activity, 'id'>) => void;
  onUpdate: (a: Activity) => void;
  onDelete: (id: string) => void;
  onSelect: (a: Activity) => void;
}

const ActivityManager: React.FC<Props> = ({ activities, onAdd, onUpdate, onDelete, onSelect }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchSubject, setSearchSubject] = useState<Subject | ''>('');

  const [formData, setFormData] = useState<Omit<Activity, 'id'>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    subject: 'mathématiques',
    domain: '',
    difficulty: 3,
    description: '',
    objective: '',
    competencies: '',
    material: ''
  });

  const filteredActivities = activities.filter(activity => {
    const matchesText = activity.title.toLowerCase().includes(searchText.toLowerCase()) ||
      activity.domain.toLowerCase().includes(searchText.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesSubject = searchSubject === '' || activity.subject === searchSubject;
    return matchesText && matchesSubject;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate({ ...formData, id: editingId });
    } else {
      onAdd(formData);
    }
    closeForm();
  };

  const openEditForm = (activity: Activity) => {
    setFormData({
      title: activity.title,
      date: activity.date,
      subject: activity.subject,
      domain: activity.domain,
      difficulty: activity.difficulty,
      description: activity.description,
      objective: activity.objective || '',
      competencies: activity.competencies,
      material: activity.material || ''
    });
    setEditingId(activity.id);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      subject: 'mathématiques',
      domain: '',
      difficulty: 3,
      description: '',
      objective: '',
      competencies: '',
      material: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          <List className="text-blue-600" /> Vos Fiches Activités
        </h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} /> Nouvelle activité
        </button>
      </div>

      {/* Barres de recherche */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, domaine, description..."
            className="w-full pl-9 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm text-sm"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSearchSubject('')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${searchSubject === '' ? 'bg-slate-800 text-white' : 'bg-white border text-slate-500 hover:bg-slate-50'}`}
          >
            Toutes
          </button>
          {SUBJECTS.map(s => (
            <button
              key={s.value}
              onClick={() => setSearchSubject(searchSubject === s.value ? '' : s.value)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                searchSubject === s.value ? `${s.color} text-white shadow-md` : 'bg-white border text-slate-500 hover:bg-slate-50'
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compteur de résultats */}
      {(searchText || searchSubject) && (
        <p className="text-sm text-slate-400 italic">
          {filteredActivities.length} activité{filteredActivities.length !== 1 ? 's' : ''} trouvée{filteredActivities.length !== 1 ? 's' : ''}
        </p>
      )}

      {isFormOpen && (
        <div className="bg-white p-8 rounded-2xl border shadow-xl animate-in fade-in zoom-in duration-200">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BookOpen className="text-blue-500" /> {editingId ? 'Modifier la fiche' : 'Créer une fiche pédagogique'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Titre de l'activité</label>
              <input
                required
                className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Date</label>
              <input
                type="date"
                required
                className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Matière</label>
              <select
                className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value as Subject, domain: ''})}
              >
                {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Domaine de compétence</label>
              <input
                list="domain-suggestions"
                placeholder="Ex: Calcul mental ou nouveau domaine..."
                className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                value={formData.domain}
                onChange={e => setFormData({...formData, domain: e.target.value})}
              />
              <datalist id="domain-suggestions">
                {DOMAINS[formData.subject].map(d => <option key={d} value={d} />)}
              </datalist>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Niveau de difficulté (1-5)</label>
              <input
                type="range" min="1" max="5"
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                value={formData.difficulty}
                onChange={e => setFormData({...formData, difficulty: parseInt(e.target.value) as any})}
              />
              <div className="flex justify-between text-xs text-slate-400 px-1">
                <span>Facile</span>
                <span>Moyen</span>
                <span>Difficile</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Objectif pédagogique (optionnel)</label>
              <input
                className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                value={formData.objective}
                onChange={e => setFormData({...formData, objective: e.target.value})}
              />
            </div>
            <div className="md:col
