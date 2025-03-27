import { Link } from 'react-router-dom'

const Navigation = () => {
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-xl font-bold text-primary-600">
            Taste
          </Link>
          <div className="flex space-x-4">
            <Link
              to="/tasting-notes"
              className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Tasting Notes
            </Link>
            <Link
              to="/profile"
              className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Profile
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation 