import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { withTimeout } from '../lib/supabaseSafe'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true) // Initial auth loading
  const [profileLoading, setProfileLoading] = useState(true) // Background profile loading
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
        7000,
        'Cargando perfil'
      )

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
        return null
      }

      setProfile(data || null)
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

      const { data: existing } = await supabase
        .from('hsf_profiles')
        .select('user_id, display_name, phone, role, house_slug, loyalty_points, gender, pasos_mapa_mes, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) return existing

      const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Mago sin nombre'
      const phone = user.user_metadata?.phone || null

      const { data, error } = await supabase
        .from('hsf_profiles')
        .upsert({
          user_id: user.id,
          display_name: displayName,
          phone,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select('user_id, display_name, phone, role, house_slug, loyalty_points, gender, pasos_mapa_mes, created_at, updated_at')
        .maybeSingle()

      if (error) {
        console.error('[ENSURE PROFILE ERROR]', error)
        return null
      }
      return data
    }

    // Fallback de seguridad por si Supabase no dispara onAuthStateChange
    const fallbackTimer = setTimeout(() => {
      if (mounted && !initialized.current) {
        console.warn('Auth event fallback triggered (Supabase tardó demasiado)')
        initialized.current = true
        setLoading(false)
      }
    }, 15000)

    const initializeAuth = async () => {
      // Leer sesión local de inmediato sin esperar eventos asíncronos de red
      const { data: { session } } = await supabase.auth.getSession()
      
      const currentUser = session?.user ?? null
      if (mounted) {
        setUser(currentUser)
        if (!currentUser) {
           setProfile(null)
           setProfileLoading(false)
        }
        
        // ¡Desbloquear la UI DE INMEDIATO!
        if (!initialized.current) {
          clearTimeout(fallbackTimer)
          initialized.current = true
          setLoading(false)
        }
      }
    }

    initializeAuth()

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
               const p = await withTimeout(ensureHsfProfile(currentUser), 15000, 'Verificando perfil')
               if (mounted) setProfile(p)
             } catch (error) {
               console.error('Error al asegurar perfil:', error)
               if (mounted) setProfile(null)
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
