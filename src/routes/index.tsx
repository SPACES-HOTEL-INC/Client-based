import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { RefreshCw } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: MaintenancePage,
})

function MaintenancePage() {
  // Lock background scrolling on document body when mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.body.style.height = '100vh'
    
    return () => {
      document.body.style.overflow = ''
      document.body.style.height = ''
    }
  }, [])

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 h-screen w-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-6 overflow-hidden select-none z-[9999]">
      {/* Background Radial Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header using public/favicon.svg */}
      <header className="pt-8 z-10 flex items-center gap-3">
        <img 
          src="/favicon.svg" 
          alt="SPACES Logo" 
          className="h-10 w-auto object-contain" 
        />
        <span className="text-2xl font-black tracking-tight text-white uppercase">
          SPACES
        </span>
      </header>

      {/* Main Maintenance Card */}
      <main className="max-w-md w-full text-center space-y-6 z-10 my-auto py-6">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          Scheduled Upgrade
        </div>

        {/* Headings */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            We’re Enhancing Your Experience
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            SPACES is currently undergoing brief scheduled maintenance to improve platform performance and bring you new stays. We will be back online shortly.
          </p>
        </div>

        {/* Action Button: Check Status Only */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={handleRefresh}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Check Status
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-6 text-xs text-slate-500 z-10">
        &copy; {new Date().getFullYear()} SPACES Hospitality Inc. All rights reserved.
      </footer>
    </div>
  )
}