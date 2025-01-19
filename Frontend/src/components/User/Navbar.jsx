import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../Context/UserContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-white font-bold text-xl">
              Snippets
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link to="/snippets" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    My Snippets
                  </Link>
                  <Link to="/snippets/new" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Create Snippet
                  </Link>
                  <Link to="/groups" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Groups
                  </Link>
                  <div className="relative ml-3 group">
                    <button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                      <span className="text-gray-300 hover:text-white">{user?.username}</span>
                    </button>
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block">
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Profile
                      </Link>
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Sign in
                  </Link>
                  <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              <svg className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          {isAuthenticated ? (
            <>
              <Link to="/snippets" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                My Snippets
              </Link>
              <Link to="/snippets/new" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                Create Snippet
              </Link>
              <Link to="/groups" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                Groups
              </Link>
              <Link to="/profile" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                Profile
              </Link>
              <button 
                onClick={handleLogout}
                className="text-gray-300 hover:text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                Sign in
              </Link>
              <Link to="/register" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;