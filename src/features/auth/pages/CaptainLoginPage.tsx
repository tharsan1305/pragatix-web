import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../api/client';
import { useAuth } from '../../../store/authContext';

export const CaptainLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/api/v1/auth/login', {
        username,
        password,
      });

      const { token, user } = response.data;
      const captainUser = {
        ...user,
        role: 'CAPTAIN',
        roles: Array.from(new Set([...(user?.roles || []), 'CAPTAIN', 'ROLE_CAPTAIN'])),
        isCaptain: true,
      };

      login(token, captainUser);
      navigate('/captain', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div>
          <h2 className="type-h3 mt-2 text-center text-gray-900">
            🏆 Captain Portal Login
          </h2>
          <p className="type-body-sm mt-2 text-center text-gray-600">
            Log in with your Captain credentials
          </p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md type-caption">
            {error}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="type-form-label block text-gray-700">Username / Staff ID</label>
              <input
                type="text"
                required
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 type-body-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="type-form-label block text-gray-700">Password</label>
              <input
                type="password"
                required
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 type-body-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="type-btn w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login as Captain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaptainLoginPage;
