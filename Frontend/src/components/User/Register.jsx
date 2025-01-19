import { useState } from 'react';
import { useUser } from '../../Context/UserContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const { register } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/30 to-violet-600/30"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-25"></div>
      <div className="absolute top-0 -left-4 w-72 h-72 bg-violet-500 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob animation-delay-4000"></div>

      {/* Main Content */}
      <div className="max-w-md w-full m-4 relative z-10">
        <div className="bg-[#0B1120]/90 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 p-8 hover:shadow-indigo-500/10 transition-all duration-300">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
              Create your account
            </h2>
            <p className="mt-2 text-indigo-300/80">Join our community of developers</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300 text-sm backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-1">Username</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 shadow-[0_0_25px_rgba(99,102,241,0.35)] hover:shadow-[0_0_35px_rgba(99,102,241,0.45)]"
            >
              Create Account
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors duration-200"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;