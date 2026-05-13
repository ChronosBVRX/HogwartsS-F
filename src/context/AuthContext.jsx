import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

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
      const { data, error } = await supabase
        .from('hsf_profiles')
        .select('*, house:hsf_houses(*)')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()

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

    const initAuth = async () => {
      try {
        setLoading(true)
        
        // 1. Get initial session immediately
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error

        const currentUser = session?.user ?? null
        if (mounted) {
          setUser(currentUser)
          if (currentUser) {
            await fetchProfile(currentUser.id)
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

    // 2. Listen for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Avoid re-fetching profile during initial load if initAuth is already doing it
      if (!initialized.current && event === 'SIGNED_IN') return

      console.log('Auth event:', event)
      const currentUser = session?.user ?? null
      
      if (mounted) {
        setUser(currentUser)
        if (currentUser) {
          await fetchProfile(currentUser.id)
        } else {
          setProfile(null)
        }
      }
    })

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
