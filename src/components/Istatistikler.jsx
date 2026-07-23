import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, ShoppingBag, Users, Star, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import api from '../services/api';

const COLORS = ['#F97316', '#3B82F6', '#10B981', '#FBBF24', '#8B5CF6'];

export default function Istatistikler() {
  const [isLoading, setIsLoading] = useState(true);
  const [kpiData, setKpiData] = useState({ ciro: 0, siparis: 0, musteri: 0, memnuniyet: 0 });
  const [haftalikCiro, setHaftalikCiro] = useState([]);
  const [kategoriSatis, setKategoriSatis] = useState([]);

  useEffect(() => {
    const fetchIstatistikler = async () => {
      try {
        setIsLoading(true);
        // Backend'den gerçek verileri çekiyoruz. 
        // Eğer endpointler henüz hazır değilse hata fırlatmamak için boş veri döndürüyoruz (catch blokları).
        const [kpiRes, ciroRes, kategoriRes] = await Promise.all([
          api.get('/istatistikler/kpi').catch(() => ({ data: { ciro: 0, siparis: 0, musteri: 0, memnuniyet: 0 } })),
          api.get('/istatistikler/haftalik-ciro').catch(() => ({ data: [] })),
          api.get('/istatistikler/kategori-satis').catch(() => ({ data: [] }))
        ]);

        setKpiData(kpiRes.data || { ciro: 0, siparis: 0, musteri: 0, memnuniyet: 0 });
        setHaftalikCiro(ciroRes.data || []);
        setKategoriSatis(kategoriRes.data || []);
      } catch (error) {
        console.error("Veritabanından istatistikler çekilirken hata oluştu:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIstatistikler();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-gray-400 space-y-4">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="animate-pulse font-medium">Gerçek veriler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Üst KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4 transition-all hover:shadow-md hover:-translate-y-1">
          <div className="p-3 bg-green-50 text-green-500 rounded-xl"><TrendingUp size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Haftalık Ciro</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(kpiData.ciro)}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4 transition-all hover:shadow-md hover:-translate-y-1">
          <div className="p-3 bg-blue-50 text-blue-500 rounded-xl"><ShoppingBag size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Haftalık Sipariş</p>
            <p className="text-xl font-bold text-gray-900">{kpiData.siparis}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4 transition-all hover:shadow-md hover:-translate-y-1">
          <div className="p-3 bg-orange-50 text-orange-500 rounded-xl"><Users size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Aktif Müşteri</p>
            <p className="text-xl font-bold text-gray-900">{kpiData.musteri}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4 transition-all hover:shadow-md hover:-translate-y-1">
          <div className="p-3 bg-yellow-50 text-yellow-500 rounded-xl"><Star size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Ort. Memnuniyet</p>
            <p className="text-xl font-bold text-gray-900">{kpiData.memnuniyet} / 5</p>
          </div>
        </div>
      </div>

      {/* Grafikler Bölümü */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Çizgi Grafik: Ciro Trendi */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 relative">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Haftalık Ciro Trendi</h3>
          
          {haftalikCiro.length === 0 ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 mt-10">
               <BarChart3 size={48} className="opacity-20 mb-3" />
               <p className="font-medium">Henüz ciro verisi bulunmuyor</p>
             </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={haftalikCiro} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="gun" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} tickFormatter={(value) => `₺${value / 1000}k`} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`₺${value}`, 'Ciro']}
                  />
                  <Line type="monotone" dataKey="ciro" stroke="#F97316" strokeWidth={3} dot={{ r: 4, fill: '#F97316', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pasta Grafik: Kategori Dağılımı */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Satış Dağılımı</h3>
          
          {kategoriSatis.length === 0 ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 mt-10">
               <PieChartIcon size={48} className="opacity-20 mb-3" />
               <p className="font-medium">Satış verisi bekleniyor</p>
             </div>
          ) : (
            <div className="h-[300px] w-full flex flex-col justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kategoriSatis}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {kategoriSatis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`%${value}`, 'Oran']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}