import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FiEdit,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiAward,
  FiSliders,
  FiCalendar,
  FiBarChart2,
  FiCode,
  FiCopy,
  FiTrendingUp,
  FiAlertCircle,
  FiExternalLink,
} from 'react-icons/fi';
import { ServerUrl, CLIENT_URL } from '../utils/constants';
import toast from 'react-hot-toast';
import kitchenHomeImg from '../assets/kitchen_home.jpg';

function Dashboard({ user }) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copyingEmbed, setCopyingEmbed] = useState(false);

  useEffect(() => {
    let ignore = false;
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${ServerUrl}/api/business/bookings?limit=100`, {
          withCredentials: true,
        });
        if (!ignore && res.data?.success) {
          setBookings(res.data.data.bookings || []);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Failed to fetch dashboard bookings:', err);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchStats();
    return () => {
      ignore = true;
    };
  }, []);

  // Compute metrics dynamically from persistent bookings
  const todayStr = new Date().toISOString().split('T')[0];
  const totalCount = bookings.length;
  const todayCount = bookings.filter((b) => b.bookingDate === todayStr).length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;

  const businessName = user?.businessName || 'My Business';
  const businessType = user?.businessType || 'General Business';
  const location = user?.bookingSettings?.location || 'Bhilai, India';
  const timezone = user?.bookingSettings?.timezone || 'Asia/Kolkata';
  const bookingEnabled = Boolean(user?.bookingSettings?.bookingEnabled);
  const plan = user?.plan === 'pro' ? 'Pro' : 'Free';

  const embedScript = `<script src="${CLIENT_URL}/assistant.js" data-user-id="${user?._id}"></script>`;

  const copyEmbedCode = () => {
    setCopyingEmbed(true);
    navigator.clipboard.writeText(embedScript);
    toast.success('Embed script copied to clipboard!');
    setTimeout(() => setCopyingEmbed(false), 2000);
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Partner';

  return (
    <div className='space-y-8 animate-fadeIn'>
      {/* Top Welcome Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <h1 className='font-serif text-3xl sm:text-4xl font-bold text-[#201A17] tracking-tight'>
            Good morning, {firstName} 👋
          </h1>
          <p className='mt-1 text-sm font-medium text-[#6B5E57]'>
            {bookingEnabled ? (
              <span className='inline-flex items-center gap-1.5'>
                <span className='w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse'></span>
                Your AI assistant is active and accepting inquiries & bookings.
              </span>
            ) : (
              <span className='inline-flex items-center gap-1.5 text-[#C77700]'>
                <FiAlertCircle size={14} />
                Online bookings are currently paused.
              </span>
            )}
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <button
            onClick={() => navigate('/builder')}
            className='inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#A34720] text-white text-sm font-semibold hover:bg-[#853717] transition-all cursor-pointer shadow-xs shadow-[#A34720]/25'
          >
            <span>Customize Assistant</span>
          </button>
        </div>
      </div>

      {/* Metrics Row (4 Cards Matching Moodboard) */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Total Bookings */}
        <div className='bg-[#FFFCF7] rounded-3xl p-5 border border-[#E6DDD1] shadow-2xs hover:border-[#A34720]/40 transition-colors'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-[#6B5E57] uppercase tracking-wider'>Total Bookings</span>
            {totalCount > 0 && (
              <span className='inline-flex items-center text-[11px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-full'>
                <FiTrendingUp className='mr-0.5' /> live
              </span>
            )}
          </div>
          <div className='mt-2 flex items-baseline gap-2'>
            <h3 className='font-serif text-3xl sm:text-4xl font-bold text-[#201A17]'>{loading ? '—' : totalCount}</h3>
          </div>
          <p className='text-[11px] text-[#968880] mt-1'>Lifetime customer reservations</p>
        </div>

        {/* Today */}
        <div className='bg-[#FFFCF7] rounded-3xl p-5 border border-[#E6DDD1] shadow-2xs hover:border-[#A34720]/40 transition-colors'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-[#6B5E57] uppercase tracking-wider'>Today</span>
            <span className='w-2 h-2 rounded-full bg-[#A34720]'></span>
          </div>
          <div className='mt-2 flex items-baseline gap-2'>
            <h3 className='font-serif text-3xl sm:text-4xl font-bold text-[#A34720]'>{loading ? '—' : todayCount}</h3>
          </div>
          <p className='text-[11px] text-[#968880] mt-1'>Bookings scheduled for today</p>
        </div>

        {/* Completed */}
        <div className='bg-[#FFFCF7] rounded-3xl p-5 border border-[#E6DDD1] shadow-2xs hover:border-[#A34720]/40 transition-colors'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-[#6B5E57] uppercase tracking-wider'>Completed</span>
            <FiCheckCircle className='text-[#2E7D32]' size={16} />
          </div>
          <div className='mt-2 flex items-baseline gap-2'>
            <h3 className='font-serif text-3xl sm:text-4xl font-bold text-[#2E7D32]'>{loading ? '—' : completedCount}</h3>
          </div>
          <p className='text-[11px] text-[#968880] mt-1'>Guests successfully served</p>
        </div>

        {/* Cancelled */}
        <div className='bg-[#FFFCF7] rounded-3xl p-5 border border-[#E6DDD1] shadow-2xs hover:border-[#A34720]/40 transition-colors'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-[#6B5E57] uppercase tracking-wider'>Cancelled</span>
            <span className='text-[11px] font-bold text-[#C62828] bg-[#FFEBEE] px-2 py-0.5 rounded-full'>freed</span>
          </div>
          <div className='mt-2 flex items-baseline gap-2'>
            <h3 className='font-serif text-3xl sm:text-4xl font-bold text-[#C62828]'>{loading ? '—' : cancelledCount}</h3>
          </div>
          <p className='text-[11px] text-[#968880] mt-1'>Capacity returned to availability</p>
        </div>
      </div>

      {/* Business Overview Card (Hero Card Matching Moodboard) */}
      <div className='bg-[#FFFCF7] rounded-3xl border border-[#E6DDD1] p-6 sm:p-7 shadow-xs'>
        <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#EFE9DF]'>
          <div className='flex items-center gap-4'>
            {user?.businessLogo ? (
              <img
                src={user.businessLogo}
                alt='Business logo'
                className='w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-[#E6DDD1] shadow-2xs flex-shrink-0'
              />
            ) : (
              <img
                src={kitchenHomeImg}
                alt='Business cover'
                className='w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-[#E6DDD1] shadow-2xs flex-shrink-0'
              />
            )}
            <div>
              <h2 className='font-serif text-2xl sm:text-3xl font-bold text-[#201A17]'>{businessName}</h2>
              <p className='text-sm text-[#6B5E57] mt-0.5 font-medium'>
                {businessType} • {location}
              </p>
              <div className='flex items-center gap-2 mt-2'>
                <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F5E2D1] text-[#382017]'>
                  Assistant: {user?.assistantName || 'Arin AI'}
                </span>
                <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FBF7F0] text-[#6B5E57] border border-[#E6DDD1]'>
                  Tone: {user?.tone || 'friendly'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/builder')}
            className='inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-[#E6DDD1] bg-white text-sm font-semibold text-[#382017] hover:bg-[#F5E2D1]/40 transition-colors cursor-pointer shadow-2xs self-end md:self-center'
          >
            <FiEdit size={14} className='text-[#A34720]' />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Metadata Details Row */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 text-xs'>
          <div className='flex items-center gap-3 p-3 rounded-2xl bg-[#FBF7F0] border border-[#EFE9DF]'>
            <div className='w-8 h-8 rounded-xl bg-white border border-[#E6DDD1] text-[#A34720] flex items-center justify-center flex-shrink-0'>
              <FiMapPin size={15} />
            </div>
            <div className='min-w-0'>
              <p className='text-[10px] uppercase font-bold text-[#968880] tracking-wider'>Location</p>
              <p className='font-bold text-[#201A17] truncate'>{location}</p>
            </div>
          </div>

          <div className='flex items-center gap-3 p-3 rounded-2xl bg-[#FBF7F0] border border-[#EFE9DF]'>
            <div className='w-8 h-8 rounded-xl bg-white border border-[#E6DDD1] text-[#A34720] flex items-center justify-center flex-shrink-0'>
              <FiClock size={15} />
            </div>
            <div className='min-w-0'>
              <p className='text-[10px] uppercase font-bold text-[#968880] tracking-wider'>Timezone</p>
              <p className='font-bold text-[#201A17] truncate'>{timezone}</p>
            </div>
          </div>

          <div className='flex items-center gap-3 p-3 rounded-2xl bg-[#FBF7F0] border border-[#EFE9DF]'>
            <div className='w-8 h-8 rounded-xl bg-white border border-[#E6DDD1] text-[#2E7D32] flex items-center justify-center flex-shrink-0'>
              <FiCheckCircle size={15} />
            </div>
            <div className='min-w-0'>
              <p className='text-[10px] uppercase font-bold text-[#968880] tracking-wider'>Booking Status</p>
              <p className='font-bold text-[#2E7D32] truncate'>{bookingEnabled ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>

          <div className='flex items-center gap-3 p-3 rounded-2xl bg-[#FBF7F0] border border-[#EFE9DF]'>
            <div className='w-8 h-8 rounded-xl bg-white border border-[#E6DDD1] text-[#382017] flex items-center justify-center flex-shrink-0'>
              <FiAward size={15} />
            </div>
            <div className='min-w-0'>
              <p className='text-[10px] uppercase font-bold text-[#968880] tracking-wider'>Subscription</p>
              <p className='font-bold text-[#382017] truncate'>{plan} Plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions (4 Cards Matching Moodboard) */}
      <div>
        <h3 className='font-serif text-xl font-bold text-[#201A17] mb-4'>Quick Actions</h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* Action 1: Customize Assistant */}
          <button
            onClick={() => navigate('/builder')}
            className='p-5 rounded-3xl bg-[#FFFCF7] border border-[#E6DDD1] hover:border-[#A34720] hover:shadow-xs transition-all text-left group cursor-pointer'
          >
            <div className='w-11 h-11 rounded-2xl bg-[#F5E2D1] text-[#A34720] flex items-center justify-center text-lg mb-4 group-hover:scale-105 transition-transform'>
              <FiSliders />
            </div>
            <h4 className='font-bold text-sm text-[#201A17] group-hover:text-[#A34720] transition-colors'>
              Customize Assistant
            </h4>
            <p className='text-xs text-[#6B5E57] mt-1 leading-relaxed'>Edit assistant persona, voice tone, and FAQs.</p>
          </button>

          {/* Action 2: Manage Bookings */}
          <button
            onClick={() => navigate('/bookings')}
            className='p-5 rounded-3xl bg-[#FFFCF7] border border-[#E6DDD1] hover:border-[#A34720] hover:shadow-xs transition-all text-left group cursor-pointer'
          >
            <div className='w-11 h-11 rounded-2xl bg-[#F5E2D1] text-[#A34720] flex items-center justify-center text-lg mb-4 group-hover:scale-105 transition-transform'>
              <FiCalendar />
            </div>
            <h4 className='font-bold text-sm text-[#201A17] group-hover:text-[#A34720] transition-colors'>
              Manage Bookings
            </h4>
            <p className='text-xs text-[#6B5E57] mt-1 leading-relaxed'>View appointments, manage status, and track metrics.</p>
          </button>

          {/* Action 3: Embed on Website */}
          <button
            onClick={copyEmbedCode}
            className='p-5 rounded-3xl bg-[#FFFCF7] border border-[#E6DDD1] hover:border-[#A34720] hover:shadow-xs transition-all text-left group cursor-pointer sm:col-span-2 lg:col-span-2'
          >
            <div className='w-11 h-11 rounded-2xl bg-[#F5E2D1] text-[#A34720] flex items-center justify-center text-lg mb-4 group-hover:scale-105 transition-transform'>
              <FiCode />
            </div>
            <h4 className='font-bold text-sm text-[#201A17] group-hover:text-[#A34720] transition-colors flex items-center gap-1.5'>
              <span>Embed on Website</span>
              <FiCopy size={12} className={copyingEmbed ? 'text-[#2E7D32]' : 'text-[#6B5E57]'} />
            </h4>
            <p className='text-xs text-[#6B5E57] mt-1 leading-relaxed'>
              {copyingEmbed ? 'Copied script tag to clipboard!' : 'Copy 1-line script tag to embed Arin AI on your website.'}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
