import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSeedling, FaSignInAlt } from 'react-icons/fa';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem('token', data.token);
      window.dispatchEvent(new Event('storage'));
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-white">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-green-100 flex flex-col justify-center"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-green-300 shadow text-green-600 text-3xl mb-2">
            <FaSeedling />
          </div>
          <h2 className="text-2xl font-bold text-green-700 mb-1 flex items-center gap-2">
            <FaSignInAlt /> Login
          </h2>
          <p className="text-gray-500 text-sm">Welcome back to your agri dashboard!</p>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition"
            placeholder="you@email.com"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition"
            placeholder="Your password"
          />
        </div>
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white py-2 rounded-lg font-semibold shadow hover:from-green-500 hover:to-green-700 transition flex items-center justify-center gap-2"
        >
          {loading ? 'Logging in...' : <><FaSignInAlt /> Login</>}
        </button>
        <div className="text-center mt-4 text-gray-600 text-sm">
          New to AgriTech?{' '}
          <Link to="/signup" className="text-green-600 font-semibold hover:underline">Sign Up</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
