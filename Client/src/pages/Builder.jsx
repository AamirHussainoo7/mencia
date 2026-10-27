import { useState } from 'react';
import axios from 'axios';
import {
  FiCopy,
  FiPlus,
  FiTrash2,
  FiClock,
  FiCalendar,
  FiMapPin,
  FiCheck,
  FiArrowRight,
  FiArrowLeft,
  FiGlobe,
  FiSliders,
  FiCheckCircle,
  FiInfo,
} from 'react-icons/fi';
import { CLIENT_URL, ServerUrl } from '../utils/constants';
import toast from 'react-hot-toast';
import kitchenHomeImg from '../assets/kitchen_home.jpg';

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const STEPS = [
  { id: 1, name: 'Basic Info', desc: 'Name, logo & type' },
  { id: 2, name: 'AI & Tone', desc: 'Personality & model' },
  { id: 3, name: 'Pages', desc: 'Voice navigation' },
  { id: 4, name: 'Booking Settings', desc: 'Slots & capacity' },
  { id: 5, name: 'Appearance', desc: 'Themes & styling' },
  { id: 6, name: 'Review & Publish', desc: 'Embed snippet' },
];

export const format12Hour = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.includes('AM') || timeStr.includes('PM') || timeStr.includes('am') || timeStr.includes('pm')) {
    return timeStr;
  }
  const parts = timeStr.split(':');
  let hours = parseInt(parts[0], 10);
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
  const formattedMinutes = (parts[1] || '00').substring(0, 2);
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

export const to24Hour = (hour12, minute, ampm) => {
  let h = parseInt(hour12, 10);
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const hh = h < 10 ? `0${h}` : `${h}`;
  const mm = String(minute).padStart(2, '0');
  return `${hh}:${mm}`;
};

