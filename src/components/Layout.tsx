import { Outlet } from 'react-router-dom'
import Navigation from './Navigation'

const Layout = () => {
  return (
    <div className="min-h-screen bg-[#FDF1ED]">
      <Navigation />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
      <footer className="bg-[#FDF1ED] mt-auto py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <div className="border-t border-[#E76F51]/10 mb-6" />
              <p className="text-sm text-[#E76F51]/70 font-medium">
                © {new Date().getFullYear()} Taste. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout 