import * as signalR from '@microsoft/signalr';
import { ensureAccessToken } from './auth/authService.js';
import { API_BASE } from '@/lib/config';

/** @type {import('@microsoft/signalr').HubConnection | null} */
let connection = null;

/** In-flight start so parallel connectMessagesHub calls share one attempt (no duplicate sockets). */
/** @type {Promise<import('@microsoft/signalr').HubConnection | null> | null} */
let startPromise = null;

/**
 * Latest hub callbacks — handlers always read from here so reconnect and early-return
 * connect() paths use the current provider callbacks without re-registering .on listeners.
 * @type {{
 *   onReceiveMessage?: (payload: unknown) => void;
 *   onUserOnline?: (userId: string) => void;
 *   onUserOffline?: (userId: string) => void;
 *   onOnlineUsers?: (userIds: string[]) => void;
 *   onUserTyping?: (conversationId: string, userId: string) => void;
 *   onUserStoppedTyping?: (conversationId: string, userId: string) => void;
 *   onReadReceipt?: (conversationId: string) => void;
 *   onMessageEdited?: (payload: unknown) => void;
 *   onMessageDeleted?: (payload: unknown) => void;
 *   onReconnecting?: (error?: Error) => void;
 *   onReconnected?: (connectionId?: string) => void;
 * } | null}
 */
let callbackRegistry = null;

/** Relative `/hubs/messages` when API_BASE is empty (dev); absolute when API_BASE is set (prod). */
function getHubUrl() {
  const base = (API_BASE || '').replace(/\/$/, '');
  return base ? `${base}/hubs/messages` : '/hubs/messages';
}

function createConnection() {
  const url = getHubUrl();
  const hub = new signalR.HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: async () => {
        const token = await ensureAccessToken();
        return token ?? '';
      },
    })
    .withAutomaticReconnect([0, 500, 1000, 2000, 5000, 10000, 30000])
    // Keep >= API SignalR:ClientTimeoutIntervalSeconds (default 120s in appsettings.json)
    .withServerTimeout(120000)
    .build();

  hub.on('ReceiveMessage', (payload) => {
    const cb = callbackRegistry?.onReceiveMessage;
    if (cb && payload) { cb(payload); }
  });
  hub.on('UserOnline', (userId) => {
    const cb = callbackRegistry?.onUserOnline;
    if (cb && userId) { cb(userId); }
  });
  hub.on('UserOffline', (userId) => {
    const cb = callbackRegistry?.onUserOffline;
    if (cb && userId) { cb(userId); }
  });
  hub.on('OnlineUsers', (userIds) => {
    const cb = callbackRegistry?.onOnlineUsers;
    if (cb && Array.isArray(userIds)) { cb(userIds); }
  });
  hub.on('UserTyping', (conversationId, userId) => {
    const cb = callbackRegistry?.onUserTyping;
    if (cb && conversationId && userId) { cb(conversationId, userId); }
  });
  hub.on('UserStoppedTyping', (conversationId, userId) => {
    const cb = callbackRegistry?.onUserStoppedTyping;
    if (cb && conversationId && userId) { cb(conversationId, userId); }
  });
  hub.on('ReadReceipt', (conversationId) => {
    const cb = callbackRegistry?.onReadReceipt;
    if (cb && conversationId) { cb(conversationId); }
  });
  hub.on('MessageEdited', (payload) => {
    const cb = callbackRegistry?.onMessageEdited;
    if (cb && payload) { cb(payload); }
  });
  hub.on('MessageDeleted', (payload) => {
    const cb = callbackRegistry?.onMessageDeleted;
    if (cb && payload) { cb(payload); }
  });
  hub.onreconnecting((error) => {
    callbackRegistry?.onReconnecting?.(error);
  });
  hub.onreconnected((connectionId) => {
    callbackRegistry?.onReconnected?.(connectionId);
  });

  return hub;
}

