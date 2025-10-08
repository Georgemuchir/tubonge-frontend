import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await login(formData);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 p-4 rounded-2xl shadow-lg">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-center text-2xl font-light text-gray-900 mb-8 tracking-wide">
          Pinglo
        </h1>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-gray-400 transition-colors"
            placeholder="Phone number, username, or email"
            required
          />

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-gray-400 transition-colors"
            placeholder="Password"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-blue-600 focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-6 mb-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400 font-semibold">OR</span>
            </div>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mb-8 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-700 font-medium mb-1">Demo Account:</p>
          <p className="text-xs text-blue-600">
            demo@pinglo.app / demo123
          </p>
        </div>

        {/* Forgot Password */}
        <div className="text-center">
          <Link to="#" className="text-xs text-blue-900 hover:text-blue-700">
            Forgot password?
          </Link>
        </div>
      </div>

      {/* Sign Up Section */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-500 font-semibold hover:text-blue-400">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;