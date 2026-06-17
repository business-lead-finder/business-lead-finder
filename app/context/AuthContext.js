'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [hasPaid, setHasPaid] = useState(null)
  const [loading, setLoading] = useState(true)
  const paidCache = useRef({}) // cache userId -> paid so re-renders don't flicker

  async function checkPayment(userId) {
    // Return cached value instantly if we already know
    if (paidCache.current[userId] === true) {
      setHasPaid(true)
      return
    }
    const { data } = await supabase
      .from('user_access')
      .select('paid')
      .eq('user_id', userId)
      .single()
    const paid = data?.paid === true
    paidCache.current[userId] = paid
    setHasPaid(paid)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) await checkPayment(u.id)
      else setHasPaid(null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        // Don't reset hasPaid to null if we already have a cached value
        if (paidCache.current[u.id] !== undefined) {
          setHasPaid(paidCache.current[u.id])
        } else {
          await checkPayment(u.id)
        }
      } else {
        setHasPaid(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signUp(email, password) {
    return await supabase.auth.signUp({ email, password })
  }

  async function signIn(email, password) {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setHasPaid(null)
    paidCache.current = {}
  }

  return (
    <AuthContext.Provider value={{ user, hasPaid, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
