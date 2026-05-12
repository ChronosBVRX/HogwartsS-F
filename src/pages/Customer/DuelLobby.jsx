import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { PlusCircle, Search, Sparkles, Wand2, ChevronLeft } from 'lucide-react'
import audioManager from '../../lib/audioManager'

export default function DuelLobby() {
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const createDuel = async () => {
    audioManager.unlockAudio().catch(() => {})
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {})
      }
    } catch (e) {}

    audioManager.playSfx('ui_button_magic')
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase.rpc('hsf_create_pvp_duel')
    if (err) setError(err.message)
    else if (data && data[0]) navigate(`/duelos/sala/${data[0].duel_id}`)
    setLoading(false)
  }

  const joinDuel = async (e) => {
    e.preventDefault()
    audioManager.unlockAudio().catch(() => {})
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {})
      }
    } catch (e) {}

    audioManager.playSfx('ui_button_magic')
    if (!inviteCode) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase.rpc('hsf_join_pvp_duel', { p_invite_code: inviteCode })
    if (err) setError(err.message)
    else if (data) navigate(`/duelos/sala/${data}`)
    setLoading(false)
  }

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-4 md:p-6 pb-24 space-y-12 animate-in fade-in duration-700 flex flex-col justify-center min-h-[80vh]">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4">
          <Wand2 className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">
          Arena de <span className="text-blue-400">Retos</span>
        </h1>
        <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">Busca un oponente o crea tu propia sala</p>
      </div>

      <div className="grid gap-6">
        {/* CREATE SECTION */}
        <div className="glass-card p-8 md:p-10 space-y-6 text-center border-magical-gold/20 hover:border-magical-gold/40 transition-colors">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Crear un Nuevo Reto</h3>
            <p className="text-xs text-white/60">Se generará un código de invitación para que otro mago pueda unirse a tu duelo.</p>
          </div>
          <button 
            onClick={createDuel}
            disabled={loading}
            className="btn-gold w-full py-5 flex items-center justify-center gap-3 text-sm font-black uppercase shadow-[0_0_30px_rgba(212,175,55,0.2)]"
          >
            <PlusCircle className="w-5 h-5" />
            {loading ? 'Preparando arena...' : 'Crear Sala de Duelo'}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-[1px] bg-white/5" />
          <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Ó</span>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>

        {/* JOIN SECTION */}
        <div className="glass-card p-8 md:p-10 space-y-6 border-blue-500/20 hover:border-blue-500/40 transition-colors">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Unirse a un Reto</h3>
            <p className="text-xs text-white/60">Ingresa el código secreto proporcionado por tu oponente.</p>
          </div>
          
          <form onSubmit={joinDuel} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input 
                type="text" 
                placeholder="Código de 6 caracteres"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-center text-xl font-black tracking-[0.5em] text-white focus:outline-none focus:border-blue-500/50 transition-all uppercase"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                maxLength={6}
              />
            </div>
            <button 
              type="submit"
              disabled={loading || inviteCode.length < 6}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(37,99,235,0.2)]"
            >
              {loading ? 'Buscando sala...' : 'Aceptar Reto'}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
          <p className="text-red-400 text-[10px] font-black uppercase tracking-widest">{error}</p>
        </div>
      )}

      <button 
        onClick={() => navigate('/duelos')}
        className="flex items-center justify-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
      >
        <ChevronLeft className="w-4 h-4" />
        Regresar
      </button>
    </div>
  )
}
