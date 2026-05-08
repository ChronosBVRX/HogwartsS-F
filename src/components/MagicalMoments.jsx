import React, { useState, useEffect } from 'react';
import { Sparkles, Camera } from 'lucide-react';

const MagicalMoments = () => {
  const [photos, setPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await fetch('https://nyfokfwghqvitfmbhkgc.supabase.co/functions/v1/drive-photos');
        if (!response.ok) throw new Error('Error al invocar la magia fotográfica');
        
        const data = await response.json();
        if (data.ok && data.photos && data.photos.length > 0) {
          // Tomar un subconjunto aleatorio para mayor dinamismo o usarlas todas
          const shuffled = data.photos.sort(() => 0.5 - Math.random()).slice(0, 15); 
          setPhotos(shuffled);
        } else {
          throw new Error('No se encontraron recuerdos');
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  useEffect(() => {
    if (photos.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 4500); // Cambia cada 4.5s
    
    return () => clearInterval(interval);
  }, [photos.length]);

  if (loading) {
    return (
      <div className="w-full max-w-lg mx-auto aspect-[4/3] rounded-3xl overflow-hidden glass-card border border-magical-gold/10 relative animate-pulse flex items-center justify-center">
         <Sparkles className="w-8 h-8 text-magical-gold/50 animate-spin-slow" />
      </div>
    );
  }

  if (error || photos.length === 0) return null; // Fallo silencioso orgánico

  return (
    <div className="w-full max-w-lg mx-auto my-8 relative group">
      {/* Título integrado */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 bg-magical-navy border border-magical-gold/30 px-6 py-1.5 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.2)] flex items-center gap-2">
        <Camera className="w-4 h-4 text-magical-gold" />
        <span className="text-xs font-black text-magical-gold uppercase tracking-widest whitespace-nowrap">
          Momentos Mágicos
        </span>
      </div>

      {/* Contenedor del Slideshow */}
      <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-magical-gold/20">
        
        {/* Capa de Gradiente para Fundido Oscuro (Premium Look) */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-magical-navy via-transparent to-transparent opacity-80 pointer-events-none" />
        
        {/* Imágenes */}
        {photos.map((photo, index) => (
          <img
            key={photo.id}
            src={photo.thumbnail || photo.url}
            alt={`Recuerdo Mágico ${index + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            loading={index === 0 ? "eager" : "lazy"}
          />
        ))}

        {/* Decoraciones Estéticas */}
        <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <Sparkles className="w-5 h-5 text-white/50" />
        </div>
        
        {/* Indicadores de progreso (Puntos) */}
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-1.5 px-4">
          {photos.slice(0, 10).map((_, idx) => {
            // Mostrar máximo 10 puntitos para no saturar si hay muchas fotos
            const isActive = idx === (currentIndex % 10);
            return (
              <div 
                key={idx} 
                className={`h-1 rounded-full transition-all duration-500 ${
                  isActive ? 'w-4 bg-magical-gold' : 'w-1.5 bg-white/30'
                }`}
              />
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default MagicalMoments;
