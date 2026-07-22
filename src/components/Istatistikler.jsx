import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, ShoppingBag, Users, Star } from 'lucide-react';

// API entegrasyonuna kadar kullanılacak Mock Veriler
const haftalikCiro = [
  { gun: 'Pzt', ciro: 12500 },
  { gun: 'Sal', ciro: 14200 },
  { gun: 'Çar', ciro: 13800 },
  { gun: 'Per', ciro: 16500 },
  { gun: 'Cum', ciro: 22400 },
  { gun: 'Cmt', ciro: 28900 },
  { gun: 'Paz', ciro: 24500 },
];

const kategoriSatis = [
  { name: 'Burgerler', value: 65 },
  { name: 'İçecekler', value: 25 },
  { name: 'Yan Ürünler', value: 10 },
];

const COLORS = ['#F97316', '#3B82F6', '#10B981'];

export default function Istatistikler() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Üst KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-500 rounded-xl"><TrendingUp size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Haftalık Ciro</p>
            <p className="text-xl font-bold text-gray-900">₺132.800</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-500 rounded-xl"><ShoppingBag size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Haftalık Sipariş</p>
            <p className="text-xl font-bold text-gray-900">845</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-orange-50 text-orange-500 rounded-xl"><Users size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Aktif Müşteri</p>
            <p className="text-xl font-bold text-gray-900">1.240</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-yellow-50 text-yellow-500 rounded-xl"><Star size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Ort. Memnuniyet</p>
            <p className="text-xl font-bold text-gray-900">4.8 / 5</p>
          </div>
        </div>
      </div>

      {/* Grafikler Bölümü */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Çizgi Grafik: Ciro Trendi */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Haftalık Ciro Trendi</h3>
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
        </div>

        {/* Pasta Grafik: Kategori Dağılımı */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Satış Dağılımı</h3>
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
        </div>

      </div>
    </div>
  );
}