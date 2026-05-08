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
    
    // Show only on mobile and if NOT installed
    if (isMobile && !isStandalone) {
      // Delay to ensure smooth loading
      const timer = setTimeout(() => setIsVisible(true), 2000);
      
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handler);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) return; // iOS users see the instructions
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsVisible(false);
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="w-full bg-gradient-to-r from-magical-gold via-magical-gold/90 to-magical-gold py-2.5 px-4 relative z-[100] shadow-lg animate-in slide-in-from-top duration-500">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-magical-navy animate-pulse" />
          <p className="text-[10px] md:text-xs font-black text-magical-navy uppercase tracking-widest">
            {isIOS ? 'Toca "Compartir" y "Añadir a inicio" para instalar' : 'Lleva la magia en tu bolsillo instalando la App'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {!isIOS && (
            <button 
              onClick={handleInstallClick}
              className="bg-magical-navy text-magical-gold px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-md"
            >
              Instalar
            </button>
          )}
          <button 
            onClick={() => setIsVisible(false)}
            className="text-magical-navy/40 hover:text-magical-navy transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
