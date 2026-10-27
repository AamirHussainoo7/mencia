import { useState, useEffect } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, provider } from '../utils/firebase';
import axios from 'axios';
import { ServerUrl } from '../utils/constants';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import diningImg from '../assets/dining_scene.jpg';

function Login({ setUser }) {
  const navigate = useNavigate();
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if returning from redirect sign-in
  useEffect(() => {
    let isMounted = true;
    const processRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user && isMounted) {
          setLoading(true);
          const { displayName, email } = result.user;
          const res = await axios.post(
            `${ServerUrl}/api/auth/google`,
            { name: displayName || email?.split('@')[0] || 'User', email },
            { withCredentials: true }
          );
          if (setUser) setUser(res.data);
          toast.success('Welcome back!');
          navigate('/');
        }
      } catch (error) {
        console.error('Redirect Sign-in Error:', error);
        toast.error(error?.response?.data?.message || error?.message || 'Authentication failed');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    processRedirect();
    return () => {
      isMounted = false;
    };
  }, [navigate, setUser]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const { displayName, email } = result.user;
      const res = await axios.post(
        `${ServerUrl}/api/auth/google`,
        { name: displayName || email?.split('@')[0] || 'User', email },
        { withCredentials: true }
      );
      setUser(res.data);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      console.error('Google Sign-in Error:', error);
      if (error?.code === 'auth/popup-blocked') {
        toast('Popup blocked by browser. Redirecting to Google Sign-in...', { icon: '🔄' });
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr) {
          toast.error('Redirect failed: ' + redirectErr.message);
        }
      } else if (error?.code === 'auth/popup-closed-by-user') {
        toast('Sign in window was closed.', { icon: 'ℹ️' });
      } else if (error?.code === 'auth/unauthorized-domain') {
        toast.error('Domain not authorized in Firebase Console.');
      } else if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error?.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailContinue = (e) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      toast.error('Please enter your email or use Google Sign-In.');
      return;
    }
    // Direct user to Google OAuth for secure SSO
    toast('Using secure Google SSO for your account...', { icon: '🔐' });
    handleGoogleSignIn();
  };

  return (
    <div className='min-h-screen bg-[#F8F3EB] flex flex-col justify-between selection:bg-[#F5E2D1] selection:text-[#382017]'>
      {/* Minimal Header */}
      <div className='max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between'>
        <Link to='/' className='flex items-center gap-3 group'>
          <div className='w-9 h-9 rounded-xl bg-[#382017] flex items-center justify-center text-white shadow-2xs group-hover:bg-[#A34720] transition-colors'>
            <FiCheckCircle className='text-xl text-[#F5E2D1]' />
          </div>
          <span className='font-serif text-2xl font-bold tracking-tight text-[#201A17]'>Arin AI</span>
        </Link>
        <Link to='/' className='text-xs font-bold text-[#A34720] hover:underline'>
          Back to Home →
        </Link>
      </div>

      {/* Main Split / Card Canvas */}
      <div className='flex-1 flex items-center justify-center px-4 py-8 max-w-5xl mx-auto w-full'>
        <div className='w-full grid grid-cols-1 md:grid-cols-12 rounded-[36px] overflow-hidden border border-[#E6DDD1] shadow-xl bg-[#FFFCF7]'>
          {/* Left Visual Column: Warm Dining Ambience */}
          <div className='hidden md:block md:col-span-5 relative'>
            <img
              src={diningImg}
              alt='Restaurant ambiance'
              className='w-full h-full object-cover filter brightness-[0.9]'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-[#24140D]/90 via-[#24140D]/30 to-transparent flex flex-col justify-end p-8 text-white'>
              <span className='text-[10px] font-bold tracking-widest text-[#F5E2D1] uppercase'>SaaS Concierge</span>
              <h3 className='font-serif text-2xl font-bold mt-1 text-white leading-tight'>
                The intelligent voice host for modern dining.
              </h3>
              <p className='text-xs text-[#F5E2D1]/80 mt-2 leading-relaxed'>
                Live table reservations, availability checks, and guest guidance embedded in one script tag.
              </p>
            </div>
          </div>

          {/* Right Column: Clean Login Card Matching Moodboard */}
          <div className='md:col-span-7 p-8 sm:p-14 flex flex-col justify-center'>
            <div className='max-w-md mx-auto w-full text-center'>
              {/* Logo & Header */}
              <div className='w-12 h-12 rounded-2xl bg-[#382017] text-[#F5E2D1] flex items-center justify-center text-2xl mx-auto mb-4 shadow-sm'>
                <FiCheckCircle />
              </div>
              <h2 className='font-serif text-3xl font-bold text-[#201A17] tracking-tight'>Welcome back</h2>
              <p className='text-xs sm:text-sm text-[#6B5E57] mt-1 font-medium'>
                Sign in to continue to your restaurant dashboard
              </p>

              {/* Primary Google SSO Action */}
              <div className='mt-8'>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className='w-full h-14 rounded-2xl border border-[#E6DDD1] bg-white hover:bg-[#FBF7F0] text-[#201A17] text-sm font-bold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-2xs hover:scale-[1.01]'
                >
                  <FcGoogle className='text-2xl bg-white p-0.5 rounded-full' />
                  <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
                </button>
              </div>

              {/* Divider */}
              <div className='relative my-6'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-[#EFE9DF]' />
                </div>
                <div className='relative flex justify-center text-[11px] font-bold text-[#968880] uppercase tracking-wider'>
                  <span className='bg-[#FFFCF7] px-3'>or</span>
                </div>
              </div>

              {/* Email Input Field & Continue Button */}
              <form onSubmit={handleEmailContinue} className='space-y-3 text-left'>
                <div>
                  <label className='block text-xs font-bold text-[#6B5E57] mb-1.5'>Email address</label>
                  <input
                    type='email'
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder='owner@restaurant.com'
                    className='w-full h-12 rounded-xl border border-[#E6DDD1] bg-white px-4 text-xs text-[#201A17] outline-none placeholder-[#968880] focus:border-[#A34720]'
                  />
                </div>

                <button
                  type='submit'
                  className='w-full h-12 rounded-xl bg-[#A34720] hover:bg-[#853717] text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2'
                >
                  <span>Continue</span>
                  <FiArrowRight size={14} />
                </button>
              </form>

              {/* Footer Terms Notice */}
              <p className='mt-8 text-[11px] text-[#968880] leading-relaxed'>
                By continuing, you agree to our{' '}
                <a href='#' className='text-[#A34720] font-semibold hover:underline'>
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href='#' className='text-[#A34720] font-semibold hover:underline'>
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Footer */}
      <div className='py-6 text-center text-xs text-[#968880]'>
        © {new Date().getFullYear()} Arin AI Technologies Inc.
      </div>
    </div>
  );
}

export default Login;
