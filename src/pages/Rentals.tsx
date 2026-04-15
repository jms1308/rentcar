import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Plus, Search, Filter, Eye, AlertCircle, CheckCircle2, Clock, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Rentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('hammasi');
  const [showModal, setShowModal] = useState(false);
  
  // For New Rental
  const [cars, setCars] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);

  const fetchRentals = () => {
    setLoading(true);
    api.get(`/rentals?status=${statusFilter}`).then(res => {
      setRentals(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchRentals();
  }, [statusFilter]);

  useEffect(() => {
    if (showModal) {
      api.get('/cars?status=bor').then(setCars);
      api.get('/clients').then(setClients);
    }
  }, [showModal]);

  useEffect(() => {
    if (selectedCar && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      setTotalAmount(diffDays * selectedCar.daily_price);
    }
  }, [selectedCar, startDate, endDate]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    await api.post('/rentals', {
      ...data,
      car_id: selectedCar.id,
      client_id: selectedClient.id,
      total_amount: totalAmount,
      daily_price: selectedCar.daily_price
    });
    
    setShowModal(false);
    fetchRentals();
  };

  const isOverdue = (rental: any) => {
    return rental.status === 'aktiv' && new Date(rental.end_date) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Ijaralar</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Yangi ijara</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="hammasi">Barcha ijaralar</option>
          <option value="aktiv">Aktiv</option>
          <option value="yakunlangan">Yakunlangan</option>
          <option value="bekor">Bekor qilingan</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Mashina</th>
                <th className="px-6 py-4 font-medium">Mijoz</th>
                <th className="px-6 py-4 font-medium">Muddati</th>
                <th className="px-6 py-4 font-medium">Summa</th>
                <th className="px-6 py-4 font-medium">To'lov</th>
                <th className="px-6 py-4 font-medium">Holat</th>
                <th className="px-6 py-4 font-medium text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">Yuklanmoqda...</td></tr>
              ) : rentals.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">Ijaralar topilmadi</td></tr>
              ) : rentals.map((rental: any) => (
                <tr key={rental.id} className={`hover:bg-gray-50 transition-colors ${isOverdue(rental) ? 'bg-red-50/50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{rental.brand} {rental.model}</div>
                    <div className="text-xs text-gray-500 font-mono">{rental.plate_number}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{rental.first_name} {rental.last_name}</div>
                    <div className="text-xs text-gray-500">Menejer: {rental.manager_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-500">{rental.start_date} dan</div>
                    <div className={`text-sm font-medium ${isOverdue(rental) ? 'text-red-600' : 'text-gray-900'}`}>
                      {rental.end_date} gacha
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{rental.total_amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <PaymentBadge status={rental.payment_status} />
                  </td>
                  <td className="px-6 py-4">
                    <RentalStatusBadge status={rental.status} overdue={isOverdue(rental)} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/rentals/${rental.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg inline-block transition-colors">
                      <Eye size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Rental Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">Yangi ijara rasmiylashtirish</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mashina tanlang</label>
                  <select 
                    required 
                    onChange={(e) => setSelectedCar(cars.find((c: any) => c.id === parseInt(e.target.value)))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tanlang...</option>
                    {cars.map((car: any) => (
                      <option key={car.id} value={car.id}>{car.brand} {car.model} ({car.plate_number}) - {car.daily_price.toLocaleString()} so'm</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mijoz tanlang</label>
                  <select 
                    required 
                    onChange={(e) => setSelectedClient(clients.find((c: any) => c.id === parseInt(e.target.value)))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tanlang...</option>
                    {clients.map((client: any) => (
                      <option key={client.id} value={client.id}>{client.first_name} {client.last_name} ({client.phone})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Boshlanish sanasi</label>
                  <input 
                    name="start_date" 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tugash sanasi</label>
                  <input 
                    name="end_date" 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kafolat summasi (so'm)</label>
                  <input name="deposit_amount" type="number" defaultValue={0} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To'lov turi</label>
                  <select name="payment_type" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="naqd">Naqd</option>
                    <option value="karta">Karta</option>
                    <option value="otkazma">O'tkazma</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Izoh</label>
                  <textarea name="notes" rows={2} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-blue-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Jami hisoblangan summa:</p>
                  <h4 className="text-2xl font-bold text-blue-900">{totalAmount.toLocaleString()} so'm</h4>
                </div>
                <div className="flex space-x-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-white transition-colors">Bekor qilish</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Saqlash</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const styles: any = {
    tolanmagan: 'bg-red-100 text-red-700',
    qisman: 'bg-yellow-100 text-yellow-700',
    tolangan: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

function RentalStatusBadge({ status, overdue }: { status: string, overdue: boolean }) {
  if (overdue) return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-600 text-white flex items-center w-fit"><Clock size={12} className="mr-1" /> Muddati o'tgan</span>;
  
  const styles: any = {
    aktiv: 'bg-blue-100 text-blue-700',
    yakunlangan: 'bg-gray-100 text-gray-700',
    bekor: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}
