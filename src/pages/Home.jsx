import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Utensils, Award, Flame, Star, Zap, ShoppingBag, Scroll, UserPlus, ArrowRight } from 'lucide-react'
import logo from '../assets/logo.png'
import heroImg from '../assets/illustrations/hero.png'
import invitationImg from '../assets/illustrations/invitation.png'
import shopImg from '../assets/illustrations/shop.png'
import collectiblesImg from '../assets/illustrations/collectibles.png'
import { menuData } from '../data/menuData'

export default function Home() {
  const featuredProducts = menuData.filter(item => item.tags?.includes('popular') || item.tags?.includes('icónico')).slice(0, 3)

  return (
    <div className="flex-1 flex flex-col items-center">
      {/* Hero Section */}
      <header className="w-full min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImg} 
            className="w-full h-full object-cover scale-105"
            alt="Hogwarts Restaurant" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-magical-navy/40 via-magical-navy/80 to-magical-navy" />
        </div>
        
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative z-10">
          <div className="space-y-4">
            <img 
              src={logo} 
              alt="Hogwarts Logo" 
              className="w-48 md:w-64 mx-auto mb-6 drop-shadow-[0_0_40px_rgba(212,175,55,0.5)] animate-bounce-slow" 
            />
            <h1 className="text-5xl md:text-9xl font-black tracking-tighter uppercase italic">
              <span className="bg-gradient-to-b from-white via-magical-gold to-magical-gold bg-clip-text text-transparent">
                Hogwarts
              </span>
              <br />
              <span className="text-3xl md:text-5xl opacity-90 block mt-2 text-white drop-shadow-lg">Snacks & Foods</span>
            </h1>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 pt-4">
            <Link to="/registro" className="btn-gold text-lg px-10 py-5 flex items-center gap-3 group shadow-[0_0_30px_rgba(212,175,55,0.3)]">
              <UserPlus className="w-6 h-6 group-hover:scale-110 transition-transform" />
              Crear Cuenta Mágica
            </Link>
            <Link to="/menu" className="px-10 py-5 bg-white/5 border border-white/20 rounded-2xl hover:bg-white/10 hover:border-white/40 transition-all font-bold backdrop-blur-md flex items-center gap-3">
              <Utensils className="w-6 h-6" />
              Ver el Menú
            </Link>
          </div>
        </div>
      </header>

      {/* Featured Menu Section */}
      <section className="w-full max-w-7xl px-6 py-32 space-y-16">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-magical-gold/10 rounded-full border border-magical-gold/20">
            <Flame className="text-magical-gold w-5 h-5 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-magical-gold">Hechizos del Mes</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">
            Favoritos del <span className="text-magical-gold">Gran Comedor</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            Nuestros platillos más aclamados por magos y brujas de todas las casas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {featuredProducts.map(item => (
            <div key={item.id} className="glass-card group relative overflow-hidden">
              <div className="absolute inset-0 bg-magical-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-8 space-y-6 relative z-10">
                <div className="flex justify-between items-start">
                  <Star className="text-magical-gold fill-magical-gold w-6 h-6" />
                  <span className="text-2xl font-black text-magical-gold">${item.precio}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black group-hover:text-magical-gold transition-colors">{item.nombre}</h3>
                  <p className="text-white/50 text-sm leading-relaxed italic border-l-2 border-magical-gold/20 pl-4">
                    "{item.descripcion}"
                  </p>
                </div>
                <Link to="/menu" className="btn-gold w-full flex justify-center items-center gap-2 py-3">
                  Pedir Hechizo <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Membership / Registration Invitation */}
      <section className="w-full px-6 py-20 bg-magical-navy relative overflow-hidden">
        <div className="max-w-7xl mx-auto glass-card overflow-hidden flex flex-col md:flex-row min-h-[500px]">
          <div className="flex-1 p-12 md:p-20 flex flex-col justify-center space-y-8 bg-gradient-to-r from-black/40 to-transparent">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-black uppercase italic leading-tight">
                Únete a la <br />
                <span className="text-magical-gold">Orden de los Snacks</span>
              </h2>
              <p className="text-xl text-white/70 max-w-lg leading-relaxed">
                Crea tu cuenta, descubre tu casa y empieza a acumular puntos para canjear por productos mágicos.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/registro" className="btn-gold px-10 py-5 text-lg flex items-center gap-3">
                <Scroll className="w-6 h-6" />
                Registrarme Ahora
              </Link>
            </div>
          </div>
          <div className="flex-1 relative min-h-[300px]">
            <img 
              src={invitationImg} 
              className="absolute inset-0 w-full h-full object-cover"
              alt="Invitación Mágica" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-magical-navy via-transparent to-transparent md:bg-gradient-to-l" />
          </div>
        </div>
      </section>

      {/* Magical Shop Section */}
      <section className="w-full max-w-7xl px-6 py-32 space-y-20">
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 order-2 md:order-1">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-magical-purple/10 rounded-full border border-magical-purple/20 text-magical-purple">
              <ShoppingBag className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Tienda de Colección</span>
            </div>
            <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
              Artículos de <br />
              <span className="text-magical-gold">Poder Mágico</span>
            </h2>
            <p className="text-xl text-white/60 leading-relaxed">
              Explora nuestra colección exclusiva de varitas, túnicas y reliquias 
              directamente desde el mundo mágico. ¡Cada pieza es auténtica y limitada!
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 glass-card border-white/5 bg-white/5">
                <h4 className="text-magical-gold font-black uppercase text-xs mb-2">Varitas</h4>
                <p className="text-white/40 text-[10px] uppercase tracking-widest">Nuevos Modelos</p>
              </div>
              <div className="p-6 glass-card border-white/5 bg-white/5">
                <h4 className="text-magical-gold font-black uppercase text-xs mb-2">Túnicas</h4>
                <p className="text-white/40 text-[10px] uppercase tracking-widest">Todas las Casas</p>
              </div>
            </div>
            <button className="btn-gold px-10 py-5 text-lg w-full md:w-auto">
              Visitar la Tienda
            </button>
          </div>
          <div className="flex-1 order-1 md:order-2">
            <div className="relative group">
              <div className="absolute inset-0 bg-magical-gold/20 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />
              <img 
                src={shopImg} 
                className="w-full rounded-3xl shadow-2xl relative z-10 border border-white/10 group-hover:scale-[1.02] transition-transform duration-700"
                alt="Tienda Mágica" 
              />
            </div>
          </div>
        </div>

        {/* Collectibles Showcase */}
        <div className="grid md:grid-cols-2 gap-12 items-center bg-white/5 rounded-[40px] p-12 md:p-20 border border-white/5">
          <div className="aspect-square relative rounded-3xl overflow-hidden">
            <img 
              src={collectiblesImg} 
              className="absolute inset-0 w-full h-full object-cover"
              alt="Coleccionables" 
            />
          </div>
          <div className="space-y-8">
            <h3 className="text-4xl font-black uppercase italic text-magical-gold">Ediciones de Coleccionista</h3>
            <div className="space-y-6">
              <CollectibleItem name="Varita de Saúco" price="950 G" description="La varita más poderosa de la historia." />
              <CollectibleItem name="Snitch Dorada" price="450 G" description="Acabado en chapa de oro con movimiento." />
              <CollectibleItem name="Diario de Tom Riddle" price="780 G" description="Réplica exacta con páginas envejecidas." />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="w-full max-w-7xl px-6 py-24 border-t border-white/5 grid md:grid-cols-4 gap-12">
        <FeatureCard icon={<Zap />} title="Puntos" desc="Gana galeones por cada compra." />
        <FeatureCard icon={<Utensils />} title="Menú" desc="Platillos temáticos únicos." />
        <FeatureCard icon={<Award />} title="Casas" desc="Beneficios exclusivos por casa." />
        <FeatureCard icon={<ShoppingBag />} title="Shop" desc="Envíos a todo el mundo mágico." />
      </section>
    </div>
  )
}

function CollectibleItem({ name, price, description }) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-4 group">
      <div>
        <h4 className="font-bold text-xl group-hover:text-magical-gold transition-colors">{name}</h4>
        <p className="text-sm text-white/40">{description}</p>
      </div>
      <div className="text-xl font-black text-magical-gold">{price}</div>
    </div>
  )
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-magical-gold/10 transition-colors">
        {React.cloneElement(icon, { className: "w-6 h-6 text-magical-gold" })}
      </div>
      <div>
        <h5 className="font-bold uppercase text-xs tracking-widest">{title}</h5>
        <p className="text-[10px] text-white/40 uppercase tracking-tighter">{desc}</p>
      </div>
    </div>
  )
}
