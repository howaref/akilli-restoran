import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChefHat, CheckCircle2, ArrowRight, UtensilsCrossed, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api'; 

const Mutfak = () => {
  const [siparisler, setSiparisler] = useState([]);
  const [sesAcik, setSesAcik] = useState(false);
  const oncekiYeniSiparisler = useRef(new Set());

  const sesCal = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.volume = 0.7;
    audio.play().catch(err => console.log('Ses çalınamadı:', err));
  };

  const sesiAc = () => {
    sesCal();
    setSesAcik(true);
    toast.success('🔔 Bildirim sesi açıldı!', { duration: 2000 });
  };

  useEffect(() => {
    const fetchMutfakSiparisleri = async () => {
      try {
        const response = await api.get('/siparisler/mutfak');
        if (response.data) {
          setSiparisler(response.data);
        }
      } catch (error) {
        console.error("Mutfak siparişleri çekilemedi:", error);
      }
    };

    fetchMutfakSiparisleri();
    const interval = setInterval(fetchMutfakSiparisleri, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const simdikiYeni = siparisler.filter(s => s.durum === 'yeni');
    const simdikiYeniIds = new Set(simdikiYeni.map(s => s.id));
    
    const yeniEklenenler = [...simdikiYeniIds].filter(id => !oncekiYeniSiparisler.current.has(id));
    
    if (sesAcik && yeniEklenenler.length > 0) {
      sesCal();
      toast.success(`🛎️ ${yeniEklenenler.length} yeni sipariş geldi!`, { 
        icon: '🔔', 
        duration: 4000 
      });
    }
    
    oncekiYeniSiparisler.current = simdikiYeniIds;
  }, [siparisler, sesAcik]);

  const durumGuncelle = async (id, yeniDurum, masaNo) => {
    setSiparisler(siparisler.map(siparis => 
      siparis.id === id ? { ...siparis, durum: yeniDurum } : siparis
    ));

    if (yeniDurum === 'hazirlaniyor') {
      toast.success(`${masaNo} siparişi hazırlanmaya başlandı!`, { icon: '🍳', duration: 3000 });
    } else if (yeniDurum === 'tamamlandi') {
      toast.success(`${masaNo} siparişi hazır! Garsona bildirildi.`, { icon: '🔔', duration: 4000 });
    }

    try {
      await api.put(`/siparisler/${id}/durum`, { durum: yeniDurum });
    } catch (error) {
      console.error("Veritabanı güncellenemedi:", error);
    }
  };

  const yeniSiparisler = siparisler.filter(s => s.durum === 'yeni');
  const hazirlananlar = siparisler.filter(s => s.durum === 'hazirlaniyor');
  const tamamlananlar = siparisler.filter(s => s.durum === 'tamamlandi');

  return (
    <div className="p-2 md:p-6 min-h-screen bg-gray-50/50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ChefHat className="w-8 h-8 text-orange-500" />
          Mutfak Ekranı (KDS)
        </h1>
        
        {!sesAcik && (
          <button
            onClick={sesiAc}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-sm"
          >
            <Volume2 className="w-5 h-5" />
            🔊 Bildirim Sesini Aç
          </button>
        )}
        {sesAcik && (
          <span className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-4 py-2 rounded-xl border border-green-200">
            <Volume2 className="w-5 h-5" />
            Ses Açık
          </span>
        )}
      </div>

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
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-lg font-bold text-emerald-700 flex items-center gap-2">
              Tamamlandı
              <span className="bg-emerald-500 text-white font-bold py-1 px-3 rounded-full text-sm shadow-sm">
                {tamamlananlar.length}
              </span>
            </h2>
          </div>
          <p className="text-xs text-emerald-600/70 mb-3 font-medium">Garson masaya götürüp "Teslim Ettim" dediğinde otomatik kalkar.</p>
          
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