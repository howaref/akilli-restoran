import axios from 'axios';

// Backend sunucusunun adresi
const API_BASE_URL = 'http://localhost:8000/api'; 

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Ürünleri getiren servis fonksiyonu (GET)
export const fetchUrunler = async () => {
    try {
        const response = await api.get('/urunler');
        return response.data;
    } catch (error) {
        console.error("Ürünler çekilirken hata oluştu:", error);
        throw error;
    }
};

// Kategorileri getiren servis fonksiyonu (GET)
export const fetchKategoriler = async () => {
    try {
        const response = await api.get('/kategoriler');
        return response.data;
    } catch (error) {
        console.error("Kategoriler çekilirken hata oluştu:", error);
        throw error;
    }
};

// YENİ: Sisteme yeni ürün ekleyen servis fonksiyonu (POST)
export const addUrun = async (urunData) => {
    try {
        // Axios arka planda JSON.stringify işlemini kendi yapar
        const response = await api.post('/urunler', urunData);
        return response.data;
    } catch (error) {
        console.error("Ürün eklenirken hata oluştu:", error);
        throw error;
    }
};

export default api;