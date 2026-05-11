import { Zap, Shield, Heart, Sparkles, Clock } from 'lucide-react'

export default function SpellCard({ spell, disabled, selected, onClick, cooldown }) {
  const familyColors = {
    attack: 'from-orange-500/20 to-red-500/20 border-red-500/30 text-red-400',
    heavy: 'from-red-600/20 to-purple-600/20 border-purple-500/30 text-purple-400',
    defense: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
    control: 'from-purple-500/20 to-pink-500/20 border-pink-500/30 text-pink-400',
    counter: 'from-slate-400/20 to-slate-600/20 border-slate-400/30 text-slate-300',
    heal: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
    charge: 'from-yellow-400/20 to-amber-500/20 border-yellow-400/30 text-yellow-400',
    disarm: 'from-rose-500/20 to-orange-500/20 border-rose-500/30 text-rose-400'
  }

  const colorClass = familyColors[spell.family] || 'from-white/10 to-transparent border-white/10 text-white'

  return (
    <button
      disabled={disabled || cooldown > 0}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-3xl border-2 p-3 md:p-5 text-left transition-all duration-300 active:scale-95 flex flex-col h-full group
        ${selected ? 'bg-white/10 scale-[1.02] border-magical-gold shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'bg-white/5 border-white/5'}
        ${(disabled || cooldown > 0) ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:bg-white/10 hover:border-white/20'}
      `}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br opacity-40 transition-opacity group-hover:opacity-60 ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]}`} />
      
      {/* Selection Glow */}
      {selected && (
        <div className="absolute inset-0 bg-magical-gold/5 animate-pulse" />
      )}

      <div className="relative z-10 flex flex-col h-full space-y-3">
        <div className="flex items-center justify-between">
          <div className={`p-1.5 rounded-lg bg-black/20 backdrop-blur-md border border-white/10 ${colorClass.split(' ')[3]}`}>
            {spell.family === 'defense' && <Shield className="w-3 h-3" />}
            {spell.family === 'heal' && <Heart className="w-3 h-3" />}
            {['attack', 'heavy'].includes(spell.family) && <Zap className="w-3 h-3" />}
            {!['defense', 'heal', 'attack', 'heavy'].includes(spell.family) && <Sparkles className="w-3 h-3" />}
          </div>
          <div className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full border border-white/5">
            <span className="text-[10px] font-black text-blue-400">{spell.cost}</span>
            <Zap className="w-2.5 h-2.5 text-blue-400 fill-blue-400" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-xs md:text-sm font-black uppercase italic tracking-tighter text-white group-hover:text-magical-gold transition-colors leading-tight">
            {spell.name}
          </h3>
          <p className="text-[8px] font-bold uppercase tracking-widest opacity-40">{spell.family}</p>
        </div>

        <div className="flex-1">
          <p className="text-[9px] md:text-[10px] text-white/60 leading-tight italic line-clamp-2">
            {spell.description}
          </p>
        </div>

        {cooldown > 0 && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-1 rounded-3xl">
            <Clock className="w-5 h-5 text-white/40" />
            <span className="text-xs font-black text-white/60">{cooldown}</span>
          </div>
        )}
      </div>
    </button>
  )
}
