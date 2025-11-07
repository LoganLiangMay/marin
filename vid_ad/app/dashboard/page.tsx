'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail] = useState('user@example.com');

  useEffect(() => {
    // Check if auth cookie exists
    const hasAuth = document.cookie.includes('authToken=');
    if (!hasAuth) {
      router.push('/auth/login');
    }
  }, [router]);

  const handleLogout = () => {
    // Clear the auth cookie
    document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">AI Video Ad Generator</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{userEmail}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to AI Video Ad Generator!
              </h2>
              <p className="text-gray-600">
                Start creating professional video advertisements with the power of AI.
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Projects Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Active Projects</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">0</dd>
                <div className="mt-3">
                  <button
                    onClick={() => router.push('/generate')}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Create New Project →
                  </button>
                </div>
              </div>
            </div>

            {/* Videos Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Videos Generated</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">0</dd>
                <div className="mt-3">
                  <button className="text-sm text-indigo-600 hover:text-indigo-500">
                    View All Videos →
                  </button>
                </div>
              </div>
            </div>

            {/* Credits Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Available Credits</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">100</dd>
                <div className="mt-3">
                  <button className="text-sm text-indigo-600 hover:text-indigo-500">
                    Buy More Credits →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-6 sm:px-0">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => router.push('/generate')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition duration-150 ease-in-out flex flex-col items-center"
            >
              <span className="text-2xl mb-1">🎬</span>
              Generate Video with AI
            </button>
            <button className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 transition duration-150 ease-in-out flex flex-col items-center">
              <span className="text-2xl mb-1">📚</span>
              Browse Templates
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  This is a demo version. Your session will remain active until you logout.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}