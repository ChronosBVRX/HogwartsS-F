import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { withTimeout } from '../lib/supabaseSafe'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(() => {
    try {
      const cached = localStorage.getItem('hsf_user_profile')
      return cached ? JSON.parse(cached) : null
    } catch (e) { return null }
  })
  const [loading, setLoading] = useState(true) // Initial auth loading
  const [profileLoading, setProfileLoading] = useState(false) // Start as false to avoid blocking if we have cache
  const [authError, setAuthError] = useState(null)
  const initialized = useRef(false)
  const fetchingProfile = useRef(false)
  const currentUserId = useRef(null)

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return null
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('hsf_profiles')
          .select('user_id, display_name, phone, role, house_slug, loyalty_points, gender, pasos_mapa_mes, created_at, updated_at')
          .eq('user_id', userId)
          .maybeSingle(),
        12000,
        'Cargando perfil'
      )

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
        return null
      }

      if (data) {
        setProfile(data)
        localStorage.setItem('hsf_user_profile', JSON.stringify(data))
      } else {
        setProfile(null)
        localStorage.removeItem('hsf_user_profile')
      }
      return data || null
    } catch (err) {
      console.error('fetchProfile failed:', err)
      setProfile(null)
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const initialHref = window.location.href
    const isRecoveryUrl =
      initialHref.includes('recovery=1') ||
      initialHref.includes('type=recovery') ||
      initialHref.includes('access_token=') ||
      initialHref.includes('refresh_token=') ||
      initialHref.includes('code=')

    const goToResetPassword = () => {
      setTimeout(() => {
        window.location.hash = '#/restablecer-password'
      }, 0)
    }

    const ensureHsfProfile = async (user) => {
      if (!user?.id) return null

      const { data, error } = await supabase.rpc('hsf_ensure_profile')
      
      if (error) {
        console.error('[ENSURE PROFILE ERROR]', error)
        return null
      }

      if (data?.ok) return data.data
      return null
    }

    // Fallback de seguridad por si Supabase no dispara onAuthStateChange
    const fallbackTimer = setTimeout(() => {
      if (mounted && !initialized.current) {
        console.warn('Auth event fallback triggered (Supabase tardó demasiado)')
        initialized.current = true
        setLoading(false)
      }
    }, 15000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event)

      if (event === 'PASSWORD_RECOVERY') {
        goToResetPassword()
      }

      const currentUser = session?.user ?? null

      if (mounted) {
        setUser(currentUser)

        if (isRecoveryUrl && event === 'INITIAL_SESSION') {
          goToResetPassword()
        }

        // Failsafe por si initializeAuth falló (Desbloquear UI básica)
        if (!initialized.current) {
          clearTimeout(fallbackTimer)
          initialized.current = true
          setLoading(false)
        }

        if (currentUser) {
          if (currentUserId.current === currentUser.id && profile) {
             setProfileLoading(false)
          } else if (!fetchingProfile.current) {
             fetchingProfile.current = true
             setProfileLoading(true)
             currentUserId.current = currentUser.id
             
             try {
               const p = await withTimeout(ensureHsfProfile(currentUser), 20000, 'Verificando perfil')
               if (mounted && p) {
                 setProfile(p)
                 localStorage.setItem('hsf_user_profile', JSON.stringify(p))
               }
             } catch (error) {
               console.error('Error al asegurar perfil:', error)
               // No borramos el perfil del state si falló la red, para no cerrar la sesión del usuario
             } finally {
               if (mounted) {
                 fetchingProfile.current = false
                 setProfileLoading(false)
               }
             }
          }
        } else {
          currentUserId.current = null
          if (mounted) {
            setProfile(null)
            setProfileLoading(false)
          }
        }
      }
    })

    return () => {
      mounted = false
      clearTimeout(fallbackTimer)
      subscription?.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      localStorage.removeItem('hsf_user_profile')
      window.location.href = '/'
    } catch (err) {
      console.error('signOut failed:', err)
      window.location.reload()
    }
  }

  const value = {
    user,
    profile,
    loading,
    profileLoading,
    authError,
    isAdmin: profile?.role === 'admin',
    isWaiter: profile?.role === 'waiter' || profile?.role === 'admin',
    refreshProfile: () => user?.id ? fetchProfile(user.id) : null,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
