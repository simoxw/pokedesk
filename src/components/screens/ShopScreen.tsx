import React from 'react';
import { useStore } from '../../store';
import { motion } from 'motion/react';
import { ArrowLeft, Coins, ShoppingCart } from 'lucide-react';
import { useSoundEffects } from '../../useSoundEffects';

type ShopItem = {
  id: string;
  name: string;
  cost: number;
  icon: string;
  description: string;
  unlock?: number;
};

const SHOP_ITEMS = [ 
  { id: 'pokeball',    name: 'Pokéball',       cost: 200,  icon: '🔴', description: 'Pokéball base' }, 
  { id: 'potion',      name: 'Pozione',         cost: 300,  icon: '🧪', description: 'Cura 30 HP' }, 
  { id: 'full_heal',   name: 'Cura Totale',     cost: 300,  icon: '💊', description: 'Cura qualsiasi stato' }, 
  { id: 'megaball',    name: 'Megaball',        cost: 600,  icon: '🔵', unlock: 5,  description: '1.8x cattura' }, 
  { id: 'superpotion', name: 'Superpozione',    cost: 700,  icon: '🧪', unlock: 4,  description: 'Cura 80 HP' }, 
  { id: 'rare_candy',  name: 'Caramella Rara',  cost: 4000, icon: '🍬', unlock: 8,  description: '+1 livello' }, 
  { id: 'ultraball',   name: 'Ultraball',       cost: 1200, icon: '🟡', unlock: 6,  description: '3x cattura' }, 
  { id: 'hyperpotion', name: 'Iperpozione',     cost: 1500, icon: '💊', unlock: 6,  description: 'Cura 200 HP' }, 
  { id: 'masterball',  name: 'Masterball',      cost: 9999, icon: '🟣', unlock: 3,  description: 'Cattura garantita' }, 
  { id: 'fire_stone',   name: 'Pietra Focaia',   cost: 2100, icon: '🔥', unlock: 3,  description: 'Evolve certi Pokémon' },
  { id: 'water_stone',  name: 'Pietra Idrica',   cost: 2100, icon: '💧', unlock: 3,  description: 'Evolve certi Pokémon' },
  { id: 'thunder_stone',name: 'Pietra Tuono',    cost: 2100, icon: '⚡', unlock: 3,  description: 'Evolve certi Pokémon' },
  { id: 'leaf_stone',   name: 'Pietra Foglia',   cost: 2100, icon: '🍃', unlock: 3,  description: 'Evolve certi Pokémon' },
  { id: 'moon_stone',   name: 'Pietra Lunare',   cost: 2100, icon: '🌙', unlock: 3,  description: 'Evolve certi Pokémon' }, 
  { id: 'dawn_stone',   name: 'Pietra Alba',      cost: 2100, icon: '🌅', unlock: 3,  description: 'Evolve certi Pokémon' },
  { id: 'ice_stone',    name: 'Pietra Ghiaccio',  cost: 2100, icon: '🧊', unlock: 3,  description: 'Evolve Eevee in Glaceon' },
  { id: 'dark_stone',   name: 'Pietra Buia',      cost: 2100, icon: '🌑', unlock: 3,  description: 'Evolve Eevee in Umbreon' },
  { id: 'sun_stone',    name: 'Pietra Solare',    cost: 2100, icon: '☀️',  unlock: 3,  description: 'Evolve Eevee in Espeon' },
  { id: 'prism_scale',  name: 'Scaglia Prisma',   cost: 2100, icon: '🌈', unlock: 3,  description: 'Evolve Eevee in Sylveon' },
  { id: 'tm',           name: 'MT Casuale',       cost: 3500, icon: '💿', unlock: 4,  description: 'Insegna una mossa MT a un Pokémon' }, 
  { id: 'heart_scale',  name: 'Squama Cuore',     cost: 6000, icon: '❤️',  unlock: 20, description: 'Insegna qualsiasi mossa (anche rare) a un Pokémon' },
]; 


export default function ShopScreen() {
  const { coins, inventory, setScreen, addCoins, addItem, medals, settings } = useStore();
  const medalsCount = medals.filter(m => m.isUnlocked).length;
  const { playSound } = useSoundEffects(settings.audio);
  const [toast, setToast] = React.useState<string | null>(null);
  const [quantities, setQuantities] = React.useState<Record<string, number>>(() =>
    SHOP_ITEMS.reduce((acc, item) => {
      acc[item.id] = 1;
      return acc;
    }, {} as Record<string, number>)
  );
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1000);
  };

  const setItemQuantity = (itemId: string, nextQty: number) => {
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(1, Math.min(99, nextQty)) }));
  };

  const handleBuy = (item: ShopItem, quantity: number) => {
    const totalCost = item.cost * quantity;
    if (coins >= totalCost) {
      addCoins(-totalCost);
      addItem(item.id, quantity);
      playSound('money');
      showToast(`+${quantity} ${item.name}`);
    } else {
      alert("Monete insufficienti!");
    }
  };

  return (
    <div className="h-full flex flex-col p-6 bg-[#0f0f1a] relative">
      {toast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-black font-black text-sm px-4 py-2 rounded-2xl shadow-lg animate-pulse">
          {toast}
        </div>
      )}
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
          const quantity = quantities[item.id] || 1;
          const totalCost = item.cost * quantity;
          const canIncrease = totalCost + item.cost <= coins && quantity < 99;
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
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <button
                    disabled={isLocked || quantity <= 1}
                    onClick={() => setItemQuantity(item.id, quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-white/10 disabled:opacity-40 font-black"
                  >
                    -
                  </button>
                  <span className="min-w-8 text-center text-xs font-black">{quantity}</span>
                  <button
                    disabled={isLocked || !canIncrease}
                    onClick={() => setItemQuantity(item.id, quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-white/10 disabled:opacity-40 font-black"
                  >
                    +
                  </button>
                </div>
                <button 
                  disabled={isLocked || coins < totalCost}
                  onClick={() => handleBuy(item, quantity)}
                  className="bg-[#e63946] disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <ShoppingCart size={14} /> ACQUISTA ({totalCost}¢)
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
