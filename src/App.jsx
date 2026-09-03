import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import { applyTheme } from './theme/applyTheme';
import { defaultTheme } from './theme/defaultTheme';

import { I18nProvider } from './context/I18nContext';
import { ToastProvider } from './context/ToastContext';
import { BusinessProvider } from './context/BusinessContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { CartProvider } from './context/CartContext';

import Layout from './components/layout/Layout';
import ProtectedRoute from './routes/ProtectedRoute';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderCancel from './pages/OrderCancel';
import TrackOrder from './pages/TrackOrder';
import Reels from './pages/Reels';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';

import AccountLayout from './pages/account/AccountLayout';
import Dashboard from './pages/account/Dashboard';
import Orders from './pages/account/Orders';
import OrderDetail from './pages/account/OrderDetail';
import Wishlist from './pages/account/Wishlist';
import MyReviews from './pages/account/MyReviews';
import Profile from './pages/account/Profile';

export default function App() {
  useEffect(() => {
    /* One call paints the whole design system onto :root.
       When the backend ships business/theme, merge it and call applyTheme again. */
    applyTheme(defaultTheme);
  }, []);

  return (
    <BrowserRouter>
      <I18nProvider>
        <ToastProvider>
          <BusinessProvider>
            <AuthProvider>
              <WishlistProvider>
                <CartProvider>
                  <ScrollToTop />
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/product/:slug" element={<ProductDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/order/success" element={<OrderSuccess />} />
                      <Route path="/order/cancel" element={<OrderCancel />} />
                      <Route path="/track" element={<TrackOrder />} />
                      <Route path="/reels" element={<Reels />} />
                      <Route path="/reels/:slug" element={<Reels />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ForgotPassword />} />

                      <Route
                        path="/account"
                        element={<ProtectedRoute><AccountLayout /></ProtectedRoute>}
                      >
                        <Route index element={<Dashboard />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="orders/:id" element={<OrderDetail />} />
                        <Route path="wishlist" element={<Wishlist />} />
                        <Route path="reviews" element={<MyReviews />} />
                        <Route path="profile" element={<Profile />} />
                      </Route>

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </CartProvider>
              </WishlistProvider>
            </AuthProvider>
          </BusinessProvider>
        </ToastProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}
