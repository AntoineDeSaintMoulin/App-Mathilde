
import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  FileText, 
  CheckSquare, 
  Square, 
  Search,
  Calendar,
  Clock
} from 'lucide-react';
import { Note, TodoItem } from '../types';

interface NotesManagerProps {
  notes: Note[];
  onAdd: (note: Omit<Note, 'id' | 'updatedAt'>) => void;
  onUpdate: (note: Note) => void;
  onDelete: (id: string) => void;
}

const NotesManager: React.FC<NotesManagerProps> = ({ notes, onAdd, onUpdate, onDelete }) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes.length > 0 ? notes[0].id : null);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  const handleAddNote = () => {
    const newNote = {
      title: 'Nouvelle note',
      content: '',
      todos: []
    };
    onAdd(newNote);
  };

  const handleUpdateTitle = (title: string) => {
    if (selectedNote) {
      onUpdate({ ...selectedNote, title, updatedAt: new Date().toISOString() });
    }
  };

  const handleUpdateContent = (content: string) => {
    if (selectedNote) {
      onUpdate({ ...selectedNote, content, updatedAt: new Date().toISOString() });
    }
  };

  const handleAddTodo = () => {
    if (selectedNote) {
      const newTodo: TodoItem = {
        id: Math.random().toString(36).substr(2, 9),
        text: '',
        completed: false
      };
      onUpdate({ 
        ...selectedNote, 
        todos: [...selectedNote.todos, newTodo],
        updatedAt: new Date().toISOString() 
      });
    }
  };

  const handleUpdateTodo = (todoId: string, updates: Partial<TodoItem>) => {
    if (selectedNote) {
      onUpdate({
        ...selectedNote,
        todos: selectedNote.todos.map(t => t.id === todoId ? { ...t, ...updates } : t),
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleDeleteTodo = (todoId: string) => {
    if (selectedNote) {
      onUpdate({
        ...selectedNote,
        todos: selectedNote.todos.filter(t => t.id !== todoId),
        updatedAt: new Date().toISOString()
      });
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
          <div className="p-4 border-bottom border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-800">Mes Notes</h2>
              <button 
                onClick={handleAddNote}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher une note..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredNotes.map(note => (
              <button
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={`w-full text-left p-3 rounded-2xl transition-all group ${
                  selectedNoteId === note.id 
                    ? 'bg-white shadow-md border border-slate-100' 
                    : 'hover:bg-slate-100/80 text-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm truncate ${selectedNoteId === note.id ? 'text-blue-600' : 'text-slate-700'}`}>
                      {note.title || 'Sans titre'}
                    </h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {note.content || 'Pas de contenu'}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Supprimer cette note ?')) onDelete(note.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                  <Clock size={10} />
                  <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  {note.todos.length > 0 && (
                    <div className="flex items-center gap-1 ml-auto">
                      <CheckSquare size={10} />
                      <span>{note.todos.filter(t => t.completed).length}/{note.todos.length}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
            {filteredNotes.length === 0 && (
              <div className="text-center py-10 px-4">
                <FileText className="mx-auto text-slate-200 mb-2" size={32} />
                <p className="text-sm text-slate-400">Aucune note trouvée</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {selectedNote ? (
            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
              <input 
                type="text" 
                value={selectedNote.title}
                onChange={(e) => handleUpdateTitle(e.target.value)}
                placeholder="Titre de la note"
                className="w-full text-3xl font-black tracking-tighter text-slate-900 border-none focus:ring-0 p-0 mb-6 placeholder:text-slate-200"
              />

              <div className="space-y-8">
                {/* Text Content */}
                <section>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    Contenu
                  </label>
                  <textarea 
                    value={selectedNote.content}
                    onChange={(e) => handleUpdateContent(e.target.value)}
                    placeholder="Commencez à écrire..."
                    className="w-full min-h-[200px] text-slate-600 leading-relaxed border-none focus:ring-0 p-0 resize-none placeholder:text-slate-200"
                  />
                </section>

                {/* To-Do List */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Liste de tâches
                    </label>
                    <button 
                      onClick={handleAddTodo}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Plus size={14} />
                      Ajouter une tâche
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedNote.todos.map(todo => (
                      <div key={todo.id} className="flex items-center gap-3 group">
                        <button 
                          onClick={() => handleUpdateTodo(todo.id, { completed: !todo.completed })}
                          className={`shrink-0 transition-colors ${todo.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-slate-400'}`}
                        >
                          {todo.completed ? <CheckSquare size={20} /> : <Square size={20} />}
                        </button>
                        <input 
                          type="text" 
                          value={todo.text}
                          onChange={(e) => handleUpdateTodo(todo.id, { text: e.target.value })}
                          placeholder="Faire quelque chose..."
                          className={`flex-1 bg-transparent border-none focus:ring-0 p-0 text-sm transition-all ${
                            todo.completed ? 'text-slate-300 line-through' : 'text-slate-600'
                          }`}
                        />
                        <button 
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {selectedNote.todos.length === 0 && (
                      <p className="text-xs text-slate-300 italic">Aucune tâche pour le moment</p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <FileText size={40} />
              </div>
              <p className="font-bold text-slate-400">Sélectionnez une note pour commencer</p>
              <button 
                onClick={handleAddNote}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
              >
                Créer ma première note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesManager;
