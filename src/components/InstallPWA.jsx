import React, { useState, useEffect } from 'react';
import { X, Share } from 'lucide-react';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone;

    if (isStandalone) return;

    const handlePrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
      setIsVisible(true);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      setIsVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    // En iOS no existe beforeinstallprompt, mostramos instrucciones manuales tras 1.5s
    if (isIosDevice) {
      const timer = setTimeout(() => setIsVisible(true), 1500);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handlePrompt);
        window.removeEventListener('appinstalled', handleInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) return;

    if (!deferredPrompt) {
      alert("La instalación aún no está disponible. Navega unos segundos por la app y vuelve a intentarlo, o usa el menú ⋮ de Chrome y toca 'Instalar aplicación'.");
      return;
    }

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Resultado de instalación: ${outcome}`);

    setDeferredPrompt(null);
    setCanInstall(false);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-magical-navy border border-magical-gold/20 p-3 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-[9999] flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1">
        {!isIOS ? (
          <p className="text-sm font-medium text-white leading-tight flex items-center gap-2">
            <span className="text-lg">📱</span>
            Instala la app para entrar más rápido.
          </p>
        ) : (
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-white leading-tight">
              📱 Instala la app para un acceso más rápido.
            </p>
            <p className="text-[10px] text-white/50 uppercase tracking-widest flex items-center gap-1">
              Toca <Share className="w-3 h-3" /> y "Añadir a inicio"
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {!isIOS && (
          <button
            onClick={handleInstallClick}
            className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-bold shadow-md hover:bg-green-500 transition-colors"
          >
            Instalar
          </button>
        )}

        <button
          onClick={() => setIsVisible(false)}
          className="text-white/40 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default InstallPWA;
