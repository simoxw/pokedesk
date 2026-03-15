import React from 'react';
import { useStore } from '../../store';
import { motion } from 'motion/react';
import { ArrowLeft, Coins, ShoppingCart } from 'lucide-react';

const SHOP_ITEMS = [ 
  { id: 'pokeball',    name: 'Pokéball',       cost: 200,  icon: '🔴', description: 'Pokéball base' }, 
  { id: 'potion',      name: 'Pozione',         cost: 300,  icon: '🧪', description: 'Cura 30 HP' }, 
  { id: 'full_heal',   name: 'Cura Totale',     cost: 300,  icon: '💊', description: 'Cura qualsiasi stato' }, 
  { id: 'megaball',    name: 'Megaball',        cost: 600,  icon: '🔵', unlock: 5,  description: '1.8x cattura' }, 
  { id: 'superpotion', name: 'Superpozione',    cost: 700,  icon: '🧪', unlock: 4,  description: 'Cura 80 HP' }, 
  { id: 'rare_candy',  name: 'Caramella Rara',  cost: 2500, icon: '🍬', unlock: 8,  description: '+1 livello' }, 
  { id: 'ultraball',   name: 'Ultraball',       cost: 1200, icon: '🟡', unlock: 6,  description: '3x cattura' }, 
  { id: 'hyperpotion', name: 'Iperpozione',     cost: 1500, icon: '💊', unlock: 6,  description: 'Cura 200 HP' }, 
  { id: 'masterball',  name: 'Masterball',      cost: 9999, icon: '🟣', unlock: 3,  description: 'Cattura garantita' }, 
  { id: 'fire_stone',   name: 'Pietra Focaia',   cost: 2100, icon: '🔥', unlock: 3,  description: 'Evolve certi Pokémon' },
  { id: 'water_stone',  name: 'Pietra Idrica',   cost: 2100, icon: '💧', unlock: 3,  description: 'Evolve certi Pokémon' },
  { id: 'thunder_stone',name: 'Pietra Tuono',    cost: 2100, icon: '⚡', unlock: 3,  description: 'Evolve certi Pokémon' },
  { id: 'leaf_stone',   name: 'Pietra Foglia',   cost: 2100, icon: '🍃', unlock: 3,  description: 'Evolve certi Pokémon' },
  { id: 'moon_stone',   name: 'Pietra Lunare',   cost: 2100, icon: '🌙', unlock: 3,  description: 'Evolve certi Pokémon' },
]; 


export default function ShopScreen() {
  const { coins, inventory, setScreen, addCoins, addItem, medals } = useStore();
  const medalsCount = medals.filter(m => m.isUnlocked).length;

  const handleBuy = (item: any) => {
    if (coins >= item.cost) {
      addCoins(-item.cost);
      addItem(item.id, 1);
    } else {
      alert("Monete insufficienti!");
    }
  };

  return (
    <div className="h-full flex flex-col p-6 bg-[#0f0f1a]">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => setScreen('HUB_SCREEN')} className="p-2 bg-[#1a1a2e] rounded-xl">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-black">NEGOZIO</h2>
        </div>
        <div className="bg-yellow-500/20 text-yellow-500 px-4 py-2 rounded-2xl flex items-center gap-2 font-black">
          <Coins size={18} /> {coins}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-24">
        {SHOP_ITEMS.map(item => {
          const isLocked = item.unlock && medalsCount < item.unlock;
          return (
            <div 
              key={item.id}
              className={`flex items-center justify-between p-4 rounded-2xl border border-white/5 ${
                isLocked ? 'opacity-40 grayscale' : 'bg-[#1a1a2e]'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <h4 className="font-bold uppercase text-sm">{item.name}</h4>
                  {item.description && ( 
                    <p className="text-[10px] text-white/40 mt-0.5">{item.description}</p> 
                  )} 
                  <p className="text-xs text-yellow-500 font-black">{item.cost}¢</p>
                  {isLocked && <span className="text-[10px] text-white/30">🔒 {item.unlock} medaglie</span>}
                </div>
              </div>
              <button 
                disabled={isLocked || coins < item.cost}
                onClick={() => handleBuy(item)}
                className="bg-[#e63946] disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <ShoppingCart size={14} /> ACQUISTA
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
