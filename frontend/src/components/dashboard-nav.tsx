'use client'

/**
 * Dashboard Navigation Component
 * Story 6.1: Next.js Project Setup with Authentication
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import {
  HomeIcon,
  PhoneIcon,
  ChartBarIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  SearchIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Calls', href: '/dashboard/calls', icon: PhoneIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Insights', href: '/dashboard/insights', icon: LightBulbIcon },
  { name: 'Quality', href: '/dashboard/quality', icon: ShieldCheckIcon, adminOnly: false, analystOnly: true },
  { name: 'Search', href: '/dashboard/search', icon: SearchIcon },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { user, logout, isAdmin, isAnalyst } = useAuth()

  // Filter navigation based on user role
  const filteredNav = navigation.filter((item) => {
    if (item.adminOnly && !isAdmin) return false
    if (item.analystOnly && !isAnalyst) return false
    return true
  })

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-brand-600">Audio Pipeline</h1>
          </div>
          <button
            onClick={() => logout()}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-brand-600">Audio Pipeline</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-brand-600'
                  )}
                >
                  <item.icon
                    className={clsx(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-brand-600'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-brand-600" />
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {isAdmin ? 'Admin' : isAnalyst ? 'Analyst' : 'User'}
                </p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="mt-3 w-full btn btn-secondary btn-sm flex items-center justify-center"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
