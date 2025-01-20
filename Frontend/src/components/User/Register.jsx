import { useState, useEffect } from 'react';
import { useUser } from '../../Context/UserContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const backgroundImages = [
    "url(/src/assets/Anime_Pastel_Dream_Create_a_hyperrealistic_night_sky_landscape_0.jpg)",
    "url(/src/assets/Absolute_Reality_v16_Create_a_hyperrealistic_night_sky_landsca_0.jpg)",
    "url(/src/assets/Anime_Pastel_Dream_Create_a_hyperrealistic_night_sky_landscape_1.jpg)",
    ];

  const [backgroundImage, setBackgroundImage] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const { register } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const randomImage = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
    setBackgroundImage(randomImage);
  }, []);

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
         style={{
           backgroundImage: backgroundImage,
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundRepeat: 'no-repeat'
         }}>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-900/30 to-black/50"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>

      {/* Main Content */}
      <div className="max-w-md w-full m-4 relative z-10">
        <div className="backdrop-blur-xl backdrop-filter bg-white/10 rounded-2xl shadow-lg border border-white/20 p-8 hover:shadow-indigo-500/10 transition-all duration-300">
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
                  className="w-full px-4 py-3 rounded-xl bg-violet-500/10 border border-white text-white placeholder-indigo-400/60 focus:border-white focus:ring-1 focus:ring-white transition-all duration-200"
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
                  className="w-full px-4 py-3 rounded-xl bg-violet-500/10 border border-white text-white placeholder-indigo-400/60 focus:border-white focus:ring-1 focus:ring-white transition-all duration-200"
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
                  className="w-full px-4 py-3 rounded-xl bg-violet-500/10 border border-white text-white placeholder-indigo-400/60 focus:border-white focus:ring-1 focus:ring-white transition-all duration-200"
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
                  className="w-full px-4 py-3 rounded-xl bg-violet-500/10 border border-white text-white placeholder-indigo-400/60 focus:border-white focus:ring-1 focus:ring-white transition-all duration-200"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-300 shadow-[0_0_25px_rgba(139,92,246,0.35)] hover:shadow-[0_0_35px_rgba(139,92,246,0.45)]"
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