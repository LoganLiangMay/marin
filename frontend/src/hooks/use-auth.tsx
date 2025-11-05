'use client'

/**
 * Authentication Hook and Context
 * Story 6.1: Next.js Project Setup with Authentication
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, login as authLogin, logout as authLogout, getUser, isAdmin, isAnalyst } from '@/lib/auth'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
  isAnalyst: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check authentication status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const currentUser = await getUser()
      setUser(currentUser)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function login(email: string, password: string) {
    try {
      await authLogin(email, password)
      const currentUser = await getUser()
      setUser(currentUser)
      toast.success('Successfully logged in')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Login error:', error)
      let errorMessage = 'Failed to login'

      if (error.name === 'UserNotFoundException' || error.name === 'NotAuthorizedException') {
        errorMessage = 'Invalid email or password'
      } else if (error.name === 'UserNotConfirmedException') {
        errorMessage = 'Please confirm your email address'
      }

      toast.error(errorMessage)
      throw error
    }
  }

  async function logout() {
    try {
      await authLogout()
      setUser(null)
      toast.success('Successfully logged out')
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout')
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: isAdmin(user),
    isAnalyst: isAnalyst(user),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Protected route wrapper
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
