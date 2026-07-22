import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // createJSONStorage eklendi

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null, // Giriş yapan kullanıcının bilgileri (email, role vb.)
      isAuthenticated: false, // Oturum açık mı?
      
      // Giriş fonksiyonu: Girilen e-posta adresine göre rolü dinamik belirler
      login: async (email, password) => {
        try {
          // 1. Durum: Yönetici (Admin) Girişi
          if (email === 'admin@restoran.com' && password === '123456') {
            set({ user: { role: 'admin', email }, isAuthenticated: true });
            return true;
          } 
          // 2. Durum: Aşçı (Mutfak) Girişi
          else if (email === 'mutfak@restoran.com' && password === '123456') {
            set({ user: { role: 'mutfak', email }, isAuthenticated: true });
            return true;
          } 
          // 3. Durum: Garson Girişi
          else if (email === 'garson@restoran.com' && password === '123456') {
            set({ user: { role: 'garson', email }, isAuthenticated: true });
            return true;
          }
          
          return false; // E-posta veya şifre hatalıysa
        } catch (error) {
          console.error("Giriş hatası:", error);
          return false;
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