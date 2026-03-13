import React, { useState } from 'react';
import { useStore } from '../../store';
import { motion } from 'motion/react';
import { ArrowLeft, Copy, Download, Upload, ArrowLeftRight } from 'lucide-react';

export default function TradeScreen() {
  const { box, setScreen, addPokemon } = useStore();
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [code, setCode] = useState('');

  const handleExport = (pkmn: any) => {
    const json = JSON.stringify(pkmn);
    const base64 = btoa(json);
    setCode(base64);
    navigator.clipboard.writeText(base64);
    alert("Codice Pokémon copiato negli appunti!");
  };

  const handleImport = () => {
    try {
      const json = atob(code);
      const pkmn = JSON.parse(json);
      // Basic validation
      if (pkmn.name && pkmn.level && pkmn.pokemonId) {
        addPokemon({ ...pkmn, id: Math.random().toString(36).substr(2, 9) });
        alert(`${pkmn.name} importato con successo!`);
        setCode('');
      }
    } catch (e) {
      alert("Codice non valido!");
    }
  };

  return (
    <div className="h-full flex flex-col p-6 bg-[#0f0f1a]">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => setScreen('START_SCREEN')} className="p-2 bg-[#1a1a2e] rounded-xl">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-black">SCAMBIA</h2>
      </header>

      <div className="flex gap-2 mb-8 bg-[#1a1a2e] p-1 rounded-2xl">
        <button 
          onClick={() => setMode('export')}
          className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${mode === 'export' ? 'bg-[#e63946]' : 'text-white/40'}`}
        >
          ESPORTA
        </button>
        <button 
          onClick={() => setMode('import')}
          className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${mode === 'import' ? 'bg-[#e63946]' : 'text-white/40'}`}
        >
          IMPORTA
        </button>
      </div>

      {mode === 'export' ? (
        <div className="flex-1 flex flex-col">
          <p className="text-xs text-white/40 mb-4 italic">Seleziona un Pokémon dal Box per generare il codice di scambio.</p>
          <div className="grid grid-cols-3 gap-3 overflow-y-auto flex-1 no-scrollbar">
            {box.map(pkmn => (
              <button 
                key={pkmn.id}
                onClick={() => handleExport(pkmn)}
                className="bg-[#1a1a2e] p-2 rounded-xl border border-white/5 flex flex-col items-center"
              >
                <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pkmn.pokemonId}.png`} className="w-16 h-16" />
                <span className="text-[10px] font-bold uppercase truncate w-full text-center">{pkmn.name}</span>
              </button>
            ))}
          </div>
          {code && (
            <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-white/10">
              <p className="text-[8px] font-mono break-all opacity-50 mb-2">{code}</p>
              <button 
                onClick={() => navigator.clipboard.writeText(code)}
                className="w-full bg-white/10 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
              >
                <Copy size={14} /> COPIA CODICE
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6">
          <p className="text-xs text-white/40 italic">Incolla qui il codice Base64 ricevuto da un altro allenatore.</p>
          <textarea 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-48 bg-[#1a1a2e] border border-white/5 rounded-2xl p-4 text-[10px] font-mono focus:outline-none focus:ring-2 focus:ring-[#e63946]/50"
            placeholder="Incolla codice..."
          />
          <button 
            onClick={handleImport}
            className="w-full bg-[#e63946] py-4 rounded-2xl font-bold flex items-center justify-center gap-3"
          >
            <ArrowLeftRight size={20} /> IMPORTA POKÉMON
          </button>
        </div>
      )}
    </div>
  );
}
