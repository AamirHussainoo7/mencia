import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiLayout,
  FiSliders,
  FiCalendar,
  FiFileText,
  FiBarChart2,
  FiCreditCard,
  FiEye,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiCheckCircle,
  FiBell,
  FiExternalLink,
} from 'react-icons/fi';
import axios from 'axios';
import { ServerUrl } from '../utils/constants';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';

function AppLayout({ user, setUser, children }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.get(ServerUrl + '/api/auth/logout', { withCredentials: true });
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
      console.error(error);
    }
  };

  const navItems = [
    { name: 'Overview', path: '/', icon: FiLayout, exact: true },
    { name: 'Assistant', path: '/builder', icon: FiSliders },
    { name: 'Bookings', path: '/bookings', icon: FiCalendar },
    { name: 'Billing', path: '/billing', icon: FiCreditCard },
  ];

  const planName = user?.plan === 'pro' ? 'Pro Plan' : 'Free Plan';
  const userInitial = (user?.name?.charAt(0) || 'U').toUpperCase();

  const SidebarContent = () => (
    <div className='flex flex-col h-full bg-[#FFFCF7] border-r border-[#E6DDD1] select-none'>
      {/* Brand Header */}
      <div className='h-20 flex items-center px-6 border-b border-[#EFE9DF]'>
        <button
          onClick={() => {
            navigate('/');
            setMobileOpen(false);
          }}
          className='flex items-center gap-3 text-left group cursor-pointer'
        >
          <div className='w-9 h-9 rounded-xl bg-[#382017] flex items-center justify-center text-white shadow-sm group-hover:bg-[#A34720] transition-colors'>
            <FiCheckCircle className='text-xl text-[#F5E2D1]' />
          </div>
          <div>
            <span className='font-serif text-2xl font-bold tracking-tight text-[#201A17]'>Arin AI</span>
            <span className='block text-[11px] font-sans font-semibold tracking-wider text-[#A34720] uppercase'>AI Assistant</span>
          </div>
        </button>
      </div>

      {/* Navigation List */}
      <nav className='flex-1 px-4 py-6 space-y-1.5 overflow-y-auto'>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.exact}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#A34720] text-white shadow-sm shadow-[#A34720]/20'
                    : 'text-[#6B5E57] hover:bg-[#F5E2D1]/40 hover:text-[#201A17]'
                }`
              }
            >
              <Icon className='text-lg flex-shrink-0' />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Card */}
      <div className='p-4 border-t border-[#EFE9DF] bg-[#FBF7F0]'>
        <div className='flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-white border border-[#E6DDD1]'>
          <div className='flex items-center gap-2.5 min-w-0'>
            <div className='w-9 h-9 rounded-full bg-[#382017] text-[#F5E2D1] flex items-center justify-center text-sm font-bold flex-shrink-0'>
              {userInitial}
            </div>
            <div className='min-w-0'>
              <p className='text-xs font-bold text-[#201A17] truncate'>{user?.name || 'Aamir Hussain'}</p>
              <p className='text-[11px] font-medium text-[#A34720]'>{planName}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title='Sign Out'
            className='p-2 text-[#968880] hover:text-[#C62828] hover:bg-[#FFEBEE] rounded-xl transition-colors cursor-pointer'
          >
            <FiLogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-[#F8F3EB] flex flex-col lg:flex-row'>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className='hidden lg:block w-64 xl:w-72 flex-shrink-0 fixed inset-y-0 left-0 z-30'>
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className='lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity'
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </div>

      {/* Main Content Area */}
      <div className='flex-1 lg:pl-64 xl:pl-72 flex flex-col min-w-0'>
        {/* Top Header Bar */}
        <header className='h-20 bg-[#FFFCF7]/90 backdrop-blur-md border-b border-[#E6DDD1] sticky top-0 z-20 px-4 sm:px-8 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => setMobileOpen(true)}
              className='lg:hidden p-2 rounded-xl text-[#382017] hover:bg-[#F2EDE4] cursor-pointer'
              aria-label='Open Navigation Menu'
            >
              <FiMenu size={22} />
            </button>
            <div className='hidden sm:block'>
              <span className='text-xs font-semibold uppercase tracking-wider text-[#968880]'>Arin AI Platform</span>
            </div>
          </div>

          <div className='flex items-center gap-3 sm:gap-4'>
            {/* Notification Indicator */}
            <button
              title='Notifications'
              className='w-9 h-9 rounded-xl border border-[#E6DDD1] bg-white text-[#6B5E57] hover:text-[#382017] hover:bg-[#F5E2D1]/30 flex items-center justify-center transition-colors cursor-pointer'
            >
              <FiBell size={16} />
            </button>

            {/* User Mini Badge */}
            <div className='flex items-center gap-2.5 pl-2 border-l border-[#E6DDD1]'>
              <div className='w-8 h-8 rounded-full bg-[#382017] text-[#F5E2D1] flex items-center justify-center text-xs font-bold'>
                {userInitial}
              </div>
              <div className='hidden md:block text-left'>
                <p className='text-xs font-bold text-[#201A17] leading-none'>{user?.name || 'Aamir Hussain'}</p>
                <p className='text-[10px] text-[#A34720] font-semibold mt-0.5'>{planName}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className='flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto'>
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
