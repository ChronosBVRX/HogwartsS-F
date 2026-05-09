import React from 'react'
import { Link } from 'react-router-dom'
import { Wand2, Users, MapPin, CalendarClock, Cake, MessageCircle, GlassWater, Snowflake, Camera, PartyPopper } from 'lucide-react'
import MagicalMoments from '../components/MagicalMoments'

// Stable absolute paths from /public
const logo = '/logo.png'
const heroImg = '/hero.png'

export default function Home() {
  const whatsappNumber = "+527531394284";
  const whatsappMessage = "Hola! Me gustaría cotizar un evento/reservación en Hogwarts Snacks & Foods.";
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="flex-1 flex flex-col items-center w-full">
      {/* Hero Section */}
      <header className="w-full min-h-[80vh] md:min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImg} 
            className="w-full h-full object-cover scale-105"
            alt="Restaurante Temático" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-magical-navy/60 via-magical-navy/80 to-magical-navy" />
        </div>
        
        <div className="max-w-4xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative z-10 -mt-16 md:-mt-0">
          <img 
            src={logo} 
            alt="Hogwarts Logo" 
            className="w-32 md:w-56 mx-auto mb-2 md:mb-4 drop-shadow-[0_0_40px_rgba(212,175,55,0.5)] animate-bounce-slow" 
          />
          
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase italic text-white drop-shadow-lg leading-tight">
            Celebra tu evento en un <br/>
            <span className="bg-gradient-to-r from-magical-gold via-yellow-200 to-magical-gold bg-clip-text text-transparent">mundo mágico</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-white/90 max-w-3xl mx-auto font-medium leading-relaxed px-4">
            Celebra tu cumpleaños, reunión familiar o evento especial en un lugar donde la magia se vive en cada rincón.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-gold text-base md:text-lg px-8 py-4 flex items-center gap-3 w-full sm:w-auto justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)]">
              <MessageCircle className="w-6 h-6" />
              Reserva por WhatsApp
            </a>
            <a href="#espacios" className="px-8 py-4 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition-all font-bold backdrop-blur-md flex items-center gap-3 w-full sm:w-auto justify-center text-white">
              <Wand2 className="w-5 h-5" />
              Conoce nuestros espacios
            </a>
          </div>

          {/* Quick Info */}
          <div className="flex flex-wrap justify-center gap-6 pt-8 text-sm text-white/70">
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-magical-gold"/> Av. Tarascos #272, Lázaro Cárdenas</div>
            <div className="flex items-center gap-2"><CalendarClock className="w-4 h-4 text-magical-gold"/> Jue - Dom | 3:00 PM - 11:30 PM</div>
          </div>
        </div>
      </header>

      {/* Bloque destacado: Eventos y reservaciones */}
      <section className="w-full max-w-7xl px-6 py-24 relative">
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-magical-gold/10 rounded-full border border-magical-gold/20">
            <PartyPopper className="w-4 h-4 text-magical-gold" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-magical-gold">Grupos y Eventos</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">
            Haz de tu celebración una <span className="text-magical-gold">experiencia mágica</span>
          </h2>
          <p className="text-white/70 max-w-3xl mx-auto text-lg leading-relaxed">
            Aquí no solo reservas una mesa: entras a un universo mágico de tres pisos, con ambientes únicos, aire acondicionado, promociones especiales y rincones perfectos para fotos y momentos inolvidables.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
          <FeatureCard icon={<Cake />} title="Cumpleaños" desc="Infantiles y familiares" />
          <FeatureCard icon={<Users />} title="Reuniones" desc="Con amigos o laborales" />
          <FeatureCard icon={<Snowflake />} title="Climatizado" desc="Aire Acondicionado" />
          <FeatureCard icon={<GlassWater />} title="Convivios" desc="Bebidas y platillos" />
          <FeatureCard icon={<Camera />} title="Fotos" desc="Sets temáticos" />
          <FeatureCard icon={<Wand2 />} title="Tres Pisos" desc="Ambientes de fantasía" />
        </div>

        <div className="mt-16 text-center">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-gold inline-flex items-center justify-center gap-2 px-8 py-4 text-lg w-full sm:w-auto">
            <Wand2 className="w-5 h-5" /> Cotiza tu cumpleaños o reunión
          </a>
        </div>
      </section>

      {/* Galería Premium de Momentos Mágicos */}
      <section className="w-full max-w-7xl px-6 py-12 relative">
        <div className="absolute inset-0 bg-magical-gold/5 blur-[100px] pointer-events-none" />
        <div className="flex flex-col items-center text-center space-y-4 mb-12 relative z-10">
          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">
            Momentos <span className="text-magical-gold">Inolvidables</span>
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Revive las celebraciones que nuestros invitados han compartido en nuestros ambientes de fantasía.
          </p>
        </div>
        <MagicalMoments />
      </section>

      {/* Recorrido por pisos */}
      <section id="espacios" className="w-full px-6 py-24 bg-black/40 relative border-y border-white/5">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter">
              Tres pisos llenos de <span className="text-magical-gold">magia</span>
            </h2>
            <p className="text-white/60 text-lg">Ambientes diseñados para que cada visita se sienta como una aventura.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FloorCard 
              title="Primer Piso"
              subtitle="El Gran Salón"
              desc="Vive la grandeza desde el momento en que entras. Este piso es ideal para reuniones más privadas, convivencia familiar y celebraciones con un toque clásico."
              ac={true}
            />
            <FloorCard 
              title="Segundo Piso"
              subtitle="Callejón Mágico"
              desc="Un espacio familiar lleno de fantasía, ideal para que los peques se diviertan mientras los adultos disfrutan la experiencia."
              ac={true}
            />
            <FloorCard 
              title="Tercer Piso"
              subtitle="Mundo Encantado"
              desc="Un universo rodeado de princesas, héroes y personajes. Ideal para cumpleaños infantiles, fotos familiares y celebraciones de color."
              ac={true}
            />
          </div>
        </div>
      </section>

      {/* Promociones Semanales */}
      <section className="w-full max-w-5xl mx-auto px-6 py-24 space-y-12">
        <div className="text-center space-y-4">
           <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-magical-gold">
             Promociones Mágicas Cada Semana
           </h2>
           <p className="text-lg text-white/70 max-w-2xl mx-auto">
             Ven con tu familia, amigos o invitados y aprovecha nuestras promociones. La magia sabe mejor cuando se comparte. ✨
           </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <PromoCard day="Jueves" promo="Copas de Clericot y Crepas Clásicas" deal="2x1" />
          <PromoCard day="Viernes" promo="Copas de Clericot y Cerveza de Mantequilla" deal="2x1" />
          <PromoCard day="Sábado" promo="Micheladas Clásicas" deal="3x2" />
          <PromoCard day="Domingo" promo="Crepas y Cerveza de Mantequilla" deal="2x1" />
        </div>
      </section>

      {/* CTA Final */}
      <section className="w-full px-6 py-24 bg-gradient-to-t from-magical-navy via-magical-navy/50 to-transparent relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[url('/hero.png')] opacity-10 bg-cover bg-center mix-blend-screen" />
        <div className="max-w-3xl mx-auto relative z-10 space-y-8 glass-card p-10 md:p-16 border-magical-gold/20">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic leading-tight">
            Reserva tu mesa o agenda tu <span className="text-magical-gold">evento mágico</span>
          </h2>
          <p className="text-xl text-white/80">
            ¿Tienes un cumpleaños, reunión o celebración especial? En Hogwarts Snacks & Foods te ayudamos a convertirlo en una experiencia inolvidable.
          </p>
          <div className="pt-4 flex flex-col items-center gap-4">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-gold px-12 py-5 text-xl flex items-center justify-center gap-3 w-full sm:w-auto shadow-[0_0_40px_rgba(212,175,55,0.4)]">
              <MessageCircle className="w-6 h-6" />
              Reservar por WhatsApp
            </a>
            <div className="text-sm text-white/50 space-y-1 mt-4 font-medium">
              <p>📍 Av. Tarascos #272, Lázaro Cárdenas, Michoacán</p>
              <p>🕒 Jueves a Domingo | 3:00 PM a 11:30 PM</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Botón flotante de WhatsApp global */}
      <a 
        href={whatsappUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 bg-[#25D366] hover:bg-[#1ebd5a] text-white p-4 rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.4)] hover:scale-110 transition-all group flex items-center gap-0 overflow-hidden"
      >
        <MessageCircle className="w-7 h-7 shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 font-bold px-0 group-hover:px-3 text-sm">
          Reserva tu evento
        </span>
      </a>

    </div>
  )
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="glass-card p-6 flex flex-col items-center text-center gap-4 hover:border-magical-gold/30 transition-colors group">
      <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-magical-gold/20 transition-colors text-magical-gold shrink-0">
        {React.cloneElement(icon, { className: "w-8 h-8" })}
      </div>
      <div>
        <h5 className="font-black uppercase text-sm md:text-base tracking-widest leading-tight">{title}</h5>
        <p className="text-[10px] md:text-xs text-white/50 uppercase tracking-wider mt-1 leading-tight">{desc}</p>
      </div>
    </div>
  )
}

