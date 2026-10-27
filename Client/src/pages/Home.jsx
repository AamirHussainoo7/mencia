import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiMic,
  FiCompass,
  FiCode,
  FiCalendar,
  FiPlay,
  FiCheckCircle,
  FiArrowRight,
  FiCheck,
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, provider } from '../utils/firebase';
import axios from 'axios';
import { ServerUrl } from '../utils/constants';
import toast from 'react-hot-toast';
import AssistantPreview from '../Components/AssistantPreview';
import heroImg from '../assets/hero_restaurant.jpg';
import diningImg from '../assets/dining_scene.jpg';
import Navbar from '../Components/Navbar';

function Home({ user, setUser }) {
  const navigate = useNavigate();

  // Process redirect sign-in result if returning from redirect
  useEffect(() => {
    let isMounted = true;
    const processRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user && isMounted) {
          const { displayName, email } = result.user;
          const res = await axios.post(
            `${ServerUrl}/api/auth/google`,
            { name: displayName || email?.split('@')[0] || 'User', email },
            { withCredentials: true }
          );
          if (setUser) setUser(res.data);
          toast.success('Signed in successfully!');
          navigate('/');
        }
      } catch (error) {
        console.error('Redirect Sign-in Error:', error);
      }
    };
    processRedirect();
    return () => {
      isMounted = false;
    };
  }, [navigate, setUser]);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const { displayName, email } = result.user;
      const res = await axios.post(
        `${ServerUrl}/api/auth/google`,
        { name: displayName || email?.split('@')[0] || 'User', email },
        { withCredentials: true }
      );
      if (setUser) setUser(res.data);
      toast.success('Signed in successfully!');
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
        toast.error(error?.message || 'Google sign in failed');
      }
    }
  };

  const featurePills = [
    {
      icon: FiMic,
      title: 'Voice AI',
      desc: 'Natural conversation',
    },
    {
      icon: FiCompass,
      title: 'Smart Navigation',
      desc: 'Guide users to pages',
    },
    {
      icon: FiCode,
      title: 'Easy Embed',
      desc: 'Add with one script tag',
    },
    {
      icon: FiCalendar,
      title: 'Appointments & Booking',
      desc: 'Real-time reservations',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Sign up free',
      desc: 'Continue with Google and create your assistant in under 60 seconds.',
    },
    {
      num: '02',
      title: 'Customize personality',
      desc: 'Set your business name, tone, voice demeanor, and FAQ responses.',
    },
    {
      num: '03',
      title: 'Set booking rules',
      desc: 'Define time slots, party limits, and operating hours with zero overbooking.',
    },
    {
      num: '04',
      title: 'Embed anywhere',
      desc: 'Copy a single script tag and paste it into any website or CMS.',
    },
  ];

  return (
    <div className='min-h-screen bg-[#F8F3EB] text-[#201A17] flex flex-col font-sans selection:bg-[#F5E2D1] selection:text-[#382017]'>
      {/* Public Navigation */}
      <Navbar user={user} />

      {/* Hero Section (Matching Moodboard Editorial Split) */}
      <section className='relative px-4 sm:px-8 pt-8 sm:pt-14 pb-16 sm:pb-24 max-w-7xl mx-auto w-full'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center'>
          {/* Left Column: Editorial Typography & CTAs */}
          <div className='lg:col-span-7 space-y-6 text-left'>
            {/* Category Eyebrow Pill */}
            <div className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E6DDD1] bg-[#FFFCF7] text-xs font-bold text-[#A34720] shadow-2xs'>
              <span className='w-1.5 h-1.5 rounded-full bg-[#A34720] animate-pulse'></span>
              AI Web Assistant Platform
            </div>

            {/* Serif Headline with Terracotta Highlight */}
            <h1 className='font-serif text-4xl sm:text-6xl lg:text-[68px] font-bold tracking-tight text-[#201A17] leading-[1.08]'>
              Add an AI{' '}
              <span className='text-[#A34720] italic font-normal'>Assistant</span> to{' '}
              <br className='hidden sm:block' />
              your Website
            </h1>

            {/* Supporting Copy */}
            <p className='text-base sm:text-lg text-[#6B5E57] max-w-xl leading-relaxed'>
              Create a smart voice-enabled assistant that talks to visitors, answers questions,
              navigates pages, and manages real-time bookings & leads for any business.
            </p>

            {/* Primary CTA (Watch Demo removed per user request) */}
            <div className='flex flex-wrap items-center gap-4 pt-2'>
              {user ? (
                <button
                  onClick={() => navigate('/')}
                  className='h-14 px-8 rounded-2xl bg-[#382017] hover:bg-[#A34720] text-white text-base font-semibold shadow-sm hover:scale-[1.01] transition-all cursor-pointer flex items-center gap-2'
                >
                  <span>Open Your Dashboard</span>
                  <FiArrowRight />
                </button>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  className='h-14 px-8 rounded-2xl bg-[#382017] hover:bg-[#A34720] text-white text-sm sm:text-base font-semibold shadow-sm hover:scale-[1.01] transition-all cursor-pointer flex items-center gap-3'
                >
                  <FcGoogle className='text-2xl bg-white p-0.5 rounded-full' />
                  <span>Get Started with Google</span>
                </button>
              )}
            </div>

            {/* Micro Tier Info */}
            <p className='text-xs font-semibold text-[#968880] tracking-wide'>
              Free plan includes 100 AI responses · No credit card required
            </p>

            {/* 4 Feature Pills at Bottom of Hero */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#EFE9DF]'>
              {featurePills.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <div
                    key={idx}
                    className='p-3.5 rounded-2xl bg-[#FFFCF7] border border-[#E6DDD1] shadow-2xs hover:border-[#A34720]/40 transition-colors'
                  >
                    <div className='w-8 h-8 rounded-xl bg-[#F5E2D1] text-[#A34720] flex items-center justify-center text-sm mb-2'>
                      <Icon />
                    </div>
                    <h4 className='text-xs font-bold text-[#201A17]'>{p.title}</h4>
                    <p className='text-[11px] text-[#6B5E57] mt-0.5 font-medium leading-tight'>{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Authentic Business Interior + Overlay Assistant Widget */}
          <div className='lg:col-span-5 relative flex items-center justify-center'>
            <div className='relative w-full max-w-[500px] rounded-[36px] overflow-hidden border border-[#E6DDD1] shadow-xl'>
              {/* Authentic Business Photography Backdrop */}
              <img
                src={heroImg}
                alt='Authentic business website experience'
                className='w-full h-[580px] sm:h-[640px] object-cover object-top filter brightness-[0.92]'
              />

              {/* Gentle Warm Ambient Vignette */}
              <div className='absolute inset-0 bg-gradient-to-t from-[#24140D]/80 via-[#24140D]/25 to-transparent pointer-events-none'></div>

              {/* Floating Mencia Assistant Widget Card */}
              <div id='hero-assistant-preview' className='absolute inset-0 p-5 sm:p-7 flex items-center justify-center'>
                <AssistantPreview />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: How It Works */}
      <section id='how-it-works' className='py-20 bg-[#FFFCF7] border-y border-[#E6DDD1]'>
        <div className='max-w-7xl mx-auto px-4 sm:px-8'>
          <div className='text-center max-w-2xl mx-auto mb-16'>
            <span className='text-xs font-bold uppercase tracking-wider text-[#A34720]'>Streamlined Workflow</span>
            <h2 className='font-serif text-3xl sm:text-4xl font-bold text-[#201A17] mt-2'>
              Get started in minutes
            </h2>
            <p className='text-sm sm:text-base text-[#6B5E57] mt-3'>
              Simple setup designed for any business owner. No complicated engineering needed.
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
            {steps.map((s, idx) => (
              <div
                key={idx}
                className='p-7 rounded-3xl bg-[#FBF7F0] border border-[#E6DDD1] hover:border-[#A34720]/40 transition-all shadow-2xs hover:shadow-xs group'
              >
                <span className='font-serif text-3xl font-bold text-[#A34720] block group-hover:scale-105 transition-transform'>
                  {s.num}
                </span>
                <h3 className='font-bold text-base text-[#201A17] mt-4'>{s.title}</h3>
                <p className='text-xs sm:text-sm text-[#6B5E57] mt-2 leading-relaxed font-medium'>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Business & Customer Experience */}
      <section id='features' className='py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-10 items-center'>
          <div className='lg:col-span-6 rounded-3xl overflow-hidden border border-[#E6DDD1] shadow-lg'>
            <img
              src={diningImg}
              alt='Atmospheric business space and customer experience'
              className='w-full h-[400px] object-cover'
            />
          </div>

          <div className='lg:col-span-6 space-y-6 text-left'>
            <span className='text-xs font-bold uppercase tracking-wider text-[#A34720]'>Engineered for Growth</span>
            <h2 className='font-serif text-3xl sm:text-4xl font-bold text-[#201A17] leading-tight'>
              Turn casual browsers into confirmed clients & customers
            </h2>
            <p className='text-sm sm:text-base text-[#6B5E57] leading-relaxed'>
              When visitors ask questions, Arin AI guides them to the right pages, answers business FAQs,
              checks appointment availability in real time, and collects customer contacts automatically.
            </p>

            <div className='space-y-3 pt-2 text-sm font-semibold text-[#382017]'>
              <div className='flex items-center gap-3'>
                <div className='w-6 h-6 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center text-xs flex-shrink-0'>
                  <FiCheck />
                </div>
                <span>Zero double-booking guarantee via atomic database locking</span>
              </div>
              <div className='flex items-center gap-3'>
                <div className='w-6 h-6 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center text-xs flex-shrink-0'>
                  <FiCheck />
                </div>
                <span>Sub-300ms speech and text responses powered by Groq</span>
              </div>
              <div className='flex items-center gap-3'>
                <div className='w-6 h-6 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center text-xs flex-shrink-0'>
                  <FiCheck />
                </div>
                <span>Autonomous voice navigation and 24/7 lead capture</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Conversion CTA Banner */}
      <section className='px-4 sm:px-8 pb-20 max-w-7xl mx-auto w-full'>
        <div className='rounded-[36px] bg-[#382017] text-white p-8 sm:p-14 text-center relative overflow-hidden shadow-xl'>
          <div className='max-w-2xl mx-auto space-y-4'>
            <span className='text-xs font-bold uppercase tracking-widest text-[#F5E2D1]'>Autonomous Voice Assistant</span>
            <h2 className='font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight'>
              Ready to give your website a 24/7 AI assistant?
            </h2>
            <p className='text-sm sm:text-base text-[#F5E2D1]/80 max-w-lg mx-auto leading-relaxed'>
              Get started with 100 free responses today. Embed on any website with one line of code.
            </p>
            <div className='pt-4'>
              <button
                onClick={handleGoogleSignIn}
                className='px-8 py-4 rounded-2xl bg-[#A34720] hover:bg-[#853717] text-white font-bold text-sm sm:text-base shadow-lg transition-transform hover:scale-[1.02] cursor-pointer inline-flex items-center gap-3'
              >
                <FcGoogle className='text-2xl bg-white p-0.5 rounded-full' />
                <span>Get Started with Google</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t border-[#E6DDD1] bg-[#FFFCF7] py-12 px-4 sm:px-8 text-xs text-[#6B5E57]'>
        <div className='max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left'>
          <div className='flex items-center gap-3'>
            <div className='w-7 h-7 rounded-lg bg-[#382017] text-[#F5E2D1] flex items-center justify-center text-sm font-bold'>
              A
            </div>
            <span className='font-serif text-lg font-bold text-[#201A17]'>Arin AI</span>
            <span className='text-[11px] text-[#968880]'>— Autonomous AI Web Assistant</span>
          </div>

          <div className='flex items-center gap-6 font-semibold'>
            <a href='#features' className='hover:text-[#A34720]'>Features</a>
            <a href='#how-it-works' className='hover:text-[#A34720]'>How it Works</a>
            <a href='mailto:support@arin.ai' className='hover:text-[#A34720]'>Contact</a>
            <span className='text-[#2E7D32] flex items-center gap-1.5'>
              <span className='w-1.5 h-1.5 rounded-full bg-[#2E7D32]'></span>
              Operational
            </span>
          </div>
        </div>

        <div className='max-w-7xl mx-auto mt-6 pt-6 border-t border-[#EFE9DF] text-center text-[#968880] text-[11px]'>
          © {new Date().getFullYear()} Arin AI Technologies Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default Home;
