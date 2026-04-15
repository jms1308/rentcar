import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { db as firestore } from '../lib/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';
import { 
  Car, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { Link } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Test Firestore connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(firestore, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    api.get('/dashboard/stats')
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Dashboard error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full">Yuklanmoqda...</div>;
  if (!data) return <div className="flex items-center justify-center h-full text-red-600">Ma'lumotlarni yuklashda xatolik yuz berdi.</div>;

  const revenueChartData = {
    labels: data.charts.revenueHistory.map((h: any) => h.date),
    datasets: [
      {
        label: 'Daromad (so\'m)',
        data: data.charts.revenueHistory.map((h: any) => h.total),
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const statusChartData = {
    labels: data.charts.carStatus.map((s: any) => s.status),
    datasets: [
      {
        data: data.charts.carStatus.map((s: any) => s.count),
        backgroundColor: [
          '#10B981', // bor
          '#2563EB', // ijarada
          '#F59E0B', // tamirda
          '#6B7280', // rezerv
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Xush kelibsiz, bugungi holat bilan tanishing.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ijaradagi mashinalar" 
          value={data.stats.activeRentals} 
          icon={<Car className="text-blue-600" />} 
          color="blue"
        />
        <StatCard 
          title="Bu oygi daromad" 
          value={data.stats.monthlyRevenue.toLocaleString() + ' so\'m'} 
          icon={<TrendingUp className="text-green-600" />} 
          color="green"
        />
        <StatCard 
          title="Bo'sh mashinalar" 
          value={data.stats.availableCars} 
          icon={<CheckCircle2 className="text-emerald-600" />} 
          color="emerald"
        />
        <StatCard 
          title="Muddati o'tgan" 
          value={data.stats.overdueRentals} 
          icon={<AlertCircle className="text-red-600" />} 
          color="red"
          isWarning={data.stats.overdueRentals > 0}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">Oxirgi 30 kunlik daromad</h3>
          <div className="h-[300px]">
            <Line data={revenueChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">Mashinalar holati</h3>
          <div className="h-[300px] flex items-center justify-center">
            <Doughnut data={statusChartData} options={{ cutout: '70%' }} />
          </div>
        </div>
      </div>

      {/* Recent Rentals Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Bugungi aktiv ijaralar</h3>
          <Link to="/rentals" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
            Hammasini ko'rish <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Mashina</th>
                <th className="px-6 py-4 font-medium">Mijoz</th>
                <th className="px-6 py-4 font-medium">Boshlanish</th>
                <th className="px-6 py-4 font-medium">Tugash</th>
                <th className="px-6 py-4 font-medium">Summa</th>
                <th className="px-6 py-4 font-medium">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recentRentals.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{r.brand} {r.model}</div>
                    <div className="text-xs text-gray-500">{r.plate_number}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{r.first_name} {r.last_name}</td>
                  <td className="px-6 py-4 text-gray-600">{r.start_date}</td>
                  <td className="px-6 py-4 text-gray-600">{r.end_date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{r.total_amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      Aktiv
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, isWarning }: any) {
  const colors: any = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    emerald: 'bg-emerald-50',
    red: 'bg-red-50',
  };

  return (
    <div className={`p-6 rounded-xl shadow-sm border border-gray-100 bg-white ${isWarning ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h4 className={`text-2xl font-bold mt-1 ${isWarning ? 'text-red-600' : 'text-gray-900'}`}>{value}</h4>
    </div>
  );
}
