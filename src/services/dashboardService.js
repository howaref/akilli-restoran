import api from './api';

export const getDashboardStats = async () => {
  try {
    // Backend'in ilgili uç noktasına (endpoint) GET isteği atılır.
    const response = await api.get('/dashboard/stats');
    
    // İstek başarılı olursa, backend'den gelen gerçek JSON verisi döndürülür.
    return response.data;
  } catch (error) {
    console.error("API'den istatistikler çekilirken hata oluştu:", error);
    
    // Sahte mock veriler tamamen kaldırıldı. 
    // Sunucu kapalı veya hata durumunda arayüzün patlamaması için sıfır (0) döndürülüyor.
    return {
      ciro: 0,
      aktifSiparis: 0,
      kritikStok: 0
    };
  }
};