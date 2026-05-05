import { Link } from 'react-router-dom'
import { Sparkles, Utensils, Award } from 'lucide-react'
import logo from '../assets/logo.png'

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <header className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          <img src={logo} alt="Hogwarts Logo" className="w-48 md:w-64 mx-auto mb-6 drop-shadow-[0_0_25px_rgba(212,175,55,0.4)]" />
          <span className="bg-gradient-to-b from-white to-magical-gold bg-clip-text text-transparent">
            Hogwarts
          </span>
          <br />
          <span className="text-3xl md:text-5xl opacity-90">Snacks & Foods</span>
        </h1>
        
        <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
          Donde el sabor se encuentra con la magia. Disfruta de una experiencia gastronómica 
          única en un ambiente inspirado en los grandes salones de la hechicería.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link to="/registro" className="btn-gold text-lg">
            Crear Cuenta Mágica
          </Link>
          <Link to="/menu" className="px-6 py-2 border border-white/20 rounded-xl hover:bg-white/5 transition-colors">
            Ver Menú
          </Link>
        </div>
      </header>

      <section className="grid md:grid-cols-3 gap-8 mt-24 max-w-6xl w-full">
        <FeatureCard 
          icon={<Sparkles className="w-8 h-8 text-magical-gold" />}
          title="Descubre tu Casa"
          description="Al registrarte, nuestro ritual te asignará una casa mágica con beneficios únicos."
        />
        <FeatureCard 
          icon={<Utensils className="w-8 h-8 text-magical-gold" />}
          title="Menú Temático"
          description="Hamburguesas, snacks y bebidas preparadas con ingredientes de la más alta calidad."
        />
        <FeatureCard 
          icon={<Award className="w-8 h-8 text-magical-gold" />}
          title="Puntos de Lealtad"
          description="Cada visita te otorga puntos que puedes canjear por recompensas exclusivas."
        />
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="glass-card p-8 flex flex-col items-center gap-4 group hover:border-magical-gold/50 transition-colors">
      <div className="p-4 bg-magical-gold/10 rounded-full group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-magical-gold">{title}</h3>
      <p className="text-white/60">{description}</p>
    </div>
  )
}
