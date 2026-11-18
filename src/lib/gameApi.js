import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

let clockOffsetMs = 0;
let authPromise = null;

function requireClient() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment settings.'
    );
  }
  return supabase;
}

export function formatRpcError(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;
  const raw = [err.message, err.details, err.hint].filter(Boolean).join(' ').trim();
  const msg = raw.toLowerCase();

  if (!raw) return fallback;
  if (msg.includes('supabase is not configured')) return err.message;
  if (msg.includes('room not found') || msg.includes('not found') || msg.includes('does not exist')) {
    return 'Room not found. Please check the 4-letter code.';
  }
  if (msg.includes('room is full') || msg.includes('full')) {
    return 'Room is full (maximum 3 players).';
  }
  if (msg.includes('already started') || msg.includes('not in lobby') || msg.includes('game in progress')) {
    return 'Game already started in this room.';
  }
  if (msg.includes('not enough players') || msg.includes('at least 2') || msg.includes('need 2')) {
    return 'At least 2 players are needed to start.';
  }
  if (msg.includes('only host') || msg.includes('not host') || msg.includes('host only')) {
    return 'Only the host can perform this action.';
  }
  if (msg.includes('anonymous') && msg.includes('disabled')) {
    return 'Anonymous sign-in must be enabled in Supabase Authentication.';
  }
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }

  return err.message || fallback;
}

/**
 * Ensures an active browser session (anonymous if none exists).
 * Deduplicates concurrent calls on startup.
 */
export async function ensureSession() {
  const client = requireClient();

  if (authPromise) {
    return authPromise;
  }

  authPromise = (async () => {
    const { data: sessionData, error: sessionErr } = await client.auth.getSession();
    if (sessionErr) {
      throw new Error(formatRpcError(sessionErr, 'Unable to restore session.'));
    }
    if (sessionData?.session?.user) {
      return sessionData.session;
    }

    const { data: anonData, error: anonErr } = await client.auth.signInAnonymously();
    if (anonErr) {
      throw new Error(formatRpcError(anonErr, 'Unable to sign in anonymously.'));
    }
    return anonData.session;
  })();

  try {
    return await authPromise;
  } finally {
    authPromise = null;
  }
}

/**
 * Fetches server_time() and computes local-to-server clock offset in ms.
 */
export async function syncServerTime() {
  const client = requireClient();
  const t0 = Date.now();
  const { data, error } = await client.rpc('server_time');
  const t1 = Date.now();

  if (error) {
    throw new Error(formatRpcError(error, 'Unable to synchronize server time.'));
  }

  const raw =
    typeof data === 'string'
      ? data
      : Array.isArray(data)
        ? data[0]?.server_time ?? data[0]
        : data?.server_time ?? data?.now ?? null;

  const serverMs = raw ? new Date(raw).getTime() : NaN;
  if (!Number.isNaN(serverMs)) {
    const midpoint = Math.round((t0 + t1) / 2);
    clockOffsetMs = serverMs - midpoint;
  }
  return clockOffsetMs;
}

export function getClockOffsetMs() {
  return clockOffsetMs;
}

export function getServerNowMs() {
  return Date.now() + clockOffsetMs;
}

/**
 * Fetches the current user's player row if they are already in a room.
 */
export async function fetchMyPlayer(userId) {
  const client = requireClient();
  const { data, error } = await client
    .from('players')
    .select('id, room_code, name, seat, last_seen')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(formatRpcError(error, 'Failed to check active room.'));
  }
  return data;
}

/**
 * Fetches the full authoritative state for a room (room, players, votes).
 */
