import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  ArrowLeft, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Calendar, 
  User, 
  Car as CarIcon, 
  CreditCard,
  History
} from 'lucide-react';

export default function RentalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api.get(`/rentals/${id}`).then(res => {
      setData(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    
    await api.post('/payments', { ...payload, rental_id: id });
    setShowPaymentModal(false);
    fetchData();
  };

  const handleReturn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    
    await api.post(`/rentals/${id}/return`, payload);
    setShowReturnModal(false);
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-full">Yuklanmoqda...</div>;

  const { rental, payments } = data;
  const totalPaid = payments.reduce((acc: number, p: any) => acc + p.amount, 0);
  const balance = rental.total_amount - totalPaid;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Orqaga qaytish
        </button>
        <div className="flex space-x-3">
          <a 
            href={`/api/rentals/${id}/contract`} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FileText size={20} />
            <span>Shartnoma (PDF)</span>
          </a>
          {rental.status === 'aktiv' && (
            <button 
              onClick={() => setShowReturnModal(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle2 size={20} />
              <span>Mashina qaytarildi</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Rental Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Ijara ma'lumotlari # {rental.id}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${rental.status === 'aktiv' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                {rental.status}
              </span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CarIcon className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Avtomobil</p>
                    <p className="font-medium text-gray-900">{rental.brand} {rental.model}</p>
                    <p className="text-sm font-mono text-blue-600">{rental.plate_number}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <User className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Mijoz</p>
                    <p className="font-medium text-gray-900">{rental.first_name} {rental.last_name}</p>
                    <p className="text-sm text-gray-600">{rental.phone}</p>
                    <p className="text-xs text-gray-500 mt-1">{rental.address}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Muddati</p>
                    <p className="text-sm text-gray-900"><span className="text-gray-500">Boshlanish:</span> {rental.start_date}</p>
                    <p className="text-sm text-gray-900"><span className="text-gray-500">Tugash:</span> {rental.end_date}</p>
                    {rental.return_date && <p className="text-sm text-green-600 font-bold"><span className="text-gray-500">Qaytarilgan:</span> {rental.return_date}</p>}
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CreditCard className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Moliyaviy</p>
                    <p className="text-sm text-gray-900"><span className="text-gray-500">Kunlik:</span> {rental.daily_price.toLocaleString()} so'm</p>
                    <p className="text-sm text-gray-900"><span className="text-gray-500">Kafolat:</span> {rental.deposit_amount.toLocaleString()} so'm</p>
                  </div>
                </div>
              </div>
            </div>
            {rental.notes && (
              <div className="px-6 pb-6">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Izoh</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">{rental.notes}</p>
              </div>
            )}
          </div>

          {/* Payments History */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <History size={20} className="mr-2 text-gray-400" /> To'lovlar tarixi
              </h3>
              {rental.status === 'aktiv' && (
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center"
                >
                  <Plus size={16} className="mr-1" /> To'lov qo'shish
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-medium">Sana</th>
                    <th className="px-6 py-3 font-medium">Summa</th>
                    <th className="px-6 py-3 font-medium">Turi</th>
                    <th className="px-6 py-3 font-medium">Izoh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">To'lovlar mavjud emas</td></tr>
                  ) : payments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(p.payment_date).toLocaleString('uz-UZ')}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{p.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">{p.payment_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{p.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Summary Card */}
        <div className="space-y-6">
          <div className="bg-[#1e3a5f] text-white p-8 rounded-2xl shadow-lg">
            <h4 className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">To'lov xulosasi</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Jami summa:</span>
                <span className="text-lg font-bold">{rental.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">To'langan:</span>
                <span className="text-lg font-bold text-green-400">{totalPaid.toLocaleString()}</span>
              </div>
              <div className="pt-4 border-t border-blue-800 flex justify-between items-center">
                <span className="text-gray-300 font-medium">Qoldiq:</span>
                <span className={`text-2xl font-black ${balance <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {balance.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-8">
              <div className={`text-center py-2 rounded-lg text-sm font-bold uppercase tracking-wider ${
                rental.payment_status === 'tolangan' ? 'bg-green-500/20 text-green-400' : 
                rental.payment_status === 'qisman' ? 'bg-yellow-500/20 text-yellow-400' : 
                'bg-red-500/20 text-red-400'
              }`}>
                {rental.payment_status}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">To'lov qo'shish</h3>
            </div>
            <form onSubmit={handleAddPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Summa (so'm)</label>
                <input name="amount" type="number" required defaultValue={balance > 0 ? balance : 0} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To'lov turi</label>
                <select name="payment_type" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="naqd">Naqd</option>
                  <option value="karta">Karta</option>
                  <option value="otkazma">O'tkazma</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Izoh</label>
                <textarea name="notes" rows={2} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
              <div className="mt-8 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-6 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">Bekor qilish</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">Mashinani qaytarib olish</h3>
            </div>
            <form onSubmit={handleReturn} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qaytarilgan sana</label>
                <input name="return_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yakuniy summa (so'm)</label>
                <input name="total_amount" type="number" required defaultValue={rental.total_amount} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-500 mt-1">Agar muddat o'tgan bo'lsa yoki qo'shimcha xarajatlar bo'lsa o'zgartiring.</p>
              </div>
              <div className="mt-8 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowReturnModal(false)} className="px-6 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">Bekor qilish</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Tasdiqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
