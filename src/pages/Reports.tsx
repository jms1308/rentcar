import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Calendar, TrendingUp, Key, UserCheck, Star } from 'lucide-react';

export default function Reports() {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const handleExcelExport = () => {
    window.open(`/api/reports/export/excel?start_date=${startDate}&end_date=${endDate}`, '_blank');
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Hisobotlar</h1>
        <p className="text-gray-500">Korxona faoliyati bo'yicha tahliliy ma'lumotlar.</p>
      </header>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-6 flex items-center">
          <Calendar className="mr-2 text-blue-600" size={20} /> Davrni tanlang
        </h3>
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dan</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Gacha</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleExcelExport}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileSpreadsheet size={20} />
              <span>Excel yuklash</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportStatCard 
          title="Jami daromad" 
          value="12,450,000 so'm" 
          icon={<TrendingUp className="text-blue-600" />} 
          desc="Tanlangan davrda"
        />
        <ReportStatCard 
          title="Ijaralar soni" 
          value="24 ta" 
          icon={<Key className="text-purple-600" />} 
          desc="Muvaffaqiyatli yakunlangan"
        />
        <ReportStatCard 
          title="Eng ko'p ijaralangan" 
          value="Chevrolet Tahoe" 
          icon={<Star className="text-yellow-600" />} 
          desc="01 A 777 AA"
        />
        <ReportStatCard 
          title="Eng faol menejer" 
          value="Menejer Birinchi" 
          icon={<UserCheck className="text-emerald-600" />} 
          desc="12 ta ijara"
        />
      </div>

      <div className="bg-blue-50 p-8 rounded-2xl border border-blue-100 flex items-center justify-between">
        <div>
          <h4 className="text-xl font-bold text-blue-900">To'liq tahliliy hisobot (PDF)</h4>
          <p className="text-blue-700 mt-1">Barcha ko'rsatkichlar va grafiklar jamlangan PDF formatidagi hisobot.</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
          <FileText size={20} />
          <span>PDF Generatsiya</span>
        </button>
      </div>
    </div>
  );
}

function ReportStatCard({ title, value, icon, desc }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
      </div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h4 className="text-xl font-bold text-gray-900 mt-1">{value}</h4>
      <p className="text-xs text-gray-400 mt-2">{desc}</p>
    </div>
  );
}