export async function fetchRoomBundle(code) {
  const client = requireClient();
  const cleanCode = String(code || '').trim().toUpperCase();

  const [roomRes, playersRes, votesRes] = await Promise.all([
    client
      .from('rooms')
      .select(
        'code, host_id, status, current_scene, voting_opens_at, scene_ends_at, scene_duration, year, grain, panic, trust, flags, history, ending'
      )
      .eq('code', cleanCode)
      .maybeSingle(),
    client
      .from('players')
      .select('id, room_code, name, seat, last_seen')
      .eq('room_code', cleanCode)
      .order('seat', { ascending: true }),
    client
      .from('votes')
      .select('room_code, scene_id, player_id, choice_id')
      .eq('room_code', cleanCode),
  ]);

  if (roomRes.error) {
    throw new Error(formatRpcError(roomRes.error, 'Failed to load room.'));
  }
  if (playersRes.error) {
    throw new Error(formatRpcError(playersRes.error, 'Failed to load players.'));
  }
  if (votesRes.error) {
    throw new Error(formatRpcError(votesRes.error, 'Failed to load votes.'));
  }

  return {
    room: roomRes.data || null,
    players: playersRes.data || [],
    votes: votesRes.data || [],
  };
}

export async function createRoom(playerName) {
  const client = requireClient();
  const trimmed = String(playerName || '').trim();
  if (!trimmed) {
    throw new Error('Please enter your name.');
  }

  const { data, error } = await client.rpc('create_room', { p_name: trimmed });
  if (error) {
    throw new Error(formatRpcError(error, 'Could not create room.'));
  }
  return String(data).trim().toUpperCase();
}

export async function joinRoom(code, playerName) {
  const client = requireClient();
  const cleanCode = String(code || '').trim().toUpperCase();
  const trimmed = String(playerName || '').trim();

  if (!trimmed) {
    throw new Error('Please enter your name.');
  }
  if (!/^[A-Z0-9]{4}$/.test(cleanCode)) {
    throw new Error('Please enter a 4-letter room code.');
  }

  const { data, error } = await client.rpc('join_room', {
    p_code: cleanCode,
    p_name: trimmed,
  });
  if (error) {
    throw new Error(formatRpcError(error, 'Could not join room.'));
  }
  return String(data || cleanCode).trim().toUpperCase();
}

export async function leaveRoom() {
  const client = requireClient();
  const { error } = await client.rpc('leave_room');
  if (error) {
    throw new Error(formatRpcError(error, 'Could not leave room.'));
  }
}

export async function touchPlayer() {
  if (!supabase) return;
  await supabase.rpc('touch_player');
}

export async function startGame(code, firstSceneId, duration = 60) {
  const client = requireClient();
  const { error } = await client.rpc('start_game', {
    p_code: code,
    p_first_scene: firstSceneId,
    p_duration: duration,
  });
  if (error) {
    throw new Error(formatRpcError(error, 'Could not start the game.'));
  }
}

export async function submitVote(code, sceneId, choiceId) {
  const client = requireClient();
  const { error } = await client.rpc('submit_vote', {
    p_code: code,
    p_scene: sceneId,
    p_choice: choiceId,
  });
  if (error) {
    throw new Error(formatRpcError(error, 'Could not submit vote.'));
  }
}

export async function resolveScene({
  code,
  fromScene,
  nextScene,
  grain,
  panic,
  trust,
  year,
  flags,
  entry,
  duration,
  ending,
  intro = 5,
}) {
  const client = requireClient();
  const { data, error } = await client.rpc('resolve_scene', {
    p_code: code,
    p_from: fromScene,
    p_next: nextScene,
    p_grain: grain,
    p_panic: panic,
    p_trust: trust,
    p_year: year,
    p_flags: flags,
    p_entry: entry,
    p_duration: duration,
    p_ending: ending,
    p_intro: intro,
  });

  // If another client already resolved the scene, the server ignores or rejects stale p_from.
  if (error) {
    return { ignored: true, error };
  }
  return { ignored: false, data };
}

export async function resetRoom(code) {
  const client = requireClient();
  const { error } = await client.rpc('reset_room', { p_code: code });
  if (error) {
    throw new Error(formatRpcError(error, 'Could not reset room.'));
  }
}

/**
 * Subscribes to realtime postgres_changes on rooms, players, and votes for a single room.
 */
