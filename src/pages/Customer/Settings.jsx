import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { ChevronLeft, User, Lock, LogOut, Save, Wand2, CheckCircle2 } from 'lucide-react'

export default function Settings() {
  const { user, profile, signOut } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const navigate = useNavigate()

  const [gender, setGender] = useState(profile?.gender || 'male')

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase
      .from('hsf_profiles')
      .update({
        display_name: displayName,
        phone: phone,
        gender: gender,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (error) {
      setMessage({ type: 'error', text: 'Error al actualizar perfil' })
    } else {
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' })
      // Reload profile from context if possible or just wait for effect
      setTimeout(() => window.location.reload(), 1500)
    }
    setLoading(false)
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' })
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setMessage({ type: 'error', text: 'Error al cambiar contraseña' })
    } else {
      setMessage({ type: 'success', text: 'Contraseña actualizada con éxito' })
      setNewPassword('')
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 p-6 flex flex-col max-w-2xl mx-auto w-full space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate('/perfil')} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-5 h-5 text-white/40" />
        </button>
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">Configuración</h1>
          <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Gestiona tu identidad mágica</p>
        </div>
      </header>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 ${
          message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          <CheckCircle2 className="w-5 h-5" />
          <p className="text-sm font-bold">{message.text}</p>
        </div>
      )}

      {/* Edit Profile Section */}
      <section className="glass-card overflow-hidden">
        <div className="p-8 border-b border-white/5 bg-white/5 flex items-center gap-4">
          <div className="p-3 bg-magical-gold/10 rounded-2xl">
            <User className="w-5 h-5 text-magical-gold" />
          </div>
          <h2 className="text-lg font-black uppercase italic tracking-tighter text-white">Editar Perfil</h2>
        </div>
        <form onSubmit={handleUpdateProfile} className="p-8 space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Nombre Público</label>
              <input 
                type="text" 
                className="input-field"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Teléfono</label>
              <input 
                type="tel" 
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Gender Selector */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Identidad Mágica</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                  gender === 'male' ? 'border-magical-gold bg-magical-gold/10 text-white' : 'border-white/5 bg-white/5 text-white/40'
                }`}
              >
                <span className="text-2xl">🧙‍♂️</span>
                <span className="text-xs font-black uppercase tracking-widest">Mago</span>
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                  gender === 'female' ? 'border-magical-gold bg-magical-gold/10 text-white' : 'border-white/5 bg-white/5 text-white/40'
                }`}
              >
                <span className="text-2xl">🧙‍♀️</span>
                <span className="text-xs font-black uppercase tracking-widest">Bruja</span>
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full btn-gold py-4 flex items-center justify-center gap-2 text-sm font-black uppercase italic shadow-lg">
            <Save className="w-4 h-4" />
            Guardar Identidad
          </button>
        </form>
      </section>

      {/* Security Section */}
      <section className="glass-card overflow-hidden">
        <div className="p-8 border-b border-white/5 bg-white/5 flex items-center gap-4">
          <div className="p-3 bg-magical-gold/10 rounded-2xl">
            <Lock className="w-5 h-5 text-magical-gold" />
          </div>
          <h2 className="text-lg font-black uppercase italic tracking-tighter text-white">Seguridad</h2>
        </div>
        <form onSubmit={handleChangePassword} className="p-8 space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Nueva Contraseña</label>
            <input 
              type="password" 
              className="input-field"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-gold px-8 py-3 flex items-center gap-2 text-sm font-black uppercase italic">
            <Wand2 className="w-4 h-4" />
            Actualizar Contraseña
          </button>
        </form>
      </section>

      {/* Danger Zone */}
      <button 
        onClick={signOut}
        className="w-full p-6 glass-card border-red-500/20 hover:bg-red-500/10 transition-all flex items-center justify-center gap-3 group"
      >
        <LogOut className="w-6 h-6 text-red-400 group-hover:translate-x-1 transition-transform" />
        <span className="text-lg font-black uppercase italic tracking-tighter text-red-400">Cerrar Sesión</span>
      </button>
    </div>
  )
}
