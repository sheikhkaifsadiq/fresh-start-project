'use client'

import React from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden">
      <Navbar />
      
      {/* Container below fixed navbar */}
      <div className="flex flex-1 overflow-hidden pt-16">
        <Sidebar />
        
        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 relative z-0">
          <div className="mx-auto max-w-[1600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