export function subscribeToRoom(
  code,
  { onRoomChange, onPlayersChange, onVotesChange, onStatusChange }
) {
  const client = requireClient();
  const cleanCode = String(code || '').trim().toUpperCase();

  const channel = client
    .channel(`room-${cleanCode}-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `code=eq.${cleanCode}`,
      },
      (payload) => {
        onRoomChange?.(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `room_code=eq.${cleanCode}`,
      },
      (payload) => {
        onPlayersChange?.(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `room_code=eq.${cleanCode}`,
      },
      (payload) => {
        onVotesChange?.(payload);
      }
    )
    .subscribe((status) => {
      onStatusChange?.(status);
    });

  return channel;
}

export async function unsubscribeFromRoom(channel) {
  if (!supabase || !channel) return;
  try {
    await supabase.removeChannel(channel);
  } catch {
    // Ignore cleanup errors during unmount
  }
}

// --- Test Bot Helpers (client-isolated anonymous sessions for testing) ---

const activeBots = [];

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

export function getActiveBotIds(roomCode) {
  const cleanCode = String(roomCode || '').trim().toUpperCase();
  return activeBots
    .filter((b) => !cleanCode || b.roomCode === cleanCode)
    .map((b) => b.id);
}

/**
 * Spawns an isolated anonymous Supabase client for a test bot and joins the room.
 */
export async function addTestBot(roomCode, existingPlayersCount = 1) {
  requireClient();
  const cleanCode = String(roomCode || '').trim().toUpperCase();
  if (!cleanCode) {
    throw new Error('Room code is required to add a bot.');
  }
  if (existingPlayersCount >= 3) {
    throw new Error('Room is full (maximum 3 players).');
  }

  const botNumber = activeBots.filter((b) => b.roomCode === cleanCode).length + 1;
  const botName = `Bot ${botNumber}`;

  const botClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: `syd-bot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      storage: createMemoryStorage(),
    },
  });

  const { data: authData, error: authErr } = await botClient.auth.signInAnonymously();
  if (authErr || !authData?.user) {
    throw new Error(formatRpcError(authErr, 'Unable to sign in test bot.'));
  }

  const { error: joinErr } = await botClient.rpc('join_room', {
    p_code: cleanCode,
    p_name: botName,
  });

  if (joinErr) {
    throw new Error(formatRpcError(joinErr, 'Test bot could not join the room.'));
  }

  const botEntry = {
    id: authData.user.id,
    name: botName,
    roomCode: cleanCode,
    client: botClient,
  };
  activeBots.push(botEntry);

  return { id: botEntry.id, name: botEntry.name };
}

/**
 * Submits a vote for a specific active test bot by id.
 */
export async function submitBotVote(botId, roomCode, sceneId, choiceId) {
  const cleanCode = String(roomCode || '').trim().toUpperCase();
  const bot = activeBots.find((b) => b.id === botId && b.roomCode === cleanCode);
  if (!bot) return;

  await bot.client.rpc('submit_vote', {
    p_code: cleanCode,
    p_scene: sceneId,
    p_choice: choiceId,
  });
}

/**
 * Keeps active test bots marked as online via touch_player().
 */
export async function touchBots(roomCode) {
  const cleanCode = String(roomCode || '').trim().toUpperCase();
  const bots = activeBots.filter((b) => b.roomCode === cleanCode);
  await Promise.allSettled(bots.map((b) => b.client.rpc('touch_player')));
}

/**
 * Leaves the room for all in-memory test bots (and clears them).
 */
export async function removeTestBots(roomCode) {
  const cleanCode = roomCode ? String(roomCode).trim().toUpperCase() : null;
  const toRemove = activeBots.filter((b) => !cleanCode || b.roomCode === cleanCode);

  await Promise.allSettled(toRemove.map((b) => b.client.rpc('leave_room')));

  for (let i = activeBots.length - 1; i >= 0; i -= 1) {
    if (!cleanCode || activeBots[i].roomCode === cleanCode) {
      activeBots.splice(i, 1);
    }
  }
}

