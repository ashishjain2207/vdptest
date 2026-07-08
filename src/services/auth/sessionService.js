import { config } from '../config.js';
import { getSession, setSession, clearAuth } from './storage.js';

const IDLE_MS = config.session.idleTimeoutMs; // 15 minutes
const ABSOLUTE_MS = config.session.absoluteTimeoutMs; // 1 hour
let idleTimerId = null;
let absoluteTimerId = null;
let onIdleLogout = null;

/**
 * Register callback when session expires (e.g. redirect to login).
 * @param {() => void} callback
 */
export function setOnIdleLogout(callback) {
  onIdleLogout = callback;
}

function clearIdleTimer() {
  if (idleTimerId) {
    clearTimeout(idleTimerId);
    idleTimerId = null;
  }
}

function clearAbsoluteTimer() {
  if (absoluteTimerId) {
    clearTimeout(absoluteTimerId);
    absoluteTimerId = null;
  }
}

function clearAllTimers() {
  clearIdleTimer();
  clearAbsoluteTimer();
}

function scheduleIdleCheck() {
  clearIdleTimer();
  idleTimerId = setTimeout(() => {
    clearAuth();
    clearAllTimers();
    onIdleLogout?.();
  }, IDLE_MS);
}

function scheduleAbsoluteCheck(loginTimestamp) {
  clearAbsoluteTimer();
  const elapsed = Date.now() - loginTimestamp;
  const remaining = Math.max(0, ABSOLUTE_MS - elapsed);
  absoluteTimerId = setTimeout(() => {
    clearAuth();
    clearAllTimers();
    onIdleLogout?.();
  }, remaining);
}

function checkAbsoluteTimeout(session) {
  if (!session || !session.loginTimestamp) {
    return false;
  }
  const elapsed = Date.now() - session.loginTimestamp;
  return elapsed >= ABSOLUTE_MS;
}

/**
 * Update last activity and (re)start idle timer.
 * Does NOT reset absolute timeout - that's fixed from login time.
 * Call on user activity (e.g. focus, click, keydown) when authenticated.
 */
export function touchSession() {
  const session = getSession();
  if (session) {
    // Check absolute timeout first
    if (checkAbsoluteTimeout(session)) {
      clearAuth();
      clearAllTimers();
      onIdleLogout?.();
      return;
    }
    // Update last activity and reset idle timer
    setSession({ ...session, lastActivity: Date.now() });
    scheduleIdleCheck();
  }
}

/**
 * Start session idle monitoring. Call after successful login.
 * Records login timestamp for absolute timeout tracking.
 */
export function startSessionIdleCheck() {
  const loginTimestamp = Date.now();
  setSession({ lastActivity: loginTimestamp, loginTimestamp });
  scheduleIdleCheck();
  scheduleAbsoluteCheck(loginTimestamp);
}

/**
 * Stop session idle monitoring. Call on logout.
 */
export function stopSessionIdleCheck() {
  clearAllTimers();
}

/**
 * Check if session exists and is still valid (not expired).
 * @returns {boolean} True if session exists and is valid.
 */
export function hasSession() {
  const session = getSession();
  if (!session) {
    return false;
  }
  // Check absolute timeout
  if (checkAbsoluteTimeout(session)) {
    clearAuth();
    clearAllTimers();
    onIdleLogout?.();
    return false;
  }
  // Check idle timeout
  if (session.lastActivity) {
    const elapsed = Date.now() - session.lastActivity;
    if (elapsed >= IDLE_MS) {
      clearAuth();
      clearAllTimers();
      onIdleLogout?.();
      return false;
    }
  }
  return true;
}
