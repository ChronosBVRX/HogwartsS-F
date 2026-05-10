let deferredPrompt = null;
const subscribers = new Set();

const isIOSDevice = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !window.MSStream;
};

const isStandaloneMode = () => {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
};

const getState = () => ({
  canInstall: Boolean(deferredPrompt),
  isIOS: isIOSDevice(),
  isStandalone: isStandaloneMode(),
});

const notify = () => {
  const state = getState();

  console.log('[PWA] Estado:', state);

  subscribers.forEach((callback) => {
    try {
      callback(state);
    } catch (error) {
      console.error('[PWA] Error notificando suscriptor:', error);
    }
  });
};

if (typeof window !== 'undefined') {
  console.log('[PWA] Install manager cargado');

  window.addEventListener('beforeinstallprompt', (event) => {
    console.log('[PWA] beforeinstallprompt capturado temprano');

    event.preventDefault();
    deferredPrompt = event;

    notify();
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] appinstalled');

    deferredPrompt = null;
    notify();
  });
}

export const subscribeToInstallState = (callback) => {
  subscribers.add(callback);
  callback(getState());

  return () => {
    subscribers.delete(callback);
  };
};

export const promptInstall = async () => {
  if (!deferredPrompt) {
    console.warn('[PWA] No hay deferredPrompt disponible');
    return {
      available: false,
      outcome: null,
    };
  }

  const promptEvent = deferredPrompt;
  deferredPrompt = null;
  notify();

  try {
    await promptEvent.prompt();

    const choiceResult = await promptEvent.userChoice;

    console.log('[PWA] Resultado de instalación:', choiceResult.outcome);

    return {
      available: true,
      outcome: choiceResult.outcome,
    };
  } catch (error) {
    console.error('[PWA] Error abriendo prompt:', error);

    return {
      available: false,
      outcome: 'error',
      error,
    };
  } finally {
    notify();
  }
};
