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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B1120]/80 backdrop-blur-xl border-b border-indigo-500/20 shadow-lg shadow-indigo-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                Snippets
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-1">
              <Link to="/public" className="px-4 py-2 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-500/10 transition-all duration-200 text-sm font-medium">
                Public Data
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/directories" className="px-4 py-2 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-500/10 transition-all duration-200 text-sm font-medium">
                    Directories
                  </Link>
                  <Link to="/snippets" className="px-4 py-2 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-500/10 transition-all duration-200 text-sm font-medium">
                    Snippets
                  </Link>
                  <Link to="/groups" className="px-4 py-2 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-500/10 transition-all duration-200 text-sm font-medium">
                    Groups
                  </Link>
                  <div className="relative ml-3 group">
                    <button className="flex items-center space-x-1 px-4 py-2 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-500/10 transition-all duration-200">
                      <span className="text-sm font-medium">{user?.username}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="hidden group-hover:block absolute right-0 mt-1 w-48 rounded-xl bg-[#0B1120]/90 backdrop-blur-xl border border-indigo-500/30 shadow-lg py-1">
                      <Link to="/profile" className="block px-4 py-2 text-sm text-indigo-300 hover:text-white transition-colors duration-200">
                        Profile
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-indigo-300 hover:text-white transition-colors duration-200"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4 ml-4">
                  <Link to="/login" className="text-indigo-300 hover:text-white transition-colors duration-200 text-sm font-medium">
                    Sign in
                  </Link>
                  <Link to="/register" className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]">
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
              className="inline-flex items-center justify-center p-2 rounded-md text-indigo-300 hover:text-white hover:bg-indigo-500/10 transition-colors duration-200"
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
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden bg-[#0B1120]/90 backdrop-blur-xl border-t border-indigo-500/20`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link to="/public" className="text-indigo-300 hover:text-white transition-colors duration-200 block px-3 py-2 rounded-md text-base font-medium">
            Public Data
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/directories" className="text-indigo-300 hover:text-white transition-colors duration-200 block px-3 py-2 rounded-md text-base font-medium">
                Directories
              </Link>
              <Link to="/snippets" className="text-indigo-300 hover:text-white transition-colors duration-200 block px-3 py-2 rounded-md text-base font-medium">
                Snippets
              </Link>
              <Link to="/groups" className="text-indigo-300 hover:text-white transition-colors duration-200 block px-3 py-2 rounded-md text-base font-medium">
                Groups
              </Link>
              <Link to="/profile" className="text-indigo-300 hover:text-white transition-colors duration-200 block px-3 py-2 rounded-md text-base font-medium">
                Profile
              </Link>
              <button 
                onClick={handleLogout}
                className="text-indigo-300 hover:text-white transition-colors duration-200 block w-full text-left px-3 py-2 rounded-md text-base font-medium"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-indigo-300 hover:text-white transition-colors duration-200 block px-3 py-2 rounded-md text-base font-medium">
                Sign in
              </Link>
              <Link to="/register" className="text-indigo-300 hover:text-white transition-colors duration-200 block px-3 py-2 rounded-md text-base font-medium">
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