function FloorCard({ title, subtitle, desc, ac }) {
  return (
    <div className="glass-card border-white/10 hover:border-magical-gold/30 transition-all p-8 flex flex-col gap-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        <Wand2 className="w-32 h-32 text-magical-gold" />
      </div>
      <div className="relative z-10 space-y-2">
        <h3 className="text-magical-gold font-black uppercase tracking-widest text-sm">{title}</h3>
        <h4 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">{subtitle}</h4>
      </div>
      <p className="text-white/70 leading-relaxed flex-1 relative z-10">{desc}</p>
      {ac && (
        <div className="flex items-center gap-2 text-blue-300 bg-blue-500/10 w-fit px-3 py-1.5 rounded-lg border border-blue-500/20 relative z-10">
          <Snowflake className="w-4 h-4 shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-widest">Aire Acondicionado</span>
        </div>
      )}
    </div>
  )
}

function PromoCard({ day, promo, deal }) {
  return (
    <div className="glass-card border-white/5 p-6 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors">
      <div className="space-y-1 flex-1">
        <h4 className="text-magical-gold font-black uppercase tracking-widest text-xs md:text-sm">{day}</h4>
        <p className="text-white font-medium text-sm md:text-base leading-snug">{promo}</p>
      </div>
      <div className="bg-magical-gold text-magical-navy font-black text-xl md:text-2xl px-4 py-2 rounded-xl rotate-3 shadow-lg shrink-0">
        {deal}
      </div>
    </div>
  )
}
