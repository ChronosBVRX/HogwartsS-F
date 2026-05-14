import { useState, useEffect } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Map, Compass, Wand2, AlertCircle, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react'

// RESTAURANT LOCATION CONFIG
// Replace these with actual coordinates of Hogwarts Snacks & Foods
const TARGET_LAT = 19.4326
const TARGET_LNG = -99.1332
const MAX_DISTANCE_METERS = 300 // Allowed radius

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3 // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export default function LocationGuard({ children }) {
  const { profile } = useAuth()
  const [status, setStatus] = useState('checking') // checking, denied, out_of_range, error, unsupported, success
  const [distance, setDistance] = useState(null)
  const navigate = useNavigate()

  // Admins bypass the guard
  const isAdmin = profile?.role === 'admin'

  const checkLocation = () => {
    setStatus('checking')

    if (!navigator.geolocation) {
      setStatus('unsupported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const d = calculateDistance(
          position.coords.latitude,
          position.coords.longitude,
          TARGET_LAT,
          TARGET_LNG
        )
        setDistance(Math.round(d))

        if (d <= MAX_DISTANCE_METERS) {
          setStatus('success')
        } else {
          setStatus('out_of_range')
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('denied')
        } else {
          setStatus('error')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  useEffect(() => {
    if (isAdmin) {
      setStatus('success')
      return
    }
    checkLocation()
  }, [isAdmin])

  if (status === 'success' || isAdmin) {
    return children || <Outlet />
  }

  // PREMIUM MAGICAL UI FOR RESTRICTION
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000 bg-magical-navy relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-magical-gold/10 blur-[120px] rounded-full animate-pulse" />
      </div>

      <div className="relative z-10 max-w-xl w-full space-y-10">
        {/* Animated Icon Container */}
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 bg-magical-gold/20 blur-2xl rounded-full scale-150 animate-pulse" />
          <div className="relative bg-white/5 border border-white/10 backdrop-blur-xl rounded-full p-8 flex items-center justify-center shadow-2xl">
            {status === 'checking' && <RefreshCw className="w-12 h-12 text-magical-gold animate-spin" />}
            {status === 'out_of_range' && <Map className="w-12 h-12 text-magical-gold animate-float" />}
            {status === 'denied' && <Compass className="w-12 h-12 text-magical-gold" />}
            {status === 'error' && <Compass className="w-12 h-12 text-magical-gold animate-bounce-slow" />}
            {status === 'unsupported' && <Wand2 className="w-12 h-12 text-magical-gold" />}
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-6">
          <header className="space-y-3">
            {status === 'checking' && (
              <>
                <p className="text-magical-gold text-xs font-black uppercase tracking-[0.4em] animate-pulse">Consultando el Mapa del Merodeador...</p>
                <h1 className="text-2xl md:text-3xl font-black italic text-white leading-tight">
                  Verificando portal mágico...
                </h1>
              </>
            )}

            {status === 'out_of_range' && (
              <>
                <p className="text-magical-gold text-xs font-black uppercase tracking-[0.4em]">El Mapa del Merodeador indica...</p>
                <h1 className="text-3xl md:text-4xl font-black italic text-white uppercase tracking-tighter leading-none">
                  El portal mágico <br />
                  <span className="text-magical-gold">aún no se ha abierto</span>
                </h1>
              </>
            )}

            {(status === 'denied' || status === 'error' || status === 'unsupported') && (
              <>
                <p className="text-magical-gold text-xs font-black uppercase tracking-[0.4em]">Brújula Mágica</p>
                <h1 className="text-2xl md:text-3xl font-black italic text-white uppercase tracking-tighter">
                  {status === 'denied' && "El Mapa no puede encontrarte"}
                  {status === 'error' && "La brújula mágica está confundida"}
                  {status === 'unsupported' && "Tu navegador no reconoce este hechizo"}
                </h1>
              </>
            )}
          </header>

          <div className="max-w-md mx-auto space-y-4">
            {status === 'checking' && (
              <p className="text-white/60 italic leading-relaxed text-sm">
                Estamos verificando si te encuentras dentro de Hogwarts Snacks & Foods para abrir el portal mágico.
              </p>
            )}

            {status === 'out_of_range' && (
              <>
                <p className="text-white/70 italic leading-relaxed text-sm">
                  Esta experiencia solo puede desbloquearse dentro de Hogwarts Snacks & Foods. Acércate al restaurante, activa tu ubicación y vuelve a intentar entrar al mundo mágico.
                </p>
                {distance && (
                  <div className="inline-block px-4 py-1.5 rounded-full bg-magical-gold/10 border border-magical-gold/30">
                    <p className="text-[10px] font-black text-magical-gold uppercase tracking-widest">
                      Distancia estimada: {distance} metros
                    </p>
                  </div>
                )}
              </>
            )}

            {status === 'denied' && (
              <p className="text-white/60 italic leading-relaxed text-sm">
                Para abrir esta experiencia mágica necesitamos permiso para conocer tu ubicación. Activa la ubicación en tu navegador y vuelve a intentarlo.
              </p>
            )}

            {status === 'unsupported' && (
              <p className="text-white/60 italic leading-relaxed text-sm">
                Este dispositivo no permite verificar ubicación. Intenta abrir la experiencia desde otro navegador o desde tu celular.
              </p>
            )}

            {status === 'error' && (
              <p className="text-white/60 italic leading-relaxed text-sm">
                No pudimos confirmar tu ubicación en este momento. Revisa tu señal, activa tu GPS y vuelve a intentarlo.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 pt-4">
          <button 
            onClick={checkLocation}
            disabled={status === 'checking'}
            className="btn-gold w-full py-5 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${status === 'checking' ? 'animate-spin' : ''}`} />
            Volver a consultar el Mapa
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Regresar al inicio
          </button>
        </div>

        {/* Footer info */}
        <footer className="space-y-6 pt-8 border-t border-white/5">
          {isAdmin && (
            <div className="flex items-center justify-center gap-3 text-healing-green/60 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest">Modo administrador activo</p>
                <p className="text-[8px] uppercase tracking-widest opacity-80">Puedes atravesar el portal sin restricción.</p>
              </div>
            </div>
          )}
          <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest leading-relaxed">
            El quiz, la aventura mágica y los duelos forman parte de una experiencia presencial dentro del restaurante.
          </p>
        </footer>
      </div>
    </div>
  )
}
