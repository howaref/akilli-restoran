import React, { useState } from 'react';
import { Clock, ChefHat, CheckCircle2, ArrowRight, Trash2, UtensilsCrossed } from 'lucide-react';
import toast from 'react-hot-toast';

const Mutfak = () => {
  // SAHTE VERİLER KALDIRILDI - Gerçek veritabanından çekilmesi için boş array yapıldı
  const [siparisler, setSiparisler] = useState([]);

  const durumGuncelle = (id, yeniDurum, masaNo) => {
    setSiparisler(siparisler.map(siparis => 
      siparis.id === id ? { ...siparis, durum: yeniDurum } : siparis
    ));

    if (yeniDurum === 'hazirlaniyor') {
      toast.success(`${masaNo} siparişi hazırlanmaya başlandı!`, { icon: '🍳', duration: 3000 });
    } else if (yeniDurum === 'tamamlandi') {
      toast.success(`${masaNo} siparişi hazır! Garsona bildirildi.`, { icon: '🔔', duration: 4000 });
    }
  };

  const tamamlananlariTemizle = () => {
    setSiparisler(siparisler.filter(s => s.durum !== 'tamamlandi'));
    toast('Tamamlanan siparişler ekrandan temizlendi.', { icon: '🧹', duration: 3000 });
  };

  const yeniSiparisler = siparisler.filter(s => s.durum === 'yeni');
  const hazirlananlar = siparisler.filter(s => s.durum === 'hazirlaniyor');
  const tamamlananlar = siparisler.filter(s => s.durum === 'tamamlandi');

  return (
    <div className="p-2 md:p-6 min-h-screen bg-gray-50/50">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <ChefHat className="w-8 h-8 text-orange-500" />
        Mutfak Ekranı (KDS)
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KOLON 1: YENİ SİPARİŞLER */}
        <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 shadow-sm">
          <h2 className="text-lg font-bold text-red-700 mb-4 flex justify-between items-center">
            Yeni Siparişler
            <span className="bg-red-500 text-white font-bold py-1 px-3 rounded-full text-sm shadow-sm">
              {yeniSiparisler.length}
            </span>
          </h2>
          <div className="space-y-4">
            {yeniSiparisler.map(siparis => (
              <div key={siparis.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-gray-800 text-lg">{siparis.masa}</span>
                  <span className="flex items-center text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg gap-1">
                    <Clock className="w-3 h-3"/> {siparis.saat}
                  </span>
                </div>
                <ul className="text-sm text-gray-700 mb-4 space-y-1.5 font-medium">
                  {siparis.urunler.map((urun, i) => <li key={i}>• {urun}</li>)}
                </ul>
                {siparis.not && (
                  <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-lg mb-4 font-bold border border-red-100">
                    Not: {siparis.not}
                  </p>
                )}
                <button 
                  onClick={() => durumGuncelle(siparis.id, 'hazirlaniyor', siparis.masa)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 shadow-sm flex items-center justify-center gap-2"
                >
                  Hazırlamaya Başla <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
            {yeniSiparisler.length === 0 && (
              <div className="text-center py-10 flex flex-col items-center justify-center text-red-400">
                <UtensilsCrossed size={32} className="mb-2 opacity-50" />
                <span className="font-medium text-sm">Bekleyen yeni sipariş yok.</span>
              </div>
            )}
          </div>
        </div>

        {/* KOLON 2: HAZIRLANIYOR */}
        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 shadow-sm">
          <h2 className="text-lg font-bold text-amber-700 mb-4 flex justify-between items-center">
            Hazırlanıyor
            <span className="bg-amber-500 text-white font-bold py-1 px-3 rounded-full text-sm shadow-sm">
              {hazirlananlar.length}
            </span>
          </h2>
          <div className="space-y-4">
            {hazirlananlar.map(siparis => (
              <div key={siparis.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-amber-500 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-gray-800 text-lg">{siparis.masa}</span>
                  <span className="flex items-center text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg gap-1">
                    <Clock className="w-3 h-3"/> {siparis.saat}
                  </span>
                </div>
                <ul className="text-sm text-gray-700 mb-4 space-y-1.5 font-medium">
                  {siparis.urunler.map((urun, i) => <li key={i}>• {urun}</li>)}
                </ul>
                {siparis.not && (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg mb-4 font-bold border border-amber-100">
                    Not: {siparis.not}
                  </p>
                )}
                <button 
                  onClick={() => durumGuncelle(siparis.id, 'tamamlandi', siparis.masa)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 shadow-sm flex items-center justify-center gap-2"
                >
                  Sipariş Hazır <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            ))}
             {hazirlananlar.length === 0 && (
              <div className="text-center py-10 flex flex-col items-center justify-center text-amber-400">
                <ChefHat size={32} className="mb-2 opacity-50" />
                <span className="font-medium text-sm">Şu an hazırlanan sipariş yok.</span>
              </div>
            )}
          </div>
        </div>

        {/* KOLON 3: TAMAMLANDI */}
        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-sm relative">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-emerald-700 flex items-center gap-2">
              Tamamlandı
              <span className="bg-emerald-500 text-white font-bold py-1 px-3 rounded-full text-sm shadow-sm">
                {tamamlananlar.length}
              </span>
            </h2>
            {tamamlananlar.length > 0 && (
              <button 
                onClick={tamamlananlariTemizle}
                title="Listeyi Temizle"
                className="text-emerald-600 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 p-1.5 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {tamamlananlar.map(siparis => (
              <div key={siparis.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-emerald-500 opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-gray-800 text-lg">{siparis.masa}</span>
                  <span className="flex items-center text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg gap-1">
                    <Clock className="w-3 h-3"/> {siparis.saat}
                  </span>
                </div>
                <ul className="text-sm text-gray-600 space-y-1.5 line-through decoration-gray-300">
                  {siparis.urunler.map((urun, i) => <li key={i}>• {urun}</li>)}
                </ul>
              </div>
            ))}
             {tamamlananlar.length === 0 && (
              <div className="text-center py-10 flex flex-col items-center justify-center text-emerald-400">
                <CheckCircle2 size={32} className="mb-2 opacity-50" />
                <span className="font-medium text-sm">Tamamlanan sipariş listesi boş.</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Mutfak;