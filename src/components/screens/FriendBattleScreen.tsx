import React, { useState, useMemo } from 'react';
import { useStore } from '../../store';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Copy, Check, Sword, Users } from 'lucide-react';
import TypeBadge from '../ui/TypeBadge';

export default function FriendBattleScreen() {
  const { team, player, setScreen, setFriendBattleTeam } = useStore();

  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState('');
  const [previewTeam, setPreviewTeam] = useState<any[] | null>(null);
  const [previewName, setPreviewName] = useState('');

  const exportCode = useMemo(() => {
    if (team.length === 0) return '';
    const payload = {
      trainerName: player.name,
      team: team.map(p => ({
        ...p,
        currentHp: p.stats.hp, // sempre HP pieno
      })),
    };
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    } catch {
      return '';
    }
  }, [team, player.name]);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportPreview = () => {
    setImportError('');
    setPreviewTeam(null);
    try {
      const json = decodeURIComponent(escape(atob(importCode.trim())));
      const payload = JSON.parse(json);

      const teamData = payload.team ?? payload; // compatibilità con singolo array
      const trainerName = payload.trainerName ?? 'Avversario';

      if (!Array.isArray(teamData) || teamData.length === 0) {
        setImportError('Codice non valido o squadra vuota.');
        return;
      }

      const validated = teamData.slice(0, 4).map((p: any) => {
        if (
          !p.name || !p.pokemonId || !p.stats || !p.moves ||
          !p.types || !p.ivs || !p.nature || !p.growthRate
        ) throw new Error('Pokémon non valido');
        return {
          ...p,
          currentHp: p.stats.hp,
          status: null,
        };
      });

      setPreviewTeam(validated);
      setPreviewName(trainerName);
    } catch {
      setImportError('Codice non valido o corrotto. Assicurati di incollare il codice squadra corretto.');
    }
  };

  const handleStartBattle = () => {
    if (!previewTeam) return;
    setFriendBattleTeam(previewTeam.map(p => ({ ...p, trainerName: previewName })));
    setScreen('BATTLE_SCREEN');
  };

  return (
    <div className="h-full flex flex-col bg-[#0f0f1a] overflow-hidden">

      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setScreen('START_SCREEN')} className="p-2 bg-[#1a1a2e] rounded-xl">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-black uppercase flex-1">⚔️ SFIDA AMICI</h2>
        </div>

        <div className="flex gap-2 bg-[#1a1a2e] p-1 rounded-2xl mb-4">
          <button
            onClick={() => setMode('export')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${mode === 'export' ? 'bg-[#e63946] text-white' : 'text-white/40'}`}
          >
            IL MIO TEAM
          </button>
          <button
            onClick={() => { setMode('import'); setPreviewTeam(null); setImportError(''); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${mode === 'import' ? 'bg-[#e63946] text-white' : 'text-white/40'}`}
          >
            SFIDA
          </button>
        </div>
      </div>

      {/* EXPORT MODE */}
      {mode === 'export' && (
        <div className="flex-1 flex flex-col px-4 pb-4 gap-4 overflow-y-auto no-scrollbar">
          <p className="text-xs text-white/40 italic">
            Condividi questo codice con il tuo amico. Potrà incollarlo nella sezione "Sfida" per affrontare il tuo team.
          </p>

          {team.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/20">
              <span className="text-5xl">👤</span>
              <p className="font-bold text-sm">La tua squadra è vuota!</p>
            </div>
          ) : (
            <>
              {/* Anteprima team */}
              <div className="bg-[#1a1a2e] rounded-2xl p-4 border border-white/5 space-y-3">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">
                  Squadra di {player.name}
                </p>
                {team.map(p => (
                  <div key={p.id} className="flex items-center gap-3">
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.isShiny ? 'shiny/' : ''}${p.pokemonId}.png`}
                      className="w-12 h-12 object-contain"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm uppercase truncate">{p.name}</span>
                        {p.isShiny && <span className="text-yellow-400 text-xs">✨</span>}
                        <span className="text-[10px] bg-[#e63946] px-1.5 py-0.5 rounded-full font-bold">Lv.{p.level}</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {p.types.map(t => <TypeBadge key={t} type={t as any} small />)}
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-white/40 font-bold">
                      {p.stats.hp} HP
                    </div>
                  </div>
                ))}
              </div>

              {/* Codice */}
              <div className="bg-black/40 rounded-xl p-3">
                <p className="text-[8px] font-mono break-all text-white/40 leading-relaxed line-clamp-4">
                  {exportCode}
                </p>
              </div>

              <button
                onClick={handleCopy}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                  copied ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-[#e63946] text-white'
                }`}
              >
                {copied ? <><Check size={18} /> CODICE COPIATO!</> : <><Copy size={18} /> COPIA CODICE SQUADRA</>}
              </button>
            </>
          )}
        </div>
      )}

      {/* IMPORT MODE */}
      {mode === 'import' && (
        <div className="flex-1 flex flex-col px-4 pb-4 gap-4 overflow-y-auto no-scrollbar">
          <p className="text-xs text-white/40 italic">
            Incolla il codice squadra del tuo amico per affrontarlo in battaglia!
          </p>

          <textarea
            value={importCode}
            onChange={e => { setImportCode(e.target.value); setImportError(''); setPreviewTeam(null); }}
            className="h-28 bg-[#1a1a2e] border border-white/5 rounded-2xl p-4 text-[10px] font-mono focus:outline-none focus:ring-2 focus:ring-[#e63946]/50 resize-none"
            placeholder="Incolla qui il codice squadra dell'amico..."
          />

          {importError && (
            <p className="text-xs text-red-400 font-bold bg-red-500/10 rounded-xl px-4 py-2">
              ⚠️ {importError}
            </p>
          )}

          {!previewTeam && (
            <button
              onClick={handleImportPreview}
              disabled={!importCode.trim()}
              className="w-full bg-[#1a1a2e] border border-white/10 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-30"
            >
              <Users size={18} /> ANALIZZA SQUADRA
            </button>
          )}

          {/* Anteprima squadra avversaria */}
          <AnimatePresence>
            {previewTeam && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-[#1a1a2e] rounded-2xl p-4 border border-[#e63946]/30 space-y-3">
                  <p className="text-[10px] font-black text-[#e63946] uppercase tracking-widest">
                    ⚔️ Squadra di {previewName}
                  </p>
                  {previewTeam.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.isShiny ? 'shiny/' : ''}${p.pokemonId}.png`}
                        className="w-12 h-12 object-contain"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm uppercase truncate">{p.name}</span>
                          {p.isShiny && <span className="text-yellow-400 text-xs">✨</span>}
                          <span className="text-[10px] bg-[#e63946] px-1.5 py-0.5 rounded-full font-bold">Lv.{p.level}</span>
                        </div>
                        <div className="flex gap-1 mt-1">
                          {p.types.map((t: string) => <TypeBadge key={t} type={t as any} small />)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black text-white/60">{p.stats.hp} HP</div>
                        <div className="text-[9px] text-white/30">{p.nature}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleStartBattle}
                  className="w-full bg-[#e63946] py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-[#e63946]/20"
                >
                  <Sword size={22} /> INIZIA SFIDA!
                </button>

                <button
                  onClick={() => { setPreviewTeam(null); setImportCode(''); }}
                  className="w-full bg-white/5 py-3 rounded-2xl font-bold text-sm text-white/40"
                >
                  Annulla
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
