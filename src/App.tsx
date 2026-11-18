import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  CatWorldViewport,
  type CatWorldActions,
} from './components/CatWorldViewport';
import type { HudSnapshot, TimeOfDay } from './world/types';

const INITIAL_HUD: HudSnapshot = {
  catState: 'idle',
  speed: 0,
  isGrounded: true,
  nearbyPrompt: null,
  nearbyKind: null,
  statusMessage: null,
  progress: {
    boxesExplored: 0,
    totalBoxes: 6,
    cansTipped: 0,
    totalCans: 5,
    benchesVisited: 0,
    totalBenches: 4,
    toysBatted: 0,
    totalToys: 3,
  },
};

const STATE_LABELS: Record<HudSnapshot['catState'], string> = {
  idle: 'Standing',
  sit: 'Sitting',
  walk: 'Walking',
  run: 'Running',
  jump: 'Jumping',
  stretch: 'Stretching',
  swat: 'Swatting',
  inBox: 'In Box',
};

export default function App() {
  const worldRef = useRef<CatWorldActions | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const handleHudUpdate = useCallback((snapshot: HudSnapshot) => {
    setHud(snapshot);
  }, []);

  // Keyboard shortcut 'H' to toggle HUD dock (Zen / Cinema Mode)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'KeyH') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Pointer hold helpers for touch/mouse directional buttons
  const startMove = (x: number, y: number, sprint = false) => {
    worldRef.current?.setMoveInput(x, y, sprint);
  };
  const stopMove = () => {
    worldRef.current?.setMoveInput(0, 0, false);
  };

  const { progress } = hud;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Full-viewport 3D WebGL Canvas */}
      <CatWorldViewport
        ref={worldRef}
        timeOfDay={timeOfDay}
        soundEnabled={soundEnabled}
        onHudUpdate={handleHudUpdate}
      />

      {/* Minimal Top-Left Header & Unboxed Discovery Progress */}
      <header className="pointer-events-none absolute top-4 left-4 z-10 flex items-center gap-3.5 rounded-xl bg-slate-950/88 border border-white/12 px-3.5 py-2.5 shadow-lg">
        <img
          src="/assets/aistudio/image_d0334c45.png"
          alt="Grey tabby cat portrait"
          referrerPolicy="no-referrer"
          className="w-10 h-10 rounded-lg object-cover border border-white/15 shrink-0"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-semibold tracking-tight text-white whitespace-nowrap">
              Tabby City Prowl
            </h1>
            <span className="text-xs text-amber-300 font-medium whitespace-nowrap">
              {STATE_LABELS[hud.catState]}
            </span>
          </div>
          <div
            className="mt-0.5 flex items-center gap-2 text-xs text-slate-300 whitespace-nowrap"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            <span>
              Boxes {progress.boxesExplored}/{progress.totalBoxes}
            </span>
            <span aria-hidden="true" className="text-slate-500">
              ·
            </span>
            <span>
              Cans {progress.cansTipped}/{progress.totalCans}
            </span>
            <span aria-hidden="true" className="text-slate-500">
              ·
            </span>
            <span>
              Benches {progress.benchesVisited}/{progress.totalBenches}
            </span>
          </div>
        </div>
      </header>

      {/* Transient Interaction Feedback Banner (Top-Center) */}
      {hud.statusMessage && (
        <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-lg bg-slate-950/88 border border-white/12 px-4 py-2 text-xs font-medium text-amber-200 shadow-lg whitespace-nowrap">
          {hud.statusMessage}
        </div>
      )}

      {/* Contextual Nearby Interaction Prompt (Clickable + E Shortcut) */}
      {hud.nearbyPrompt && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 z-10 transition-transform duration-200 ${
            dockCollapsed ? 'bottom-16' : 'bottom-[138px]'
          }`}
        >
          <button
            type="button"
            onClick={() => worldRef.current?.interact()}
            className="flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-semibold text-xs px-4 py-2 shadow-lg transition-all cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{hud.nearbyPrompt}</span>
          </button>
        </div>
      )}

      {/* Collapsible Unified Bottom Control Dock */}
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[min(920px,95vw)] transition-transform duration-200 ease-out ${
          dockCollapsed ? 'translate-y-[calc(100%+16px)]' : 'translate-y-0'
        }`}
      >
        {/* Dock Collapse / Expand Handle */}
        <div className="flex justify-center -mb-px">
          <button
            type="button"
            onClick={() => setDockCollapsed((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-t-lg bg-slate-950/90 border border-b-0 border-white/12 px-3 py-1 text-[11px] font-medium text-slate-300 hover:text-white transition-colors cursor-pointer ${
              dockCollapsed ? '-translate-y-9 rounded-b-lg border-b' : ''
            }`}
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Show Controls (H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Hide Controls (H)</span>
              </>
            )}
          </button>
        </div>

        {/* Main Dock Panel */}
        <div className="rounded-xl bg-slate-950/90 border border-white/12 px-3.5 py-2.5 shadow-2xl flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Compact On-Screen Walk / Run Controls for Mouse & Touch */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Turn and walk left"
                onPointerDown={() => startMove(-1, 0, false)}
                onPointerUp={stopMove}
                onPointerLeave={stopMove}
                className="px-2.5 py-1.5 rounded-md bg-white/8 hover:bg-white/15 active:bg-amber-500 active:text-slate-950 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Left
              </button>
              <button
                type="button"
                aria-label="Walk forward"
                onPointerDown={() => startMove(0, 1, false)}
                onPointerUp={stopMove}
                onPointerLeave={stopMove}
                className="px-2.5 py-1.5 rounded-md bg-white/8 hover:bg-white/15 active:bg-amber-500 active:text-slate-950 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Walk
              </button>
              <button
                type="button"
                aria-label="Run forward"
                onPointerDown={() => startMove(0, 1, true)}
                onPointerUp={stopMove}
                onPointerLeave={stopMove}
                className="px-2.5 py-1.5 rounded-md bg-white/8 hover:bg-white/15 active:bg-amber-500 active:text-slate-950 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Run
              </button>
              <button
                type="button"
                aria-label="Turn and walk right"
                onPointerDown={() => startMove(1, 0, false)}
                onPointerUp={stopMove}
                onPointerLeave={stopMove}
                className="px-2.5 py-1.5 rounded-md bg-white/8 hover:bg-white/15 active:bg-amber-500 active:text-slate-950 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Right
              </button>
            </div>

            {/* Cat Actions & Poses */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => worldRef.current?.jump()}
                className="px-3 py-1.5 rounded-md bg-amber-500/90 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Jump
              </button>
              <button
                type="button"
                onClick={() => worldRef.current?.interact()}
                className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Interact
              </button>
              <button
                type="button"
                onClick={() => worldRef.current?.toggleSit()}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  hud.catState === 'sit' || hud.catState === 'inBox'
                    ? 'bg-amber-400/25 text-amber-200 border border-amber-400/40'
                    : 'bg-white/8 hover:bg-white/15 text-slate-200'
                }`}
              >
                Sit
              </button>
              <button
                type="button"
                onClick={() => worldRef.current?.triggerStretch()}
                className="px-2.5 py-1.5 rounded-md bg-white/8 hover:bg-white/15 text-slate-200 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Stretch
              </button>
              <button
                type="button"
                onClick={() => worldRef.current?.meow()}
                className="px-2.5 py-1.5 rounded-md bg-white/8 hover:bg-white/15 text-slate-200 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Meow
              </button>
            </div>

            {/* Time of Day, Close-up Camera, Reset, Audio */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-white/6 rounded-md p-0.5 border border-white/8">
                {(['morning', 'golden', 'twilight'] as TimeOfDay[]).map(
                  (preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTimeOfDay(preset)}
                      className={`px-2 py-1 rounded text-[11px] font-medium capitalize transition-colors cursor-pointer whitespace-nowrap ${
                        timeOfDay === preset
                          ? 'bg-white text-slate-950'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ),
                )}
              </div>

              <button
                type="button"
                title="Toggle close-up portrait camera"
                aria-label="Toggle close-up portrait camera"
                onClick={() => worldRef.current?.focusCloseUp()}
                className="p-1.5 rounded-md bg-white/8 hover:bg-white/15 text-slate-200 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Reset cat position (R)"
                aria-label="Reset cat position"
                onClick={() => worldRef.current?.resetCat()}
                className="p-1.5 rounded-md bg-white/8 hover:bg-white/15 text-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                title={soundEnabled ? 'Mute audio' : 'Enable audio'}
                aria-label={soundEnabled ? 'Mute audio' : 'Enable audio'}
                onClick={() => setSoundEnabled((s) => !s)}
                className="p-1.5 rounded-md bg-white/8 hover:bg-white/15 text-slate-200 transition-colors cursor-pointer"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* Quiet Keyboard Hint Line */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400 border-t border-white/8 pt-1.5">
            <span>WASD / Arrows Move</span>
            <span aria-hidden="true">·</span>
            <span>Shift Run</span>
            <span aria-hidden="true">·</span>
            <span>Space Jump</span>
            <span aria-hidden="true">·</span>
            <span>E or Click Object Interact</span>
            <span aria-hidden="true">·</span>
            <span>C Sit · X Stretch · F Meow</span>
            <span aria-hidden="true">·</span>
            <span>Drag Orbit · Scroll Zoom</span>
          </div>
        </div>
      </div>
    </div>
  );
}
