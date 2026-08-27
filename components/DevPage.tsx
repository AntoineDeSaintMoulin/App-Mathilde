import React from 'react';
import { GraduationCap, Construction, LogOut } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

interface Props {
  fullName: string;
  subjects: string[];
  years: string[];
}

const DevPage: React.FC<Props> = ({ fullName, subjects, years }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-lg flex flex-col items-center gap-8">

        {/* Icône */}
        <div className="w-20 h-20 bg-yellow-100 rounded-2xl flex items-center justify-center">
          <Construction size={40} className="text-yellow-500" />
        </div>

        {/* Message */}
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

        {/* Logo */}
        <div className="flex items-center gap-2 text-slate-300">
          <GraduationCap size={20} />
          <span className="font-black text-sm tracking-tighter">EduSuivi</span>
        </div>

        {/* Bouton déconnexion */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
        >
          <LogOut size={16} /> Retour à l'écran de connexion
        </button>
      </div>
    </div>
  );
};

export default DevPage;
