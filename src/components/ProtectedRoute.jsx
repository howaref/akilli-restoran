import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();

  // 1. KONTROL: Kullanıcı hiç giriş yapmamışsa
  if (!isAuthenticated) {
    // Navigate bileşeni, kullanıcıyı anında /login rotasına ışınlar. "replace" geçmişi siler ki geri tuşuyla dönemesin.
    return <Navigate to="/login" replace />;
  }

  // 2. KONTROL: Kullanıcının rolü, bu sayfaya girmeye yetkili roller arasında yoksa
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Yetkisiz personeli kendi paneline veya login'e geri gönderiyoruz
    return <Navigate to="/login" replace />; 
  }

  // 3. ONAY: Tüm güvenlik kontrolleri geçildiyse
  // Outlet bileşeni, bu kalkanın içine sarılmış olan asıl sayfayı (örn: Dashboard) ekranda gösterir.
  return <Outlet />;
}