import { FastForward, X } from 'lucide-react';
import type { PlayerRow, RoomRow, VoteRow } from '../types/game';

interface DevPanelProps {
  open: boolean;
  onClose: () => void;
  room: RoomRow | null;
  players: PlayerRow[];
  votes: VoteRow[];
  clockOffsetMs: number;
  myUserId: string | null;
  canSkipTitleCard: boolean;
  onSkipTitleCard: () => void;
  lockInRemainingMs: number | null;
}

export function DevPanel({
  open,
  onClose,
  room,
  players,
  votes,
  clockOffsetMs,
  myUserId,
  canSkipTitleCard,
  onSkipTitleCard,
  lockInRemainingMs,
}: DevPanelProps) {
  if (!open) return null;

  const currentSceneVotes = room?.current_scene
    ? votes.filter((v) => v.scene_id === room.current_scene)
    : [];

  const counts = currentSceneVotes.reduce<Record<string, number>>((acc, v) => {
    acc[v.choice_id] = (acc[v.choice_id] || 0) + 1;
    return acc;
  }, {});

  return (
    <aside
      aria-label="Developer inspection panel"
      className="fixed bottom-4 right-4 z-50 w-[min(92vw,360px)] max-h-[80vh] overflow-y-auto rounded-sm border border-[#C9993A] bg-[#140D08]/95 p-4 text-xs text-[#EBD9B4] shadow-[0_16px_40px_rgba(0,0,0,0.85)] backdrop-blur-md"
    >
      <div className="flex items-center justify-between border-b border-[#C9993A]/35 pb-2">
        <span className="font-cinzel font-bold tracking-[0.12em] text-[#C9993A]">
          DEV PANEL (D)
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dev panel"
          className="cursor-pointer rounded p-1 text-[#D9B98A] hover:bg-[#2B1D14] hover:text-[#EBD9B4]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {!room ? (
        <div className="mt-3 space-y-1 font-mono text-[11px] text-[#D9B98A]">
          <p>No active room</p>
          <p>Auth UID: {myUserId || 'none'}</p>
          <p>Clock offset: {clockOffsetMs} ms</p>
        </div>
      ) : (
        <div className="mt-3 space-y-3 font-mono text-[11px]">
          {canSkipTitleCard && (
            <button
              type="button"
              onClick={onSkipTitleCard}
              className="cursor-pointer flex w-full items-center justify-center gap-1.5 rounded-sm border border-[#C9993A] bg-[#2B1D14] px-3 py-2 font-cinzel text-[11px] font-bold tracking-[0.08em] text-[#EBD9B4] hover:bg-[#3A271B]"
            >
              <FastForward className="h-3.5 w-3.5 text-[#C9993A]" aria-hidden="true" />
              <span>Skip Title Card</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-1.5 text-[#D9B98A]">
            <span>Room: <strong className="text-[#EBD9B4]">{room.code}</strong></span>
            <span>Status: <strong className="text-[#EBD9B4]">{room.status}</strong></span>
            <span>Scene: <strong className="text-[#EBD9B4]">{room.current_scene || '—'}</strong></span>
            <span>Year: <strong className="text-[#EBD9B4]">{room.year}</strong></span>
            <span>Offset: <strong className="text-[#EBD9B4]">{clockOffsetMs}ms</strong></span>
            <span>Players: <strong className="text-[#EBD9B4]">{players.length}/3</strong></span>
            {lockInRemainingMs !== null && (
              <span className="col-span-2 text-[#E8883A]">
                Lock-in: <strong>{(lockInRemainingMs / 1000).toFixed(1)}s</strong>
              </span>
            )}
          </div>

          <div className="border-t border-[#C9993A]/25 pt-2">
            <p className="text-[#C9993A] font-semibold mb-1">Meters (0–100)</p>
            <div className="grid grid-cols-3 gap-2 tabular-nums">
              <div className="rounded bg-[#1E140D] px-2 py-1 border border-[#C9993A]/25">
                Grain: <strong className="text-[#EBD9B4]">{room.grain}</strong>
              </div>
              <div className="rounded bg-[#1E140D] px-2 py-1 border border-[#C9993A]/25">
                Panic: <strong className="text-[#EBD9B4]">{room.panic}</strong>
              </div>
              <div className="rounded bg-[#1E140D] px-2 py-1 border border-[#C9993A]/25">
                Trust: <strong className="text-[#EBD9B4]">{room.trust}</strong>
              </div>
            </div>
          </div>

          <div className="border-t border-[#C9993A]/25 pt-2">
            <p className="text-[#C9993A] font-semibold mb-1">Current Scene Votes</p>
            <p className="text-[#D9B98A]">
              Counts: {Object.keys(counts).length ? JSON.stringify(counts) : 'none'}
            </p>
            <ul className="mt-1 space-y-0.5 text-[#D9B98A]">
              {players.map((p) => {
                const v = currentSceneVotes.find((x) => x.player_id === p.id);
                return (
                  <li key={p.id}>
                    P{p.seat} ({p.name}): <strong className="text-[#EBD9B4]">{v ? v.choice_id : '—'}</strong>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t border-[#C9993A]/25 pt-2">
            <p className="text-[#C9993A] font-semibold mb-1">Flags</p>
            <pre className="whitespace-pre-wrap break-all rounded bg-[#1E140D] p-2 border border-[#C9993A]/25 text-[#EBD9B4]">
              {JSON.stringify(room.flags || {}, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </aside>
  );
}
