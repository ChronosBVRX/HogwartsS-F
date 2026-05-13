import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

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
      console.error('fetchProfile crashed:', err)
      setProfile(null)
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        setLoading(true)
        setAuthError(null)

        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('getSession error:', error)
          if (!mounted) return
          setUser(null)
          setProfile(null)
          setAuthError(error.message)
          return
        }

        const sessionUser = data?.session?.user ?? null

        if (!mounted) return

        setUser(sessionUser)

        if (sessionUser) {
          await fetchProfile(sessionUser.id)
        } else {
          setProfile(null)
        }
      } catch (err) {
        console.error('Auth init crashed:', err)
        if (!mounted) return
        setUser(null)
        setProfile(null)
        setAuthError(err?.message || 'Error iniciando sesión')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        const currentUser = session?.user ?? null

        if (!mounted) return

        setUser(currentUser)

        if (currentUser) {
          await fetchProfile(currentUser.id)
        } else {
          setProfile(null)
        }
      } catch (err) {
        console.error('Auth state change crashed:', err)
        if (!mounted) return
        setUser(null)
        setProfile(null)
      } finally {
        if (mounted) setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe?.()
    }
  }, [fetchProfile])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    } catch (err) {
      console.error('signOut crashed:', err)
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
