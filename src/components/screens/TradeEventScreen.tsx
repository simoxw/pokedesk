import React, { useMemo, useState, useCallback } from 'react';
import { useStore } from '../../store';
import { BattleEngine } from '../../BattleEngine';
import PokemonSprite from '../ui/PokemonSprite';
import { motion } from 'motion/react';
import { ArrowLeft, RefreshCw } from 'lucide-react';

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'ATT',
  defense: 'DEF',
  spAtk: 'SP.ATK',
  spDef: 'SP.DEF',
  speed: 'VEL',
};

function randomIv() {
  return 24 + Math.floor(Math.random() * 8);
}

function sumIvs(ivs: { hp: number; attack: number; defense: number; spAtk: number; spDef: number; speed: number }) {
  return ivs.hp + ivs.attack + ivs.defense + ivs.spAtk + ivs.spDef + ivs.speed;
}

function createNpcOffer(fromPokemon: any) {
  if (!fromPokemon) return null;
  const ivs = {
    hp: randomIv(),
    attack: randomIv(),
    defense: randomIv(),
    spAtk: randomIv(),
    spDef: randomIv(),
    speed: randomIv(),
  };
  const evs = { ...fromPokemon.evs };
  const stats = BattleEngine.calculateStats(fromPokemon.level, fromPokemon.baseStats, ivs, evs, fromPokemon.nature);
  return {
    ...fromPokemon,
    id: `npc-${Math.random().toString(36).slice(2, 10)}`,
    ivs,
    stats,
    currentHp: stats.hp,
    caughtAt: Date.now(),
    isShiny: false,
  };
}

