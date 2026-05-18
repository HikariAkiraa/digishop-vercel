import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './services/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import Contact from './pages/Contact';
import Inventory from './pages/Inventory';
import Categories from './pages/Categories';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import QrCode from './pages/QrCode';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/catalog" replace />;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<Layout />}>
        {/* Guest will be redirected to catalog automatically, admin to dashboard */}
        <Route index element={isAuthenticated ? <Dashboard /> : <Navigate to="/catalog" replace />} />
        
        {/* Public Routes */}
        <Route path="catalog" element={<Catalog />} />
        <Route path="contact" element={<Contact />} />
        <Route path="qrcode" element={<QrCode />} />

        {/* Protected Admin Routes */}
        <Route path="inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
        <Route path="transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
