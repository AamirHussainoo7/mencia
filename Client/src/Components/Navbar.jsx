import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMenu, FiX, FiCheckCircle } from 'react-icons/fi';

function Navbar({ user }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className='sticky top-0 z-40 bg-[#F8F3EB]/90 backdrop-blur-md border-b border-[#E6DDD1]'>
      <div className='max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between'>
        {/* Brand Logo */}
        <Link to='/' className='flex items-center gap-3 group'>
          <div className='w-9 h-9 rounded-xl bg-[#382017] flex items-center justify-center text-white shadow-2xs group-hover:bg-[#A34720] transition-colors'>
            <FiCheckCircle className='text-xl text-[#F5E2D1]' />
          </div>
          <div>
            <span className='font-serif text-2xl font-bold tracking-tight text-[#201A17]'>Arin AI</span>
          </div>
        </Link>

        {/* Center Navigation Links (Public Marketing) */}
        <nav className='hidden md:flex items-center gap-8 text-sm font-semibold text-[#6B5E57]'>
          <a href='#features' className='hover:text-[#A34720] transition-colors'>Features</a>
          <a href='#how-it-works' className='hover:text-[#A34720] transition-colors'>How it Works</a>
        </nav>

        {/* Right CTA Actions */}
        <div className='hidden sm:flex items-center gap-3'>
          {user ? (
            <button
              onClick={() => navigate('/')}
              className='px-5 py-2.5 rounded-2xl bg-[#A34720] text-white text-sm font-semibold hover:bg-[#853717] transition-all cursor-pointer shadow-xs shadow-[#A34720]/25'
            >
              Go to Dashboard →
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className='px-6 py-2.5 rounded-2xl bg-[#382017] text-white text-sm font-semibold hover:bg-[#A34720] transition-all cursor-pointer shadow-xs'
            >
              Get Started
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className='md:hidden p-2 text-[#382017] hover:bg-[#F2EDE4] rounded-xl'
          aria-label='Toggle mobile navigation'
        >
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className='md:hidden border-b border-[#E6DDD1] bg-[#FFFCF7] px-6 py-6 space-y-4 animate-fadeIn'>
          <nav className='flex flex-col space-y-3 text-sm font-semibold text-[#6B5E57]'>
            <a href='#features' onClick={() => setMobileMenuOpen(false)} className='py-2 hover:text-[#A34720]'>Features</a>
            <a href='#how-it-works' onClick={() => setMobileMenuOpen(false)} className='py-2 hover:text-[#A34720]'>How it Works</a>
          </nav>
          <div className='pt-4 border-t border-[#EFE9DF] flex flex-col gap-2.5'>
            {user ? (
              <button
                onClick={() => {
                  navigate('/');
                  setMobileMenuOpen(false);
                }}
                className='w-full py-3 rounded-2xl bg-[#A34720] text-white text-sm font-semibold text-center'
              >
                Go to Dashboard →
              </button>
            ) : (
              <button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className='w-full py-3 rounded-2xl bg-[#382017] text-white text-sm font-semibold text-center hover:bg-[#A34720]'
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
