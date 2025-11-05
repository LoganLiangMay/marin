/**
 * Authentication utilities using AWS Amplify
 * Story 6.1: Next.js Project Setup with Authentication
 */

import { Amplify } from 'aws-amplify'
import { signIn, signOut, getCurrentUser, fetchAuthSession, SignInOutput } from 'aws-amplify/auth'

// Configure Amplify
if (typeof window !== 'undefined') {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
        userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
        loginWith: {
          email: true,
        },
      },
    },
  })
}

export interface User {
  userId: string
  email?: string
  name?: string
  groups: string[]
}

export interface AuthTokens {
  accessToken: string
  idToken: string
  refreshToken?: string
}

/**
 * Sign in with email and password
 */
export async function login(email: string, password: string): Promise<SignInOutput> {
  try {
    const result = await signIn({
      username: email,
      password,
    })
    return result
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

/**
 * Sign out current user
 */
export async function logout(): Promise<void> {
  try {
    await signOut()
  } catch (error) {
    console.error('Logout error:', error)
    throw error
  }
}

/**
 * Get current authenticated user
 */
export async function getUser(): Promise<User | null> {
  try {
    const user = await getCurrentUser()
    const session = await fetchAuthSession()

    // Extract groups from token
    const groups = (session.tokens?.accessToken?.payload['cognito:groups'] as string[]) || []

    return {
      userId: user.userId,
      email: user.signInDetails?.loginId,
      name: user.username,
      groups,
    }
  } catch (error) {
    return null
  }
}

/**
 * Get authentication tokens
 */
export async function getAuthTokens(): Promise<AuthTokens | null> {
  try {
    const session = await fetchAuthSession()

    if (!session.tokens) {
      return null
    }

    return {
      accessToken: session.tokens.accessToken.toString(),
      idToken: session.tokens.idToken?.toString() || '',
      refreshToken: session.tokens.refreshToken?.toString(),
    }
  } catch (error) {
    return null
  }
}

/**
 * Check if user has specific role
 */
export function hasRole(user: User | null, role: string): boolean {
  if (!user) return false
  return user.groups.includes(role)
}

/**
 * Check if user is admin
 */
export function isAdmin(user: User | null): boolean {
  return hasRole(user, 'admins')
}

/**
 * Check if user is analyst
 */
export function isAnalyst(user: User | null): boolean {
  return hasRole(user, 'analysts') || isAdmin(user)
}
