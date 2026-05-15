import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(() => {
    try {
      const cached = localStorage.getItem('hsf_user_profile')
      return cached ? JSON.parse(cached) : null
    } catch (e) { return null }
  })
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  
  const fetchingProfile = useRef(false)
  const lastUserId = useRef(null)

  const ensureHsfProfile = async (u) => {
    if (!u?.id || fetchingProfile.current) return
    fetchingProfile.current = true
    setProfileLoading(true)
    
    try {
      const { data, error } = await supabase.rpc('hsf_ensure_profile')
      if (!error && data?.ok) {
        setProfile(data.data)
        localStorage.setItem('hsf_user_profile', JSON.stringify(data.data))
      }
    } catch (e) {
      console.error('Error ensuring profile:', e)
    } finally {
      fetchingProfile.current = false
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    // 1. Inicialización inmediata
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        lastUserId.current = currentUser.id
        ensureHsfProfile(currentUser)
      }
      setLoading(false)
    }
    init()

    // 2. Escuchar cambios
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      if (currentUser) {
        if (lastUserId.current !== currentUser.id) {
          lastUserId.current = currentUser.id
          ensureHsfProfile(currentUser)
        }
      } else {
        lastUserId.current = null
        setProfile(null)
        localStorage.removeItem('hsf_user_profile')
      }
      setLoading(false)
    })

    return () => subscription?.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    localStorage.removeItem('hsf_user_profile')
    window.location.href = '/'
  }

  const value = {
    user,
    profile,
    loading,
    profileLoading,
    isAdmin: profile?.role === 'admin',
    isWaiter: ['waiter', 'admin'].includes(profile?.role),
    refreshProfile: () => user ? ensureHsfProfile(user) : null,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
