import React, { useEffect, useState } from 'react';
import { Download, X, Share, Smartphone, Loader2 } from 'lucide-react';
import { promptInstall, subscribeToInstallState } from '../lib/pwaInstallManager';

const InstallPWA = () => {
  const [state, setState] = useState({
    canInstall: false,
    isIOS: false,
    isStandalone: false,
  });

  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToInstallState((nextState) => {
      setState(nextState);

      if (nextState.isStandalone) {
        setIsVisible(false);
        return;
      }

      if (nextState.canInstall) {
        setIsVisible(true);
      }
    });

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const handleInstall = async () => {
    if (!state.canInstall || isInstalling) return;

    setIsInstalling(true);

    const result = await promptInstall();

    setIsInstalling(false);

    if (result.outcome === 'accepted') {
      setIsVisible(false);
    }
  };

  if (!isVisible || state.isStandalone) return null;

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

          {state.isIOS ? (
            <>
              <p className="mt-0.5 text-xs leading-snug text-white/70">
                En iPhone, toca compartir y luego “Añadir a pantalla de inicio”.
              </p>

              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/80">
                <Share className="h-4 w-4" />
                Compartir → Añadir a inicio
              </div>
            </>
          ) : (
            <>
              <p className="mt-0.5 text-xs leading-snug text-white/70">
                {state.canInstall
                  ? 'Instala la app en tu celular para entrar más rápido al menú, promociones y tu perfil mágico.'
                  : 'Chrome todavía no ha liberado la instalación. Si no cambia, usa el menú ⋮ y toca “Instalar aplicación”.'}
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInstall}
                  disabled={!state.canInstall || isInstalling}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    state.canInstall
                      ? 'bg-green-600 text-white shadow-md hover:bg-green-500 active:scale-[0.98]'
                      : 'cursor-not-allowed bg-white/10 text-white/40'
                  }`}
                >
                  {isInstalling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {state.canInstall ? 'Instalar app' : 'Esperando Chrome'}
                </button>
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
