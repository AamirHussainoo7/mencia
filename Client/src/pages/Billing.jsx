import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiAward, FiZap, FiMessageSquare, FiShield } from 'react-icons/fi';

function Billing({ user }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !user.isSetupComplete) {
      toast.error('Please configure your assistant details first.');
      navigate('/builder');
    }
  }, [user, navigate]);

  const remainingMessages = Math.max(0, (user?.requestLimit || 0) - (user?.totalMessages || 0));

  const remainingDays = user?.proExpiresAt
    ? Math.max(0, Math.ceil((new Date(user.proExpiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  const currentPlan = user?.plan === 'pro' ? 'Pro Plan' : 'Free Plan';

  return (
    <div className='space-y-8 animate-fadeIn max-w-5xl'>
      {/* Top Header */}
      <div>
        <span className='text-xs font-bold uppercase tracking-wider text-[#A34720]'>Subscription & Entitlements</span>
        <h1 className='font-serif text-3xl sm:text-4xl font-bold text-[#201A17] tracking-tight mt-0.5'>
          Billing & Plans
        </h1>
        <p className='text-xs sm:text-sm text-[#6B5E57] mt-1 font-medium'>
          Manage your AI assistant capacity, message limits, and subscription tier.
        </p>
      </div>

      {/* 3 Telemetry Stat Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        {/* Current Plan */}
        <div className='bg-[#FFFCF7] rounded-3xl p-5 border border-[#E6DDD1] shadow-2xs'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-bold text-[#6B5E57] uppercase tracking-wider'>Active Plan</span>
            <div className='w-7 h-7 rounded-lg bg-[#F5E2D1] text-[#A34720] flex items-center justify-center text-xs'>
              <FiAward />
            </div>
          </div>
          <h3 className='font-serif text-2xl font-bold text-[#201A17] mt-2 capitalize'>{currentPlan}</h3>
          <p className='text-[11px] text-[#968880] mt-1'>
            {user?.plan === 'pro' ? '3 Months Pro subscription' : '100 initial free AI responses'}
          </p>
        </div>

        {/* AI Provider Status */}
        <div className='bg-[#FFFCF7] rounded-3xl p-5 border border-[#E6DDD1] shadow-2xs'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-bold text-[#6B5E57] uppercase tracking-wider'>Engine Status</span>
            <div className='w-7 h-7 rounded-lg bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center text-xs'>
              <FiZap />
            </div>
          </div>
          <h3 className='font-serif text-2xl font-bold text-[#2E7D32] mt-2 capitalize'>Active</h3>
          <p className='text-[11px] text-[#968880] mt-1'>Sub-300ms latency with Groq / Gemini</p>
        </div>

        {/* Messages / Expiry Telemetry */}
        <div className='bg-[#FFFCF7] rounded-3xl p-5 border border-[#E6DDD1] shadow-2xs'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-bold text-[#6B5E57] uppercase tracking-wider'>
              {user?.plan === 'free' ? 'Responses Left' : 'Plan Expiry'}
            </span>
            <div className='w-7 h-7 rounded-lg bg-[#FBF7F0] text-[#382017] flex items-center justify-center text-xs'>
              <FiMessageSquare />
            </div>
          </div>
          <h3 className='font-serif text-2xl font-bold text-[#A34720] mt-2'>
            {user?.plan === 'free' ? `${remainingMessages} Left` : `${remainingDays} Days`}
          </h3>
          <p className='text-[11px] text-[#968880] mt-1'>
            {user?.plan === 'free' ? 'Resets on Pro upgrade' : 'Automatic renewal active'}
          </p>
        </div>
      </div>

      {/* Pricing Cards (Free vs Pro) */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 pt-4'>
        {/* Free Plan Card */}
        <div className='bg-[#FFFCF7] rounded-3xl p-8 border border-[#E6DDD1] shadow-xs flex flex-col justify-between'>
          <div>
            <div className='inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#F2EDE4] text-[#6B5E57] mb-3'>
              Starter Tier
            </div>
            <h3 className='font-serif text-2xl font-bold text-[#201A17]'>Free Plan</h3>
            <div className='mt-4 flex items-baseline gap-1'>
              <span className='font-serif text-4xl sm:text-5xl font-bold text-[#201A17]'>₹0</span>
              <span className='text-xs text-[#6B5E57] font-semibold'>/ forever</span>
            </div>
            <p className='text-xs text-[#6B5E57] mt-2 leading-relaxed'>
              Ideal for testing and launching your first AI business assistant.
            </p>

            <ul className='mt-6 space-y-3 text-xs font-semibold text-[#382017]'>
              <li className='flex items-center gap-2.5'>
                <div className='w-5 h-5 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center text-[10px] flex-shrink-0'>
                  <FiCheck />
                </div>
                <span>100 AI conversational responses</span>
              </li>
              <li className='flex items-center gap-2.5'>
                <div className='w-5 h-5 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center text-[10px] flex-shrink-0'>
                  <FiCheck />
                </div>
                <span>Online bookings & appointment engine</span>
              </li>
              <li className='flex items-center gap-2.5'>
                <div className='w-5 h-5 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center text-[10px] flex-shrink-0'>
                  <FiCheck />
                </div>
                <span>Voice input & speech synthesis</span>
              </li>
              <li className='flex items-center gap-2.5'>
                <div className='w-5 h-5 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center text-[10px] flex-shrink-0'>
                  <FiCheck />
                </div>
                <span>1-line embed script for any site</span>
              </li>
            </ul>
          </div>

          <div className='pt-8'>
            <button
              disabled
              className='w-full h-12 rounded-2xl border border-[#E6DDD1] bg-[#FBF7F0] text-[#6B5E57] text-xs font-bold cursor-not-allowed'
            >
              Current Plan
            </button>
          </div>
        </div>

        {/* Pro Plan Card (Blurred with Active Waitlist Overlay) */}
        {/* ========================================================================= */}
        {/* REUSABLE AT PRO LAUNCH:                                                  */}
        {/* 1. Remove the "Waitlist Overlay Container" below.                        */}
        {/* 2. Remove the "opacity-30 blur-[2.5px] pointer-events-none select-none" */}
        {/*    classes from the inner content wrapper.                              */}
        {/* 3. Re-enable the active payment gateway checkout handler on the button.  */}
        {/* ========================================================================= */}
        <div className='bg-[#382017] text-white rounded-3xl p-8 border border-[#4D3025] shadow-lg flex flex-col justify-between relative overflow-hidden'>
          {/* Ambient background glow */}
          <div className='absolute top-0 right-0 w-32 h-32 bg-[#A34720]/30 blur-2xl rounded-full pointer-events-none'></div>

          {/* Blurred / Transparent Underlying Pro Plan Content */}
          <div className='opacity-30 blur-[2.5px] pointer-events-none select-none transition-all'>
            <div className='inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#A34720] text-white mb-3'>
              Recommended
            </div>
            <h3 className='font-serif text-2xl font-bold text-white'>Pro Plan</h3>
            <div className='mt-4 flex items-baseline gap-1'>
              <span className='font-serif text-4xl sm:text-5xl font-bold text-white'>₹699</span>
              <span className='text-xs text-[#F5E2D1]/80 font-semibold'>/ 3 months access</span>
            </div>
            <p className='text-xs text-[#F5E2D1]/80 mt-2 leading-relaxed'>
              For growing businesses managing appointments, FAQs, and lead capture.
            </p>

            <ul className='mt-6 space-y-3 text-xs font-semibold text-white'>
              <li className='flex items-center gap-2.5'>
                <div className='w-5 h-5 rounded-full bg-[#A34720] text-white flex items-center justify-center text-[10px] flex-shrink-0'>
                  <FiCheck />
                </div>
                <span><strong>Unlimited</strong> AI appointments & bookings</span>
              </li>
              <li className='flex items-center gap-2.5'>
                <div className='w-5 h-5 rounded-full bg-[#A34720] text-white flex items-center justify-center text-[10px] flex-shrink-0'>
                  <FiCheck />
                </div>
                <span>Unlimited conversational responses</span>
              </li>
              <li className='flex items-center gap-2.5'>
                <div className='w-5 h-5 rounded-full bg-[#A34720] text-white flex items-center justify-center text-[10px] flex-shrink-0'>
                  <FiCheck />
                </div>
                <span>Priority Groq low-latency processing</span>
              </li>
              <li className='flex items-center gap-2.5'>
                <div className='w-5 h-5 rounded-full bg-[#A34720] text-white flex items-center justify-center text-[10px] flex-shrink-0'>
                  <FiCheck />
                </div>
                <span>Custom business branding & logo cover</span>
              </li>
              <li className='flex items-center gap-2.5'>
                <div className='w-5 h-5 rounded-full bg-[#A34720] text-white flex items-center justify-center text-[10px] flex-shrink-0'>
                  <FiCheck />
                </div>
                <span>Priority 24/7 dedicated support</span>
              </li>
            </ul>

            <div className='pt-8'>
              {/* ORIGINAL PAYMENT BUTTON (Keep for re-enabling upon launch) */}
              {/*
              <button
                onClick={() => handleRazorpayCheckout()}
                className='w-full h-12 rounded-2xl bg-[#A34720] hover:bg-[#853717] text-white text-xs font-bold transition-all cursor-pointer shadow-md'
              >
                Upgrade to Pro Plan
              </button>
              */}
              <div className='w-full h-12 rounded-2xl bg-[#A34720]/50 text-white/50 text-xs font-bold flex items-center justify-center'>
                Upgrade to Pro Plan
              </div>
            </div>
          </div>

          {/* Prominent Foreground Waitlist Overlay (100% Crisp & Visible) */}
          <div className='absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-[#24140D]/60 backdrop-blur-[1px]'>
            <div className='p-6 rounded-3xl bg-[#2D180F]/90 border border-[#A34720]/40 shadow-2xl max-w-sm w-full space-y-4'>
              <div className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#A34720]/20 border border-[#A34720]/50 text-xs font-bold text-[#F5E2D1] shadow-inner'>
                <span className='w-2 h-2 rounded-full bg-[#A34720] animate-pulse'></span>
                <span>Coming Soon · Waitlist Active</span>
              </div>

              <div>
                <h4 className='font-serif text-2xl font-bold text-white'>Pro Plan</h4>
                <p className='text-xs text-[#F5E2D1]/80 mt-1.5 leading-relaxed'>
                  We are finalizing custom enterprise domains, unlimited bookings, and priority voice routing.
                </p>
              </div>

              <button
                type='button'
                onClick={() => toast.success("You're on the priority waitlist! We'll notify you as soon as Pro launches.", { icon: '🎉' })}
                className='w-full py-3 px-5 rounded-2xl bg-[#A34720] hover:bg-[#853717] text-white text-xs font-bold transition-all shadow-md shadow-[#A34720]/30 cursor-pointer hover:scale-[1.02]'
              >
                Join Priority Waitlist
              </button>

              <p className='text-[10px] text-[#F5E2D1]/60 font-medium'>
                Early waitlist members receive exclusive launch discounts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Billing;
