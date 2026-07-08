const APP_INSIGHTS_SCRIPT_ID = 'app-insights-web-sdk';
const APP_INSIGHTS_SCRIPT_URL = 'https://js.monitor.azure.com/scripts/b/ai.3.min.js';

let appInsightsInstance = null;
let initializationPromise = null;
let globalHandlersAttached = false;

function getCloudRole() {
  return String(import.meta.env.VITE_APPINSIGHTS_CLOUD_ROLE || '').trim();
}

function setCloudRoleOnEnvelope(envelope, cloudRole) {
  if (!cloudRole) {
    return;
  }

  if (Array.isArray(envelope.tags)) {
    envelope.tags.push({ 'ai.cloud.role': cloudRole });
    return;
  }

  envelope.tags = envelope.tags ?? {};
  envelope.tags['ai.cloud.role'] = cloudRole;
}

function getConnectionString() {
  return String(import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING || '').trim();
}

export function isAppInsightsEnabled() {
  return Boolean(getConnectionString());
}

function canUseBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function getAppInsightsConstructor() {
  return window.Microsoft?.ApplicationInsights?.ApplicationInsights ?? null;
}

function toError(value, fallbackMessage) {
  if (value instanceof Error) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    return new Error(value);
  }

  return new Error(fallbackMessage);
}

function loadSdkScript() {
  return new Promise((resolve, reject) => {
    if (!canUseBrowser()) {
      resolve(null);
      return;
    }

    const existingScript = document.getElementById(APP_INSIGHTS_SCRIPT_ID);
    if (existingScript) {
      const ctor = getAppInsightsConstructor();
      if (ctor) {
        resolve(ctor);
        return;
      }

      existingScript.addEventListener('load', () => resolve(getAppInsightsConstructor()), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load the Application Insights SDK.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = APP_INSIGHTS_SCRIPT_ID;
    script.src = APP_INSIGHTS_SCRIPT_URL;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.addEventListener('load', () => resolve(getAppInsightsConstructor()), { once: true });
    script.addEventListener('error', () => reject(new Error('Failed to load the Application Insights SDK.')), { once: true });
    document.head.appendChild(script);
  });
}

function attachGlobalHandlers(appInsights) {
  if (globalHandlersAttached || !canUseBrowser()) {
    return;
  }

  window.addEventListener('error', (event) => {
    const exception = toError(event.error ?? event.message, 'Unhandled browser error');
    appInsights.trackException({
      exception,
      properties: {
        filename: event.filename || '',
        lineno: String(event.lineno || ''),
        colno: String(event.colno || ''),
      },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const exception = toError(event.reason, 'Unhandled promise rejection');
    appInsights.trackException({
      exception,
      properties: {
        source: 'unhandledrejection',
      },
    });
  });

  globalHandlersAttached = true;
}

export async function initializeAppInsights() {
  if (!isAppInsightsEnabled() || !canUseBrowser()) {
    return null;
  }

  if (appInsightsInstance) {
    return appInsightsInstance;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = loadSdkScript()
    .then((ApplicationInsightsCtor) => {
      if (!ApplicationInsightsCtor) {
        return null;
      }

      const cloudRole = getCloudRole();
      const instance = new ApplicationInsightsCtor({
        config: {
          connectionString: getConnectionString(),
          enableAutoRouteTracking: false,
          enableCorsCorrelation: true,
          disableFetchTracking: false,
          disableAjaxTracking: false,
        },
      });

      instance.loadAppInsights();
      if (cloudRole) {
        instance.addTelemetryInitializer((envelope) => {
          setCloudRoleOnEnvelope(envelope, cloudRole);
        });
      }
      attachGlobalHandlers(instance);
      appInsightsInstance = instance;
      return appInsightsInstance;
    })
    .catch((error) => {
      console.warn('Application Insights initialization failed.', error);
      return null;
    });

  return initializationPromise;
}

export async function trackPageView({ name, uri } = {}) {
  const appInsights = await initializeAppInsights();
  if (!appInsights) {
    return;
  }

  appInsights.trackPageView({
    name,
    uri,
  });
}
