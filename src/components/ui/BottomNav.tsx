import React from 'react';
import { useStore } from '../../store';
import { 
  Users, 
  Backpack, 
  Database, 
  Sword, 
  BookOpen, 
  Menu 
} from 'lucide-react';

export default function BottomNav() {
  const { currentScreen, setScreen } = useStore();

  const navItems = [
    { id: 'TEAM_SCREEN', icon: <Users size={24} />, label: 'SQUADRA' },
    { id: 'BAG_SCREEN', icon: <Backpack size={24} />, label: 'ZAINO' },
    { id: 'BOX_SCREEN', icon: <Database size={24} />, label: 'BOX' },
    { id: 'BATTLE_SCREEN', icon: <Sword size={24} />, label: 'LOTTA' },
    { id: 'POKEDEX_SCREEN', icon: <BookOpen size={24} />, label: 'DEX' },
    { id: 'START_SCREEN', icon: <Menu size={24} />, label: 'MENU' },
  ];

  return (
    <nav className="bg-[#1a1a2e] border-t border-white/5 px-2 py-3 flex justify-around items-center pb-safe">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setScreen(item.id as any)}
          className={`flex flex-col items-center gap-1 transition-all ${
            currentScreen === item.id ? 'text-[#e63946]' : 'text-white/40'
          }`}
        >
          {item.icon}
          <span className="text-[10px] font-bold">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
