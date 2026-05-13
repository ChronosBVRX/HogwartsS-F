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
      // Use a timeout for profile fetching
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      )
      
      const request = supabase
        .from('hsf_profiles')
        .select('*, house:hsf_houses(*)')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()

      const { data, error } = await Promise.race([request, timeout])

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

    // Single listener for all auth states (including initial load)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id)
      
      const currentUser = session?.user ?? null
      
      if (!mounted) return

      setUser(currentUser)
      
      if (currentUser) {
        await fetchProfile(currentUser.id)
      } else {
        setProfile(null)
      }

      // Mark as initialized after the first auth state is handled
      if (!initialized.current) {
        initialized.current = true
        setLoading(false)
      }
    })

    // Fallback if onAuthStateChange doesn't fire for some reason
    const timer = setTimeout(() => {
      if (mounted && !initialized.current) {
        console.warn('Auth initialization fallback triggered')
        setLoading(false)
        initialized.current = true
      }
    }, 6000)

    return () => {
      mounted = false
      subscription?.unsubscribe()
      clearTimeout(timer)
    }
  }, [fetchProfile])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      // Force reload to clear any stale state
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
