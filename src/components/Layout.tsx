import { Outlet } from 'react-router-dom'
import Navigation from './Navigation'

const Layout = () => {
  return (
    <div className="min-h-screen bg-[#FDF1ED]">
      <Navigation />
      <main className="flex-grow">
        <div className="relative">
          <div className="relative z-10">
            <Outlet />
          </div>
        </div>
      </main>
      <footer className="bg-[#FDF1ED] mt-auto">
        <div>
          <div className="text-center">
            <div className="taste-divider mb-6" />
            <p className="text-sm text-[#E76F51]/60 font-medium">
              © {new Date().getFullYear()} Taste. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout 