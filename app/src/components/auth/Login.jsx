import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSeedling, FaSignInAlt, FaEnvelope, FaLock } from 'react-icons/fa';
import { useTranslation } from 'react-i18next'

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/home');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      // Store both token and userId
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userName', data.user.name);
      if (data.user.location) {
        localStorage.setItem('userLocation', JSON.stringify(data.user.location));
      }

      window.dispatchEvent(new Event('storage'));
      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      {/* Header for login page */}
      <header className="bg-white py-4 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/">
            <div className="flex items-center">
              <div>
                <span className="font-bold text-2xl text-green-600">Agri</span>
                <span className="font-bold text-2xl text-yellow-500">Tech</span>
              </div>
            </div>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-6 py-20 flex flex-col md:flex-row items-center justify-center gap-12">
        {/* Left Column with Image and Text */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
              Welcome Back to <span className="text-green-600">AgriTech</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-md">
              Login to access your personalized farming solutions and continue your journey to sustainable agriculture.
            </p>
          </div>
          {/* <img
            src="https://media.istockphoto.com/id/503646746/photo/farmer-spreading-fertilizer-in-the-field-wheat.jpg?s=612x612&w=0&k=20&c=Lgxsjbz0jaYyQrvfzhyAsW2zELtshRP4AtLzkpmcLiE="
            alt="Farming Community"
            className="w-full max-w-md rounded-lg shadow-xl hidden md:block"
          /> */}
        </div>

        {/* Right Column with Login Form */}
        <div className="w-full md:w-1/2 max-w-md">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl p-8"
          >
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-3xl mb-3">
                <FaSeedling />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {t('login_title')}
              </h2>
              <p className="text-gray-600">{t('login_welcome')}</p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">{t('email')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                  placeholder="you@email.com"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">{t('password')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                  placeholder="Your password"
                />
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              {loading ? t('logging_in') : <>{t('login_title')} <FaSignInAlt /></>}
            </button>

            <div className="text-center mt-6 text-gray-600">
              {t('new_to_agritech')}{' '}
              <Link to="/signup" className="text-green-600 font-semibold hover:underline">
                {t('sign_up')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
