import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if is iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (isStandalone) return;

    // Logic for Android / Chrome
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, we show it after a small delay if not standalone
    if (isIosDevice && !isStandalone) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-700">
      <div className="glass-card p-5 border-magical-gold/30 bg-magical-navy/90 backdrop-blur-xl shadow-[0_0_50px_rgba(212,175,55,0.2)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-magical-gold flex items-center justify-center shadow-lg shadow-magical-gold/20">
            <Download className="text-magical-navy w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Hogwarts en tu Celular</h4>
            <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest leading-none">
              {isIOS ? 'Toca compartir y "Añadir a inicio"' : 'Instala nuestra App Mágica'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isIOS ? (
            <button 
              onClick={handleInstallClick}
              className="bg-magical-gold text-magical-navy px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
            >
              Instalar
            </button>
          ) : (
             <div className="p-2 bg-white/10 rounded-xl text-magical-gold">
                <Share className="w-4 h-4" />
             </div>
          )}
          <button 
            onClick={() => setIsVisible(false)}
            className="p-2 text-white/20 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
