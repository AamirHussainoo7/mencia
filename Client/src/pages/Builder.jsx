import { useState } from 'react';
import axios from 'axios';
import { FiCopy, FiPlus, FiTrash2, FiClock, FiCalendar, FiMapPin } from 'react-icons/fi';
import { CLIENT_URL, ServerUrl } from '../utils/constants';
import toast from 'react-hot-toast';

const THEMES = ['light', 'dark', 'glass', 'neon'];
const TONES = ['friendly', 'professional', 'sales'];
const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function Builder({ user, setUser }) {
  const [editAssistant, setEditAssistant] = useState(!user?.isSetupComplete);

  // Assistant Configuration State
  const [assistantName, setAssistantName] = useState(user?.assistantName || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [businessType, setBusinessType] = useState(user?.businessType || '');
  const [businessDescription, setBusinessDescription] = useState(user?.businessDescription || '');
  const [theme, setTheme] = useState(user?.theme || 'dark');
  const [tone, setTone] = useState(user?.tone || 'friendly');
  const [groqApiKey, setGroqApiKey] = useState(user?.groqApiKey || '');
  const [geminiApiKey, setGeminiApiKey] = useState(user?.geminiApiKey || '');

  // Navigation Pages State
  const [pages, setPages] = useState(user?.pages || []);
  const [pageName, setPageName] = useState('');
  const [pagePath, setPagePath] = useState('');
  const [pageKeywords, setPageKeywords] = useState('');
  const [loading, setLoading] = useState(false);

  // Reservation / Booking Settings State
  const [bookingEnabled, setBookingEnabled] = useState(user?.bookingSettings?.bookingEnabled || false);
  const [location, setLocation] = useState(user?.bookingSettings?.location || '');
  const [timezone, setTimezone] = useState(user?.bookingSettings?.timezone || 'Asia/Kolkata');
  const [workingDays, setWorkingDays] = useState(
    user?.bookingSettings?.workingDays || ALL_DAYS
  );
  const [slots, setSlots] = useState(user?.bookingSettings?.slots || []);
  const [maxPartySize, setMaxPartySize] = useState(user?.bookingSettings?.maxPartySize || 12);
  const [advanceDaysLimit, setAdvanceDaysLimit] = useState(user?.bookingSettings?.advanceDaysLimit || 30);
  const [minNoticeMinutes, setMinNoticeMinutes] = useState(user?.bookingSettings?.minNoticeMinutes || 60);
  const [seatsPerTable, setSeatsPerTable] = useState(user?.bookingSettings?.seatsPerTable || 4);
  const [cancellationPolicy, setCancellationPolicy] = useState(
    user?.bookingSettings?.cancellationPolicy || 'Free cancellation up to 1 hour before reserved time slot.'
  );

  // New Slot Input State
  const [newSlotStart, setNewSlotStart] = useState('');
  const [newSlotEnd, setNewSlotEnd] = useState('');
  const [newSlotCapacity, setNewSlotCapacity] = useState(5);
  const [savingBooking, setSavingBooking] = useState(false);

  const addPage = () => {
    if (!pageName || !pagePath) return;
    const newPage = {
      name: pageName,
      path: pagePath,
      keywords: pageKeywords.split(',').map((k) => k.trim()),
    };
    setPages([...pages, newPage]);
    setPageName('');
    setPagePath('');
    setPageKeywords('');
  };

  const removePage = (index) => {
    setPages(pages.filter((_, i) => i !== index));
  };

  const toggleDay = (day) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const addSlot = () => {
    if (!newSlotStart || !newSlotEnd) {
      toast.error('Start time and end time are required.');
      return;
    }
    if (newSlotStart >= newSlotEnd) {
      toast.error('Start time must be earlier than end time.');
      return;
    }
    const cap = parseInt(newSlotCapacity, 10);
    if (isNaN(cap) || cap < 1) {
      toast.error('Capacity must be at least 1 table.');
      return;
    }

    const newSlot = {
      slotId: 'slot_' + Date.now(),
      name: `${newSlotStart} - ${newSlotEnd}`,
      startTime: newSlotStart,
      endTime: newSlotEnd,
      capacity: cap,
      seatsPerTable: Number(seatsPerTable) || 4,
    };

    setSlots([...slots, newSlot]);
    setNewSlotStart('');
    setNewSlotEnd('');
  };

  const removeSlot = (index) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const saveAssistant = async () => {
    setLoading(true);
    try {
      const data = {
        assistantName,
        businessName,
        businessType,
        businessDescription,
        tone,
        theme,
        groqApiKey,
        geminiApiKey,
        pages,
      };

      const res = await axios.post(ServerUrl + '/api/user/save-assistant', data, { withCredentials: true });
      setUser(res.data.user);
      setEditAssistant(false);
      toast.success('Assistant Saved Successfully');
    } catch (error) {
      toast.error('Failed to save assistant');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveBookingSettings = async () => {
    setSavingBooking(true);
    try {
      const payload = {
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

      const res = await axios.patch(ServerUrl + '/api/user/booking-settings', payload, { withCredentials: true });
      if (res.data.success) {
        setUser({
          ...user,
          bookingSettings: res.data.bookingSettings,
        });
        toast.success('Reservation settings saved successfully!');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save reservation settings');
    } finally {
      setSavingBooking(false);
    }
  };

  const remainingMessages = Math.max(
    0,
    (user?.requestLimit || 0) - (user?.totalMessages || 0)
  );

  const remainingDays = user?.proExpiresAt
    ? Math.max(
        0,
        Math.ceil((new Date(user.proExpiresAt) - new Date()) / (1000 * 60 * 60 * 24))
      )
    : 0;

  const embedCode = `<script src="${CLIENT_URL}/assistant.js" data-user-id="${user?._id}"></script>`;

  return (
    <div className='min-h-screen bg-[#f7f8fc] px-4 py-10'>
      <div className='max-w-4xl mx-auto'>
        <div className='mb-8'>
          <h2 className='text-3xl font-bold text-[#081028]'>Assistant Builder</h2>
          <p className='text-gray-500 mt-1'>Configure your assistant behavior, voice, and restaurant reservations.</p>
        </div>

        {/* Setup Complete Card & Embed Code */}
        {!editAssistant && (
          <div className='bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-8'>
            <h2 className='text-2xl font-bold text-[#081028]'>Assistant Active & Ready</h2>
            <p className='text-gray-400 mt-1'>Your assistant is embedded and active on your website.</p>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6'>
              <div className='rounded-2xl border border-gray-100 bg-[#f8fafc] p-4'>
                <p className='text-sm text-gray-400'>Current Plan</p>
                <h2 className='text-xl font-bold text-[#081028] mt-1 capitalize'>{user?.plan}</h2>
              </div>

              <div className='rounded-2xl border border-gray-100 bg-[#f8fafc] p-4'>
                <p className='text-sm text-gray-400'>AI Provider Status</p>
                <h2
                  className={`text-xl font-bold mt-1 capitalize ${
                    (user?.groqStatus || user?.geminiStatus || 'active') === 'active'
                      ? 'text-emerald-600'
                      : (user?.groqStatus || user?.geminiStatus) === 'invalid'
                      ? 'text-red-500'
                      : 'text-amber-500'
                  }`}
                >
                  {user?.groqStatus || user?.geminiStatus || 'active'}
                </h2>
              </div>

              <div className='rounded-2xl border border-gray-100 bg-[#f8fafc] p-4'>
                <p className='text-sm text-gray-400'>{user?.plan === 'free' ? 'Messages Left' : 'Plan Expiry'}</p>
                <h2 className='text-xl font-bold text-[#081028] mt-1 capitalize'>
                  {user?.plan === 'free' ? remainingMessages : `${remainingDays} Days`}
                </h2>
              </div>
            </div>

            <div className='mt-7'>
              <div className='mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4'>
                <p className='text-sm font-semibold text-amber-900'>Where to paste this script?</p>
                <p className='text-sm text-amber-700 mt-2 leading-6'>
                  Paste this script before the closing <span className='font-semibold'>&lt;/body&gt;</span> tag of your website HTML file.
                </p>
                <pre className='mt-3 bg-[#0b1020] text-emerald-400 rounded-xl p-3 text-xs font-mono overflow-x-auto'>
                  {`<body>\n  Your Website Content\n  ${embedCode}\n</body>`}
                </pre>
              </div>

              <p className='text-sm font-medium text-[#081028] mb-3 mt-4'>Embed Code</p>
              <div className='relative'>
                <textarea
                  readOnly
                  value={embedCode}
                  className='w-full h-20 bg-[#0b1020] text-emerald-400 rounded-2xl p-4 text-sm font-mono resize-none outline-none'
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(embedCode);
                    toast.success('Copied to clipboard');
                  }}
                  className='absolute top-4 right-4 w-10 h-10 rounded-xl bg-white flex items-center justify-center cursor-pointer shadow-sm hover:scale-105 transition-all'
                >
                  <FiCopy />
                </button>
              </div>

              <button
                onClick={() => setEditAssistant(true)}
                className='mt-6 h-12 px-6 rounded-2xl bg-gradient-to-r from-purple-500 to-emerald-500 text-white font-medium cursor-pointer hover:opacity-95'
              >
                Edit Core Assistant
              </button>
            </div>
          </div>
        )}

        {/* Reservation & Booking Settings Section (Available Anytime) */}
        <div className='bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-8'>
          <div className='flex items-center justify-between border-b border-gray-100 pb-4 mb-6'>
            <div>
              <h2 className='text-xl font-bold text-[#081028] flex items-center gap-2'>
                <FiCalendar className='text-purple-600' /> Table Reservations
              </h2>
              <p className='text-sm text-gray-500 mt-0.5'>Enable conversational AI booking for your restaurant or cafe.</p>
            </div>
            <label className='relative inline-flex items-center cursor-pointer'>
              <input
                type='checkbox'
                checked={bookingEnabled}
                onChange={(e) => setBookingEnabled(e.target.checked)}
                className='sr-only peer'
              />
              <div className="w-13 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-emerald-500"></div>
            </label>
          </div>

          <div className='space-y-6'>
            {/* Location & Timezone */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='text-sm font-medium text-gray-700 block mb-1 flex items-center gap-1.5'>
                  <FiMapPin className='text-gray-400' /> Restaurant Location / Address
                </label>
                <input
                  type='text'
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder='e.g. 104 Connaught Place, New Delhi'
                  className='w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-purple-400 outline-none'
                />
              </div>

              <div>
                <label className='text-sm font-medium text-gray-700 block mb-1 flex items-center gap-1.5'>
                  <FiClock className='text-gray-400' /> Operating Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className='w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-purple-400 outline-none bg-white'
                >
                  <option value='Asia/Kolkata'>Asia/Kolkata (IST)</option>
                  <option value='America/New_York'>America/New_York (EST)</option>
                  <option value='America/Los_Angeles'>America/Los_Angeles (PST)</option>
                  <option value='America/Chicago'>America/Chicago (CST)</option>
                  <option value='Europe/London'>Europe/London (GMT/BST)</option>
                  <option value='Europe/Paris'>Europe/Paris (CET)</option>
                  <option value='Asia/Dubai'>Asia/Dubai (GST)</option>
                  <option value='Asia/Singapore'>Asia/Singapore (SGT)</option>
                  <option value='UTC'>UTC</option>
                </select>
              </div>
            </div>

            {/* Working Days */}
            <div>
              <label className='text-sm font-medium text-gray-700 block mb-2'>Working Days</label>
              <div className='flex flex-wrap gap-2'>
                {ALL_DAYS.map((day) => {
                  const active = workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type='button'
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                        active
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Booking Rules & Limits */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
              <div>
                <label className='text-xs font-medium text-gray-600 block mb-1'>Seats / Table</label>
                <input
                  type='number'
                  min='1'
                  value={seatsPerTable}
                  onChange={(e) => setSeatsPerTable(e.target.value)}
                  className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm'
                />
              </div>

              <div>
                <label className='text-xs font-medium text-gray-600 block mb-1'>Max Party Size</label>
                <input
                  type='number'
                  min='1'
                  value={maxPartySize}
                  onChange={(e) => setMaxPartySize(e.target.value)}
                  className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm'
                />
              </div>

              <div>
                <label className='text-xs font-medium text-gray-600 block mb-1'>Advance Limit (Days)</label>
                <input
                  type='number'
                  min='1'
                  value={advanceDaysLimit}
                  onChange={(e) => setAdvanceDaysLimit(e.target.value)}
                  className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm'
                />
              </div>

              <div>
                <label className='text-xs font-medium text-gray-600 block mb-1'>Min Notice (Mins)</label>
                <input
                  type='number'
                  min='0'
                  value={minNoticeMinutes}
                  onChange={(e) => setMinNoticeMinutes(e.target.value)}
                  className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm'
                />
              </div>
            </div>

            {/* Fixed Slots Manager */}
            <div className='border-t border-gray-100 pt-5'>
              <h3 className='text-md font-semibold text-gray-800 mb-3 flex items-center gap-1.5'>
                <FiClock className='text-purple-600' /> Configured Reservation Slots
              </h3>

              {/* Slot Add Inputs */}
              <div className='grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4'>
                <div>
                  <label className='text-xs text-gray-500 block mb-1'>Start Time (HH:mm)</label>
                  <input
                    type='time'
                    value={newSlotStart}
                    onChange={(e) => setNewSlotStart(e.target.value)}
                    className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm'
                  />
                </div>
                <div>
                  <label className='text-xs text-gray-500 block mb-1'>End Time (HH:mm)</label>
                  <input
                    type='time'
                    value={newSlotEnd}
                    onChange={(e) => setNewSlotEnd(e.target.value)}
                    className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm'
                  />
                </div>
                <div>
                  <label className='text-xs text-gray-500 block mb-1'>Table Capacity</label>
                  <input
                    type='number'
                    min='1'
                    value={newSlotCapacity}
                    onChange={(e) => setNewSlotCapacity(e.target.value)}
                    className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm'
                  />
                </div>
                <div className='flex items-end'>
                  <button
                    type='button'
                    onClick={addSlot}
                    className='w-full h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all'
                  >
                    <FiPlus /> Add Slot
                  </button>
                </div>
              </div>

              {/* Slot List */}
              <div className='space-y-2 mt-3'>
                {slots.length === 0 ? (
                  <p className='text-sm text-gray-400 italic py-2'>No time slots configured yet. Add slots above.</p>
                ) : (
                  slots.map((s, idx) => (
                    <div
                      key={s.slotId || idx}
                      className='flex items-center justify-between border border-gray-100 rounded-2xl px-4 py-3 bg-[#fdfdfd]'
                    >
                      <div className='flex items-center gap-3'>
                        <span className='w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs'>
                          {idx + 1}
                        </span>
                        <div>
                          <p className='font-semibold text-gray-800 text-sm'>
                            {s.startTime} — {s.endTime}
                          </p>
                          <p className='text-xs text-gray-400'>{s.capacity} tables available</p>
                        </div>
                      </div>
                      <button
                        type='button'
                        onClick={() => removeSlot(idx)}
                        className='text-red-500 hover:text-red-700 p-2 cursor-pointer'
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cancellation Policy */}
            <div>
              <label className='text-xs font-medium text-gray-600 block mb-1'>Cancellation Policy</label>
              <textarea
                value={cancellationPolicy}
                onChange={(e) => setCancellationPolicy(e.target.value)}
                placeholder='e.g. Free cancellation up to 1 hour before reserved time slot.'
                className='w-full border border-gray-200 rounded-xl p-3 text-xs resize-none h-18'
              />
            </div>

            {/* Save Reservation Settings Button */}
            <button
              onClick={saveBookingSettings}
              disabled={savingBooking}
              className='w-full h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-emerald-500 text-white font-semibold cursor-pointer disabled:opacity-50 hover:shadow-md transition-all'
            >
              {savingBooking ? 'Saving Reservations...' : 'Save Reservation Settings'}
            </button>
          </div>
        </div>

        {/* Core Assistant Settings (Edit Mode) */}
        {editAssistant && (
          <div className='space-y-6'>
            <div className='bg-white rounded-3xl border border-gray-100 shadow-sm p-6'>
              <h2 className='text-lg font-semibold mb-5'>Basic Information</h2>
              <div className='space-y-4'>
                <input
                  type='text'
                  onChange={(e) => setAssistantName(e.target.value)}
                  value={assistantName}
                  placeholder='Assistant Name'
                  className='w-full border border-gray-200 rounded-2xl px-4 py-3'
                />
                <input
                  type='text'
                  onChange={(e) => setBusinessName(e.target.value)}
                  value={businessName}
                  placeholder='Business Name'
                  className='w-full border border-gray-200 rounded-2xl px-4 py-3'
                />
                <input
                  type='text'
                  onChange={(e) => setBusinessType(e.target.value)}
                  value={businessType}
                  placeholder='e.g. Italian Restaurant & Cafe'
                  className='w-full border border-gray-200 rounded-2xl px-4 py-3'
                />
                <textarea
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  value={businessDescription}
                  placeholder='Business Description & FAQs'
                  className='w-full h-28 border border-gray-200 rounded-2xl p-4 resize-none'
                />
              </div>
            </div>

            {/* Tone & Theme */}
            <div className='bg-white rounded-3xl border border-gray-100 shadow-sm p-6'>
              <h2 className='text-lg font-semibold mb-5'>Appearance & Tone</h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm text-gray-500 block mb-2'>Theme</label>
                  <div className='flex gap-2'>
                    {THEMES.map((t) => (
                      <button
                        key={t}
                        type='button'
                        onClick={() => setTheme(t)}
                        className={`px-4 py-2 rounded-xl text-sm capitalize ${
                          theme === t ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className='text-sm text-gray-500 block mb-2'>Tone</label>
                  <div className='flex gap-2'>
                    {TONES.map((t) => (
                      <button
                        key={t}
                        type='button'
                        onClick={() => setTone(t)}
                        className={`px-4 py-2 rounded-xl text-sm capitalize ${
                          tone === t ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Groq AI Provider API Key */}
            <div className='bg-white rounded-3xl border border-gray-100 shadow-sm p-6'>
              <div className='flex items-center justify-between mb-2'>
                <h2 className='text-lg font-semibold'>Groq API Key (Fast & Reliable)</h2>
                <span className='px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full'>
                  Llama 3.3 Versatile
                </span>
              </div>
              <p className='text-xs text-gray-400 mb-4'>
                Enter your Groq API key (starts with <code className='font-mono text-gray-600'>gsk_</code>). Leave blank if using server default key.
              </p>
              <input
                type='password'
                value={groqApiKey || geminiApiKey}
                onChange={(e) => {
                  setGroqApiKey(e.target.value);
                  setGeminiApiKey(e.target.value);
                }}
                placeholder='Enter your Groq API Key (e.g. gsk_...)'
                className='w-full border border-gray-200 rounded-2xl px-4 py-3 font-mono text-sm'
              />
            </div>

            {/* Website Navigation Pages */}
            <div className='bg-white rounded-3xl border border-gray-100 shadow-sm p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-semibold'>Keyword Navigation Pages</h2>
                <button
                  type='button'
                  onClick={addPage}
                  className='flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold'
                >
                  <FiPlus /> Add Page
                </button>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4'>
                <input
                  type='text'
                  placeholder='Page Name (e.g. Menu)'
                  className='border border-gray-200 rounded-xl px-4 py-2.5 text-sm'
                  onChange={(e) => setPageName(e.target.value)}
                  value={pageName}
                />
                <input
                  type='text'
                  placeholder='Path (e.g. /menu)'
                  className='border border-gray-200 rounded-xl px-4 py-2.5 text-sm'
                  onChange={(e) => setPagePath(e.target.value)}
                  value={pagePath}
                />
                <input
                  type='text'
                  placeholder='Keywords (e.g. dishes, food, drinks)'
                  className='border border-gray-200 rounded-xl px-4 py-2.5 text-sm'
                  onChange={(e) => setPageKeywords(e.target.value)}
                  value={pageKeywords}
                />
              </div>

              <div className='space-y-2'>
                {pages.map((p, idx) => (
                  <div key={idx} className='flex items-center justify-between border border-gray-100 rounded-xl p-3 bg-gray-50'>
                    <div>
                      <p className='font-medium text-sm text-gray-800'>{p.name}</p>
                      <p className='text-xs text-gray-400'>{p.path}</p>
                    </div>
                    <button type='button' onClick={() => removePage(idx)} className='text-red-500 p-1'>
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Core Assistant Button */}
            <button
              onClick={saveAssistant}
              disabled={loading || !assistantName || !businessName || !businessType || !businessDescription}
              className='w-full h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-emerald-500 text-white font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all'
            >
              {loading ? 'Saving...' : user?.isSetupComplete ? 'Update Assistant' : 'Save Assistant'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Builder;
