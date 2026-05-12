import React, { useState, useEffect } from 'react';
import audioManager from '../lib/audioManager';

const AudioToggle = () => {
  const [isEnabled, setIsEnabled] = useState(audioManager.isAudioEnabled());

  useEffect(() => {
    setIsEnabled(audioManager.isAudioEnabled());
  }, []);

  const toggleAudio = () => {
    const newValue = !isEnabled;
    audioManager.setAudioEnabled(newValue);
    setIsEnabled(newValue);
    
    // Unlock context on user interaction
    audioManager.unlockAudio().catch(() => {});
    
    if (newValue) {
      audioManager.playSfx('ui_button_magic');
    }
  };

  return (
    <button
      id="audio-toggle-btn"
      onClick={toggleAudio}
      className={`
        fixed bottom-6 right-6 z-[100]
        flex items-center justify-center
        w-12 h-12 rounded-full
        backdrop-blur-xl bg-white/10 border border-white/20
        shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-500
        hover:scale-110 hover:bg-white/20 active:scale-95
        text-white group
      `}
      aria-label={isEnabled ? 'Silenciar audio' : 'Activar audio'}
    >
      <div className="relative">
        {isEnabled ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          </svg>
        )}
      </div>
      
      {/* Glow effect */}
      {isEnabled && (
        <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse -z-10" />
      )}
    </button>
  );
};

export default AudioToggle;
