import React from 'react'
import { Link } from 'react-router-dom'
import { Wand2, MapPin, CalendarClock, MessageCircle, Snowflake, Shield, UserPlus } from 'lucide-react'
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
            className="w-40 md:w-56 mx-auto mb-2 md:mb-4 drop-shadow-[0_0_40px_rgba(212,175,55,0.5)] animate-bounce-slow" 
          />
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase italic text-white drop-shadow-lg leading-tight">
            Celebra tu evento en un <br/>
            <span className="bg-gradient-to-r from-magical-gold via-yellow-200 to-magical-gold bg-clip-text text-transparent pr-2 pb-1">mundo mágico</span>
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

      {/* Experiencia & Pisos (Combined to save space) */}
      <section id="espacios" className="w-full px-6 py-16 bg-black/40 relative border-y border-white/5">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-6">
            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">
              Haz de tu celebración una <span className="text-magical-gold">experiencia mágica</span>
            </h2>
            <p className="text-white/70 max-w-3xl mx-auto text-lg leading-relaxed">
              Aquí no solo reservas una mesa: entras a un universo de <strong className="text-magical-gold">tres pisos climatizados</strong>, con ambientes únicos, promociones especiales y rincones perfectos para cumpleaños y fotos inolvidables.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FloorCard 
              title="Primer Piso"
              subtitle="El Gran Salón"
              desc="Vive la grandeza desde que entras. Ideal para reuniones privadas y convivencia con un toque clásico."
              ac={true}
            />
            <FloorCard 
              title="Segundo Piso"
              subtitle="Callejón Mágico"
              desc="Un espacio familiar lleno de fantasía, ideal para que los peques se diviertan mientras disfrutas la experiencia."
              ac={true}
            />
            <FloorCard 
              title="Tercer Piso"
              subtitle="Mundo Encantado"
              desc="Un universo de princesas y héroes. Perfecto para cumpleaños infantiles y celebraciones llenas de color."
              ac={true}
            />
          </div>
        </div>
      </section>

      {/* Galería Premium de Momentos Mágicos */}
      <section className="w-full max-w-7xl px-6 py-12 relative">
        <div className="absolute inset-0 bg-magical-gold/5 blur-[100px] pointer-events-none" />
        <MagicalMoments />
      </section>

      {/* Registration Benefits - RESTORED & COMPACT */}
      <section className="w-full max-w-5xl mx-auto px-6 py-8">
        <div className="glass-card bg-gradient-to-r from-magical-gold/10 to-transparent border-magical-gold/20 p-8 flex flex-col md:flex-row items-center gap-8 justify-between hover:border-magical-gold/40 transition-colors">
          <div className="space-y-3 flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter">
              Regístrate y obtén <span className="text-magical-gold">Beneficios</span>
            </h2>
            <p className="text-white/70 text-sm md:text-base leading-relaxed">
              Descubre a qué casa perteneces, acumula <strong>Puntos de Magia</strong> en cada visita y canjéalos por platillos, bebidas o souvenirs exclusivos de nuestra tienda.
            </p>
          </div>
          <Link to="/registro" className="btn-gold px-8 py-4 flex items-center gap-3 shrink-0 w-full md:w-auto justify-center">
            Crear Cuenta Mágica
          </Link>
        </div>
      </section>

      {/* Promociones Semanales - COMPACT */}
      <section className="w-full max-w-5xl mx-auto px-6 py-12 space-y-8">
        <div className="text-center">
           <h2 className="text-3xl font-black uppercase italic tracking-tighter text-magical-gold">
             Promociones Semanales
           </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <PromoCard day="Jueves" promo="Copas de Clericot y Crepas Clásicas" deal="2x1" />
          <PromoCard day="Viernes" promo="Clericot y Cerveza de Mantequilla" deal="2x1" />
          <PromoCard day="Sábado" promo="Micheladas Clásicas" deal="3x2" />
          <PromoCard day="Domingo" promo="Crepas y Cerveza de Mantequilla" deal="2x1" />
        </div>
      </section>

      {/* CTA Final - COMPACT */}
      <section className="w-full px-6 py-16 bg-gradient-to-t from-magical-navy to-transparent relative text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-5xl font-black uppercase italic">
            Reserva tu <span className="text-magical-gold">evento mágico</span>
          </h2>
          <p className="text-white/80">
            En Hogwarts Snacks & Foods te ayudamos a convertir tu celebración en una experiencia inolvidable.
          </p>
          <div className="pt-4">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-gold px-10 py-4 text-lg inline-flex items-center justify-center gap-3 w-full sm:w-auto shadow-[0_0_30px_rgba(212,175,55,0.3)]">
              Reservar por WhatsApp
            </a>
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
