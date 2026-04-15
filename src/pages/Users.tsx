import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Plus, Shield, ShieldCheck, X, Lock } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users').then(res => {
      setUsers(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    await api.post('/users', data);
    setShowModal(false);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Foydalanuvchilar</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Yangi menejer</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Foydalanuvchi</th>
                <th className="px-6 py-4 font-medium">Username</th>
                <th className="px-6 py-4 font-medium">Rol</th>
                <th className="px-6 py-4 font-medium">Holat</th>
                <th className="px-6 py-4 font-medium text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Yuklanmoqda...</td></tr>
              ) : users.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        {user.full_name[0]}
                      </div>
                      <div className="font-medium text-gray-900">{user.full_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono">{user.username}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      {user.role === 'admin' ? <ShieldCheck size={16} className="text-purple-600" /> : <Shield size={16} className="text-blue-600" />}
                      <span className={`text-sm font-medium capitalize ${user.role === 'admin' ? 'text-purple-700' : 'text-blue-700'}`}>{user.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.is_active ? 'Faol' : 'Bloklangan'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <Lock size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">Yangi menejer qo'shish</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">F.I.SH</label>
                <input name="full_name" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input name="username" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parol</label>
                <input name="password" type="password" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select name="role" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="manager">Menejer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="mt-8 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">Bekor qilish</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
