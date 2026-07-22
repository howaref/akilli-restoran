import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import Mutfak from './Mutfak'; 
import Istatistikler from "../components/Istatistikler";
import { LayoutDashboard, ChefHat, Users, LogOut, TrendingUp, ShoppingBag, AlertCircle, BarChart3, Menu, X, Settings, HelpCircle, User as UserIcon, Maximize, Minimize, Utensils, BellRing, Star, ConciergeBell, Receipt, BookOpen, Edit2, Save, Plus, Filter } from 'lucide-react';
import { getDashboardStats } from '../services/dashboardService';
import { fetchUrunler, fetchKategoriler, addUrun } from '../services/api';
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

  const [activeTab, setActiveTab] = useState(user?.role === 'mutfak' ? 'mutfak' : 'overview');
  
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: '', price: '', desc: '' });
  const [reviewFilter, setReviewFilter] = useState('all');
  const [menuItems, setMenuItems] = useState([]);

  // SAHTE VERİLER KALDIRILDI - Gerçek API'den dolması için boş array yapıldı
  const [tables, setTables] = useState([]);
  const [reviews, setReviews] = useState([]);

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
          desc: urun.aciklama || '-'
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

  const handleLogout = () => {
    logout();
    toast('Görüşmek üzere!', { icon: '👋', style: { background: '#F97316', color: '#fff' } });
    navigate('/login');
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const getTableStyle = (status) => {
    switch(status) {
      case 'bos': return 'bg-white border-gray-200 hover:border-gray-300 text-gray-400';
      case 'dolu': return 'bg-orange-50/50 border-orange-400 text-orange-700 shadow-sm';
      case 'yeniSiparis': return 'bg-red-50 border-red-500 text-red-700 shadow-md ring-4 ring-red-500/20'; 
      default: return 'bg-white border-gray-200';
    }
  };

  const handleTableClick = (table) => {
    if (table.status === 'bos') {
      toast('Bu masa şu an boş.', { icon: 'ℹ️' });
      return;
    }
    setSelectedTable(table);
  };

  const handleSaveMenu = (e) => {
    e.preventDefault();
    setMenuItems(menuItems.map(item => item.id === editingItem.id ? editingItem : item));
    setEditingItem(null);
    toast.success('Fiyat başarıyla güncellendi!', { duration: 4000 });
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
        aciklama: newItem.desc
      };

      const kaydedilenUrun = await addUrun(urunVerisi);

      const productToAdd = {
        id: kaydedilenUrun.id || Date.now(), 
        name: kaydedilenUrun.ad || urunVerisi.ad,
        category: newItem.category, 
        price: kaydedilenUrun.fiyat || urunVerisi.fiyat,
        desc: kaydedilenUrun.aciklama || urunVerisi.aciklama
      };

      setMenuItems([productToAdd, ...menuItems]);
      setIsAddingProduct(false);
      setNewItem({ name: '', category: categories[0]?.ad || 'Burgerler', price: '', desc: '' }); 
      
      toast.success(`"${productToAdd.name}" başarıyla menüye eklendi!`, { id: loadingToast, duration: 4000 });
      
    } catch (error) {
      console.error("Ekleme hatası:", error);
      toast.error('Ürün kaydedilemedi! API bağlantınızı kontrol edin.', { id: loadingToast, duration: 4000 });
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans relative overflow-hidden">
      
      {/* Modal - Seçili Masa Adisyonu */}
      {selectedTable && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedTable(null)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`p-5 flex items-center justify-between border-b ${selectedTable.status === 'yeniSiparis' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl ${selectedTable.status === 'yeniSiparis' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
                  <Receipt size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedTable.no} Adisyonu</h3>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${selectedTable.status === 'yeniSiparis' ? 'text-red-600' : 'text-orange-600'}`}>
                    {selectedTable.status === 'yeniSiparis' ? '🚨 Yeni Sipariş Bekliyor' : 'Dolu Masa'}
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
                {selectedTable.orders.map((order, index) => (
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
                <button onClick={() => { toast.success('Garson çağrısı yanıtlandı.'); setSelectedTable(null); }} className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-3 rounded-xl transition-colors">Çağrıyı Kapat</button>
              )}
              {selectedTable.status === 'yeniSiparis' ? (
                <button onClick={() => { toast.success('Sipariş onaylandı ve mutfağa iletildi!'); setSelectedTable(null); }} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-md transition-all hover:-translate-y-0.5">Siparişi Onayla</button>
              ) : (
                <button onClick={() => { toast.success('Hesap kapatıldı.'); setSelectedTable(null); }} className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl shadow-md transition-all hover:-translate-y-0.5">Hesabı Tahsil Et</button>
              )}
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
              <button type="submit" className="w-full flex justify-center items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md">
                <Save size={20} />
                <span>Değişiklikleri Arayüzde Kaydet</span>
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
              <button type="submit" className="w-full flex justify-center items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md">
                <Plus size={20} />
                <span>Listeye Ekle</span>
              </button>
            </form>
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

          {user?.role === 'admin' && (
            <button onClick={() => setActiveTab('personel')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:translate-x-1 ${activeTab === 'personel' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50/50'}`}>
              <Users size={20} />
              <span>Personel</span>
            </button>
          )}

          {/* Sadece ADMİN için Gelişmiş Sipariş Paneli */}
          {user?.role === 'admin' && (
            <button onClick={() => setActiveTab('siparis')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:translate-x-1 ${activeTab === 'siparis' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50/50'}`}>
              <ShoppingBag size={20} />
              <span>Gelişmiş Sipariş</span>
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
              {activeTab === 'overview' ? 'Genel Bakış' : activeTab === 'menu' ? 'Menü Yönetimi' : activeTab === 'mutfak' ? 'Mutfak Durumu' : activeTab === 'personel' ? 'Personel' : 'Masa Sipariş'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4 md:space-x-6 relative">
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
                  <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"><Settings size={16} /><span>Hesap Ayarları</span></button>
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
                            <p className="font-bold text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{item.desc}</p>
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

          {/* PERSONEL EKRANI YER TUTUCU */}
          {activeTab === 'personel' && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in duration-300">
              <Users size={64} className="mb-4 opacity-50" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Personel Yönetimi</h2>
              <p className="text-gray-500 font-medium">Bu modül henüz kodlanmadı. Yakında eklenecektir.</p>
            </div>
          )}

          {/* MASA SİPARİŞ EKRANI YER TUTUCU (Sadece Admin Görebilir) */}
          {activeTab === 'siparis' && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in duration-300">
              <ShoppingBag size={64} className="mb-4 opacity-50" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Gelişmiş Sipariş Yönetimi</h2>
              <p className="text-gray-500 font-medium">Gelişmiş detay paneli buraya eklenecektir.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}