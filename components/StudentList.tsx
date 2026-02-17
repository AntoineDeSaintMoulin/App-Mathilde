
import React, { useState } from 'react';
import { UserPlus, User, Edit2, Trash2, Search, Phone, Cake, Info } from 'lucide-react';
import { Student } from '../types';

interface Props {
  students: Student[];
  onAdd: (s: Omit<Student, 'id'>) => void;
  onUpdate: (s: Student) => void;
  onDelete: (id: string) => void;
  onViewStudent: (s: Student) => void;
}

const StudentList: React.FC<Props> = ({ students, onAdd, onUpdate, onDelete, onViewStudent }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Omit<Student, 'id'>>({ 
    firstName: '', 
    lastName: '', 
    observations: '',
    birthDate: '',
    parentPhones: ''
  });

  const filtered = students.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate({ ...formData, id: editingId });
    } else {
      onAdd(formData);
    }
    closeForm();
  };

  const openEdit = (s: Student) => {
    setFormData({
      firstName: s.firstName,
      lastName: s.lastName,
      observations: s.observations,
      birthDate: s.birthDate || '',
      parentPhones: s.parentPhones || ''
    });
    setEditingId(s.id);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ firstName: '', lastName: '', observations: '', birthDate: '', parentPhones: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher un élève..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-md"
        >
          <UserPlus size={18} /> Nouvel élève
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl border shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-lg">{editingId ? 'Modifier l\'élève' : 'Nouvel élève'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              required
              placeholder="Prénom" 
              className="p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              value={formData.firstName}
              onChange={e => setFormData({...formData, firstName: e.target.value})}
            />
            <input 
              required
              placeholder="Nom" 
              className="p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              value={formData.lastName}
              onChange={e => setFormData({...formData, lastName: e.target.value})}
            />
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Date de naissance (optionnel)</label>
              <input 
                type="date"
                className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                value={formData.birthDate}
                onChange={e => setFormData({...formData, birthDate: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Téléphones parents (optionnel)</label>
              <input 
                placeholder="Ex: 06 12 34 56 78"
                className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                value={formData.parentPhones}
                onChange={e => setFormData({...formData, parentPhones: e.target.value})}
              />
            </div>
            <textarea 
              placeholder="Observations générales" 
              className="p-2.5 border rounded-lg md:col-span-2 h-24 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              value={formData.observations}
              onChange={e => setFormData({...formData, observations: e.target.value})}
            />
            <div className="flex justify-end gap-2 md:col-span-2 border-t pt-4">
              <button type="button" onClick={closeForm} className="px-4 py-2 text-slate-600 font-medium">Annuler</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700">
                {editingId ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(student => (
          <div 
            key={student.id} 
            onClick={() => onViewStudent(student)}
            className="bg-white p-5 rounded-2xl border group hover:border-blue-500 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">
                  {student.firstName[0]}{student.lastName[0]}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{student.firstName} {student.lastName}</h4>
                  <div className="flex gap-2 mt-1">
                    {student.birthDate && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Cake size={10}/> {new Date(student.birthDate).toLocaleDateString('fr-FR')}</span>}
                    {student.parentPhones && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Phone size={10}/> Contact</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); openEdit(student); }} 
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(student.id); }} 
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {student.observations && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 italic shadow-inner line-clamp-2">
                "{student.observations}"
              </div>
            )}
            <div className="mt-auto pt-4 text-[10px] text-blue-600 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
              <span>Fiche détaillée</span>
              <Info size={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentList;
