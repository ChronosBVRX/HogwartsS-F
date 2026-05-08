import React, { useState, useEffect } from 'react';
import { Download, X, Share, Sparkles } from 'lucide-react';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Basic mobile detection
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    // 1. Listen for the magical prompt (Android/Chrome)
    const handlePrompt = (e) => {
      console.log('🪄 Hogwarts App is ready to be summoned (Prompt captured)');
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);

    // 2. Definitive Solution: ALWAYS show the banner on mobile if not installed
    if (isMobile && !isStandalone) {
      const timer = setTimeout(() => setIsVisible(true), 2500); // 2.5s delay
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handlePrompt);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleInstallClick = async () => {
    // For iOS, the UI already shows the "Share" instruction
    if (isIOS) return; 

    if (deferredPrompt) {
      // 3. Execute the installation ritual
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`✨ Ritual Outcome: ${outcome}`);
      
      // Clean up and hide
      setDeferredPrompt(null);
      setIsVisible(false);
    } else {
      // Fallback si el navegador no disparó el evento (Pasa mucho en Android)
      alert("Para instalar: Toca el menú de tu navegador (los tres puntos ⋮ arriba a la derecha) y selecciona 'Instalar aplicación' o 'Añadir a la pantalla de inicio'.");
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-magical-navy border border-magical-gold/20 p-3 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-[9999] flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex items-center gap-3 flex-1">
        {!isIOS ? (
           <p className="text-sm font-medium text-white leading-tight flex items-center gap-2">
             <span className="text-lg">📱</span> Instala la app para un acceso más rápido.
           </p>
        ) : (
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-white leading-tight">
               📱 Instala la app para un acceso más rápido.
            </p>
            <p className="text-[10px] text-white/50 uppercase tracking-widest flex items-center gap-1">
              Toca <Share className="w-3 h-3"/> y "Añadir a inicio"
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
