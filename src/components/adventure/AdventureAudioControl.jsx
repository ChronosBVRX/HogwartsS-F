import { Volume2 } from 'lucide-react'

export default function AdventureAudioControl({
  enabled,
  onEnable,
  compact = false,
  error = null
}) {
  if (enabled) {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-magical-gold/5 border border-magical-gold/20 rounded-full text-magical-gold/80 text-[9px] font-black uppercase tracking-widest animate-pulse shadow-sm">
          <Volume2 className="w-3.5 h-3.5" />
          <span>{compact ? 'Audio Mágico' : 'Audio Mágico Activo'}</span>
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
