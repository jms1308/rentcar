import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Plus, Search, Edit2, Trash2, X, Upload, Car } from 'lucide-react';

export default function Cars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('hammasi');
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState<any>(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  const fetchCars = () => {
    setLoading(true);
    api.get(`/cars?status=${statusFilter}&search=${search}`).then(res => {
      setCars(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    const timer = setTimeout(fetchCars, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Haqiqatan ham o\'chirmoqchimisiz?')) {
      await api.delete(`/cars/${id}`);
      fetchCars();
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (editingCar) {
      await api.putFormData(`/cars/${editingCar.id}`, formData);
    } else {
      await api.postFormData('/cars', formData);
    }
    
    setShowModal(false);
    setEditingCar(null);
    fetchCars();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Mashinalar</h1>
        {isAdmin && (
          <button 
            onClick={() => { setEditingCar(null); setShowModal(true); }}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Mashina qo'shish</span>
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Raqam yoki model bo'yicha qidiruv..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="hammasi">Barcha holatlar</option>
          <option value="bor">Bor</option>
          <option value="ijarada">Ijarada</option>
          <option value="tamirda">Ta'mirda</option>
          <option value="rezerv">Rezerv</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Rasm</th>
                <th className="px-6 py-4 font-medium">Raqam</th>
                <th className="px-6 py-4 font-medium">Brend & Model</th>
                <th className="px-6 py-4 font-medium">Yil / Rang</th>
                <th className="px-6 py-4 font-medium">Kunlik narx</th>
                <th className="px-6 py-4 font-medium">Holat</th>
                <th className="px-6 py-4 font-medium text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">Yuklanmoqda...</td></tr>
              ) : cars.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">Mashinalar topilmadi</td></tr>
              ) : cars.map((car: any) => (
                <tr key={car.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-16 h-10 rounded bg-gray-100 overflow-hidden">
                      {car.image_url ? (
                        <img src={car.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400"><Car size={20} /></div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-gray-900">{car.plate_number}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{car.brand}</div>
                    <div className="text-sm text-gray-500">{car.model}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{car.year}</div>
                    <div className="text-sm text-gray-500">{car.color}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{car.daily_price.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={car.status} />
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {isAdmin && (
                      <>
                        <button 
                          onClick={() => { setEditingCar(car); setShowModal(true); }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(car.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Car Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">
                {editingCar ? 'Mashinani tahrirlash' : 'Yangi mashina qo\'shish'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Davlat raqami</label>
                  <input name="plate_number" defaultValue={editingCar?.plate_number} required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brend</label>
                  <input name="brand" defaultValue={editingCar?.brand} required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input name="model" defaultValue={editingCar?.model} required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yil</label>
                  <input name="year" type="number" defaultValue={editingCar?.year} required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rang</label>
                  <input name="color" defaultValue={editingCar?.color} required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kunlik narx (so'm)</label>
                  <input name="daily_price" type="number" defaultValue={editingCar?.daily_price} required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Holat</label>
                  <select name="status" defaultValue={editingCar?.status || 'bor'} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="bor">Bor</option>
                    <option value="ijarada">Ijarada</option>
                    <option value="tamirda">Ta'mirda</option>
                    <option value="rezerv">Rezerv</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rasm</label>
                  <div className="relative">
                    <input name="image" type="file" accept="image/*" className="hidden" id="car-image" />
                    <label htmlFor="car-image" className="flex items-center justify-center space-x-2 w-full px-4 py-2 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <Upload size={18} className="text-gray-400" />
                      <span className="text-sm text-gray-500">Rasm yuklash</span>
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Izoh</label>
                  <textarea name="notes" defaultValue={editingCar?.notes} rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
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

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    bor: 'bg-green-100 text-green-700',
    ijarada: 'bg-blue-100 text-blue-700',
    tamirda: 'bg-yellow-100 text-yellow-700',
    rezerv: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}
