import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { fetchPublicMaintenanceStatus } from '@/services/maintenanceStatusService';
import { setPublicMaintenanceMode } from '@/services/api/maintenanceApiGate';
import { MAINTENANCE_GRACE_PERIOD_MS } from '@/lib/maintenanceLoginPolicy';

const MaintenanceModeContext = createContext({
  /** @type {boolean | null} null = not loaded yet */
  maintenanceMode: null,
  /** True briefly after maintenance turns on so active users see a warning banner. */
  gracePeriodActive: false,
  refresh: async () => {},
});

export function MaintenanceModeProvider({ children }) {
  const [maintenanceMode, setMaintenanceMode] = useState(null);
  const [gracePeriodActive, setGracePeriodActive] = useState(false);
  const prevMaintenanceModeRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const on = await fetchPublicMaintenanceStatus();
      setMaintenanceMode(on);
      return on;
    } catch {
      setMaintenanceMode((current) => current ?? true);
      return true;
    }
  }, []);

  useEffect(() => {
    void refresh();
    const intervalMs = 90_000;
    const id = setInterval(() => void refresh(), intervalMs);
    const onVis = () => {
      if (document.visibilityState === 'visible') {void refresh();}
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [refresh]);

  useEffect(() => {
    setPublicMaintenanceMode(maintenanceMode);
  }, [maintenanceMode]);

  useEffect(() => {
    const prev = prevMaintenanceModeRef.current;
    prevMaintenanceModeRef.current = maintenanceMode;
    if (prev !== false || maintenanceMode !== true) {
      return undefined;
    }
    setGracePeriodActive(true);
    const id = window.setTimeout(() => setGracePeriodActive(false), MAINTENANCE_GRACE_PERIOD_MS);
    return () => window.clearTimeout(id);
  }, [maintenanceMode]);

  const value = useMemo(
    () => ({ maintenanceMode, gracePeriodActive, refresh }),
    [maintenanceMode, gracePeriodActive, refresh],
  );

  return (
    <MaintenanceModeContext.Provider value={value}>{children}</MaintenanceModeContext.Provider>
  );
}

export function useMaintenanceMode() {
  return useContext(MaintenanceModeContext);
}
