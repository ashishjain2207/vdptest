import { REALTIME, dispatchRealtime } from '@/lib/realtimeEvents';

export const CONNECTION_EVENTS = REALTIME.connections;

/**
 * @param {{
 *   peerUserId?: string,
 *   actorUserId?: string,
 *   isConnected?: boolean,
 *   hasPendingConnectionRequest?: boolean,
 *   hasConnectionRequestFromThem?: boolean,
 *   pendingConnectionRequestId?: string | null,
 *   notificationType?: 'connectionRequest' | 'connectionAccepted',
 * }} detail
 */
export function dispatchConnectionRelationshipChanged(detail) {
  dispatchRealtime(CONNECTION_EVENTS.RELATIONSHIP_CHANGED, detail);
}

/** @param {unknown} id */
export function normalizeConnectionUserId(id) {
  if (id === null || id === undefined) {
    return '';
  }
  const s = String(id).trim().toLowerCase();
  if (!s) {
    return '';
  }
  const hexOnly = s.replace(/-/g, '');
  if (/^[0-9a-f]{32}$/i.test(hexOnly)) {
    return hexOnly;
  }
  return s;
}
