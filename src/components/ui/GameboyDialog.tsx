import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface GameboyDialogProps {
  lines: string[];
  trainerName: string;
  trainerSprite: string;
  onComplete: () => void;
  variant?: 'intro' | 'win' | 'lose';
}

export default function GameboyDialog({
  lines,
  trainerName,
  trainerSprite,
  onComplete,
  variant = 'intro',
}: GameboyDialogProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  const currentLine = lines[lineIndex] ?? '';

  // Typewriter effect
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(currentLine.slice(0, i));
      if (i >= currentLine.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 28);
    return () => clearInterval(interval);
  }, [lineIndex, currentLine]);

  const handleTap = () => {
    if (!done) {
      // Skip typewriter
      setDisplayed(currentLine);
      setDone(true);
      return;
    }
    if (lineIndex < lines.length - 1) {
      setLineIndex(i => i + 1);
    } else {
      onComplete();
    }
  };

  const bgColor =
    variant === 'win'
      ? 'from-emerald-950 to-black'
      : variant === 'lose'
      ? 'from-red-950 to-black'
      : 'from-slate-950 to-black';

  const accentColor =
    variant === 'win'
      ? 'text-emerald-400 border-emerald-500/40'
      : variant === 'lose'
      ? 'text-red-400 border-red-500/40'
      : 'text-white border-white/20';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[200] bg-gradient-to-b ${bgColor} flex flex-col items-center justify-end pb-8 px-4`}
      onClick={handleTap}
    >
      {/* Sprite trainer */}
      <motion.img
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        src={trainerSprite}
        alt={trainerName}
        className="w-48 h-48 object-contain drop-shadow-2xl mb-4 pixelated"
        style={{ imageRendering: 'pixelated' }}
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://play.pokemonshowdown.com/sprites/trainers/unknown.png';
        }}
      />

      {/* Dialog box stile GameBoy */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`w-full max-w-sm border-2 ${accentColor} rounded-2xl bg-black/90 backdrop-blur-sm p-5`}
      >
        {/* Nome trainer */}
        <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${accentColor.split(' ')[0]}`}>
          {trainerName}
        </p>

        {/* Testo con cursore lampeggiante */}
        <p className="text-white font-mono text-sm leading-relaxed min-h-[48px]">
          {displayed}
          {!done && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-2 h-3 bg-white ml-0.5 align-middle"
            />
          )}
        </p>

        {/* Indicatore avanza */}
        {done && (
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            className={`text-right text-xs mt-2 ${accentColor.split(' ')[0]}`}
          >
            ▼
          </motion.div>
        )}
      </motion.div>

      {/* Hint tap */}
      <p className="text-white/20 text-[10px] mt-3 font-mono">
        tocca per continuare
      </p>
    </motion.div>
  );
}