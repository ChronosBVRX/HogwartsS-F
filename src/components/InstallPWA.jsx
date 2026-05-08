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
      // Prevent Chrome from showing its own boring banner
      e.preventDefault();
      // Save the event for later
      setDeferredPrompt(e);
      // Now it's safe to show our premium button
      if (!isStandalone) setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);

    // 2. iOS Logic (Since Apple doesn't fire the event)
    if (isIosDevice && !isStandalone) {
      const timer = setTimeout(() => setIsVisible(true), 4000);
      return () => clearTimeout(timer);
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
