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
      // FORCE visibility after a short delay
      const timer = setTimeout(() => setIsVisible(true), 3000);
      
      const handler = (e) => {
        console.log('✅ PWA Install Prompt captured');
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
    if (isIOS) return; // iOS has its own visual hint in the UI
    
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setIsVisible(false);
      setDeferredPrompt(null);
    } else {
      // Fallback if prompt is not yet ready
      alert('Para instalar: Toca los tres puntos (⋮) de tu navegador y selecciona "Instalar aplicación" o "Añadir a la pantalla de inicio".');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-full bg-magical-gold py-3 px-4 relative z-[100] shadow-[0_4px_20px_rgba(212,175,55,0.4)] animate-in slide-in-from-top duration-500">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-magical-navy rounded-lg shadow-inner">
             <Sparkles className="w-4 h-4 text-magical-gold animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] md:text-xs font-black text-magical-navy uppercase tracking-widest leading-none">
              {isIOS ? 'Instalar Hogwarts App' : 'App Mágica Disponible'}
            </p>
            <p className="text-[9px] text-magical-navy/70 font-bold uppercase tracking-tight leading-none">
              {isIOS ? 'Toca [↑] y luego "Añadir a inicio"' : 'Lleva el menú siempre contigo'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isIOS ? (
            <button 
              onClick={handleInstallClick}
              className="bg-magical-navy text-magical-gold px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar
            </button>
          ) : (
             <div className="flex items-center gap-2 px-3 py-2 bg-magical-navy/10 rounded-xl border border-magical-navy/10">
                <Share className="w-4 h-4 text-magical-navy" />
                <span className="text-[10px] font-black text-magical-navy">IOS</span>
             </div>
          )}
          <button 
            onClick={() => setIsVisible(false)}
            className="p-1.5 text-magical-navy/30 hover:text-magical-navy transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
