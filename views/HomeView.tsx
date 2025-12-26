
import React from 'react';
import { HapticButton } from '../components/HapticButton';
import { Plus, Users, Moon, Sun, Sparkles } from 'lucide-react';

interface Props {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  isGuest?: boolean;
}

export const HomeView: React.FC<Props> = ({ onCreateRoom, onJoinRoom, toggleTheme, isDarkMode, isGuest = true }) => {
  return (
    <div className="flex flex-col h-full px-6 pt-12 pb-24 space-y-6 bg-black text-white overflow-hidden">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-red-600 leading-none mb-1 uppercase">Movie<br/>Match</h1>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-30">Discovery Engine v3.0</p>
        </div>
        <HapticButton 
          onClick={toggleTheme}
          className="p-2.5 bg-white/5 rounded-full ios-blur border border-white/10"
        >
          {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-400" />}
        </HapticButton>
      </header>

      <div className="flex-1 flex flex-col justify-center space-y-4">
        <HapticButton 
          onClick={onCreateRoom}
          impact="heavy"
          className="group relative w-full p-6 rounded-[32px] border bg-[#1C1C1E] border-white/10 ios-card-shadow active:scale-[0.96] shadow-2xl shadow-red-600/10 transition-all duration-300"
        >
          <div className="relative z-10 flex flex-col items-start gap-4 text-left">
            <div className="p-3.5 rounded-2xl text-white bg-gradient-to-br from-red-600 to-purple-700 shadow-lg shadow-red-600/20">
              <Plus size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tight">Crea Stanza</h3>
              <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-0.5">Host della serata</p>
            </div>
          </div>
          <Sparkles className="absolute top-6 right-6 text-white/10 animate-pulse" size={32} />
        </HapticButton>

        <HapticButton 
          onClick={onJoinRoom}
          impact="medium"
          className="group relative w-full p-6 bg-[#1C1C1E] rounded-[32px] ios-card-shadow border border-white/10 overflow-hidden active:scale-[0.96] transition-all shadow-2xl shadow-blue-600/10"
        >
          <div className="relative z-10 flex flex-col items-start gap-4 text-left">
            <div className="p-3.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-lg shadow-blue-600/20">
              <Users size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tight">Entra</h3>
              <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-0.5">Unisciti con codice</p>
            </div>
          </div>
        </HapticButton>
      </div>

      <footer className="text-center opacity-10 pb-4">
        <p className="text-[8px] font-black uppercase tracking-[0.4em]">Built for Cinephiles • 2024</p>
      </footer>
    </div>
  );
};
