import React, { useState } from 'react';
import { useStore } from '../../store';
import { motion } from 'motion/react';
import { ArrowLeft, Copy, Download, Upload, Trash2, Volume2, VolumeX, Bell, BellOff } from 'lucide-react';

export default function OptionsScreen() {
  const { settings, setScreen, resetGame, updateSettings } = useStore();

  const handleExport = () => {
    const data = localStorage.getItem('pokedesk-save');
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pokedesk_save_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const text = ev.target?.result as string;
          JSON.parse(text); // valida che sia JSON
          localStorage.setItem('pokedesk-save', text);
          alert('Salvataggio importato! Ricarica la pagina.');
          window.location.reload();
        } catch {
          alert('File non valido!');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    const confirm1 = confirm("Sei sicuro di voler resettare la partita? Perderai tutti i progressi.");
    if (confirm1) {
      const confirm2 = prompt("Scrivi 'RESET' per confermare definitivamente:");
      if (confirm2 === 'RESET') {
        resetGame();
        setScreen('START_SCREEN');
      }
    }
  };

  return (
    <div className="h-full flex flex-col p-6 bg-[#0f0f1a]">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => setScreen('START_SCREEN')} className="p-2 bg-[#1a1a2e] rounded-xl">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-black">OPZIONI</h2>
      </header>

      <div className="space-y-6">
        <section>
          <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">AUDIO E NOTIFICHE</h3>
          <div className="bg-[#1a1a2e] rounded-2xl overflow-hidden border border-white/5">
            <OptionToggle 
              icon={settings.audio ? <Volume2 size={20} /> : <VolumeX size={20} />}
              label="Audio di gioco"
              active={settings.audio}
              onClick={() => updateSettings({ audio: !settings.audio })}
            />
            <OptionToggle 
              icon={settings.notifications ? <Bell size={20} /> : <BellOff size={20} />}
              label="Notifiche PWA"
              active={settings.notifications}
              onClick={() => updateSettings({ notifications: !settings.notifications })}
            />
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">DATI DI SALVATAGGIO</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleExport}
              className="bg-[#1a1a2e] border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-2"
            >
              <Download size={24} className="text-indigo-400" />
              <span className="text-xs font-bold">EXPORT JSON</span>
            </button>
            <button 
              className="bg-[#1a1a2e] border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-2"
              onClick={handleImport}
            >
              <Upload size={24} className="text-emerald-400" />
              <span className="text-xs font-bold">IMPORT JSON</span>
            </button>
          </div>
        </section>

        <section className="pt-8">
          <button 
            onClick={handleReset}
            className="w-full bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-2xl flex items-center justify-center gap-3 font-bold"
          >
            <Trash2 size={20} /> RESET PARTITA
          </button>
        </section>
      </div>
    </div>
  );
}

function OptionToggle({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
    >
      <div className="flex items-center gap-4">
        <span className="text-white/50">{icon}</span>
        <span className="font-bold">{label}</span>
      </div>
      <div className={`w-12 h-6 rounded-full relative transition-all ${active ? 'bg-[#e63946]' : 'bg-white/10'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-7' : 'left-1'}`} />
      </div>
    </button>
  );
}
