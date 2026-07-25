import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null, // Giriş yapan kullanıcının bilgileri (email, role vb.)
      isAuthenticated: false, // Oturum açık mı?

      // GÜNCELLEME: Sabit kodlanmış (hardcoded) hesaplar kaldırıldı.
      // Giriş artık gerçek backend'e (POST /api/login) bağlı, veritabanındaki kullanıcılarla doğrulanıyor.
      login: async (kullaniciAdi, sifre) => {
        try {
          const response = await api.post('/login', {
            kullanici_adi: kullaniciAdi,
            sifre: sifre
          });
          const { kullanici_adi, rol } = response.data;
          // Not: Dashboard.jsx ve diğer bileşenler user.email alanını okuyor,
          // bu yüzden kullanici_adi değeri email alanına yerleştiriliyor (kod tabanını değiştirmemek için).
          set({ user: { role: rol, email: kullanici_adi }, isAuthenticated: true });
          return true;
        } catch (error) {
          console.error("Giriş hatası:", error);
          return false; // Kullanıcı adı veya şifre hatalıysa (401) ya da sunucu hatasıysa
        }
      },

      // Çıkış fonksiyonu: State'i sıfırlar ve Session Storage'ı otomatik temizler
      logout: () => set({ user: null, isAuthenticated: false })
    }),
    {
      name: 'auth-storage', // Tarayıcı hafızasındaki anahtar isim
      storage: createJSONStorage(() => sessionStorage), // Sadece açık olan sekmeye özel hafıza ayarı
    }
  )
);