import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Builder from './pages/Builder';
import Bookings from './pages/Bookings';
import Billing from './pages/Billing';
import ProtectedRoute from './Components/ProtectedRoute';
import AppLayout from './Components/AppLayout';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
import { ServerUrl } from './utils/constants';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axios.get(ServerUrl + '/api/user/current-user', { withCredentials: true });
        setUser(res.data);
      } catch (error) {
        // User not logged in, remain in signed-out state
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  if (loading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-[#F8F3EB] gap-3'>
        <div className='w-10 h-10 border-3 border-[#A34720] border-t-transparent rounded-full animate-spin' />
        <span className='font-serif text-sm font-bold text-[#382017] tracking-wider uppercase'>Arin AI</span>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position='top-right'
        toastOptions={{
          style: {
            background: '#FFFCF7',
            color: '#201A17',
            border: '1px solid #E6DDD1',
            borderRadius: '16px',
            fontSize: '13px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            boxShadow: '0 8px 30px rgba(56,32,23,0.08)',
          },
        }}
      />
      <Routes>
        {/* Authentication Route */}
        <Route
          path='/login'
          element={user ? <Navigate to='/' replace /> : <Login setUser={setUser} />}
        />

        {/* Public Landing Page OR Authenticated Dashboard Overview */}
        <Route
          path='/'
          element={
            user ? (
              <AppLayout user={user} setUser={setUser}>
                <Dashboard user={user} />
              </AppLayout>
            ) : (
              <Home user={user} setUser={setUser} />
            )
          }
        />

        {/* Protected SaaS Application Routes */}
        <Route
          path='/builder'
          element={
            <ProtectedRoute user={user} loading={loading}>
              <AppLayout user={user} setUser={setUser}>
                <Builder user={user} setUser={setUser} />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/bookings'
          element={
            <ProtectedRoute user={user} loading={loading}>
              <AppLayout user={user} setUser={setUser}>
                <Bookings user={user} />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/billing'
          element={
            <ProtectedRoute user={user} loading={loading}>
              <AppLayout user={user} setUser={setUser}>
                <Billing user={user} />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </>
  );
}

export default App;
