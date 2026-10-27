import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ServerUrl } from '../utils/constants';
import toast from 'react-hot-toast';
import {
  FiCalendar,
  FiUsers,
  FiClock,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiCopy,
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';

const STATUS_BADGES = {
  confirmed: {
    label: 'Confirmed',
    badge: 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]',
  },
  pending: {
    label: 'Pending',
    badge: 'bg-[#FFF8E1] text-[#C77700] border-[#FFE082]',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-[#E3F2FD] text-[#1565C0] border-[#BBDEFB]',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]',
  },
  no_show: {
    label: 'No-Show',
    badge: 'bg-[#F5F5F5] text-[#616161] border-[#E0E0E0]',
  },
};

const format12Hour = (timeStr) => {
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

function Bookings({ user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${ServerUrl}/api/business/bookings?limit=100`;
      if (dateFilter) url += `&date=${dateFilter}`;
      if (statusFilter && statusFilter !== 'all') url += `&status=${statusFilter}`;

      const res = await axios.get(url, { withCredentials: true });
      if (res.data.success) {
        setBookings(res.data.data.bookings || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusUpdate = async (id, newStatus) => {
    if (
      newStatus === 'cancelled' &&
      !window.confirm('Are you sure you want to cancel this reservation? Table capacity will be released.')
    ) {
      return;
    }
    setUpdatingId(id);
    try {
      const res = await axios.patch(
        `${ServerUrl}/api/business/bookings/${id}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(`Booking marked as ${newStatus}`);
        setBookings((prev) =>
          prev.map((b) => (b._id === id ? { ...b, status: newStatus } : b))
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update reservation status');
    } finally {
      setUpdatingId(null);
    }
  };

  const copyRef = (ref) => {
    navigator.clipboard.writeText(ref);
    toast.success(`Copied reference ${ref}`);
  };

  // Status counts
  const totalCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  // Filtered by search query (name, phone, reference)
  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.customerName || '').toLowerCase().includes(q) ||
      (b.customerPhone || '').includes(q) ||
      (b.bookingReference || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className='space-y-6 animate-fadeIn'>
      {/* Top Header matching Moodboard Screen 4 */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <span className='text-xs font-bold uppercase tracking-wider text-[#A34720]'>Capacity & Guest Log</span>
          <h1 className='font-serif text-3xl sm:text-4xl font-bold text-[#201A17] tracking-tight mt-0.5'>
            Table Reservations
          </h1>
          <p className='text-xs sm:text-sm text-[#6B5E57] mt-1 font-medium'>
            View and manage all customer reservations for {user?.businessName || 'your restaurant'}.
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <button
            onClick={fetchBookings}
            disabled={loading}
            className='inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-[#E6DDD1] bg-white text-xs font-bold text-[#382017] hover:bg-[#F5E2D1]/40 transition-colors shadow-2xs cursor-pointer'
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Date Selector, Search, Filter matching Moodboard) */}
      <div className='bg-[#FFFCF7] rounded-3xl border border-[#E6DDD1] p-4 sm:p-5 space-y-4 shadow-xs'>
        <div className='flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3'>
          {/* Search Input */}
          <div className='relative flex-1 max-w-md'>
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search by customer name, phone, or reference...'
              className='w-full h-11 pl-10 pr-4 rounded-xl border border-[#E6DDD1] bg-[#FBF7F0] text-xs text-[#201A17] outline-none placeholder-[#968880] focus:border-[#A34720]'
            />
            <FiSearch className='absolute left-3.5 top-3.5 text-[#968880]' size={15} />
          </div>

          {/* Date Picker Filter */}
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-2 border border-[#E6DDD1] rounded-xl px-3.5 py-2 bg-white text-xs font-semibold'>
              <FiCalendar className='text-[#A34720]' size={14} />
              <input
                type='date'
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className='bg-transparent outline-none text-[#201A17] cursor-pointer'
              />
            </div>
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className='text-xs text-[#A34720] font-bold hover:underline cursor-pointer'
              >
                Clear Date
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs (Matching Moodboard Screen 4) */}
        <div className='flex items-center gap-2 overflow-x-auto pt-2 border-t border-[#EFE9DF]'>
          {[
            { id: 'all', label: `All (${totalCount})` },
            { id: 'confirmed', label: `Confirmed (${confirmedCount})` },
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'completed', label: `Completed (${completedCount})` },
            { id: 'cancelled', label: `Cancelled (${cancelledCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#382017] text-white shadow-2xs'
                  : 'bg-[#F2EDE4] text-[#6B5E57] hover:bg-[#E6DDD1]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Reservation Data Table */}
      <div className='bg-[#FFFCF7] rounded-3xl border border-[#E6DDD1] shadow-xs overflow-hidden'>
        {loading ? (
          <div className='p-16 text-center text-[#968880]'>
            <FiRefreshCw className='animate-spin inline-block text-3xl mb-3 text-[#A34720]' />
            <p className='text-sm font-semibold'>Loading dining reservations...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className='p-16 text-center max-w-md mx-auto'>
            <div className='w-14 h-14 rounded-2xl bg-[#F5E2D1] text-[#A34720] flex items-center justify-center text-2xl mx-auto mb-4'>
              <FiCalendar />
            </div>
            <h3 className='font-serif text-xl font-bold text-[#201A17]'>No Reservations Found</h3>
            <p className='text-xs text-[#6B5E57] mt-1.5 leading-relaxed'>
              {dateFilter || statusFilter !== 'all' || searchQuery
                ? 'No bookings match your selected filters. Try clearing your search or date query.'
                : 'Customer bookings made via the voice assistant will appear here in real time.'}
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-[#FBF7F0] text-[11px] font-bold uppercase tracking-wider text-[#6B5E57] border-b border-[#E6DDD1]'>
                <tr>
                  <th className='px-6 py-4'>Booking Ref</th>
                  <th className='px-6 py-4'>Date & Time</th>
                  <th className='px-6 py-4'>Customer</th>
                  <th className='px-6 py-4'>Party / Tables</th>
                  <th className='px-6 py-4'>Status</th>
                  <th className='px-6 py-4 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-[#EFE9DF]'>
                {filteredBookings.map((b) => {
                  const badgeInfo = STATUS_BADGES[b.status] || STATUS_BADGES.confirmed;
                  return (
                    <tr key={b._id} className='hover:bg-[#FBF7F0]/60 transition-colors'>
                      {/* Booking Reference with 1-Click Copy */}
                      <td className='px-6 py-4 font-mono font-bold text-[#A34720]'>
                        <button
                          onClick={() => copyRef(b.bookingReference)}
                          className='inline-flex items-center gap-1.5 hover:underline cursor-pointer'
                          title='Click to copy reference'
                        >
                          <span>{b.bookingReference}</span>
                          <FiCopy size={11} className='text-[#968880]' />
                        </button>
                      </td>

                      {/* Date & Time */}
                      <td className='px-6 py-4'>
                        <div className='font-bold text-[#201A17]'>{b.bookingDate}</div>
                        <div className='text-[11px] text-[#6B5E57] flex items-center gap-1 mt-0.5'>
                          <FiClock size={11} className='text-[#A34720]' />
                          <span>{format12Hour(b.startTime)} – {format12Hour(b.endTime)}</span>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className='px-6 py-4'>
                        <div className='font-bold text-[#201A17]'>{b.customerName}</div>
                        <a
                          href={`tel:${b.customerPhone}`}
                          className='text-[11px] text-[#6B5E57] hover:text-[#A34720] flex items-center gap-1 mt-0.5'
                        >
                          <FiPhone size={11} />
                          <span>{b.customerPhone}</span>
                        </a>
                      </td>

                      {/* Party & Table Allocation */}
                      <td className='px-6 py-4'>
                        <div className='font-bold text-[#201A17] flex items-center gap-1'>
                          <FiUsers size={13} className='text-[#A34720]' />
                          <span>{b.partySize} guests</span>
                        </div>
                        <div className='text-[11px] text-[#6B5E57] mt-0.5'>{b.allocatedCapacity || 1} table(s)</div>
                      </td>

                      {/* Status Badge */}
                      <td className='px-6 py-4'>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold border capitalize ${badgeInfo.badge}`}
                        >
                          {badgeInfo.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className='px-6 py-4 text-right'>
                        {b.status === 'confirmed' ? (
                          <div className='inline-flex items-center gap-1.5 justify-end'>
                            <button
                              onClick={() => handleStatusUpdate(b._id, 'completed')}
                              disabled={updatingId === b._id}
                              title='Mark as Completed'
                              className='px-2.5 py-1 rounded-lg bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32] text-[11px] font-bold transition-colors cursor-pointer'
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(b._id, 'cancelled')}
                              disabled={updatingId === b._id}
                              title='Cancel Booking (Releases capacity)'
                              className='px-2.5 py-1 rounded-lg bg-[#FFEBEE] hover:bg-[#FFCDD2] text-[#C62828] text-[11px] font-bold transition-colors cursor-pointer'
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(b._id, 'no_show')}
                              disabled={updatingId === b._id}
                              title='Mark No Show'
                              className='px-2.5 py-1 rounded-lg bg-[#FFF8E1] hover:bg-[#FFE082] text-[#C77700] text-[11px] font-bold transition-colors cursor-pointer'
                            >
                              No-Show
                            </button>
                          </div>
                        ) : (
                          <span className='text-[11px] text-[#968880] italic'>No actions available</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Table Footer / Summary */}
            <div className='px-6 py-4 bg-[#FBF7F0] border-t border-[#E6DDD1] flex items-center justify-between text-xs text-[#6B5E57] font-semibold'>
              <span>
                Showing {filteredBookings.length} of {bookings.length} reservations
              </span>
              <div className='flex items-center gap-1'>
                <button
                  disabled
                  className='w-7 h-7 rounded-lg border border-[#E6DDD1] bg-white flex items-center justify-center opacity-50 cursor-not-allowed'
                >
                  <FiChevronLeft size={14} />
                </button>
                <span className='w-7 h-7 rounded-lg bg-[#382017] text-white flex items-center justify-center font-bold text-xs'>
                  1
                </span>
                <button
                  disabled
                  className='w-7 h-7 rounded-lg border border-[#E6DDD1] bg-white flex items-center justify-center opacity-50 cursor-not-allowed'
                >
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Bookings;
