import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewMemory from './pages/NewMemory';
import MemoryDetail from './pages/MemoryDetail';
import Timeline from './pages/Timeline';
import ProductPreview from './pages/ProductPreview';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';
import Contribute from './pages/Contribute';
import Constellation from './pages/Constellation';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/memories/new"
            element={
              <ProtectedRoute>
                <NewMemory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/memories/:id"
            element={
              <ProtectedRoute>
                <MemoryDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timeline"
            element={
              <ProtectedRoute>
                <Timeline />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artworks/:artworkId/product"
            element={
              <ProtectedRoute>
                <ProductPreview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
          <Route
            path="/constellation"
            element={
              <ProtectedRoute>
                <Constellation />
              </ProtectedRoute>
            }
          />
          <Route path="/contribute/:token" element={<Contribute />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
