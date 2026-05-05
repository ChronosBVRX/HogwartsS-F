import { Link } from 'react-router-dom'
import { Sparkles, Utensils, Award, Flame, Star, Zap } from 'lucide-react'
import logo from '../assets/logo.png'
import heroImg from '../assets/illustrations/hero.png'
import { menuData } from '../data/menuData'

export default function Home() {
  const featuredProducts = menuData.filter(item => item.tags?.includes('popular') || item.tags?.includes('icónico')).slice(0, 3)

  return (
    <div className="flex-1 flex flex-col items-center">
      {/* Hero Section */}
      <header className="w-full min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImg} 
            className="w-full h-full object-cover scale-105"
            alt="Hogwarts Restaurant" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-magical-navy/40 via-magical-navy/80 to-magical-navy" />
        </div>
        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-magical-gold/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-magical-purple/10 rounded-full blur-[120px] animate-pulse delay-700" />
        
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative z-10">
          <div className="space-y-4">
            <img 
              src={logo} 
              alt="Hogwarts Logo" 
              className="w-48 md:w-64 mx-auto mb-6 drop-shadow-[0_0_35px_rgba(212,175,55,0.4)] animate-bounce-slow" 
            />
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic">
              <span className="bg-gradient-to-b from-white via-magical-gold to-magical-gold bg-clip-text text-transparent">
                Hogwarts
              </span>
              <br />
              <span className="text-3xl md:text-5xl opacity-90 block mt-2 text-white">Snacks & Foods</span>
            </h1>
          </div>
          
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed font-medium">
            Donde cada bocado es un encantamiento. Disfruta de una experiencia 
            gastronómica legendaria en el corazón del mundo mágico.
          </p>

          <div className="flex flex-wrap justify-center gap-6 pt-4">
            <Link to="/registro" className="btn-gold text-lg px-8 py-4 flex items-center gap-2 group">
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Inicia tu Aventura
            </Link>
            <Link to="/menu" className="px-8 py-4 border border-white/20 rounded-2xl hover:bg-white/5 hover:border-white/40 transition-all font-bold backdrop-blur-sm">
              Explorar el Menú
            </Link>
          </div>
        </div>
      </header>

      {/* Featured Section */}
      <section className="w-full max-w-7xl px-6 py-24 space-y-12">
        <div className="flex flex-col items-center text-center space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold flex items-center gap-3">
            <Flame className="text-orange-500 w-8 h-8 md:w-12 md:h-12" />
            Favoritos del Gran Comedor
          </h2>
          <div className="w-24 h-1 bg-magical-gold rounded-full" />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {featuredProducts.map(item => (
            <div key={item.id} className="glass-card p-6 flex flex-col gap-4 group hover:scale-[1.02] transition-all">
              <div className="flex justify-between items-start">
                <span className="px-3 py-1 bg-magical-gold/20 text-magical-gold text-[10px] font-black uppercase rounded-full">
                  Destacado
                </span>
                <Star className="text-magical-gold fill-magical-gold w-4 h-4" />
              </div>
              <h3 className="text-2xl font-bold">{item.nombre}</h3>
              <p className="text-white/50 text-sm italic">"{item.descripcion}"</p>
              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                <span className="text-xl font-black text-magical-gold">${item.precio}</span>
                <Link to="/menu" className="text-sm font-bold text-white/80 hover:text-magical-gold transition-colors">
                  Pedir ahora →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-3 gap-8 pb-32 px-6 max-w-7xl w-full">
        <FeatureCard 
          icon={<Zap className="w-8 h-8 text-magical-gold" />}
          title="Casas de Hogwarts"
          description="Únete a Gryffindor, Slytherin, Ravenclaw o Hufflepuff y gana puntos para tu casa."
        />
        <FeatureCard 
          icon={<Utensils className="w-8 h-8 text-magical-gold" />}
          title="Cocina de Pociones"
          description="Nuestras bebidas cambian de color y echan humo. ¡Es pura magia líquida!"
        />
        <FeatureCard 
          icon={<Award className="w-8 h-8 text-magical-gold" />}
          title="Premios Mágicos"
          description="Canjea tus puntos por Galeones, productos gratis y accesos VIP."
        />
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="glass-card p-10 flex flex-col items-center text-center gap-6 group hover:border-magical-gold/50 transition-all duration-500 hover:-translate-y-2">
      <div className="p-5 bg-magical-gold/10 rounded-2xl group-hover:bg-magical-gold/20 transition-all shadow-[0_0_30px_rgba(212,175,55,0.05)]">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-magical-gold">{title}</h3>
        <p className="text-white/60 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