function Builder({ user, setUser }) {
  const [activeStep, setActiveStep] = useState(1);

  // Step 1: Basic Information
  const [businessName, setBusinessName] = useState(user?.businessName || 'My Business');
  const [businessType, setBusinessType] = useState(user?.businessType || 'General Business');
  const [businessLogo, setBusinessLogo] = useState(user?.businessLogo || '');
  const [businessDescription, setBusinessDescription] = useState(
    user?.businessDescription || 'A modern business dedicated to providing excellent service and seamless customer support.'
  );

  // Step 2: AI & Persona
  const [assistantName, setAssistantName] = useState(user?.assistantName || 'Arin AI');
  const [tone, setTone] = useState(user?.tone || 'friendly');
  const [theme, setTheme] = useState(user?.theme || 'warm');

  // Step 3: Navigation Pages
  const [pages, setPages] = useState(user?.pages || []);
  const [pageName, setPageName] = useState('');
  const [pagePath, setPagePath] = useState('');
  const [pageKeywords, setPageKeywords] = useState('');

  // Step 4: Table Reservations
  const [bookingEnabled, setBookingEnabled] = useState(user?.bookingSettings?.bookingEnabled ?? true);
  const [location, setLocation] = useState(user?.bookingSettings?.location || 'near Housing Board, Bhilai');
  const [timezone, setTimezone] = useState(user?.bookingSettings?.timezone || 'Asia/Kolkata');
  const [workingDays, setWorkingDays] = useState(
    user?.bookingSettings?.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  );
  const [slots, setSlots] = useState(
    user?.bookingSettings?.slots || [
      { slotId: 'slot_1', name: '12:00 - 13:00', startTime: '12:00', endTime: '13:00', capacity: 5 },
      { slotId: 'slot_2', name: '13:00 - 14:00', startTime: '13:00', endTime: '14:00', capacity: 6 },
      { slotId: 'slot_3', name: '19:00 - 20:00', startTime: '19:00', endTime: '20:00', capacity: 4 },
      { slotId: 'slot_4', name: '20:00 - 21:00', startTime: '20:00', endTime: '21:00', capacity: 5 },
    ]
  );
  const [maxPartySize, setMaxPartySize] = useState(user?.bookingSettings?.maxPartySize || 12);
  const [advanceDaysLimit, setAdvanceDaysLimit] = useState(user?.bookingSettings?.advanceDaysLimit || 30);
  const [minNoticeMinutes, setMinNoticeMinutes] = useState(user?.bookingSettings?.minNoticeMinutes || 60);
  const [seatsPerTable, setSeatsPerTable] = useState(user?.bookingSettings?.seatsPerTable || 4);
  const [cancellationPolicy, setCancellationPolicy] = useState(
    user?.bookingSettings?.cancellationPolicy || 'Free cancellation up to 1 hour before reserved time slot.'
  );

  // New Slot Builder state (12-hour with AM / PM)
  const [startHour, setStartHour] = useState('08');
  const [startMinute, setStartMinute] = useState('00');
  const [startAmpm, setStartAmpm] = useState('PM');

  const [endHour, setEndHour] = useState('09');
  const [endMinute, setEndMinute] = useState('00');
  const [endAmpm, setEndAmpm] = useState('PM');
  const [newSlotCapacity, setNewSlotCapacity] = useState(5);

  const [saving, setSaving] = useState(false);
  const [copyingEmbed, setCopyingEmbed] = useState(false);

  // Page handlers
  const addPage = () => {
    if (!pageName || !pagePath) {
      toast.error('Page name and path are required');
      return;
    }
    const newPage = {
      name: pageName.trim(),
      path: pagePath.trim(),
      keywords: pageKeywords.split(',').map((k) => k.trim()).filter(Boolean),
    };
    setPages([...pages, newPage]);
    setPageName('');
    setPagePath('');
    setPageKeywords('');
  };

  const removePage = (index) => {
    setPages(pages.filter((_, i) => i !== index));
  };

  // Day toggle handler
  const toggleDay = (day) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  // Slot handlers (12-hour format with AM / PM)
  const addSlot = () => {
    const start24 = to24Hour(startHour, startMinute, startAmpm);
    const end24 = to24Hour(endHour, endMinute, endAmpm);

    if (start24 >= end24) {
      toast.error('Start time must be earlier than end time.');
      return;
    }
    const cap = parseInt(newSlotCapacity, 10);
    if (isNaN(cap) || cap < 1) {
      toast.error('Capacity must be at least 1 table.');
      return;
    }

    const start12 = `${startHour}:${startMinute} ${startAmpm}`;
    const end12 = `${endHour}:${endMinute} ${endAmpm}`;

    const newSlot = {
      slotId: 'slot_' + Date.now(),
      name: `${start12} - ${end12}`,
      startTime: start24,
      endTime: end24,
      capacity: cap,
      seatsPerTable: Number(seatsPerTable) || 4,
    };

    setSlots([...slots, newSlot]);
    toast.success(`Added slot: ${start12} – ${end12}`);
  };

  const removeSlot = (index) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  // Save Assistant Settings
  const saveAllSettings = async () => {
    setSaving(true);
    try {
      // 1. Save Core Assistant
      const assistantData = {
        assistantName,
        businessName,
        businessType,
        businessDescription,
        businessLogo,
        tone,
        theme,
        pages,
      };

      const resCore = await axios.post(ServerUrl + '/api/user/save-assistant', assistantData, {
        withCredentials: true,
      });

      // 2. Save Booking Settings
      const bookingPayload = {
        bookingEnabled,
        location,
        timezone,
        workingDays,
        slots,
        seatsPerTable: Number(seatsPerTable),
        maxPartySize: Number(maxPartySize),
        advanceDaysLimit: Number(advanceDaysLimit),
        minNoticeMinutes: Number(minNoticeMinutes),
        cancellationPolicy,
      };

      const resBooking = await axios.patch(ServerUrl + '/api/user/booking-settings', bookingPayload, {
        withCredentials: true,
      });

      if (setUser) {
        setUser({
          ...resCore.data.user,
          bookingSettings: resBooking.data.bookingSettings,
        });
      }

      toast.success('Configuration saved & published successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save settings. Please verify inputs.');
    } finally {
      setSaving(false);
    }
  };

  const embedScript = `<script src="${CLIENT_URL}/assistant.js" data-user-id="${user?._id}"></script>`;

  const copyEmbedCode = () => {
    setCopyingEmbed(true);
    navigator.clipboard.writeText(embedScript);
    toast.success('Embed script copied to clipboard!');
    setTimeout(() => setCopyingEmbed(false), 2000);
  };

  return (
    <div className='space-y-8 animate-fadeIn'>
      {/* Top Page Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <span className='text-xs font-bold uppercase tracking-wider text-[#A34720]'>Studio Configuration</span>
          <h1 className='font-serif text-3xl sm:text-4xl font-bold text-[#201A17] tracking-tight mt-0.5'>
            Assistant Builder
          </h1>
          <p className='text-xs sm:text-sm text-[#6B5E57] mt-1 font-medium'>
            Step-by-step customization to configure your website AI assistant.
          </p>
        </div>

        <button
          onClick={saveAllSettings}
          disabled={saving}
          className='px-6 py-2.5 rounded-2xl bg-[#A34720] text-white text-sm font-semibold hover:bg-[#853717] transition-all cursor-pointer shadow-xs shadow-[#A34720]/25 flex items-center gap-2'
        >
          <FiCheck />
          <span>{saving ? 'Publishing...' : 'Save & Publish'}</span>
        </button>
      </div>

      {/* Main Container: Focused Centered Form */}
      <div className='max-w-4xl mx-auto w-full space-y-6'>
        {/* Stepper Header Pills */}
        <div className='bg-[#FFFCF7] p-3 sm:p-4 rounded-3xl border border-[#E6DDD1] flex items-center gap-1.5 sm:gap-2 overflow-x-auto shadow-2xs'>
          {STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeStep === s.id
                  ? 'bg-[#382017] text-white shadow-2xs'
                  : 'text-[#6B5E57] hover:bg-[#F5E2D1]/40'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  activeStep === s.id ? 'bg-[#A34720] text-white' : 'bg-[#E6DDD1] text-[#201A17]'
                }`}
              >
                {s.id}
              </span>
              <span className='hidden sm:inline'>{s.name}</span>
            </button>
          ))}
        </div>

        {/* Step 1: Basic Information */}
        {activeStep === 1 && (
          <div className='bg-[#FFFCF7] rounded-3xl border border-[#E6DDD1] p-6 sm:p-8 space-y-6 shadow-xs animate-fadeIn'>
            <div>
              <h3 className='font-serif text-2xl font-bold text-[#201A17]'>Basic Information</h3>
              <p className='text-xs text-[#6B5E57] mt-1'>Set up your business identity, branding logo, and description.</p>
            </div>

            <div className='space-y-5'>
              <div>
                <label className='block text-xs font-bold text-[#6B5E57] mb-1.5'>Business Name</label>
                <input
                  type='text'
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder='Acme Corp / Kitchen Home'
                  className='w-full h-12 rounded-xl border border-[#E6DDD1] bg-white px-4 text-xs font-bold text-[#201A17] outline-none placeholder-[#968880] focus:border-[#A34720]'
                />
              </div>

              <div>
                <label className='block text-xs font-bold text-[#6B5E57] mb-1.5'>Business Type</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className='w-full h-12 rounded-xl border border-[#E6DDD1] bg-white px-4 text-xs font-semibold text-[#201A17] outline-none focus:border-[#A34720]'
                >
                  <option value='General Business'>General Business & Website</option>
                  <option value='E-Commerce'>E-Commerce & Online Store</option>
                  <option value='SaaS'>SaaS & Tech Platform</option>
                  <option value='Agency'>Agency & Consulting</option>
                  <option value='Healthcare'>Healthcare, Clinic & Wellness</option>
                  <option value='Restaurant'>Restaurant, Cafe & Dining</option>
                  <option value='Real Estate'>Real Estate & Property</option>
                  <option value='Services'>Professional Services & Legal</option>
                  <option value='Other'>Other</option>
                </select>
              </div>

              <div>
                <label className='block text-xs font-bold text-[#6B5E57] mb-1.5'>Business Address / Location</label>
                <input
                  type='text'
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder='e.g. Near Housing Board, Bhilai / Online'
                  className='w-full h-12 rounded-xl border border-[#E6DDD1] bg-white px-4 text-xs font-bold text-[#201A17] outline-none placeholder-[#968880] focus:border-[#A34720]'
                />
                <p className='text-[11px] text-[#968880] mt-1'>
                  Your assistant uses this to answer customer questions about your address, directions, and location.
                </p>
              </div>

              {/* Editable Business Logo Section */}
              <div>
                <label className='block text-xs font-bold text-[#6B5E57] mb-2'>Business Logo & Avatar</label>
                <div className='p-4 rounded-2xl bg-[#FBF7F0] border border-[#EFE9DF] space-y-3'>
                  <div className='flex items-center gap-4'>
                    <div className='w-16 h-16 rounded-2xl bg-white border border-[#E6DDD1] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs'>
                      {businessLogo ? (
                        <img
                          src={businessLogo}
                          alt='Business logo'
                          className='w-full h-full object-cover'
                          onError={() => {
                            toast.error('Could not load image from provided URL');
                          }}
                        />
                      ) : (
                        <div className='w-full h-full bg-[#A34720] text-white flex items-center justify-center font-serif text-2xl font-bold'>
                          {(businessName || 'M').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <input
                        type='url'
                        value={businessLogo}
                        onChange={(e) => setBusinessLogo(e.target.value)}
                        placeholder='Paste logo image URL (https://...)'
                        className='w-full h-11 px-3.5 rounded-xl border border-[#E6DDD1] bg-white text-xs text-[#201A17] outline-none placeholder-[#968880] focus:border-[#A34720]'
                      />
                      <p className='text-[11px] text-[#968880] mt-1'>
                        This logo appears inside your floating assistant launcher button.
                      </p>
                    </div>
                  </div>

                  {/* Quick Preset Avatars */}
                  <div className='flex items-center gap-2 pt-1'>
                    <span className='text-[10px] font-bold uppercase text-[#968880]'>Presets:</span>
                    <button
                      type='button'
                      onClick={() => setBusinessLogo('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&auto=format&fit=crop&q=80')}
                      className='text-[11px] font-semibold text-[#A34720] hover:underline cursor-pointer bg-white px-2.5 py-0.5 rounded-md border border-[#E6DDD1]'
                    >
                      Bistro
                    </button>
                    <button
                      type='button'
                      onClick={() => setBusinessLogo('https://images.unsplash.com/photo-1497366216548-37526070297c?w=120&auto=format&fit=crop&q=80')}
                      className='text-[11px] font-semibold text-[#A34720] hover:underline cursor-pointer bg-white px-2.5 py-0.5 rounded-md border border-[#E6DDD1]'
                    >
                      Corporate
                    </button>
                    <button
                      type='button'
                      onClick={() => setBusinessLogo('')}
                      className='text-[11px] font-semibold text-[#6B5E57] hover:underline cursor-pointer bg-white px-2.5 py-0.5 rounded-md border border-[#E6DDD1]'
                    >
                      Reset to Default
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className='flex items-center justify-between mb-1.5'>
                  <label className='text-xs font-bold text-[#6B5E57]'>Short Description</label>
                  <span className='text-[10px] text-[#968880] font-mono'>{businessDescription.length}/300</span>
                </div>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder='Describe your business and what visitors should know...'
                  className='w-full p-4 rounded-xl border border-[#E6DDD1] bg-white text-xs text-[#201A17] outline-none placeholder-[#968880] focus:border-[#A34720] resize-none'
                />
              </div>
            </div>

            {/* Step Navigation Bar */}
            <div className='pt-4 border-t border-[#EFE9DF] flex justify-end'>
              <button
                type='button'
                onClick={() => setActiveStep(2)}
                className='px-6 py-2.5 rounded-xl bg-[#382017] hover:bg-[#A34720] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs'
              >
                <span>Next: AI Persona</span>
                <FiArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

          {/* Step 2: AI & Persona */}
          {activeStep === 2 && (
            <div className='bg-[#FFFCF7] rounded-3xl border border-[#E6DDD1] p-6 sm:p-8 space-y-6 shadow-xs animate-fadeIn'>
              <div>
                <h3 className='font-serif text-2xl font-bold text-[#201A17]'>AI Persona & Voice Demeanor</h3>
                <p className='text-xs text-[#6B5E57] mt-1'>Define how your assistant introduces itself and speaks with guests.</p>
              </div>

              <div className='space-y-4'>
                <div>
                  <label className='block text-xs font-bold text-[#6B5E57] mb-1.5'>Assistant Name</label>
                  <input
                    type='text'
                    value={assistantName}
                    onChange={(e) => setAssistantName(e.target.value)}
                    placeholder='Arin AI'
                    className='w-full h-12 rounded-xl border border-[#E6DDD1] bg-white px-4 text-xs font-bold text-[#201A17] outline-none focus:border-[#A34720]'
                  />
                </div>

                <div>
                  <label className='block text-xs font-bold text-[#6B5E57] mb-2'>Assistant Tone</label>
                  <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                    {[
                      { id: 'friendly', name: 'Friendly & Warm', quote: 'Delighted to have you with us! How can I help?' },
                      { id: 'professional', name: 'Crisp & Professional', quote: 'Welcome. I am ready to reserve your table.' },
                      { id: 'sales', name: 'Casual & Upbeat', quote: 'Hey there! Ready for the best meal in town?' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type='button'
                        onClick={() => setTone(t.id)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          tone === t.id
                            ? 'bg-[#F5E2D1] border-[#A34720] shadow-2xs'
                            : 'bg-white border-[#E6DDD1] hover:bg-[#FBF7F0]'
                        }`}
                      >
                        <p className='text-xs font-bold text-[#201A17]'>{t.name}</p>
                        <p className='text-[11px] text-[#6B5E57] italic mt-1 font-medium leading-snug'>"{t.quote}"</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step Navigation Bar */}
              <div className='pt-4 border-t border-[#EFE9DF] flex items-center justify-between'>
                <button
                  type='button'
                  onClick={() => setActiveStep(1)}
                  className='px-5 py-2 rounded-xl border border-[#E6DDD1] text-xs font-bold text-[#6B5E57] hover:bg-[#FBF7F0] flex items-center gap-1.5'
                >
                  <FiArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type='button'
                  onClick={() => setActiveStep(3)}
                  className='px-6 py-2.5 rounded-xl bg-[#382017] hover:bg-[#A34720] text-white text-xs font-bold transition-all flex items-center gap-2'
                >
                  <span>Next: Pages</span>
                  <FiArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Pages */}
          {activeStep === 3 && (
            <div className='bg-[#FFFCF7] rounded-3xl border border-[#E6DDD1] p-6 sm:p-8 space-y-6 shadow-xs animate-fadeIn'>
              <div>
                <h3 className='font-serif text-2xl font-bold text-[#201A17]'>Pages & Navigation</h3>
                <p className='text-xs text-[#6B5E57] mt-1'>
                  Allow visitors to ask questions about your pages and navigate directly using voice or text.
                </p>
              </div>

              {/* Add New Page Form */}
              <div className='p-4 rounded-2xl bg-[#FBF7F0] border border-[#EFE9DF] space-y-3'>
                <p className='text-xs font-bold text-[#201A17]'>Add New Navigation Route</p>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-2.5'>
                  <input
                    type='text'
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                    placeholder='Page Name (e.g. Services)'
                    className='h-10 px-3 rounded-lg border border-[#E6DDD1] bg-white text-xs text-[#201A17] outline-none'
                  />
                  <input
                    type='text'
                    value={pagePath}
                    onChange={(e) => setPagePath(e.target.value)}
                    placeholder='URL Path (e.g. /services)'
                    className='h-10 px-3 rounded-lg border border-[#E6DDD1] bg-white text-xs text-[#201A17] outline-none'
                  />
                  <input
                    type='text'
                    value={pageKeywords}
                    onChange={(e) => setPageKeywords(e.target.value)}
                    placeholder='Keywords (comma separated)'
                    className='h-10 px-3 rounded-lg border border-[#E6DDD1] bg-white text-xs text-[#201A17] outline-none'
                  />
                </div>
                <button
                  type='button'
                  onClick={addPage}
                  className='px-4 py-2 rounded-xl bg-[#382017] hover:bg-[#A34720] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs'
                >
                  <FiPlus size={14} />
                  <span>Add Route</span>
                </button>
              </div>

              {/* Existing Routes List */}
              <div className='space-y-2'>
                {pages.length === 0 ? (
                  <p className='text-xs text-[#968880] italic py-2'>No navigation routes configured yet.</p>
                ) : (
                  pages.map((p, idx) => (
                    <div
                      key={idx}
                      className='flex items-center justify-between p-3 rounded-xl bg-white border border-[#E6DDD1]'
                    >
                      <div>
                        <span className='text-xs font-bold text-[#201A17]'>{p.name}</span>
                        <span className='text-xs font-mono text-[#A34720] ml-2 font-medium'>{p.path}</span>
                        <p className='text-[11px] text-[#6B5E57] mt-0.5'>Keywords: {p.keywords.join(', ')}</p>
                      </div>
                      <button
                        type='button'
                        onClick={() => removePage(idx)}
                        className='p-2 text-[#968880] hover:text-[#C62828] cursor-pointer'
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Step Navigation Bar */}
              <div className='pt-4 border-t border-[#EFE9DF] flex items-center justify-between'>
                <button
                  type='button'
                  onClick={() => setActiveStep(2)}
                  className='px-5 py-2 rounded-xl border border-[#E6DDD1] text-xs font-bold text-[#6B5E57] hover:bg-[#FBF7F0] flex items-center gap-1.5'
                >
                  <FiArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type='button'
                  onClick={() => setActiveStep(4)}
                  className='px-6 py-2.5 rounded-xl bg-[#382017] hover:bg-[#A34720] text-white text-xs font-bold transition-all flex items-center gap-2'
                >
                  <span>Next: Booking Settings</span>
                  <FiArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Booking & Scheduling Settings */}
          {activeStep === 4 && (
            <div className='bg-[#FFFCF7] rounded-3xl border border-[#E6DDD1] p-6 sm:p-8 space-y-6 shadow-xs animate-fadeIn'>
              <div>
                <h3 className='font-serif text-2xl font-bold text-[#201A17]'>Booking & Scheduling Settings</h3>
                <p className='text-xs text-[#6B5E57] mt-1'>Set up your business booking, appointment, or table reservation preferences.</p>
              </div>

              {/* Master Enable/Disable Toggle */}
              <div className='flex items-center justify-between p-4.5 rounded-2xl bg-[#FBF7F0] border border-[#EFE9DF]'>
                <div>
                  <h4 className='text-xs font-bold text-[#201A17]'>Enable Online Bookings / Appointments</h4>
                  <p className='text-[11px] text-[#6B5E57] mt-0.5 font-medium'>
                    Allow visitors to schedule appointments, bookings, or reservations through your AI assistant.
                  </p>
                </div>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={bookingEnabled}
                    onChange={(e) => setBookingEnabled(e.target.checked)}
                    className='sr-only peer'
                  />
                  <div className="w-12 h-6 bg-[#D9CFC2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A34720]"></div>
                </label>
              </div>

              {/* Location & Timezone Inputs */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-bold text-[#6B5E57] mb-1.5'>Business Location / Address</label>
                  <input
                    type='text'
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder='Bhilai, India / Online'
                    className='w-full h-11 rounded-xl border border-[#E6DDD1] bg-white px-3.5 text-xs text-[#201A17] outline-none focus:border-[#A34720]'
                  />
                </div>

                <div>
                  <label className='block text-xs font-bold text-[#6B5E57] mb-1.5'>Operating Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className='w-full h-11 rounded-xl border border-[#E6DDD1] bg-white px-3.5 text-xs text-[#201A17] outline-none focus:border-[#A34720]'
                  >
                    <option value='Asia/Kolkata'>Asia/Kolkata (IST)</option>
                    <option value='America/New_York'>America/New York (EST)</option>
                    <option value='Europe/London'>Europe/London (GMT)</option>
                    <option value='Asia/Dubai'>Asia/Dubai (GST)</option>
                  </select>
                </div>
              </div>

              {/* Working Days Selector (7 Pills Matching Moodboard) */}
              <div>
                <label className='block text-xs font-bold text-[#6B5E57] mb-2'>Working Days</label>
                <div className='flex flex-wrap gap-2'>
                  {ALL_DAYS.map((day) => {
                    const active = workingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type='button'
                        onClick={() => toggleDay(day)}
                        className={`w-12 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          active
                            ? 'bg-[#382017] text-white shadow-2xs'
                            : 'bg-[#F2EDE4] text-[#6B5E57] hover:bg-[#E6DDD1]'
                        }`}
                      >
                        {DAY_LABELS[day]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Numeric Rules Grid */}
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                <div>
                  <label className='block text-[11px] font-bold text-[#6B5E57] mb-1'>Capacity / Seats per Slot</label>
                  <input
                    type='number'
                    min={1}
                    value={seatsPerTable}
                    onChange={(e) => setSeatsPerTable(e.target.value)}
                    className='w-full h-10 rounded-xl border border-[#E6DDD1] bg-white px-3 text-xs text-[#201A17] outline-none'
                  />
                </div>

                <div>
                  <label className='block text-[11px] font-bold text-[#6B5E57] mb-1'>Max Party Size</label>
                  <input
                    type='number'
                    min={1}
                    value={maxPartySize}
                    onChange={(e) => setMaxPartySize(e.target.value)}
                    className='w-full h-10 rounded-xl border border-[#E6DDD1] bg-white px-3 text-xs text-[#201A17] outline-none'
                  />
                </div>

                <div>
                  <label className='block text-[11px] font-bold text-[#6B5E57] mb-1'>Advance Limit (Days)</label>
                  <input
                    type='number'
                    min={1}
                    value={advanceDaysLimit}
                    onChange={(e) => setAdvanceDaysLimit(e.target.value)}
                    className='w-full h-10 rounded-xl border border-[#E6DDD1] bg-white px-3 text-xs text-[#201A17] outline-none'
                  />
                </div>

                <div>
                  <label className='block text-[11px] font-bold text-[#6B5E57] mb-1'>Min Notice (Mins)</label>
                  <input
                    type='number'
                    min={0}
                    value={minNoticeMinutes}
                    onChange={(e) => setMinNoticeMinutes(e.target.value)}
                    className='w-full h-10 rounded-xl border border-[#E6DDD1] bg-white px-3 text-xs text-[#201A17] outline-none'
                  />
                </div>
              </div>

              {/* Reservation Slots Matrix (Matching Moodboard Screen 3) */}
              <div className='pt-2'>
                <div className='flex items-center justify-between mb-3'>
                  <h4 className='text-xs font-bold text-[#201A17]'>Reservation Slots</h4>
                  <span className='text-[11px] text-[#968880]'>{slots.length} slots configured</span>
                </div>

                {/* Inline New Slot Builder (12-Hour with AM / PM) */}
                <div className='p-4 rounded-2xl bg-[#FBF7F0] border border-[#EFE9DF] mb-4 space-y-3.5'>
                  <div className='flex items-center justify-between'>
                    <p className='text-xs font-bold text-[#201A17]'>+ Add New Reservation Slot</p>
                    <span className='text-[10px] text-[#A34720] font-bold uppercase tracking-wider bg-[#F5E2D1] px-2 py-0.5 rounded-full'>
                      12-Hour Format (AM / PM)
                    </span>
                  </div>

                  <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                    {/* Start Time (12-Hour) */}
                    <div>
                      <label className='block text-[10px] text-[#6B5E57] font-bold mb-1'>Start Time</label>
                      <div className='flex items-center gap-1.5'>
                        <select
                          value={startHour}
                          onChange={(e) => setStartHour(e.target.value)}
                          className='flex-1 h-9 px-2 rounded-lg border border-[#E6DDD1] bg-white text-xs font-bold text-[#201A17] outline-none focus:border-[#A34720]'
                        >
                          {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span className='text-xs font-bold text-[#6B5E57]'>:</span>
                        <select
                          value={startMinute}
                          onChange={(e) => setStartMinute(e.target.value)}
                          className='w-14 h-9 px-1.5 rounded-lg border border-[#E6DDD1] bg-white text-xs font-bold text-[#201A17] outline-none focus:border-[#A34720]'
                        >
                          {['00', '15', '30', '45'].map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <select
                          value={startAmpm}
                          onChange={(e) => setStartAmpm(e.target.value)}
                          className='w-16 h-9 px-1.5 rounded-lg border border-[#A34720]/40 bg-[#F5E2D1] text-xs font-bold text-[#A34720] outline-none focus:border-[#A34720]'
                        >
                          <option value='AM'>AM</option>
                          <option value='PM'>PM</option>
                        </select>
                      </div>
                    </div>

                    {/* End Time (12-Hour) */}
                    <div>
                      <label className='block text-[10px] text-[#6B5E57] font-bold mb-1'>End Time</label>
                      <div className='flex items-center gap-1.5'>
                        <select
                          value={endHour}
                          onChange={(e) => setEndHour(e.target.value)}
                          className='flex-1 h-9 px-2 rounded-lg border border-[#E6DDD1] bg-white text-xs font-bold text-[#201A17] outline-none focus:border-[#A34720]'
                        >
                          {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span className='text-xs font-bold text-[#6B5E57]'>:</span>
                        <select
                          value={endMinute}
                          onChange={(e) => setEndMinute(e.target.value)}
                          className='w-14 h-9 px-1.5 rounded-lg border border-[#E6DDD1] bg-white text-xs font-bold text-[#201A17] outline-none focus:border-[#A34720]'
                        >
                          {['00', '15', '30', '45'].map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <select
                          value={endAmpm}
                          onChange={(e) => setEndAmpm(e.target.value)}
                          className='w-16 h-9 px-1.5 rounded-lg border border-[#A34720]/40 bg-[#F5E2D1] text-xs font-bold text-[#A34720] outline-none focus:border-[#A34720]'
                        >
                          <option value='AM'>AM</option>
                          <option value='PM'>PM</option>
                        </select>
                      </div>
                    </div>

                    {/* Capacity */}
                    <div>
                      <label className='block text-[10px] text-[#6B5E57] font-bold mb-1'>Table Capacity</label>
                      <input
                        type='number'
                        min={1}
                        value={newSlotCapacity}
                        onChange={(e) => setNewSlotCapacity(e.target.value)}
                        className='w-full h-9 px-3 rounded-lg border border-[#E6DDD1] bg-white text-xs font-bold text-[#201A17] outline-none focus:border-[#A34720]'
                      />
                    </div>
                  </div>

                  <button
                    type='button'
                    onClick={addSlot}
                    className='px-4 py-2 rounded-xl bg-[#382017] hover:bg-[#A34720] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all'
                  >
                    <FiPlus size={14} />
                    <span>Add Slot ({startHour}:{startMinute} {startAmpm} – {endHour}:{endMinute} {endAmpm})</span>
                  </button>
                </div>

                {/* Slots Rows (12-Hour formatted) */}
                <div className='space-y-2'>
                  {slots.map((s, idx) => (
                    <div
                      key={s.slotId || idx}
                      className='flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#E6DDD1]'
                    >
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 rounded-lg bg-[#F5E2D1] text-[#A34720] flex items-center justify-center text-sm'>
                          <FiClock />
                        </div>
                        <div>
                          <p className='text-xs font-bold text-[#201A17]'>
                            {format12Hour(s.startTime)} – {format12Hour(s.endTime)}
                          </p>
                          <p className='text-[11px] text-[#6B5E57] font-medium'>
                            {s.capacity} tables available ({s.capacity * (Number(seatsPerTable) || 4)} seats)
                          </p>
                        </div>
                      </div>

                      <button
                        type='button'
                        onClick={() => removeSlot(idx)}
                        className='p-2 text-[#968880] hover:text-[#C62828] cursor-pointer'
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Navigation Bar */}
              <div className='pt-4 border-t border-[#EFE9DF] flex items-center justify-between'>
                <button
                  type='button'
                  onClick={() => setActiveStep(3)}
                  className='px-5 py-2 rounded-xl border border-[#E6DDD1] text-xs font-bold text-[#6B5E57] hover:bg-[#FBF7F0] flex items-center gap-1.5'
                >
                  <FiArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type='button'
                  onClick={() => setActiveStep(5)}
                  className='px-6 py-2.5 rounded-xl bg-[#382017] hover:bg-[#A34720] text-white text-xs font-bold transition-all flex items-center gap-2'
                >
                  <span>Next: Appearance</span>
                  <FiArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Appearance */}
          {activeStep === 5 && (
            <div className='bg-[#FFFCF7] rounded-3xl border border-[#E6DDD1] p-6 sm:p-8 space-y-6 shadow-xs animate-fadeIn'>
              <div>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='font-serif text-2xl font-bold text-[#201A17]'>Widget Appearance & Colors</h3>
                    <p className='text-xs text-[#6B5E57] mt-1'>
                      Click any theme to see your live assistant change colors on the screen instantly.
                    </p>
                  </div>
                  <span className='hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]'>
                    <span className='w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse'></span>
                    Live Preview Active
                  </span>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5'>
                {[
                  {
                    id: 'warm',
                    name: 'Warm Terracotta',
                    desc: 'Cream, terracotta & peach',
                    colors: ['#A34720', '#F5E2D1', '#382017'],
                  },
                  {
                    id: 'dark',
                    name: 'Espresso Night',
                    desc: 'Deep espresso & amber glow',
                    colors: ['#7C3AED', '#4F8CFF', '#050816'],
                  },
                  {
                    id: 'light',
                    name: 'Clean White',
                    desc: 'Minimal slate & ivory',
                    colors: ['#60A5FA', '#2563EB', '#F1F7FF'],
                  },
                  {
                    id: 'glass',
                    name: 'Frosted Glass',
                    desc: 'Modern blur & violet glass',
                    colors: ['#38BDF8', '#818CF8', '#C4B5FD'],
                  },
                ].map((th) => {
                  const isSelected = theme === th.id;
                  return (
                    <button
                      key={th.id}
                      type='button'
                      onClick={() => {
                        setTheme(th.id);
                        // Trigger live color update on widget
                        window.dispatchEvent(new CustomEvent('mencia:setTheme', { detail: { theme: th.id } }));
                        window.postMessage({ type: 'MENCIA_SET_THEME', theme: th.id }, '*');

                        const popupEl = document.getElementById('mencia-widget-popup');
                        const btnEl = document.getElementById('mencia-widget-btn');
                        if (popupEl) {
                          popupEl.className = popupEl.className.replace(/\btheme-\w+\b/g, '').trim() + ` theme-${th.id}`;
                          popupEl.style.display = 'flex';
                        }
                        if (btnEl) {
                          btnEl.className = btnEl.className.replace(/\btheme-\w+\b/g, '').trim() + ` theme-${th.id}`;
                        }
                        toast.success(`Applied ${th.name} theme live!`, { icon: '🎨' });
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'bg-[#F5E2D1] border-[#A34720] shadow-2xs ring-2 ring-[#A34720]/20'
                          : 'bg-white border-[#E6DDD1] hover:bg-[#FBF7F0] hover:border-[#A34720]/40'
                      }`}
                    >
                      <div className='flex items-center gap-1.5 mb-2.5'>
                        {th.colors.map((c, i) => (
                          <span
                            key={i}
                            className='w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs'
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <p className='text-xs font-bold text-[#201A17] flex items-center justify-between'>
                        <span>{th.name}</span>
                        {isSelected && <span className='text-[10px] text-[#A34720] font-semibold'>Active</span>}
                      </p>
                      <p className='text-[11px] text-[#6B5E57] mt-1 font-medium leading-snug'>{th.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Step Navigation Bar */}
              <div className='pt-4 border-t border-[#EFE9DF] flex items-center justify-between'>
                <button
                  type='button'
                  onClick={() => setActiveStep(4)}
                  className='px-5 py-2 rounded-xl border border-[#E6DDD1] text-xs font-bold text-[#6B5E57] hover:bg-[#FBF7F0] flex items-center gap-1.5'
                >
                  <FiArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type='button'
                  onClick={() => setActiveStep(6)}
                  className='px-6 py-2.5 rounded-xl bg-[#382017] hover:bg-[#A34720] text-white text-xs font-bold transition-all flex items-center gap-2'
                >
                  <span>Next: Review & Embed</span>
                  <FiArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Review & Publish */}
          {activeStep === 6 && (
            <div className='bg-[#FFFCF7] rounded-3xl border border-[#E6DDD1] p-6 sm:p-8 space-y-6 shadow-xs animate-fadeIn'>
              <div>
                <h3 className='font-serif text-2xl font-bold text-[#201A17]'>Review & Embed Code</h3>
                <p className='text-xs text-[#6B5E57] mt-1'>Copy your personalized script tag and paste it on your website.</p>
              </div>

              {/* Embed Code Terminal Box */}
              <div className='p-4.5 rounded-2xl bg-[#24140D] text-[#F5E2D1] relative font-mono text-xs shadow-inner'>
                <div className='flex items-center justify-between pb-2 mb-2 border-b border-white/10'>
                  <span className='text-[10px] uppercase font-bold text-[#A34720]'>Embed Snippet</span>
                  <button
                    type='button'
                    onClick={copyEmbedCode}
                    className='inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors cursor-pointer'
                  >
                    <FiCopy size={13} />
                    <span>{copyingEmbed ? 'Copied!' : 'Copy Tag'}</span>
                  </button>
                </div>
                <pre className='overflow-x-auto whitespace-pre-wrap leading-relaxed'>{embedScript}</pre>
              </div>

              {/* Instructions Callout */}
              <div className='p-4 rounded-2xl bg-[#FBF7F0] border border-[#EFE9DF] text-xs text-[#6B5E57] space-y-2'>
                <p className='font-bold text-[#201A17]'>How to install:</p>
                <p>1. Open your website's HTML file (or theme header/footer settings in WordPress, Shopify, Webflow).</p>
                <p>2. Paste this script tag right before the closing <code className='text-[#A34720] font-bold'>&lt;/body&gt;</code> tag.</p>
                <p>3. Refresh your website to see Arin AI live!</p>
              </div>

              {/* Step Navigation Bar */}
              <div className='pt-4 border-t border-[#EFE9DF] flex items-center justify-between'>
                <button
                  type='button'
                  onClick={() => setActiveStep(5)}
                  className='px-5 py-2 rounded-xl border border-[#E6DDD1] text-xs font-bold text-[#6B5E57] hover:bg-[#FBF7F0] flex items-center gap-1.5'
                >
                  <FiArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type='button'
                  onClick={saveAllSettings}
                  disabled={saving}
                  className='px-7 py-3 rounded-xl bg-[#A34720] hover:bg-[#853717] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm'
                >
                  <FiCheck size={16} />
                  <span>{saving ? 'Publishing...' : 'Publish Configuration'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

export default Builder;
