import React, { useEffect, useState } from 'react';
import { Download, X, Share, Smartphone } from 'lucide-react';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const iosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    setIsIOS(iosDevice);
    setIsStandalone(standaloneMode);

    if (standaloneMode) {
      setIsVisible(false);
      return;
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      console.log('[PWA] beforeinstallprompt capturado');

      setDeferredPrompt(event);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      console.log('[PWA] appinstalled');

      setDeferredPrompt(null);
      setIsVisible(false);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    let fallbackTimer;

    if (iosDevice) {
      fallbackTimer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
    } else {
      fallbackTimer = setTimeout(() => {
        setIsVisible(true);
      }, 8000);
    }

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    console.log('[PWA] deferredPrompt disponible:', Boolean(deferredPrompt));
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();

      const choiceResult = await deferredPrompt.userChoice;
      console.log('[PWA] Resultado de instalación:', choiceResult.outcome);

      setDeferredPrompt(null);

      if (choiceResult.outcome === 'accepted') {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('[PWA] Error al abrir prompt de instalación:', error);
    }
  };

  if (!isVisible || isStandalone) return null;

  const canInstall = Boolean(deferredPrompt);

  return (
    <div className="fixed bottom-5 left-1/2 z-[9999] w-[92%] max-w-sm -translate-x-1/2 rounded-2xl border border-magical-gold/25 bg-magical-navy/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-magical-gold/15 text-magical-gold">
          <Smartphone className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">
            Hogwarts Snacks & Foods
          </p>

          {!isIOS ? (
            <>
              <p className="mt-0.5 text-xs leading-snug text-white/70">
                {canInstall
                  ? 'Instala la app en tu celular para entrar más rápido al menú, promociones y tu perfil mágico.'
                  : 'La instalación estará disponible después de navegar unos segundos por la app.'}
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={!canInstall}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    canInstall
                      ? 'bg-green-600 text-white shadow-md hover:bg-green-500 active:scale-[0.98]'
                      : 'cursor-not-allowed bg-white/10 text-white/40'
                  }`}
                >
                  <Download className="h-4 w-4" />
                  Instalar app
                </button>

                {!canInstall && (
                  <span className="text-[10px] uppercase tracking-wide text-white/35">
                    Esperando Chrome
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="mt-0.5 text-xs leading-snug text-white/70">
                En iPhone, toca compartir y luego “Añadir a pantalla de inicio”.
              </p>

              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/80">
                <Share className="h-4 w-4" />
                Compartir → Añadir a inicio
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="shrink-0 rounded-lg p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default InstallPWA;
