import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';

const STORAGE_KEY = 'pokedesk-mute-btn-pos';
const BTN_SIZE = 36;

function loadPos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { x: window.innerWidth - BTN_SIZE - 12, y: window.innerHeight - 160 };
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export default function FloatingMuteButton() {
  const { settings, updateSettings } = useStore();
  const [pos, setPos] = useState<{ x: number; y: number }>(loadPos);
  const [dragging, setDragging] = useState(false);

  const isDragging = useRef(false);
  const posRef = useRef(pos);
  const startPointer = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenersAttached = useRef(false);

  // Aggiorna il ref ogni volta che pos cambia
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  // Attacca i listener globali una volta sola al mount
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - startPointer.current.x;
      const dy = e.clientY - startPointer.current.y;
      const newX = clamp(startPos.current.x + dx, 8, window.innerWidth - BTN_SIZE - 8);
      const newY = clamp(startPos.current.y + dy, 8, window.innerHeight - BTN_SIZE - 8);
      setPos({ x: newX, y: newY });
    };

    const onUp = () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      if (isDragging.current) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posRef.current));
      }
      isDragging.current = false;
      setDragging(false);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []); // [] — si attacca una volta sola

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    startPointer.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...pos };
    longPressTimer.current = setTimeout(() => {
      isDragging.current = true;
      setDragging(true);
    }, 400);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (!isDragging.current) {
      updateSettings({ audio: !settings.audio });
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (isDragging.current) return;
    const dx = Math.abs(e.clientX - startPointer.current.x);
    const dy = Math.abs(e.clientY - startPointer.current.y);
    if (dx > 6 || dy > 6) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    }
  };

  return (
    <button
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
      onContextMenu={e => e.preventDefault()}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: BTN_SIZE,
        height: BTN_SIZE,
        zIndex: 200,
        touchAction: 'none',
        cursor: dragging ? 'grabbing' : 'pointer',
        boxShadow: dragging
          ? '0 0 0 3px rgba(230,57,70,0.5)'
          : '0 2px 8px rgba(0,0,0,0.4)',
        transition: dragging ? 'none' : 'box-shadow 0.2s',
      }}
      className="rounded-full bg-[#1a1a2e]/95 border border-white/15 flex items-center justify-center text-base backdrop-blur-sm select-none"
    >
      {settings.audio ? '🔊' : '🔇'}
    </button>
  );
}