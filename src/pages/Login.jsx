import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const success = await login(email, password);
    
    if (success) {
      toast.success('Giriş başarılı, yönlendiriliyorsunuz...');
      navigate('/dashboard');
    } else {
      toast.error('Hatalı e-posta veya şifre!');
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      
      {/* Arka planı hafif karartan katman (Fotoğrafın renklerini daha iyi ortaya çıkarır) */}
      <div className="absolute inset-0 bg-black/30 z-0"></div>

      {/* BUZLU CAM (GLASSMORPHISM) EFEKTLİ GİRİŞ KARTI */}
      <div className="relative z-10 bg-white/10 backdrop-blur-md p-10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-full max-w-md border border-white/20">
        
        {/* Başlık Alanı - Yazılar beyaz ve açık gri yapıldı */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight drop-shadow-md">Akıllı Restoran</h1>
          <p className="text-sm text-gray-300 font-medium">Yönetim paneline erişmek için giriş yapın.</p>
        </div>

        {/* Form Alanı */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">E-Posta Adresi</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // Inputlar da cama uyumlu yarı saydam ve beyaz metinli yapıldı
              className="w-full px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/80 focus:border-transparent transition-all bg-black/20 text-white placeholder-gray-400"
              placeholder="admin@restoran.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/80 focus:border-transparent transition-all bg-black/20 text-white placeholder-gray-400"
              placeholder="••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(249,115,22,0.5)] disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
        
      </div>
    </div>
  );
}