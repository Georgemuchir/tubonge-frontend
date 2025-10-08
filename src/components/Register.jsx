import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
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
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password
    });

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
        <h1 className="text-center text-2xl font-light text-gray-900 mb-2 tracking-wide">
          Pinglo
        </h1>
        <p className="text-center text-gray-500 text-sm mb-8">
          Sign up to see photos and videos from your friends.
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-gray-400 transition-colors"
            placeholder="Mobile Number or Email"
            required
          />

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-gray-400 transition-colors"
            placeholder="Full Name"
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
            minLength={6}
          />

          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-gray-400 transition-colors"
            placeholder="Confirm Password"
            required
            minLength={6}
          />

          {/* Terms */}
          <div className="py-4">
            <p className="text-xs text-gray-500 text-center leading-4">
              People who use our service may have uploaded your contact information to Pinglo.{' '}
              <a href="#" className="text-gray-700">Learn More</a>
            </p>
          </div>

          <div className="py-2">
            <p className="text-xs text-gray-500 text-center leading-4">
              By signing up, you agree to our{' '}
              <a href="#" className="text-gray-700">Terms</a>,{' '}
              <a href="#" className="text-gray-700">Data Policy</a> and{' '}
              <a href="#" className="text-gray-700">Cookies Policy</a>.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-blue-600 focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>
      </div>

      {/* Login Section */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Have an account?{' '}
            <Link to="/login" className="text-blue-500 font-semibold hover:text-blue-400">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;