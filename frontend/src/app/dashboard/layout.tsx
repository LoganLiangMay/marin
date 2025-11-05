'use client'

/**
 * Dashboard Layout with Navigation
 * Story 6.1: Next.js Project Setup with Authentication
 */

import { ProtectedRoute } from '@/hooks/use-auth'
import { DashboardNav } from '@/components/dashboard-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <main className="lg:pl-64 pt-16">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
