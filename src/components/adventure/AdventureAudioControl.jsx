import { Volume2, VolumeX } from 'lucide-react'

export default function AdventureAudioControl({ enabled, onEnable, onDisable, compact = false }) {
  if (enabled) {
    return (
      <button
        onClick={onDisable}
        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
      >
        <VolumeX className="w-4 h-4" />
        {compact ? 'Audio' : 'Desactivar audio'}
      </button>
    )
  }

  return (
    <button
      onClick={onEnable}
      className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-magical-gold text-magical-navy hover:scale-[1.02] transition-all text-[10px] font-black uppercase tracking-widest shadow-lg"
    >
      <Volume2 className="w-4 h-4" />
      {compact ? 'Audio' : 'Activar magia sonora'}
    </button>
  )
}
