import { Outlet } from 'react-router-dom'
import Navigation from './Navigation'

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <Outlet />
        </div>
      </main>
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="text-center text-sm text-gray-600">
            © {new Date().getFullYear()} Taste. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout 