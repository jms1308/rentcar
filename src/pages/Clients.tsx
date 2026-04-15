import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Plus, Search, User, Phone, MapPin, X, History } from 'lucide-react';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchClients = () => {
    setLoading(true);
    api.get(`/clients?search=${search}`).then(res => {
      setClients(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    const timer = setTimeout(fetchClients, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    await api.post('/clients', data);
    setShowModal(false);
    fetchClients();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Mijozlar</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Mijoz qo'shish</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Ism yoki telefon bo'yicha qidiruv..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Mijoz</th>
                <th className="px-6 py-4 font-medium">Telefon</th>
                <th className="px-6 py-4 font-medium">Passport</th>
                <th className="px-6 py-4 font-medium">Manzil</th>
                <th className="px-6 py-4 font-medium">Ijaralar soni</th>
                <th className="px-6 py-4 font-medium text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Yuklanmoqda...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Mijozlar topilmadi</td></tr>
              ) : clients.map((client: any) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {client.first_name[0]}
                      </div>
                      <div className="font-medium text-gray-900">{client.first_name} {client.last_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono">{client.phone}</td>
                  <td className="px-6 py-4 text-gray-600">{client.passport_series} {client.passport_number}</td>
                  <td className="px-6 py-4 text-gray-600 truncate max-w-[200px]">{client.address}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {client.rental_count} ta
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Tarix">
                      <History size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">Yangi mijoz qo'shish</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ism</label>
                  <input name="first_name" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Familiya</label>
                  <input name="last_name" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input name="phone" required placeholder="+998901234567" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seriya</label>
                  <input name="passport_series" required placeholder="AA" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Raqam</label>
                  <input name="passport_number" required placeholder="1234567" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manzil</label>
                <textarea name="address" rows={2} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"></textarea>
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
