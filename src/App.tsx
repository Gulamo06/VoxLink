import { AnimatePresence, motion } from 'framer-motion';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import { Analytics } from '@vercel/analytics/react';

function AuthenticatedLayout() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home tab="chats" />} />
        <Route path="/contacts" element={<Home tab="contacts" />} />
        <Route path="/rooms" element={<Home tab="groups" />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  const { currentUser } = useAuthStore();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-text">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentUser ? 'app-authenticated' : 'app-guest'}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="mx-auto max-w-xl px-0"
          >
            {currentUser ? (
              <AuthenticatedLayout />
            ) : (
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <Analytics />
    </ErrorBoundary>
  );
}

export default App;
