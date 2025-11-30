import { useState } from 'react';
import { Sidebar } from './Sidebar';
import type { City } from '../types';

interface LayoutProps {
  cities: City[];
  children: React.ReactNode;
}

export function Layout({ cities, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-40 flex items-center px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="ml-3 font-semibold text-gray-900">100 Cities for Kids</span>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 z-50
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar cities={cities} onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <main className="lg:ml-72 min-h-screen pt-14 lg:pt-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
