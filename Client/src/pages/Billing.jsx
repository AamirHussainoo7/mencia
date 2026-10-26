import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

function Billing({ user }) {
  const navigate = useNavigate()

  useEffect(() => {
    if (user && !user.isSetupComplete) {
      toast.error("Setup your assistant first");
      navigate("/builder");
    }
  }, [user, navigate])

  const remainingMessages =
    Math.max(
      0,
      (user?.requestLimit || 0) -
      (user?.totalMessages || 0)
    );

  const remainingDays =
    user?.proExpiresAt
      ? Math.max(
        0,
        Math.ceil(
          (new Date(user.proExpiresAt) - new Date()) /
          (1000 * 60 * 60 * 24)
        )
      )
      : 0;

  return (
    <div className='min-h-screen bg-[#f7f8fc] px-4 py-10'>

      <div className='max-w-5xl mx-auto'>

        <div className='mb-8'>
          <h2 className='text-3xl font-bold text-[#081028]'>
            Billing &amp; Subscription
          </h2>
          <p className='text-gray-500 mt-1'>Manage your AI assistant plan and usage.</p>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6'>

          <div className='bg-white rounded-3xl p-6 border border-gray-100 shadow-sm'>
            <p className='text-sm text-gray-400'>Current Plan</p>
            <h2 className='text-xl font-bold text-[#081028] mt-1 capitalize'>{user?.plan}</h2>
          </div>

          <div className='bg-white rounded-3xl p-6 border border-gray-100 shadow-sm'>
            <p className='text-sm text-gray-400'>Gemini Status</p>
            <h2 className={`text-xl font-bold mt-1 capitalize ${
              user?.geminiStatus === "active"
                ? "text-emerald-600"
                : user?.geminiStatus === "invalid"
                  ? "text-red-500"
                  : "text-amber-500"
            }`}>{user?.geminiStatus}</h2>
          </div>

          <div className='bg-white rounded-3xl p-6 border border-gray-100 shadow-sm'>
            <p className='text-sm text-gray-400'>{user?.plan === "free" ? "Messages Left" : "Plan Expiry"}</p>
            <h2 className='text-xl font-bold text-[#081028] mt-1 capitalize'>
              {user?.plan === "free" ? remainingMessages : `${remainingDays} Days`}
            </h2>
          </div>

        </div>

        {/* Plan cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-10'>

          {/* Free */}
          <div className='bg-white rounded-3xl p-8 border border-gray-100 shadow-sm'>
            <h2 className="text-2xl font-bold text-[#081028]">Free Plan</h2>
            <h3 className="text-5xl font-bold mt-5 text-[#081028]">₹0</h3>
            <ul className="mt-6 space-y-4 text-gray-600">
              <li>200 AI messages</li>
              <li>Voice assistant</li>
              <li>Navigation support</li>
              <li>Basic customization</li>
            </ul>
          </div>

          {/* Pro */}
          <div className='rounded-3xl p-8 bg-gradient-to-r from-purple-600 to-emerald-500 text-white shadow-lg'>
            <h2 className="text-2xl font-bold text-white">Pro Plan</h2>
            <h3 className="text-5xl font-bold mt-5 text-white">₹699</h3>
            <p className='mt-2 opacity-80'>3 Months Access</p>
            <ul className='mt-6 space-y-4 opacity-90'>
              <li>Unlimited AI messages</li>
              <li>Advanced AI assistant</li>
              <li>Priority performance</li>
              <li>Unlimited navigation</li>
              <li>Premium support</li>
            </ul>

            {/* Razorpay disabled — will be re-enabled later */}
            <button
              disabled
              className='mt-8 h-14 w-full rounded-2xl font-semibold bg-white/30 text-white cursor-not-allowed opacity-70'
            >
              Coming Soon
            </button>
            <p className='mt-3 text-xs text-white/70 text-center'>Payments will be enabled soon</p>
          </div>

        </div>

      </div>

    </div>
  )
}

export default Billing
