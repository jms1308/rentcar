import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Lock, User } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Backend login
      const data = await api.post('/login', { username, password });
      
      if (data && data.token) {
        // 2. Firebase login/sync
        const email = username.includes('@') ? username : `${username}@autorent.uz`;
        try {
          // Try to sign in
          await signInWithEmailAndPassword(auth, email, password);
        } catch (fbErr: any) {
          // If user doesn't exist in Firebase, create them (sync with backend)
          if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential') {
            try {
              await createUserWithEmailAndPassword(auth, email, password);
            } catch (createErr) {
              console.error('Firebase Create Error:', createErr);
            }
          } else {
            console.error('Firebase Auth Error:', fbErr);
          }
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
      } else {
        setError('Login yoki parol noto\'g\'ri');
      }
    } catch (err: any) {
      setError(err.message || 'Server bilan bog\'lanishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-[#1e3a5f] p-8 text-center">
          <h1 className="text-3xl font-bold text-blue-400 tracking-wider">AUTORENT</h1>
          <p className="text-gray-300 mt-2">Tizimga kirish</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Foydalanuvchi nomi</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <User size={18} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="admin"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parol</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Lock size={18} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Kirilmoqda...' : 'Kirish'}
          </button>
        </form>
        
        <div className="p-6 bg-gray-50 text-center border-t border-gray-100">
          <p className="text-xs text-gray-500">© 2026 AutoRent Management System</p>
        </div>
      </div>
    </div>
  );
}
