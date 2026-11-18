export type RoomStatus = 'lobby' | 'playing' | 'finished';

export type DecisionRule = 'majority' | 'host' | 'default';

export interface HistoryEntry {
  scene: string;
  phase?: string;
  choiceId: string;
  choiceText: string;
  resultText?: string;
  votes: Record<string, string>;
  decidedBy?: DecisionRule;
}

export interface YearCard {
  title: string;
  subtitle: string;
  mood?: 'abundance' | 'drought';
}

export interface RoomRow {
  code: string;
  host_id: string;
  status: RoomStatus;
  current_scene: string | null;
  voting_opens_at: string | null;
  scene_ends_at: string | null;
  scene_duration: number | null;
  year: number;
  grain: number;
  panic: number;
  trust: number;
  flags: Record<string, boolean | string | number>;
  history: HistoryEntry[];
  ending: string | null;
}

export interface PlayerRow {
  id: string;
  room_code: string;
  name: string;
  seat: 1 | 2 | 3;
  last_seen: string;
}

export interface VoteRow {
  room_code: string;
  scene_id: string;
  player_id: string;
  choice_id: string;
}

export interface SceneChoice {
  id: string;
  title?: string;
  text: string;
  bgImageUrl?: string;
  resultText?: string;
  effects: {
    grain: number;
    panic: number;
    trust: number;
  };
  setFlags: Record<string, boolean | string | number>;
  next: string | ((state: { grain: number; panic: number; trust: number; flags: Record<string, unknown>; year: number; room: RoomRow }) => string);
}

export interface StoryScene {
  id: string;
  phase: string;
  year: number;
  duration: number;
  yearCard?: YearCard;
  text: string;
  defaultChoice: string;
  choices: SceneChoice[];
}

export interface EndingInfo {
  id: string;
  number: number;
  title: string;
  coreConcept?: string;
  outcome: string;
  academicExplanation: string;
  sourceNote: string;
}
