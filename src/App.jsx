import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Mutfak from './pages/Mutfak';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '10px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
          success: { style: { background: '#10B981' } },
          error: { style: { background: '#EF4444' } },
        }} 
      />

      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* GÜNCELLENEN KISIM: Dashboard'a tüm yetkili roller girebilir */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'mutfak', 'garson']} />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Mutfak sayfasına sadece admin ve mutfak girebilir */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'mutfak']} />}>
          <Route path="/mutfak" element={<Mutfak />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;