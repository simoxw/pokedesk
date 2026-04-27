import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../store';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Copy, Check, Sword, Users } from 'lucide-react';
import TypeBadge from '../ui/TypeBadge';
import PokemonSprite from '../ui/PokemonSprite';
import { fetchSquads, uploadSquad, CommunitySquad } from '../../lib/supabaseClient';

export default function FriendBattleScreen() {
  const { team, player, setScreen, setFriendBattleTeam } = useStore();

  const [mode, setMode] = useState<'export' | 'import' | 'community'>('export');
  const [copied, setCopied] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState('');
  const [previewTeam, setPreviewTeam] = useState<any[] | null>(null);
  const [previewName, setPreviewName] = useState('');
  const [communitySquads, setCommunitySquads] = useState<CommunitySquad[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState('');
  const [uploadSquadName, setUploadSquadName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedCommunitySquad, setSelectedCommunitySquad] = useState<CommunitySquad | null>(null);

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

  useEffect(() => {
    if (mode === 'community') {
      setCommunityLoading(true);
      fetchSquads().then(data => {
        setCommunitySquads(data);
        setCommunityLoading(false);
      });
    }
  }, [mode]);

  useEffect(() => {
    if (!selectedCommunitySquad) return;
    setImportCode(selectedCommunitySquad.code);
    setPreviewTeam(null);
    setImportError('');
  }, [selectedCommunitySquad]);

  useEffect(() => {
    if (selectedCommunitySquad && importCode) {
      setTimeout(() => handleImportPreview(), 50);
    }
  }, [importCode, selectedCommunitySquad]);

  useEffect(() => {
    if (mode !== 'community') {
      setSelectedCommunitySquad(null);
      setPreviewTeam(null);
      setUploadSuccess(false);
      setCommunityError('');
    }
  }, [mode]);

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
    const { battleTower, abandonBattleTower } = useStore.getState(); 
    if (battleTower?.isActive) abandonBattleTower();

    setFriendBattleTeam(previewTeam.map(p => ({ ...p, trainerName: previewName })));
    setSelectedCommunitySquad(null);
    setUploadSuccess(false);
    setScreen('BATTLE_SCREEN');
  };

  const handleUploadSquad = async () => {
    if (team.length === 0) {
      setCommunityError('La tua squadra è vuota!');
      return;
    }
    if (uploadSquadName.trim() === '') {
      setCommunityError('Inserisci un nome per la squadra!');
      return;
    }
    setUploading(true);
    setCommunityError('');
    const preview = team.map(p => ({ name: p.name, pokemonId: p.pokemonId, isShiny: p.isShiny }));
    const success = await uploadSquad({
      trainer_name: player.name,
      squad_name: uploadSquadName.trim(),
      code: exportCode,
      pokemon_preview: preview,
    });
    if (success) {
      setUploadSuccess(true);
      setUploadSquadName('');
      // Refresh list
      const data = await fetchSquads();
      setCommunitySquads(data);
    } else {
      setCommunityError('Errore durante il caricamento. Riprova.');
    }
    setUploading(false);
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
          <button
            onClick={() => setMode('community')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${mode === 'community' ? 'bg-[#e63946] text-white' : 'text-white/40'}`}
          >
            COMMUNITY
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
                    <PokemonSprite
                      pokemonId={p.pokemonId}
                      isShiny={p.isShiny}
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
                      <PokemonSprite
                        pokemonId={p.pokemonId}
                        isShiny={p.isShiny}
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

      {/* COMMUNITY MODE */}
      {mode === 'community' && (
        <div className="flex-1 flex flex-col px-4 pb-4 gap-4 overflow-y-auto no-scrollbar">
          <p className="text-xs text-white/40 italic">
            Carica la tua squadra o sfida squadre della community!
          </p>

          {/* Upload section */}
          <div className="bg-[#1a1a2e] rounded-2xl p-4 border border-white/5 space-y-3">
            <p className="text-sm font-black text-white/60 uppercase">CARICA LA TUA SQUADRA</p>
            <input
              value={uploadSquadName}
              onChange={e => setUploadSquadName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e63946]/50"
              placeholder="Nome squadra (es. Team Fuoco)"
            />
            <button
              onClick={handleUploadSquad}
              disabled={uploading || team.length === 0}
              className="w-full bg-[#e63946] py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-30"
            >
              {uploading ? 'CARICAMENTO...' : 'CARICA'}
            </button>
            {uploadSuccess && (
              <p className="text-xs text-green-400 font-bold">Squadra caricata con successo!</p>
            )}
            {communityError && (
              <p className="text-xs text-red-400 font-bold">{communityError}</p>
            )}
          </div>

          {/* Community list */}
          {communityLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/40">
              <span className="text-3xl">⏳</span>
              <p className="font-bold text-sm">Caricamento...</p>
            </div>
          ) : communitySquads.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/20">
              <span className="text-5xl">👥</span>
              <p className="font-bold text-sm">Nessuna squadra disponibile</p>
            </div>
          ) : (
            <div className="space-y-3">
              {communitySquads.map(squad => (
                <div key={squad.id} className="bg-[#1a1a2e] rounded-2xl p-4 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-sm">{squad.trainer_name}</p>
                      <p className="text-xs text-white/40">{squad.squad_name}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCommunitySquad(squad)}
                      className="bg-[#e63946] px-4 py-2 rounded-xl font-bold text-xs"
                    >
                      SFIDA
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {squad.pokemon_preview.slice(0, 4).map((p, i) => (
                      <div key={i} className="relative">
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.pokemonId}.png`}
                          className="w-8 h-8 object-contain"
                          alt={p.name}
                        />
                        {p.isShiny && <span className="absolute -top-1 -right-1 text-yellow-400 text-xs">✨</span>}
                      </div>
                    ))}
                  </div>
                  {selectedCommunitySquad?.id === squad.id && (
                    <div className="border-t border-white/10 pt-3 space-y-3">
                      <button
                        onClick={() => setSelectedCommunitySquad(null)}
                        className="w-full bg-white/5 py-2 rounded-xl font-bold text-xs text-white/40"
                      >
                        Annulla
                      </button>
                      {previewTeam && (
                        <>
                          <div className="bg-[#0f0f1a] rounded-xl p-3 border border-[#e63946]/30 space-y-2">
                            <p className="text-[10px] font-black text-[#e63946] uppercase">Squadra di {previewName}</p>
                            {previewTeam.map((p, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <PokemonSprite
                                  pokemonId={p.pokemonId}
                                  isShiny={p.isShiny}
                                  className="w-8 h-8 object-contain"
                                />
                                <div className="flex-1 min-w-0">
                                  <span className="font-bold text-xs uppercase truncate">{p.name}</span>
                                  {p.isShiny && <span className="text-yellow-400 text-xs">✨</span>}
                                </div>
                                <span className="text-[10px] bg-[#e63946] px-1 py-0.5 rounded font-bold">Lv.{p.level}</span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={handleStartBattle}
                            className="w-full bg-[#e63946] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                          >
                            <Sword size={16} /> INIZIA SFIDA!
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
