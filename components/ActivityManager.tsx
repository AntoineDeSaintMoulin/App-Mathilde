
import React, { useState } from 'react';
import { Plus, Calendar, BookOpen, Target, List, Box, Trash2, Edit3 } from 'lucide-react';
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
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-slate-700">Description / Déroulement</label>
              <textarea 
                className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-24 bg-slate-50"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-3 md:col-span-2 pt-4">
              <button type="button" onClick={closeForm} className="px-6 py-2.5 text-slate-600 font-medium hover:text-slate-800">Annuler</button>
              <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium shadow-md hover:bg-blue-700 transition-all">
                {editingId ? 'Mettre à jour' : 'Enregistrer l\'activité'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map(activity => {
          const subjectInfo = SUBJECTS.find(s => s.value === activity.subject);
          return (
            <div 
              key={activity.id} 
              className="bg-white rounded-2xl border hover:shadow-lg transition-all cursor-pointer group flex flex-col"
              onClick={() => onSelect(activity)}
            >
              <div className={`h-2 w-full rounded-t-2xl ${subjectInfo?.color || 'bg-slate-300'}`} />
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${subjectInfo?.color} text-white flex items-center gap-1`}
                    {subjectInfo?.icon} {subjectInfo?.label}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEditForm(activity); }}
                      className="text-slate-300 hover:text-blue-500 transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(activity.id); }}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-1">{activity.title}</h3>
                <div className="text-slate-500 text-sm flex items-center gap-4 mb-4">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(activity.date).toLocaleDateString('fr-FR')}</span>
                  <span className="flex items-center gap-1"><Target size={14} /> {activity.domain}</span>
                </div>
                {activity.objective && (
                  <p className="text-slate-600 text-sm line-clamp-2 italic mb-4">
                    "{activity.objective}"
                  </p>
                )}
                <div className="flex items-center justify-between pt-4 border-t mt-auto">
                  <span className="text-xs text-slate-400">Difficulté: {activity.difficulty}/5</span>
                  <span className="text-blue-600 text-sm font-semibold group-hover:underline">Évaluer →</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityManager;
