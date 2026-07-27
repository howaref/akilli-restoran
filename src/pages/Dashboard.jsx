import { useEffect, useState, useMemo, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import Mutfak from './Mutfak'; 
import Istatistikler from "../components/Istatistikler";
import { LayoutDashboard, ChefHat, LogOut, ShoppingBag, AlertCircle, Menu, X, Settings, HelpCircle, User as UserIcon, Maximize, Minimize, Utensils, BellRing, Star, ConciergeBell, Receipt, BookOpen, Edit2, Save, Plus, Filter, Package } from 'lucide-react';
import { getDashboardStats } from '../services/dashboardService';
import { fetchUrunler, fetchKategoriler, addUrun } from '../services/api';
import api from '../services/api'; // GÜNCELLEME: api nesnesi import edildi
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  // GÜNCELLEME: Garsonun boş masaya elden sipariş girebilmesi için sepet durumu
  const [newOrderTable, setNewOrderTable] = useState(null);
  const [orderCart, setOrderCart] = useState({}); // { urun_id: adet }

  const [activeTab, setActiveTab] = useState(user?.role === 'mutfak' ? 'mutfak' : 'overview');

  // GÜNCELLEME: Garson için ses bildirimi - "Sipariş Hazır" olunca çalar
  const [sesAcik, setSesAcik] = useState(false);
  const oncekiHazirMasalar = useRef(new Set());
  const sesCalGarson = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
    audio.volume = 0.7;
    audio.play().catch(err => console.log('Ses çalınamadı:', err));
  };
  const sesiAcGarson = () => {
    sesCalGarson();
    setSesAcik(true);
  };
  
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: '', price: '', desc: '', image: '' });
  const [reviewFilter, setReviewFilter] = useState('all');
  const [menuItems, setMenuItems] = useState([]);

  // SAHTE VERİLER KALDIRILDI - Gerçek API'den dolması için boş array yapıldı
  const [tables, setTables] = useState([]);
  const [reviews, setReviews] = useState([]);

  // GÜNCELLEME: Stok Yönetimi ekranı için durum değişkenleri
  const [malzemeler, setMalzemeler] = useState([]);
  const [isMalzemeLoading, setIsMalzemeLoading] = useState(true);
  const [sktUyarilari, setSktUyarilari] = useState([]);
  const [isAddingMalzeme, setIsAddingMalzeme] = useState(false);
  const [newMalzeme, setNewMalzeme] = useState({ ad: '', birim: '', kritik_seviye: '' });
  const [stokGirisiMalzeme, setStokGirisiMalzeme] = useState(null);
  const [stokGirisiForm, setStokGirisiForm] = useState({ miktar: '', skt: '' });

  // GÜNCELLEME: Sipariş Geçmişi ekranı için durum değişkenleri
  const [siparisGecmisi, setSiparisGecmisi] = useState([]);
  const [isGecmisLoading, setIsGecmisLoading] = useState(true);
  const [gecmisMasaFiltre, setGecmisMasaFiltre] = useState('all');
  const [gecmisDurumFiltre, setGecmisDurumFiltre] = useState('all');
  const [gecmisBaslangicTarihi, setGecmisBaslangicTarihi] = useState('');
  const [gecmisBitisTarihi, setGecmisBitisTarihi] = useState('');

  // GÜNCELLEME: Hesap Ayarları (kullanıcı yönetimi) paneli için durum değişkenleri
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [kullanicilar, setKullanicilar] = useState([]);
  const [isKullaniciLoading, setIsKullaniciLoading] = useState(true);
  const [newKullanici, setNewKullanici] = useState({ kullanici_adi: '', sifre: '', rol: 'garson' });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const userName = user?.email ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1) : 'Yetkili';
    
    if (hour >= 5 && hour < 12) return { text: 'Günaydın', emoji: '☀️', name: userName };
    if (hour >= 12 && hour < 18) return { text: 'İyi Çalışmalar', emoji: '☕', name: userName };
    if (hour >= 18 && hour < 22) return { text: 'İyi Akşamlar', emoji: '🌆', name: userName };
    return { text: 'İyi Geceler', emoji: '🌙', name: userName };
  }, [user]);

  // GÜNCELLEME: FastAPI'den masaları çekme ve otomatik yenileme (Polling)
  useEffect(() => {
    const fetchMasalar = async () => {
      try {
        const response = await api.get('/masalar');
        if (response.data) {
          setTables(response.data);
        }
      } catch (error) {
        console.error("Masalar çekilirken hata oluştu:", error);
      }
    };

    fetchMasalar(); // İlk yüklemede çalışır
    
    // Her 5 saniyede bir veritabanını kontrol edip yeni siparişleri ekrana düşürür
    const interval = setInterval(fetchMasalar, 5000); 
    return () => clearInterval(interval);
  }, []);

  // GÜNCELLEME: Garson ekranı - yeni bir masa "hazirSiparis" olunca ses çalar
  useEffect(() => {
    const simdikiHazirIds = new Set(tables.filter(t => t.status === 'hazirSiparis').map(t => t.id));
    const yeniHazirler = [...simdikiHazirIds].filter(id => !oncekiHazirMasalar.current.has(id));
    if (sesAcik && yeniHazirler.length > 0) {
      sesCalGarson();
      toast.success(`🍽️ ${yeniHazirler.length} masanın siparişi hazır!`, { duration: 4000 });
    }
    oncekiHazirMasalar.current = simdikiHazirIds;
  }, [tables, sesAcik]);

  // GÜNCELLEME: FastAPI'den müşteri değerlendirmelerini çekme
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await api.get('/degerlendirmeler');
        if (response.data) {
          setReviews(response.data);
        }
      } catch (error) {
        console.error("Değerlendirmeler çekilirken hata oluştu:", error);
      }
    };

    fetchReviews();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("İstatistik yükleme hatası:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const loadMenuData = async () => {
      try {
        setIsMenuLoading(true);
        const [urunlerData, kategorilerData] = await Promise.all([
          fetchUrunler(),
          fetchKategoriler()
        ]);

        const kategoriHaritasi = {};
        kategorilerData.forEach(kat => {
          kategoriHaritasi[kat.id] = kat.ad;
        });
        setCategories(kategorilerData);

        if (kategorilerData.length > 0) {
            setNewItem(prev => ({ ...prev, category: kategorilerData[0].ad }));
        }

        const formatlanmisUrunler = urunlerData.map(urun => ({
          id: urun.id,
          name: urun.ad,
          category: kategoriHaritasi[urun.kategori_id] || 'Bilinmeyen',
          price: urun.fiyat,
          desc: urun.aciklama || '-',
          image: urun.gorsel_url || ''
        }));

        setMenuItems(formatlanmisUrunler);
      } catch (err) {
        console.error("Veritabanı API entegrasyon hatası:", err);
        toast.error("Menü verileri sunucudan çekilemedi. API açık mı?");
      } finally {
        setIsMenuLoading(false);
      }
    };

    loadMenuData();
  }, []);

  // GÜNCELLEME: Malzeme listesi ve SKT uyarılarını çeker. Stok girişi/malzeme ekleme sonrası da tekrar çağrılır.
  const fetchStokVerileri = async () => {
    try {
      setIsMalzemeLoading(true);
      const [malzemelerRes, sktRes] = await Promise.all([
        api.get('/malzemeler'),
        api.get('/malzemeler/skt-uyarilari?gun_esigi=7')
      ]);
      setMalzemeler(malzemelerRes.data || []);
      setSktUyarilari(sktRes.data || []);
    } catch (err) {
      console.error("Stok verisi çekme hatası:", err);
      toast.error("Stok verileri çekilemedi.");
    } finally {
      setIsMalzemeLoading(false);
    }
  };

  useEffect(() => {
    fetchStokVerileri();
  }, []);

  // GÜNCELLEME: Sipariş Geçmişi verisini çeker (Sipariş Geçmişi sekmesi için)
  useEffect(() => {
    const fetchSiparisGecmisi = async () => {
      try {
        setIsGecmisLoading(true);
        const response = await api.get('/siparisler/gecmis');
        setSiparisGecmisi(response.data || []);
      } catch (error) {
        console.error("Sipariş geçmişi çekme hatası:", error);
        toast.error("Sipariş geçmişi çekilemedi.");
      } finally {
        setIsGecmisLoading(false);
      }
    };
    fetchSiparisGecmisi();
  }, []);

  const handleLogout = () => {
    logout();
    toast('Görüşmek üzere!', { icon: '👋', style: { background: '#F97316', color: '#fff' } });
    navigate('/login');
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  const getTableStyle = (status) => {
    switch(status) {
      case 'bos': return 'bg-white border-gray-200 hover:border-gray-300 text-gray-400';
      case 'dolu': return 'bg-orange-50/50 border-orange-400 text-orange-700 shadow-sm';
      case 'yeniSiparis': return 'bg-red-50 border-red-500 text-red-700 shadow-md ring-4 ring-red-500/20'; 
      case 'hazirSiparis': return 'bg-green-50 border-green-500 text-green-700 shadow-md ring-4 ring-green-500/20';
      default: return 'bg-white border-gray-200';
    }
  };

  // GÜNCELLEME: Sipariş Geçmişi ekranı için durum rozeti rengi ve okunabilir etiket
  const gecmisDurumBadge = (durum) => {
    switch (durum) {
      case 'yeni': return 'bg-blue-100 text-blue-700';
      case 'hazirlaniyor': return 'bg-orange-100 text-orange-700';
      case 'tamamlandi': return 'bg-purple-100 text-purple-700';
      case 'odendi': return 'bg-green-100 text-green-700';
      case 'iptal': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const durumEtiketi = (durum) => ({
    yeni: 'Yeni', hazirlaniyor: 'Hazırlanıyor', tamamlandi: 'Tamamlandı', odendi: 'Ödendi', iptal: 'İptal'
  }[durum] || durum);

  const filtrelenmisGecmis = siparisGecmisi.filter((s) => {
    const masaUyuyor = gecmisMasaFiltre === 'all' || String(s.masa_id) === gecmisMasaFiltre;
    const durumUyuyor = gecmisDurumFiltre === 'all' || s.durum === gecmisDurumFiltre;
    const baslangicUyuyor = !gecmisBaslangicTarihi || s.tarih_iso >= gecmisBaslangicTarihi;
    const bitisUyuyor = !gecmisBitisTarihi || s.tarih_iso <= gecmisBitisTarihi;
    return masaUyuyor && durumUyuyor && baslangicUyuyor && bitisUyuyor;
  });

  // GÜNCELLEME: Hesap Ayarları paneli - kullanıcı listesini çeker, oluşturur, siler.
  const fetchKullanicilar = async () => {
    try {
      setIsKullaniciLoading(true);
      const response = await api.get('/kullanicilar');
      setKullanicilar(response.data || []);
    } catch (error) {
      console.error("Kullanıcı listesi çekme hatası:", error);
      toast.error("Kullanıcı listesi çekilemedi.");
    } finally {
      setIsKullaniciLoading(false);
    }
  };

  const handleCreateKullanici = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Kullanıcı oluşturuluyor...');
    try {
      await api.post('/kullanicilar', newKullanici);
      toast.success(`"${newKullanici.kullanici_adi}" kullanıcısı oluşturuldu.`, { id: loadingToast });
      setNewKullanici({ kullanici_adi: '', sifre: '', rol: 'garson' });
      fetchKullanicilar();
    } catch (error) {
      console.error("Kullanıcı oluşturma hatası:", error);
      const mesaj = error?.response?.data?.detail || 'Kullanıcı oluşturulamadı, tekrar deneyin.';
      toast.error(mesaj, { id: loadingToast });
    }
  };

  const handleDeleteKullanici = async (kullanici) => {
    if (!window.confirm(`"${kullanici.kullanici_adi}" kullanıcısını silmek istediğine emin misin?`)) return;
    try {
      await api.delete(`/kullanicilar/${kullanici.id}`);
      toast.success('Kullanıcı silindi.');
      fetchKullanicilar();
    } catch (error) {
      console.error("Kullanıcı silme hatası:", error);
      toast.error('Kullanıcı silinemedi, tekrar deneyin.');
    }
  };

  const handleTableClick = (table) => {
    if (table.status === 'bos') {
      // GÜNCELLEME: Boş masaya tıklayınca garson artık elden sipariş oluşturabiliyor
      setOrderCart({});
      setNewOrderTable(table);
      return;
    }
    setSelectedTable(table);
  };

  // GÜNCELLEME: Sepete ürün ekleme/çıkarma (garsonun elden sipariş girişi için)
  const handleCartChange = (urunId, delta) => {
    setOrderCart(prev => {
      const mevcutAdet = prev[urunId] || 0;
      const yeniAdet = Math.max(0, mevcutAdet + delta);
      const guncel = { ...prev };
      if (yeniAdet === 0) {
        delete guncel[urunId];
      } else {
        guncel[urunId] = yeniAdet;
      }
      return guncel;
    });
  };

  const cartToplam = Object.entries(orderCart).reduce((toplam, [urunId, adet]) => {
    const urun = menuItems.find(u => u.id === Number(urunId));
    return toplam + (urun ? urun.price * adet : 0);
  }, 0);

  const cartUrunSayisi = Object.values(orderCart).reduce((a, b) => a + b, 0);

  // GÜNCELLEME: Garsonun elden girdiği siparişi backend'e gönderir. kaynak: "garson" olduğu için
  // masa direkt "dolu" olur, "yeniSiparis" bildirimi tetiklenmez (garson zaten ne sipariş verdiğini biliyor).
  const handleCreateManualOrder = async () => {
    if (cartUrunSayisi === 0) {
      toast.error('Önce sepete ürün ekleyin.');
      return;
    }
    const loadingToast = toast.loading('Sipariş oluşturuluyor...');
    try {
      const urunler = Object.entries(orderCart).map(([urun_id, adet]) => ({
        urun_id: Number(urun_id),
        adet
      }));
      await api.post('/siparisler', {
        masa_id: newOrderTable.id,
        urunler,
        kaynak: 'garson'
      });
      toast.success(`${newOrderTable.no} için sipariş oluşturuldu.`, { id: loadingToast });
      setNewOrderTable(null);
      setOrderCart({});
    } catch (error) {
      console.error("Manuel sipariş oluşturma hatası:", error);
      toast.error('Sipariş oluşturulamadı, tekrar deneyin.', { id: loadingToast });
    }
  };

  // GÜNCELLEME: "yeniSiparis" bildirimini kapatır (sipariş zaten mutfakta, bu sadece garsonun "gördüm" işareti).
  // Mevcut PUT /api/masalar/{id}/durum endpoint'i yeniden kullanılıyor, backend'de yeni kod gerekmiyor.
  const handleSiparisiOnayla = async () => {
    try {
      await api.put(`/masalar/${selectedTable.id}/durum`, { durum: 'dolu' });
      toast.success('Sipariş görüldü olarak işaretlendi.');
      setSelectedTable(null);
    } catch (error) {
      console.error("Sipariş onaylama hatası:", error);
      toast.error('İşlem başarısız, tekrar deneyin.');
    }
  };

  // GÜNCELLEME: Sahte "Hesap kapatıldı" mesajı kaldırıldı, gerçek API çağrısına bağlandı.
  // Backend: PUT /api/masalar/{masa_id}/hesap-kapat -> masadaki tüm aktif siparişleri "odendi" yapar, masayı "bos"a çevirir.
  const handleHesapKapat = async () => {
    const loadingToast = toast.loading('Hesap kapatılıyor...');
    try {
      await api.put(`/masalar/${selectedTable.id}/hesap-kapat`);
      toast.success('Hesap kapatıldı.', { id: loadingToast });
      setSelectedTable(null);
    } catch (error) {
      console.error("Hesap kapatma hatası:", error);
      toast.error('Hesap kapatılamadı, tekrar deneyin.', { id: loadingToast });
    }
  };

  // YENİ: Garson siparişi masaya fiziksel olarak götürüp teslim ettiğinde çağrılır.
  // Backend: PUT /api/masalar/{masa_id}/teslim-et -> "tamamlandi" siparişleri "teslim_edildi" yapar, masayı "dolu"ya döndürür.
  const handleTeslimEt = async () => {
    const loadingToast = toast.loading('Teslim işaretleniyor...');
    try {
      await api.put(`/masalar/${selectedTable.id}/teslim-et`);
      toast.success('Sipariş teslim edildi olarak işaretlendi.', { id: loadingToast });
      setSelectedTable(null);
    } catch (error) {
      console.error("Teslim etme hatası:", error);
      toast.error('İşlem başarısız, tekrar deneyin.', { id: loadingToast });
    }
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Ürün güncelleniyor...');
    try {
      const seciliKategori = categories.find(k => k.ad === editingItem.category);
      const kategori_id = seciliKategori ? seciliKategori.id : 1;
      await api.put(`/urunler/${editingItem.id}`, {
        ad: editingItem.name,
        kategori_id: kategori_id,
        fiyat: editingItem.price,
        aciklama: editingItem.desc,
        gorsel_url: editingItem.image
      });
      setMenuItems(menuItems.map(item => item.id === editingItem.id ? editingItem : item));
      setEditingItem(null);
      toast.success('Ürün başarıyla güncellendi!', { id: loadingToast, duration: 4000 });
    } catch (error) {
      console.error("Ürün güncelleme hatası:", error);
      toast.error('Ürün güncellenemedi, tekrar deneyin.', { id: loadingToast });
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    const loadingToast = toast.loading('Ürün veritabanına kaydediliyor...');

    try {
      const seciliKategori = categories.find(k => k.ad === newItem.category);
      const kategori_id = seciliKategori ? seciliKategori.id : 1; 

      const urunVerisi = {
        ad: newItem.name,
        kategori_id: kategori_id,
        fiyat: parseFloat(newItem.price),
        aciklama: newItem.desc,
        gorsel_url: newItem.image
      };

      const kaydedilenUrun = await addUrun(urunVerisi);

      const productToAdd = {
        id: kaydedilenUrun.id || Date.now(), 
        name: kaydedilenUrun.ad || urunVerisi.ad,
        category: newItem.category, 
        price: kaydedilenUrun.fiyat || urunVerisi.fiyat,
        desc: kaydedilenUrun.aciklama || urunVerisi.aciklama,
        image: kaydedilenUrun.gorsel_url || urunVerisi.gorsel_url
      };

      setMenuItems([productToAdd, ...menuItems]);
      setIsAddingProduct(false);
      setNewItem({ name: '', category: categories[0]?.ad || 'Burgerler', price: '', desc: '', image: '' }); 
      
      toast.success(`"${productToAdd.name}" başarıyla menüye eklendi!`, { id: loadingToast, duration: 4000 });
      
    } catch (error) {
      console.error("Ekleme hatası:", error);
      toast.error('Ürün kaydedilemedi! API bağlantınızı kontrol edin.', { id: loadingToast, duration: 4000 });
    }
  };

  // GÜNCELLEME: Yeni malzeme tanımlama (Stok Yönetimi ekranı). Stok her zaman 0'dan başlar,
  // gerçek mal girişi "Stok Ekle" (handleStokGirisi) ile SKT'li parti olarak yapılır.
  const handleAddMalzeme = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Malzeme kaydediliyor...');
    try {
      await api.post('/malzemeler', {
        ad: newMalzeme.ad,
        stok_miktari: 0,
        birim: newMalzeme.birim,
        kritik_seviye: parseFloat(newMalzeme.kritik_seviye) || 0
      });
      toast.success(`"${newMalzeme.ad}" malzeme olarak eklendi.`, { id: loadingToast });
      setIsAddingMalzeme(false);
      setNewMalzeme({ ad: '', birim: '', kritik_seviye: '' });
      fetchStokVerileri();
    } catch (error) {
      console.error("Malzeme ekleme hatası:", error);
      toast.error('Malzeme eklenemedi, tekrar deneyin.', { id: loadingToast });
    }
  };

  // GÜNCELLEME: Bir malzemeye yeni parti (lot) girişi. SKT girildiyse FEFO/SKT uyarı sistemi bunu izler.
  const handleStokGirisi = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Stok girişi yapılıyor...');
    try {
      await api.post(`/malzemeler/${stokGirisiMalzeme.id}/stok-girisi`, {
        miktar: parseFloat(stokGirisiForm.miktar),
        skt: stokGirisiForm.skt || null
      });
      toast.success(`${stokGirisiMalzeme.ad} için stok girişi yapıldı.`, { id: loadingToast });
      setStokGirisiMalzeme(null);
      setStokGirisiForm({ miktar: '', skt: '' });
      fetchStokVerileri();
    } catch (error) {
      console.error("Stok girişi hatası:", error);
      toast.error('Stok girişi yapılamadı, tekrar deneyin.', { id: loadingToast });
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans relative overflow-hidden">
      
      {/* Modal - Seçili Masa Adisyonu */}
      {selectedTable && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedTable(null)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`p-5 flex items-center justify-between border-b ${selectedTable.status === 'yeniSiparis' ? 'bg-red-50 border-red-100' : selectedTable.status === 'hazirSiparis' ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl ${selectedTable.status === 'yeniSiparis' ? 'bg-red-500 text-white' : selectedTable.status === 'hazirSiparis' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                  <Receipt size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedTable.no} Adisyonu</h3>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${selectedTable.status === 'yeniSiparis' ? 'text-red-600' : selectedTable.status === 'hazirSiparis' ? 'text-green-600' : 'text-orange-600'}`}>
                    {selectedTable.status === 'yeniSiparis' ? '🚨 Yeni Sipariş Bekliyor' : selectedTable.status === 'hazirSiparis' ? '✅ Sipariş Hazır, Masaya Götür!' : 'Dolu Masa'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedTable(null)} className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6">
              {selectedTable.isCallingWaiter && (
                <div className="mb-4 bg-blue-50 text-blue-700 border border-blue-200 p-3 rounded-xl flex items-center space-x-3 text-sm font-medium">
                  <ConciergeBell size={18} className="animate-bounce" />
                  <span>Müşteri masaya garson çağırdı!</span>
                </div>
              )}
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {selectedTable.orders?.map((order, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center space-x-3">
                      <span className="bg-gray-100 text-gray-700 font-bold px-2 py-1 rounded text-xs">{order.qty}x</span>
                      <span className="text-gray-800 font-medium">{order.name}</span>
                    </div>
                    <span className="text-gray-600 font-semibold">{formatCurrency(order.price)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
                <span className="text-gray-500 font-medium">Genel Toplam</span>
                <span className="text-3xl font-bold text-gray-900 tracking-tight">{formatCurrency(selectedTable.amount)}</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex gap-3">
              {selectedTable.isCallingWaiter && (
                <button onClick={async () => {
                  const loadingToast = toast.loading('Çağrı kapatılıyor...');
                  try {
                    if (selectedTable.cagri_ids?.length > 0) {
                      await Promise.all(selectedTable.cagri_ids.map(cid =>
                        api.put(`/garson-cagri/${cid}/tamamla`)
                      ));
                    }
                    toast.success('Garson çağrısı yanıtlandı.', { id: loadingToast });
                    setSelectedTable(null);
                  } catch (error) {
                    console.error("Çağrı kapatma hatası:", error);
                    toast.error('İşlem başarısız.', { id: loadingToast });
                  }
                }} className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-3 rounded-xl transition-colors">Çağrıyı Kapat</button>
              )}
              {selectedTable.status === 'yeniSiparis' ? (
                <button onClick={handleSiparisiOnayla} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-md transition-all hover:-translate-y-0.5">Siparişi Onayla</button>
              ) : selectedTable.status === 'hazirSiparis' ? (
                <button onClick={handleTeslimEt} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-md transition-all hover:-translate-y-0.5">Teslim Ettim</button>
              ) : (
                <button onClick={handleHesapKapat} className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl shadow-md transition-all hover:-translate-y-0.5">Hesabı Tahsil Et</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal - Garson Elden Sipariş Oluşturma (Boş Masaya Tıklanınca) */}
      {newOrderTable && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setNewOrderTable(null)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-5 flex items-center justify-between border-b bg-gray-50 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{newOrderTable.no} için Sipariş Oluştur</h3>
                <p className="text-xs text-gray-500 mt-0.5">Müşteri QR okutmadan sipariş verdiyse buradan elden girin.</p>
              </div>
              <button onClick={() => setNewOrderTable(null)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {isMenuLoading ? (
                <p className="text-center text-gray-400 py-8 font-medium">Menü yükleniyor...</p>
              ) : menuItems.length === 0 ? (
                <p className="text-center text-gray-400 py-8 font-medium">Menüde ürün bulunmuyor.</p>
              ) : (
                menuItems.map((item) => {
                  const adet = orderCart[item.id] || 0;
                  return (
                    <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${adet > 0 ? 'border-orange-300 bg-orange-50/50' : 'border-gray-100'}`}>
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.category} · {formatCurrency(item.price)}</p>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleCartChange(item.id, -1)}
                          disabled={adet === 0}
                          className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 font-bold disabled:opacity-30 hover:bg-gray-100 transition-colors"
                        >−</button>
                        <span className="w-6 text-center font-bold text-gray-800">{adet}</span>
                        <button
                          onClick={() => handleCartChange(item.id, 1)}
                          className="w-8 h-8 rounded-lg border border-orange-300 text-orange-600 font-bold hover:bg-orange-100 transition-colors"
                        >+</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 shrink-0 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">{cartUrunSayisi} ürün seçildi</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(cartToplam)}</span>
              </div>
              <button
                onClick={handleCreateManualOrder}
                disabled={cartUrunSayisi === 0}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-md transition-all"
              >
                Siparişi Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Ürün Düzenle */}
      {editingItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setEditingItem(null)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 flex items-center justify-between border-b bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Ürün Düzenle</h3>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveMenu} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ürün Adı</label>
                <input 
                  type="text" 
                  value={editingItem.name} 
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Fiyat (TL)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={editingItem.price} 
                  onChange={(e) => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-600" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Görsel URL</label>
                <div className="flex items-center gap-3">
                  {editingItem.image ? (
                    <img src={editingItem.image} alt="" className="w-14 h-14 rounded-xl object-cover border border-gray-200 shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div className="w-14 h-14 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300 shrink-0">
                      <Utensils size={20} />
                    </div>
                  )}
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editingItem.image || ''}
                    onChange={(e) => setEditingItem({...editingItem, image: e.target.value})}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Bir görsel adresi yapıştır (mobil uygulama aynı alanı okuyor).</p>
              </div>
              <button type="submit" className="w-full flex justify-center items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md">
                <Save size={20} />
                <span>Değişiklikleri Kaydet</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Yeni Ürün Ekle */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsAddingProduct(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 flex items-center justify-between border-b bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Sisteme Yeni Ürün Ekle</h3>
              <button onClick={() => setIsAddingProduct(false)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ürün Adı</label>
                <input 
                  type="text" 
                  placeholder="Örn: Klasik Burger"
                  value={newItem.name} 
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori</label>
                <select 
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  {categories.length > 0 ? (
                    categories.map((kat) => (
                      <option key={kat.id} value={kat.ad}>{kat.ad}</option>
                    ))
                  ) : (
                    <option value="Burgerler">Burgerler</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Fiyat (TL)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={newItem.price} 
                  onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-600" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">İçerik / Açıklama</label>
                <textarea 
                  rows="2"
                  placeholder="İçerik bilgisini yazınız..."
                  value={newItem.desc} 
                  onChange={(e) => setNewItem({...newItem, desc: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500" 
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Görsel URL</label>
                <div className="flex items-center gap-3">
                  {newItem.image ? (
                    <img src={newItem.image} alt="" className="w-14 h-14 rounded-xl object-cover border border-gray-200 shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div className="w-14 h-14 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300 shrink-0">
                      <Utensils size={20} />
                    </div>
                  )}
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newItem.image}
                    onChange={(e) => setNewItem({...newItem, image: e.target.value})}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Bir görsel adresi yapıştır (mobil uygulama aynı alanı okuyor).</p>
              </div>
              <button type="submit" className="w-full flex justify-center items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md">
                <Plus size={20} />
                <span>Listeye Ekle</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Yeni Malzeme Ekle (Stok Yönetimi) */}
      {isAddingMalzeme && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsAddingMalzeme(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 flex items-center justify-between border-b bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Yeni Malzeme Ekle</h3>
              <button onClick={() => setIsAddingMalzeme(false)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddMalzeme} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Malzeme Adı</label>
                <input
                  type="text"
                  placeholder="Örn: Köfte"
                  value={newMalzeme.ad}
                  onChange={(e) => setNewMalzeme({...newMalzeme, ad: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Birim</label>
                <select
                  value={newMalzeme.birim}
                  onChange={(e) => setNewMalzeme({...newMalzeme, birim: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  required
                >
                  <option value="">Seçiniz</option>
                  <option value="kg">kg (gramaj bazlı - ör: köfte, peynir)</option>
                  <option value="adet">adet (sayı bazlı - ör: kola, ekmek)</option>
                  <option value="lt">lt (litre bazlı - ör: yağ, süt)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kritik Seviye</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Bu seviyenin altına düşünce uyarı verir"
                  value={newMalzeme.kritik_seviye}
                  onChange={(e) => setNewMalzeme({...newMalzeme, kritik_seviye: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <p className="text-xs text-gray-400">Stok miktarı 0 olarak başlar. Mal geldikçe "Stok Ekle" ile SKT'li parti girişi yapılır.</p>
              <button type="submit" className="w-full flex justify-center items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md">
                <Plus size={20} />
                <span>Malzemeyi Kaydet</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Stok Girişi (Parti/SKT) (Stok Yönetimi) */}
      {stokGirisiMalzeme && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setStokGirisiMalzeme(null)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 flex items-center justify-between border-b bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{stokGirisiMalzeme.ad} - Stok Girişi</h3>
                <p className="text-xs text-gray-500 mt-0.5">Mevcut stok: {stokGirisiMalzeme.stok_miktari} {stokGirisiMalzeme.birim}</p>
              </div>
              <button onClick={() => setStokGirisiMalzeme(null)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleStokGirisi} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Gelen Miktar ({stokGirisiMalzeme.birim})</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Örn: 10"
                  value={stokGirisiForm.miktar}
                  onChange={(e) => setStokGirisiForm({...stokGirisiForm, miktar: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Son Kullanma Tarihi (varsa)</label>
                <input
                  type="date"
                  value={stokGirisiForm.skt}
                  onChange={(e) => setStokGirisiForm({...stokGirisiForm, skt: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button type="submit" className="w-full flex justify-center items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md">
                <Plus size={20} />
                <span>Stok Girişini Kaydet</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Hesap Ayarları (Kullanıcı Yönetimi, sadece Admin) */}
      {isAccountSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsAccountSettingsOpen(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-5 flex items-center justify-between border-b bg-gray-50 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Hesap Ayarları — Kullanıcılar</h3>
              <button onClick={() => setIsAccountSettingsOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">Mevcut Kullanıcılar</h4>
                {isKullaniciLoading ? (
                  <p className="text-sm text-gray-400 py-2">Yükleniyor...</p>
                ) : kullanicilar.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">Henüz kullanıcı yok.</p>
                ) : (
                  <div className="space-y-2">
                    {kullanicilar.map((k) => (
                      <div key={k.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{k.kullanici_adi}</p>
                          <p className="text-xs text-gray-500 capitalize">{k.rol}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteKullanici(k)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Sil
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h4 className="text-sm font-bold text-gray-700 mb-3">Yeni Kullanıcı Oluştur</h4>
                <form onSubmit={handleCreateKullanici} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Kullanıcı adı"
                    value={newKullanici.kullanici_adi}
                    onChange={(e) => setNewKullanici({...newKullanici, kullanici_adi: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Şifre (en az 4 karakter)"
                    value={newKullanici.sifre}
                    onChange={(e) => setNewKullanici({...newKullanici, sifre: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                    minLength={4}
                  />
                  <select
                    value={newKullanici.rol}
                    onChange={(e) => setNewKullanici({...newKullanici, rol: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="admin">Admin</option>
                    <option value="mutfak">Mutfak</option>
                    <option value="garson">Garson</option>
                  </select>
                  <button
                    type="submit"
                    className="w-full flex justify-center items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all shadow-md"
                  >
                    <Plus size={18} />
                    <span>Kullanıcı Oluştur</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-gray-800/40 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* SİDEBAR */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white/90 backdrop-blur-xl border-r border-gray-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 shrink-0">
          <h1 className="text-xl font-bold text-orange-500 border-2 border-orange-500 p-1 rounded-lg tracking-tight">Akıllı Restoran</h1>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500 hover:text-orange-500 transition-colors"><X size={24} /></button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* ADMİN ve GARSON için ortak ana sayfa butonu */}
          {(user?.role === 'admin' || user?.role === 'garson') && (
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:translate-x-1 ${activeTab === 'overview' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50/50'}`}>
              {user?.role === 'garson' ? <ShoppingBag size={20} /> : <LayoutDashboard size={20} />}
              <span>{user?.role === 'garson' ? 'Masalar ve Siparişler' : 'Genel Bakış'}</span>
            </button>
          )}

          {user?.role === 'admin' && (
            <button onClick={() => setActiveTab('menu')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:translate-x-1 ${activeTab === 'menu' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50/50'}`}>
              <BookOpen size={20} />
              <span>Menü Yönetimi</span>
            </button>
          )}

          {(user?.role === 'admin' || user?.role === 'mutfak') && (
            <button onClick={() => setActiveTab('mutfak')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:translate-x-1 ${activeTab === 'mutfak' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50/50'}`}>
              <ChefHat size={20} />
              <span>Mutfak Durumu</span>
            </button>
          )}

          {/* Sadece ADMİN için Sipariş Geçmişi */}
          {user?.role === 'admin' && (
            <button onClick={() => setActiveTab('siparis')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:translate-x-1 ${activeTab === 'siparis' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50/50'}`}>
              <Receipt size={20} />
              <span>Sipariş Geçmişi</span>
            </button>
          )}

          {/* Sadece ADMİN için Stok Yönetimi */}
          {user?.role === 'admin' && (
            <button onClick={() => setActiveTab('stok')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:translate-x-1 ${activeTab === 'stok' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50/50'}`}>
              <Package size={20} />
              <span>Stok Yönetimi</span>
              {sktUyarilari.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{sktUyarilari.length}</span>
              )}
            </button>
          )}
        </nav>
        
        <div className="p-4 border-t border-gray-100 shrink-0">
          <button className="group flex items-center space-x-3 px-4 py-3 w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-lg font-medium transition-all duration-300">
            <HelpCircle size={20} className="group-hover:scale-110 transition-transform duration-300" />
            <span>Yardım Merkezi</span>
          </button>
        </div>
      </aside>

      {/* ANA İÇERİK ALANI */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] z-10 shrink-0">
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-gray-600 hover:text-orange-500 transition-colors p-1"><Menu size={24} /></button>
            <h2 className="text-xl font-semibold text-gray-800 tracking-tight hidden sm:block">
              {greeting.text}, <span className="text-orange-600">{greeting.name}</span> <span className="text-xl">{greeting.emoji}</span>
            </h2>
            <h2 className="text-xl font-semibold text-gray-800 tracking-tight sm:hidden">
              {activeTab === 'overview' ? 'Genel Bakış' : activeTab === 'menu' ? 'Menü Yönetimi' : activeTab === 'mutfak' ? 'Mutfak Durumu' : activeTab === 'stok' ? 'Stok Yönetimi' : activeTab === 'siparis' ? 'Sipariş Geçmişi' : 'Genel Bakış'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4 md:space-x-6 relative">
            {(user?.role === 'admin' || user?.role === 'garson') && !sesAcik && (
              <button
                onClick={sesiAcGarson}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm"
              >
                🔊 Ses Aç
              </button>
            )}
            {(user?.role === 'admin' || user?.role === 'garson') && sesAcik && (
              <span className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 text-xs">
                🔊 Açık
              </span>
            )}
            <button onClick={toggleFullScreen} className="text-gray-500 hover:text-orange-500 transition-colors p-2 rounded-lg hover:bg-orange-50 hidden sm:block">
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
            <div className="hidden sm:block h-8 w-px bg-gray-200"></div>
            <div className="relative">
              {isProfileMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />}
              <div className="relative z-50 flex items-center space-x-3 md:space-x-4 cursor-pointer group" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                <div className="hidden md:block text-right transition-transform duration-300 group-hover:-translate-x-1">
                  <p className="text-sm font-medium text-gray-900">{user?.email || 'Yetkili'}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role || 'Admin'} Rolü</p>
                </div>
                <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold border border-orange-200 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:bg-orange-500 group-hover:text-white shrink-0">
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'A'}
                </div>
              </div>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 py-2 origin-top-right animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <div className="px-4 py-2 border-b border-gray-50 mb-1 md:hidden">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role} Rolü</p>
                  </div>
                  <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"><UserIcon size={16} /><span>Profilim</span></button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => { setIsAccountSettingsOpen(true); setIsProfileMenuOpen(false); fetchKullanicilar(); }}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      <Settings size={16} /><span>Hesap Ayarları</span>
                    </button>
                  )}
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"><LogOut size={16} /><span>Çıkış Yap</span></button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* SAYFA İÇERİKLERİ */}
        <div className="p-4 md:p-8 overflow-y-auto flex-1">
          
          {/* GENEL BAKIŞ EKRANI */}
          {activeTab === 'overview' && (
            <div className="animate-in fade-in duration-300">
              {user?.role === 'admin' ? (
                <div className="mb-8">
                  <Istatistikler />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:gap-6 mb-8 md:grid-cols-1">
                  <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-orange-200 cursor-default">
                    <div className="p-3 bg-blue-50 text-blue-500 rounded-xl"><ShoppingBag size={24} /></div>
                    <div className="w-full">
                      <p className="text-sm text-gray-500 font-medium mb-1">Aktif Siparişler</p>
                      {isLoading ? <div className="h-8 bg-gray-100 rounded animate-pulse w-20"></div> : <p className="text-2xl font-bold text-gray-800 tracking-tight">{stats?.aktifSiparis || 0} Bekleyen</p>}
                    </div>
                  </div>
                </div>
              )}

              {(user?.role === 'admin' || user?.role === 'garson') ? (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Masa Düzeni</h3>
                    <div className="flex space-x-4 text-xs font-medium text-gray-500">
                      <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-gray-300 mr-2"></span>Boş</span>
                      <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-2"></span>Dolu</span>
                      <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2 animate-pulse"></span>Yeni Sipariş</span>
                      <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>Sipariş Hazır</span>
                      <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2"></span>Garson Çağrısı</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {/* GÜNCELLEME: Masa Yoksa Uyarı Göster */}
                    {tables.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                         <Utensils size={40} className="mb-3 opacity-30" />
                         <p className="font-medium">Henüz açık masa bulunmuyor.</p>
                         <p className="text-xs mt-1">Veritabanından masaların çekilmesi bekleniyor...</p>
                      </div>
                    ) : (
                      tables.map((table) => (
                        <div key={table.id} onClick={() => handleTableClick(table)} className={`relative p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer hover:-translate-y-1 flex flex-col items-center justify-center text-center ${getTableStyle(table.status)}`}>
                          {table.isCallingWaiter && <div className="absolute -top-3 -left-3 bg-blue-500 text-white p-2 rounded-full shadow-lg animate-bounce" title="Müşteri Garson Çağırıyor!"><ConciergeBell size={16} /></div>}
                          {table.status === 'yeniSiparis' && <div className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg animate-bounce" title="Yeni Sipariş Var!"><BellRing size={16} className="animate-pulse" /></div>}
                          {table.status === 'hazirSiparis' && <div className="absolute -top-3 -right-3 bg-green-500 text-white p-2 rounded-full shadow-lg animate-bounce" title="Sipariş Hazır, Masaya Götür!"><BellRing size={16} className="animate-pulse" /></div>}
                          
                          <Utensils size={28} className="mb-3 opacity-80" strokeWidth={1.5} />
                          <h4 className="font-bold text-lg mb-1">{table.no}</h4>
                          
                          {table.status !== 'bos' ? (
                            <div className="mt-2 space-y-1 w-full border-t border-current/10 pt-2">
                              <p className="text-xs opacity-80 font-medium">{table.items} Sipariş</p>
                              <p className="text-sm font-bold">{formatCurrency(table.amount)}</p>
                            </div>
                          ) : (
                            <div className="mt-2 border-t border-current/10 pt-2 w-full">
                              <p className="text-xs font-medium opacity-60">Müsait</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              {user?.role === 'admin' && (
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                      <Star className="text-orange-500 mr-2" size={20} fill="currentColor" />
                      Son Müşteri Değerlendirmeleri
                    </h3>
                    <div className="flex items-center space-x-2 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                      <button 
                        onClick={() => setReviewFilter('all')} 
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${reviewFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
                      >
                        Tümü
                      </button>
                      <button 
                        onClick={() => setReviewFilter('low')} 
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${reviewFilter === 'low' ? 'bg-red-500 text-white' : 'bg-transparent text-gray-600 hover:bg-red-50 hover:text-red-600'}`}
                      >
                        <Filter size={14} />
                        Şikayetler (≤3)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* GÜNCELLEME: Yorum Yoksa Uyarı Göster */}
                    {reviews.length === 0 ? (
                      <div className="col-span-full py-10 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                        <Star size={32} className="mb-2 opacity-30" />
                        <p className="font-medium">Sistemde henüz müşteri değerlendirmesi bulunmuyor.</p>
                      </div>
                    ) : (
                      reviews
                        .filter(r => reviewFilter === 'all' ? true : r.rating <= 3)
                        .map((review) => (
                        <div key={review.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow animate-in fade-in zoom-in-95 duration-300">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <span className="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg mb-1">{review.table}</span>
                              <h4 className="font-bold text-gray-800 text-sm">{review.author}</h4>
                            </div>
                            <div className="flex space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} className={i < review.rating ? (review.rating <= 3 ? "text-red-500" : "text-orange-500") : "text-gray-300"} fill={i < review.rating ? "currentColor" : "none"} />
                              ))}
                            </div>
                          </div>
                          <p className={`text-sm italic ${review.rating <= 3 ? 'text-red-700 font-medium' : 'text-gray-600'}`}>"{review.comment}"</p>
                          <p className="text-xs text-gray-400 mt-3 text-right">{review.time}</p>
                        </div>
                      ))
                    )}
                    
                    {reviews.length > 0 && reviewFilter === 'low' && reviews.filter(r => r.rating <= 3).length === 0 && (
                      <div className="col-span-full bg-green-50 text-green-700 p-6 rounded-2xl border border-green-200 text-center font-medium">
                        🎉 Harika! Şu an için düşük puanlı hiçbir değerlendirme veya şikayet bulunmuyor.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MENÜ YÖNETİMİ EKRANI */}
          {activeTab === 'menu' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Menü ve Fiyat Yönetimi</h2>
                  <p className="text-sm text-gray-500 mt-1">Burada yapılan güncellemeler mobil uygulamaya anında yansır.</p>
                </div>
                <button 
                  onClick={() => setIsAddingProduct(true)}
                  className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm font-bold text-sm"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Yeni Ürün Ekle</span>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-semibold border-b border-gray-100">Ürün Adı</th>
                      <th className="p-4 font-semibold border-b border-gray-100">Kategori</th>
                      <th className="p-4 font-semibold border-b border-gray-100">Fiyat</th>
                      <th className="p-4 font-semibold border-b border-gray-100 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {isMenuLoading ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-gray-500 font-semibold animate-pulse">
                          Veritabanından ürünler çekiliyor...
                        </td>
                      </tr>
                    ) : menuItems.length === 0 ? (
                       <tr>
                        <td colSpan="4" className="p-8 text-center text-gray-500 font-semibold">
                          Menüde henüz ürün bulunmuyor.
                        </td>
                      </tr>
                    ) : (
                      menuItems.map((item) => (
                        <tr key={item.id} className="hover:bg-orange-50/30 transition-colors group">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {item.image ? (
                                <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
                              ) : (
                                <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-300 shrink-0">
                                  <Utensils size={16} />
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-gray-900">{item.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{item.desc}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-semibold">{item.category}</span>
                          </td>
                          <td className="p-4 font-bold text-gray-900">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="p-4 text-right">
                            <button onClick={() => setEditingItem(item)} className="inline-flex items-center space-x-1 bg-white border border-gray-200 text-gray-700 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-all text-xs font-bold shadow-sm group-hover:shadow">
                              <Edit2 size={14} />
                              <span>Düzenle</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MUTFAK DURUMU EKRANI */}
          {activeTab === 'mutfak' && (
             <div className="animate-in fade-in duration-300">
               <Mutfak />
             </div>
          )}

          {/* SİPARİŞ GEÇMİŞİ EKRANI (Sadece Admin Görebilir) */}
          {activeTab === 'siparis' && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Sipariş Geçmişi</h2>
                    <p className="text-sm text-gray-500 mt-1">Tüm siparişlerin kayıtları, en yeniden eskiye.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={gecmisMasaFiltre}
                      onChange={(e) => setGecmisMasaFiltre(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="all">Tüm Masalar</option>
                      {tables.map((t) => (
                        <option key={t.id} value={String(t.id)}>{t.no}</option>
                      ))}
                    </select>
                    <select
                      value={gecmisDurumFiltre}
                      onChange={(e) => setGecmisDurumFiltre(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="all">Tüm Durumlar</option>
                      <option value="yeni">Yeni</option>
                      <option value="hazirlaniyor">Hazırlanıyor</option>
                      <option value="tamamlandi">Tamamlandı</option>
                      <option value="odendi">Ödendi</option>
                      <option value="iptal">İptal</option>
                    </select>
                    <input
                      type="date"
                      value={gecmisBaslangicTarihi}
                      onChange={(e) => setGecmisBaslangicTarihi(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      title="Başlangıç tarihi"
                    />
                    <input
                      type="date"
                      value={gecmisBitisTarihi}
                      onChange={(e) => setGecmisBitisTarihi(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      title="Bitiş tarihi"
                    />
                    {(gecmisMasaFiltre !== 'all' || gecmisDurumFiltre !== 'all' || gecmisBaslangicTarihi || gecmisBitisTarihi) && (
                      <button
                        onClick={() => { setGecmisMasaFiltre('all'); setGecmisDurumFiltre('all'); setGecmisBaslangicTarihi(''); setGecmisBitisTarihi(''); }}
                        className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-colors font-medium"
                      >
                        Filtreleri Temizle
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="p-4 font-semibold border-b border-gray-100">Masa</th>
                        <th className="p-4 font-semibold border-b border-gray-100">Tarih</th>
                        <th className="p-4 font-semibold border-b border-gray-100">Ürünler</th>
                        <th className="p-4 font-semibold border-b border-gray-100">Tutar</th>
                        <th className="p-4 font-semibold border-b border-gray-100">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {isGecmisLoading ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-gray-500 font-semibold animate-pulse">
                            Sipariş geçmişi yükleniyor...
                          </td>
                        </tr>
                      ) : filtrelenmisGecmis.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-gray-500 font-semibold">
                            Kayıt bulunamadı.
                          </td>
                        </tr>
                      ) : (
                        filtrelenmisGecmis.map((s) => (
                          <tr key={s.id} className="hover:bg-orange-50/30 transition-colors">
                            <td className="p-4 font-bold text-gray-900">{s.masa}</td>
                            <td className="p-4 text-gray-500">{s.tarih}</td>
                            <td className="p-4 text-gray-700 max-w-xs truncate" title={s.urunler.join(', ')}>
                              {s.urunler.join(', ') || '-'}
                            </td>
                            <td className="p-4 font-bold text-gray-900">{formatCurrency(s.toplam_tutar)}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${gecmisDurumBadge(s.durum)}`}>
                                {durumEtiketi(s.durum)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STOK YÖNETİMİ EKRANI (Sadece Admin Görebilir) */}
          {activeTab === 'stok' && (
            <div className="animate-in fade-in duration-300 space-y-6">

              {/* SKT Uyarıları Paneli */}
              {sktUyarilari.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                  <h3 className="text-red-700 font-bold flex items-center mb-3">
                    <AlertCircle size={20} className="mr-2" />
                    Son Kullanma Tarihi Yaklaşan Stoklar
                  </h3>
                  <div className="space-y-2">
                    {sktUyarilari.map((uyari) => (
                      <div key={uyari.parti_id} className="flex justify-between items-center bg-white rounded-xl px-4 py-3 border border-red-100">
                        <div>
                          <p className="font-semibold text-gray-900">{uyari.malzeme}</p>
                          <p className="text-xs text-gray-500">{uyari.kalan_miktar} {uyari.birim} kaldı</p>
                        </div>
                        <span className={`text-sm font-bold px-3 py-1 rounded-lg ${uyari.kalan_gun <= 1 ? 'bg-red-500 text-white' : 'bg-orange-100 text-orange-700'}`}>
                          {uyari.kalan_gun <= 0 ? 'SKT Doldu!' : `${uyari.kalan_gun} gün kaldı`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Malzeme Listesi */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Malzeme &amp; Stok Yönetimi</h2>
                    <p className="text-sm text-gray-500 mt-1">Sipariş verildikçe stoklar buradan otomatik düşer (SKT'si en yakın parti önce).</p>
                  </div>
                  <button
                    onClick={() => setIsAddingMalzeme(true)}
                    className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm font-bold text-sm"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                    <span className="hidden sm:inline">Yeni Malzeme Ekle</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="p-4 font-semibold border-b border-gray-100">Malzeme</th>
                        <th className="p-4 font-semibold border-b border-gray-100">Stok</th>
                        <th className="p-4 font-semibold border-b border-gray-100">Kritik Seviye</th>
                        <th className="p-4 font-semibold border-b border-gray-100">Durum</th>
                        <th className="p-4 font-semibold border-b border-gray-100 text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {isMalzemeLoading ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-gray-500 font-semibold animate-pulse">
                            Stoklar yükleniyor...
                          </td>
                        </tr>
                      ) : malzemeler.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-gray-500 font-semibold">
                            Henüz malzeme eklenmemiş.
                          </td>
                        </tr>
                      ) : (
                        malzemeler.map((malzeme) => {
                          const kritik = malzeme.stok_miktari <= malzeme.kritik_seviye;
                          return (
                            <tr key={malzeme.id} className="hover:bg-orange-50/30 transition-colors">
                              <td className="p-4 font-bold text-gray-900">{malzeme.ad}</td>
                              <td className="p-4 text-gray-700">{malzeme.stok_miktari} {malzeme.birim}</td>
                              <td className="p-4 text-gray-500">{malzeme.kritik_seviye} {malzeme.birim}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${kritik ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                  {kritik ? 'Kritik' : 'Normal'}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => { setStokGirisiMalzeme(malzeme); setStokGirisiForm({ miktar: '', skt: '' }); }}
                                  className="inline-flex items-center space-x-1 bg-white border border-gray-200 text-gray-700 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-all text-xs font-bold shadow-sm"
                                >
                                  <Plus size={14} />
                                  <span>Stok Ekle</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}