export default function TradeEventScreen() {
  const { team, box, coins, favorites, setScreen, addPokemon, removePokemon, updatePokedex, addCoins } = useStore();
  const [selectedSource, setSelectedSource] = useState<'team' | 'box'>('team');
  const [selectedPokemonId, setSelectedPokemonId] = useState<string | null>(null);
  const [offerSeed, setOfferSeed] = useState(Math.random());
  const [boxIvMin, setBoxIvMin] = useState(0);
  const [boxIvMax, setBoxIvMax] = useState(186);
  const [boxLevelMin, setBoxLevelMin] = useState(0);
  const [boxLevelMax, setBoxLevelMax] = useState(100);
  const [boxFavoritesOnly, setBoxFavoritesOnly] = useState(false);
  const tradeCost = 5000;

  const allOwned = useMemo(() => [...team, ...box], [team, box]);
  const selectedPokemon = useMemo(
    () => allOwned.find((p) => p.id === selectedPokemonId) ?? null,
    [allOwned, selectedPokemonId]
  );

  const npcOffer = useMemo(() => {
    if (allOwned.length === 0) return null;
    const source = allOwned[Math.floor((offerSeed * 1000000) % allOwned.length)];
    return createNpcOffer(source);
  }, [allOwned, offerSeed]);

  const filteredBox = useMemo(() => {
    return box.filter((pkmn) => {
      if (boxFavoritesOnly && !favorites.includes(pkmn.id)) return false;
      const totalIv = sumIvs(pkmn.ivs);
      if (totalIv < boxIvMin || totalIv > boxIvMax) return false;
      if (pkmn.level < boxLevelMin || pkmn.level > boxLevelMax) return false;
      return true;
    });
  }, [box, boxFavoritesOnly, boxIvMin, boxIvMax, boxLevelMin, boxLevelMax, favorites]);

  const availableList = selectedSource === 'team' ? team : filteredBox;

  const canTrade = !!selectedPokemon && !!npcOffer && coins >= tradeCost;

  const handleTrade = useCallback(() => {
    if (!selectedPokemon || !npcOffer) return;
    if (coins < tradeCost) {
      alert('Non hai abbastanza monete per lo scambio.');
      return;
    }
    addCoins(-tradeCost);
    removePokemon(selectedPokemon.id);
    addPokemon({ ...npcOffer, id: `npc-${Math.random().toString(36).slice(2, 9)}` });
    updatePokedex(npcOffer.pokemonId, 'caught', npcOffer.types?.[0]);
    setSelectedPokemonId(null);
    setOfferSeed(Math.random());
    alert(`Scambio completato! Hai ricevuto ${npcOffer.name}.`);
  }, [selectedPokemon, npcOffer, coins, removePokemon, addPokemon, updatePokedex, addCoins]);

  return (
    <div className="h-full flex flex-col bg-[#0f0f1a] overflow-hidden">
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setScreen('START_SCREEN')} className="p-2 bg-[#1a1a2e] rounded-xl">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-black uppercase flex-1">TRADE EVENT</h2>
          <button
            onClick={() => setOfferSeed(Math.random())}
            className="px-3 py-2 bg-[#1a1a2e] rounded-2xl text-xs font-black uppercase"
          >
            <RefreshCw size={16} className="inline-block mr-1" /> Nuova offerta
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
        <div className="rounded-3xl border border-white/10 bg-[#11121b] p-5">
          <p className="text-sm text-white/50 mb-3">L'NPC offre un Pokémon con IV tra 24 e 31. Scegli un tuo Pokémon da cedere, paga 5000¢ e ottieni l'offerta.</p>
          {npcOffer ? (
            <div className="bg-[#0f0f1a] rounded-3xl p-4 border border-[#e63946]/20">
              <div className="flex items-center gap-4">
                <PokemonSprite pokemonId={npcOffer.pokemonId} isShiny={npcOffer.isShiny} style={{ width: '54px', height: '54px' }} />
                <div className="flex-1">
                  <p className="font-black text-lg">{npcOffer.name} Lv.{npcOffer.level}</p>
                  <p className="text-[11px] text-white/40">IV totali {sumIvs(npcOffer.ivs)}</p>
                  <p className="text-[11px] text-white/40">Richiesta: {tradeCost}¢ + 1 Pokémon</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-white/40">Nessun Pokémon disponibile per generare l'offerta. Cattura o ricevi un Pokémon per attivare l'evento.</p>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#11121b] p-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <button
              onClick={() => setSelectedSource('team')}
              className={`flex-1 py-2 rounded-2xl text-sm font-black ${selectedSource === 'team' ? 'bg-[#e63946]' : 'bg-[#0f0f1a] text-white/60'}`}
            >
              Squadra ({team.length})
            </button>
            <button
              onClick={() => setSelectedSource('box')}
              className={`flex-1 py-2 rounded-2xl text-sm font-black ${selectedSource === 'box' ? 'bg-[#e63946]' : 'bg-[#0f0f1a] text-white/60'}`}
            >
              Box ({box.length})
            </button>
          </div>
          {selectedSource === 'box' && (
            <div className="mb-4 rounded-3xl border border-white/10 bg-[#0f0f1a] p-4 space-y-3">
              <p className="text-[11px] text-white/50">Filtra i Pokémon del Box per IV, livello o preferiti.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1a1a2e] rounded-2xl p-3 text-xs font-bold">
                  <span className="block mb-2">IV min</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBoxIvMin((value) => Math.max(0, value - 1))}
                      className="w-8 h-8 rounded-2xl bg-[#0f0f1a]"
                    >-</button>
                    <input
                      type="number"
                      value={boxIvMin}
                      min={0}
                      max={186}
                      onChange={(e) => setBoxIvMin(Math.max(0, Math.min(186, Number(e.target.value) || 0)))}
                      className="min-w-0 rounded-2xl bg-[#11121b] border border-white/10 px-2 py-2 text-sm"
                    />
                    <button
                      onClick={() => setBoxIvMin((value) => Math.min(boxIvMax, value + 1))}
                      className="w-8 h-8 rounded-2xl bg-[#0f0f1a]"
                    >+</button>
                  </div>
                </div>
                <div className="bg-[#1a1a2e] rounded-2xl p-3 text-xs font-bold">
                  <span className="block mb-2">IV max</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBoxIvMax((value) => Math.max(boxIvMin, value - 1))}
                      className="w-8 h-8 rounded-2xl bg-[#0f0f1a]"
                    >-</button>
                    <input
                      type="number"
                      value={boxIvMax}
                      min={0}
                      max={186}
                      onChange={(e) => setBoxIvMax(Math.max(0, Math.min(186, Number(e.target.value) || 0)))}
                      className="min-w-0 rounded-2xl bg-[#11121b] border border-white/10 px-2 py-2 text-sm"
                    />
                    <button
                      onClick={() => setBoxIvMax((value) => Math.min(186, value + 1))}
                      className="w-8 h-8 rounded-2xl bg-[#0f0f1a]"
                    >+</button>
                  </div>
                </div>
                <div className="bg-[#1a1a2e] rounded-2xl p-3 text-xs font-bold">
                  <span className="block mb-2">Lv min</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBoxLevelMin((value) => Math.max(0, value - 1))}
                      className="w-8 h-8 rounded-2xl bg-[#0f0f1a]"
                    >-</button>
                    <input
                      type="number"
                      value={boxLevelMin}
                      min={0}
                      max={100}
                      onChange={(e) => setBoxLevelMin(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                      className="min-w-0 rounded-2xl bg-[#11121b] border border-white/10 px-2 py-2 text-sm"
                    />
                    <button
                      onClick={() => setBoxLevelMin((value) => Math.min(boxLevelMax, value + 1))}
                      className="w-8 h-8 rounded-2xl bg-[#0f0f1a]"
                    >+</button>
                  </div>
                </div>
                <div className="bg-[#1a1a2e] rounded-2xl p-3 text-xs font-bold">
                  <span className="block mb-2">Lv max</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBoxLevelMax((value) => Math.max(boxLevelMin, value - 1))}
                      className="w-8 h-8 rounded-2xl bg-[#0f0f1a]"
                    >-</button>
                    <input
                      type="number"
                      value={boxLevelMax}
                      min={0}
                      max={100}
                      onChange={(e) => setBoxLevelMax(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                      className="min-w-0 rounded-2xl bg-[#11121b] border border-white/10 px-2 py-2 text-sm"
                    />
                    <button
                      onClick={() => setBoxLevelMax((value) => Math.min(100, value + 1))}
                      className="w-8 h-8 rounded-2xl bg-[#0f0f1a]"
                    >+</button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBoxFavoritesOnly((current) => !current)}
                className={`w-full py-3 rounded-2xl text-sm font-black ${boxFavoritesOnly ? 'bg-yellow-500 text-black' : 'bg-[#1a1a2e] text-white/60'}`}
              >
                {boxFavoritesOnly ? 'Solo preferiti ★' : 'Mostra preferiti'}
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {availableList.length === 0 && (
              <p className="text-white/40 col-span-2">Nessun Pokémon in questa fonte.</p>
            )}
            {availableList.map((pkmn) => (
              <div key={pkmn.id} className={`text-left rounded-3xl p-3 border ${selectedPokemonId === pkmn.id ? 'border-[#e63946]' : 'border-white/10'} bg-[#0f0f1a]`}> 
              <button
                type="button"
                onClick={() => setSelectedPokemonId(pkmn.id)}
                className="w-full text-left"
              >
                <div className="flex items-center gap-3">
                  <PokemonSprite pokemonId={pkmn.pokemonId} isShiny={pkmn.isShiny} style={{ width: '36px', height: '36px' }} />
                  <div className="truncate">
                    <p className="font-black truncate">{pkmn.name} Lv.{pkmn.level}</p>
                    <p className="text-[10px] text-white/40 truncate">IV {sumIvs(pkmn.ivs)}</p>
                  </div>
                </div>
              </button>
              {selectedSource === 'box' && selectedPokemonId === pkmn.id && (
                <button
                  onClick={handleTrade}
                  disabled={!canTrade}
                  className={`mt-3 w-full rounded-2xl py-3 font-black transition ${canTrade ? 'bg-[#e63946] text-white' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
                >
                  {canTrade ? 'Conferma scambio' : 'Seleziona un Pokémon valido'}
                </button>
              )}
            </div>
            ))}
          </div>
          {selectedSource === 'box' && selectedPokemon && (
            <div className="rounded-3xl border border-white/10 bg-[#0f0f1a] p-4 mt-3 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-black">{selectedPokemon.name} Lv.{selectedPokemon.level}</p>
                  <p className="text-xs text-white/50">IV {sumIvs(selectedPokemon.ivs)} • {favorites.includes(selectedPokemon.id) ? '★ Preferito' : 'Pokémon selezionato'}</p>
                </div>
                <button
                  onClick={handleTrade}
                  disabled={!canTrade}
                  className={`rounded-2xl px-4 py-3 font-black transition ${canTrade ? 'bg-[#e63946] text-white' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
                >
                  {canTrade ? 'Conferma scambio' : 'Seleziona un Pokémon valido'}
                </button>
              </div>
              <p className="text-[11px] text-white/40">Premi qui per confermare il Pokémon dal box senza dover scorrere fino in fondo.</p>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#11121b] p-5 space-y-3">
          <div className="flex items-center justify-between text-sm text-white/50">
            <span>Monete</span>
            <span>{coins}¢</span>
          </div>
          <div className="rounded-2xl bg-white/5 p-4 text-sm">
            <p className="font-black text-white/80">Seleziona un Pokémon da sacrificare e conferma lo scambio.</p>
            <p className="text-[11px] text-white/40">L'offerta resta la stessa finché non confermi o rinnovi.</p>
          </div>
          <button
            onClick={handleTrade}
            disabled={!canTrade}
            className={`w-full py-4 rounded-3xl font-black transition ${canTrade ? 'bg-[#e63946]' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
          >
            {canTrade ? 'Scambia ora' : 'Seleziona un Pokémon e assicurati di avere 5000¢'}
          </button>
        </div>
      </div>
    </div>
  );
}
