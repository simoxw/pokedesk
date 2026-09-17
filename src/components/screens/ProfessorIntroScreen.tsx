import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useStore } from '../../store';

const lines = [
  'Benvenuto nel mondo di PokeDesk.',
  'Io sono il Professore, e questa regione è piena di Pokémon da scoprire, catturare e far crescere.',
  'Prima di partire, devi scegliere i tuoi tre compagni iniziali. Ogni scelta influenzerà il tuo viaggio.',
  'Usa il tuo ingegno, affronta le palestre e conquista la Lega. Il tuo percorso inizia ora.'
];

export default function ProfessorIntroScreen() {
  const { setScreen } = useStore();

  return (
    <div className="h-full bg-gradient-to-b from-[#0a1020] via-[#101a2f] to-[#0f172a] px-5 py-6">
      <div className="mx-auto flex h-full max-w-md flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-[28px] border border-cyan-400/20 bg-slate-900/85 p-5 shadow-[0_0_30px_rgba(34,211,238,0.14)] backdrop-blur-sm"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-cyan-300/80">Professore</p>
              <h1 className="mt-2 text-2xl font-black text-white">PokeDesk</h1>
            </div>
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-cyan-400/25 bg-cyan-300/10 p-1 shadow-inner shadow-cyan-400/20">
              <img
                src="https://play.pokemonshowdown.com/sprites/trainers/oak-gen3.png"
                alt="Professore"
                className="h-full w-full object-contain"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-cyan-300">
              <Sparkles className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Introduzione</span>
            </div>
            <div className="space-y-3 text-sm leading-6 text-slate-200/90">
              {lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/5 bg-white/3 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">Missione</p>
            <p className="mt-2 text-base font-bold text-white">Scegli i tuoi 3 starter e inizia l’avventura.</p>
          </div>

          <button
            onClick={() => setScreen('STARTER_DRAFT')}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-4 text-base font-black text-slate-950 shadow-lg shadow-cyan-500/25 transition-transform active:scale-[0.98]"
          >
            Inizia la scelta
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
