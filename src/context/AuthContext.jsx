import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { withTimeout } from '../lib/supabaseSafe'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const initialized = useRef(false)

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return null
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('hsf_profiles')
          .select('user_id, display_name, phone, role, house_slug, loyalty_points, created_at')
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event)

      if (event === 'PASSWORD_RECOVERY') {
        goToResetPassword()
      }

      const currentUser = session?.user ?? null

      if (mounted) {
        setUser(currentUser)

        if (currentUser) {
          fetchProfile(currentUser.id).catch((err) => {
            console.error('fetchProfile after auth change failed:', err)
          })
        } else {
          setProfile(null)
        }
      }
    })

    const initAuth = async () => {
      try {
        setLoading(true)

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) throw error

        const currentUser = session?.user ?? null

        if (mounted) {
          setUser(currentUser)

          if (currentUser) {
            await fetchProfile(currentUser.id)
          }

          if (isRecoveryUrl) {
            goToResetPassword()
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        if (mounted) setAuthError(err.message)
      } finally {
        if (mounted) {
          setLoading(false)
          initialized.current = true
        }
      }
    }

    initAuth()

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [fetchProfile])

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
