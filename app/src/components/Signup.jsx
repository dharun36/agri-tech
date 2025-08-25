import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSeedling, FaUserPlus, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLock } from 'react-icons/fa';
import { useTranslation } from 'react-i18next'

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', latitude: '', longitude: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm((prev) => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          }));
        },
        (err) => {
          alert('Failed to get location: ' + err.message);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form };
      if (form.latitude && form.longitude) {
        payload.location = {
          type: 'Point',
          coordinates: [parseFloat(form.longitude), parseFloat(form.latitude)]
        };
        delete payload.latitude;
        delete payload.longitude;
      }
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');
      localStorage.setItem('token', data.token);
      window.dispatchEvent(new Event('storage'));
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      {/* Header for signup page */}
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

      <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-center gap-8 h-full">
        {/* Left Column with Text */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start order-2 md:order-1">
          <div className="mb-4 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2">
              Join the <span className="text-green-600">AgriTech</span> Community
            </h1>
            <p className="text-md text-gray-600 max-w-md mb-4">
              Sign up to access AI-powered tools for plant disease detection, personalized crop recommendations, and real-time market data.
            </p>
          </div>
          <img
            src="https://source.unsplash.com/f-UM_CX_fhI"
            alt="Smart Farming"
            className="w-full max-w-md rounded-lg shadow-xl hidden md:block"
          />
        </div>

        {/* Right Column with Signup Form */}
        <div className="w-full md:w-1/2 max-w-md order-1 md:order-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl p-6 "
          >
            <div className="flex flex-col items-center mb-3">

              <h2 className="text-xl font-bold text-gray-800 mb-1">
                {t('sign_up')}
              </h2>
              <p className="text-sm text-gray-600">{t('signup_welcome')}</p>
            </div>

            <div className="mb-2">
              <label className="block text-gray-700 text-sm font-medium mb-1">{t('name')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                  placeholder="Your Name"
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-gray-700 text-sm font-medium mb-1">{t('email')}</label>
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
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                  placeholder="you@email.com"
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-gray-700 text-sm font-medium mb-1">{t('phone_number')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                  placeholder="Your phone number"
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-gray-700 text-sm font-medium mb-1">{t('farm_location')}</label>
              <div className="grid grid-cols-2 gap-2 mb-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="latitude"
                    value={form.latitude}
                    onChange={handleChange}
                    step="any"
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                    placeholder="Latitude"
                  />
                </div>
                <input
                  type="number"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  step="any"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                  placeholder="Longitude"
                />
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1"
              >
                <FaMapMarkerAlt /> {t('use_my_location')}
              </button>
            </div>

            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-medium mb-1">{t('password')}</label>
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
                  minLength={6}
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                  placeholder="Create a password (min. 6 characters)"
                />
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-2 text-sm rounded-lg mb-3">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              {loading ? t('signing_up') : <>{t('sign_up')} <FaUserPlus /></>}
            </button>

            <div className="text-center mt-3 text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-green-600 font-semibold hover:underline">
                {t('login_title')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
