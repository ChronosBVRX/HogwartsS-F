import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PlaceholderPage({ title }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 text-center animate-in fade-in duration-700">
      <div className="w-24 h-24 rounded-full bg-magical-gold/10 border border-magical-gold/20 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-magical-gold/20 animate-pulse" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">{title}</h1>
        <p className="text-white/40 text-xs font-black uppercase tracking-widest">Sección en construcción mágica</p>
      </div>
      <Link to="/duelos" className="flex items-center gap-2 text-magical-gold hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4" />
        Regresar a Duelos
      </Link>
    </div>
  )
}
