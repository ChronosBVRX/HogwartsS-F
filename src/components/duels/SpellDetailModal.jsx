
import React from 'react'
import { Zap, Shield, Swords, Info, X, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

export default function SpellDetailModal({ spell, onClose, canCast, onCast }) {
  if (!spell) return null

  const FAMILY_META = {
    attack: { color: '#FF4D5A', icon: Swords, label: 'Ataque' },
    heavy: { color: '#FF8C42', icon: Swords, label: 'Ataque Pesado' },
    defense: { color: '#4DA1FF', icon: Shield, label: 'Defensa' },
    counter: { color: '#D4AF37', icon: Zap, label: 'Contrahechizo' },
    heal: { color: '#22C55E', icon: TrendingUp, label: 'Curación' },
    charge: { color: '#A855F7', icon: Zap, label: 'Carga' },
    control: { color: '#E879F9', icon: Zap, label: 'Control' }
  }

  const meta = FAMILY_META[spell.family] || FAMILY_META.attack
  const Icon = meta.icon

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="w-full max-w-lg bg-night-blue border border-magical-gold/30 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500"
        style={{ borderBottomWidth: '6px', borderBottomColor: meta.color }}
      >
        {/* Header Art */}
        <div className="relative h-40 md:h-48">
          <img 
            src={`/assets/spells/${spell.key}.jpg`} 
            className="w-full h-full object-cover brightness-[0.7]"
            onError={(e) => { e.target.src = '/assets/duels/cards/attack.webp' }}
            alt={spell.name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night-blue via-night-blue/20 to-transparent" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 border border-white/10 text-white hover:bg-black/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-md" style={{ backgroundColor: `${meta.color}22` }}>
               <Icon className="w-6 h-6" style={{ color: meta.color }} />
             </div>
             <div>
               <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight">{spell.name}</h2>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60" style={{ color: meta.color }}>{meta.label}</p>
             </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats Bar */}
          <div className="flex gap-4">
             <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/5 text-center">
                <p className="text-[8px] uppercase tracking-widest text-white/40 mb-1">Energía</p>
                <div className="flex items-center justify-center gap-1">
                   <Zap className="w-3 h-3 text-magical-gold" />
                   <span className="text-xl font-black">{spell.cost}</span>
                </div>
             </div>
             <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/5 text-center">
                <p className="text-[8px] uppercase tracking-widest text-white/40 mb-1">Potencia</p>
                <div className="flex items-center justify-center gap-1">
                   <TrendingUp className="w-3 h-3 text-impact-red" />
                   <span className="text-xl font-black">{spell.damage || 0}</span>
                </div>
             </div>
             <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/5 text-center">
                <p className="text-[8px] uppercase tracking-widest text-white/40 mb-1">Cooldown</p>
                <div className="flex items-center justify-center gap-1">
                   <span className="text-xl font-black">{spell.cooldown || 0}</span>
                </div>
             </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <p className="text-sm text-text-gray italic leading-relaxed">
              "{spell.description}"
            </p>
          </div>

          {/* Strategy Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-healing-green/5 border border-healing-green/20 rounded-2xl p-4">
               <div className="flex items-center gap-2 mb-2 text-healing-green">
                  <TrendingUp className="w-3 h-3" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Fuerte contra</p>
               </div>
               <div className="flex flex-wrap gap-1">
                  {spell.beats?.map(f => (
                    <span key={f} className="text-[8px] bg-healing-green/20 px-2 py-0.5 rounded text-healing-green font-bold uppercase">{f}</span>
                  )) || <span className="text-[8px] opacity-40">Ninguno</span>}
               </div>
            </div>
            <div className="bg-impact-red/5 border border-impact-red/20 rounded-2xl p-4">
               <div className="flex items-center gap-2 mb-2 text-impact-red">
                  <TrendingDown className="w-3 h-3" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Vulnerable a</p>
               </div>
               <div className="flex flex-wrap gap-1">
                  {spell.losesTo?.map(f => (
                    <span key={f} className="text-[8px] bg-impact-red/20 px-2 py-0.5 rounded text-impact-red font-bold uppercase">{f}</span>
                  )) || <span className="text-[8px] opacity-40">Ninguno</span>}
               </div>
            </div>
          </div>

          {/* Action */}
          <button
            disabled={!canCast}
            onClick={() => {
               onCast();
               onClose();
            }}
            className={`w-full py-5 rounded-2xl font-black uppercase italic tracking-widest transition-all duration-300 shadow-xl
              ${canCast 
                ? 'bg-magical-gold text-magical-navy scale-[1.02] hover:shadow-gold-lg' 
                : 'bg-white/5 text-white/20 border border-white/5'
              }`}
          >
            {canCast ? 'Lanzar Hechizo' : 'Sin Energía'}
          </button>
        </div>
      </div>
    </div>
  )
}
