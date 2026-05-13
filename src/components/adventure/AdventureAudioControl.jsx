import { Volume2, VolumeX, PlayCircle } from 'lucide-react'

export default function AdventureAudioControl({
  enabled,
  onEnable,
  onDisable,
  onTest,
  compact = false,
  error = null
}) {
  if (enabled) {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTest}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-magical-gold/10 border border-magical-gold/20 text-magical-gold hover:bg-magical-gold hover:text-magical-navy transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <PlayCircle className="w-4 h-4" />
            {compact ? 'Probar' : 'Probar audio'}
          </button>

          <button
            type="button"
            onClick={onDisable}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <VolumeX className="w-4 h-4" />
            {compact ? 'Audio' : 'Desactivar audio'}
          </button>
        </div>

        {error && (
          <p className="max-w-xs text-right text-[9px] text-red-300/70 uppercase tracking-widest">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onEnable}
      className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-magical-gold text-magical-navy hover:scale-[1.02] transition-all text-[10px] font-black uppercase tracking-widest shadow-lg"
    >
      <Volume2 className="w-4 h-4" />
      {compact ? 'Activar audio' : 'Activar magia sonora'}
    </button>
  )
}