/**
 * Connects to the Messages SignalR hub. Singleton: at most one connection; concurrent calls
 * await the same start. Updates callback registry on every call so UI always receives events.
 * @returns {Promise<import('@microsoft/signalr').HubConnection | null>}
 */
export async function connectMessagesHub(callbacks) {
  callbackRegistry = callbacks;

  if (!(await ensureAccessToken())) {
    return null;
  }

  if (connection?.state === signalR.HubConnectionState.Connected) {
    return connection;
  }

  if (startPromise) {
    await startPromise;
    if (connection?.state === signalR.HubConnectionState.Connected) {
      return connection;
    }
    if (
      connection?.state === signalR.HubConnectionState.Reconnecting ||
      connection?.state === signalR.HubConnectionState.Connecting
    ) {
      return connection;
    }
  }

  if (!(await ensureAccessToken())) {
    return null;
  }

  if (connection) {
    const st = connection.state;
    if (
      st === signalR.HubConnectionState.Connecting ||
      st === signalR.HubConnectionState.Reconnecting
    ) {
      return connection;
    }
    try {
      await connection.stop();
    } catch (_e) {
      // ignore
    }
    connection = null;
  }

  const hub = createConnection();
  connection = hub;

  startPromise = hub
    .start()
    .then(() => hub)
    .catch((err) => {
      console.warn('Messages hub connection failed:', err);
      if (connection === hub) {
        connection = null;
      }
      return null;
    })
    .finally(() => {
      startPromise = null;
    });

  return startPromise;
}

/**
 * Fetches the current list of online user IDs. Call after reconnect to refresh presence.
 * @returns {Promise<string[]>}
 */
export async function getOnlineUsers() {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) { return []; }
  try {
    const ids = await connection.invoke('GetOnlineUsers');
    return Array.isArray(ids) ? ids : [];
  } catch (_e) {
    return [];
  }
}

/**
 * Joins a conversation group (for receiving typing events). Call when opening a conversation.
 * @param {string} conversationId - GUID string
 */
export async function joinConversation(conversationId) {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {return;}
  try {
    await connection.invoke('JoinConversation', conversationId);
  } catch (_e) { /* ignore */ }
}

/**
 * Leaves a conversation group. Call when closing a conversation.
 * @param {string} conversationId - GUID string
 */
export async function leaveConversation(conversationId) {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {return;}
  try {
    await connection.invoke('LeaveConversation', conversationId);
  } catch (_e) { /* ignore */ }
}

/**
 * Notifies others that the user is typing. Debounce on the caller side.
 * @param {string} conversationId - GUID string
 */
export async function notifyTyping(conversationId) {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {return;}
  try {
    await connection.invoke('UserTyping', conversationId);
  } catch (_e) { /* ignore */ }
}

/**
 * Updates the user's last-seen timestamp. Call periodically (e.g. every 2 min) while connected.
 */
export async function updateLastSeen() {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) { return; }
  try {
    await connection.invoke('UpdateLastSeen');
  } catch (_e) { /* ignore */ }
}

/**
 * Notifies others that the user stopped typing.
 * @param {string} conversationId - GUID string
 */
export async function notifyStoppedTyping(conversationId) {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {return;}
  try {
    await connection.invoke('UserStoppedTyping', conversationId);
  } catch (_e) { /* ignore */ }
}

/**
 * Disconnects from the Messages hub. Call on logout.
 */
export async function disconnectMessagesHub() {
  if (startPromise) {
    try {
      await startPromise;
    } catch (_e) {
      // ignore
    }
    startPromise = null;
  }
  if (connection) {
    try {
      await connection.stop();
    } catch (_e) {
      // ignore
    }
    connection = null;
  }
  callbackRegistry = null;
}

/**
 * Returns the current connection if any.
 * @returns {import('@microsoft/signalr').HubConnection | null}
 */
export function getMessagesHubConnection() {
  return connection;
}
