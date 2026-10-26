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
} from 'react-icons/fi';

const STATUS_COLORS = {
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  no_show: 'bg-amber-50 text-amber-700 border-amber-200',
};

function Bookings({ user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, statusFilter]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        let url = `${ServerUrl}/api/business/bookings?limit=100`;
        if (dateFilter) url += `&date=${dateFilter}`;
        if (statusFilter && statusFilter !== 'all') url += `&status=${statusFilter}`;

        const res = await axios.get(url, { withCredentials: true });
        if (!ignore && res.data.success) {
          setBookings(res.data.data.bookings || []);
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
          toast.error('Failed to load bookings');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [dateFilter, statusFilter]);

  const handleStatusUpdate = async (id, newStatus) => {
    if (newStatus === 'cancelled' && !window.confirm('Are you sure you want to cancel this reservation? Capacity will be released.')) {
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
        setBookings(bookings.map((b) => (b._id === id ? { ...b, status: newStatus } : b)));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Metrics computation
  const todayStr = new Date().toISOString().split('T')[0];
  const totalCount = bookings.length;
  const todayCount = bookings.filter((b) => b.bookingDate === todayStr).length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

  return (
    <div className='min-h-screen bg-[#f7f8fc] px-4 py-10'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8'>
          <div>
            <h2 className='text-3xl font-bold text-[#081028]'>Table Reservations</h2>
            <p className='text-gray-500 mt-1'>
              Manage live customer bookings for {user?.businessName || 'your restaurant'}.
            </p>
          </div>
          <button
            onClick={fetchBookings}
            disabled={loading}
            className='flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:border-purple-300 transition-all cursor-pointer shadow-sm'
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Metrics Grid */}
        <div className='grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-8'>
          <div className='bg-white rounded-2xl p-4 border border-gray-100 shadow-sm'>
            <p className='text-xs text-gray-400 font-medium'>Total Bookings</p>
            <h3 className='text-2xl font-bold text-[#081028] mt-1'>{totalCount}</h3>
          </div>
          <div className='bg-white rounded-2xl p-4 border border-gray-100 shadow-sm'>
            <p className='text-xs text-purple-600 font-medium'>Today</p>
            <h3 className='text-2xl font-bold text-purple-700 mt-1'>{todayCount}</h3>
          </div>
          <div className='bg-white rounded-2xl p-4 border border-gray-100 shadow-sm'>
            <p className='text-xs text-emerald-600 font-medium'>Confirmed</p>
            <h3 className='text-2xl font-bold text-emerald-600 mt-1'>{confirmedCount}</h3>
          </div>
          <div className='bg-white rounded-2xl p-4 border border-gray-100 shadow-sm'>
            <p className='text-xs text-blue-600 font-medium'>Completed</p>
            <h3 className='text-2xl font-bold text-blue-600 mt-1'>{completedCount}</h3>
          </div>
          <div className='bg-white rounded-2xl p-4 border border-gray-100 shadow-sm col-span-2 sm:col-span-1'>
            <p className='text-xs text-red-500 font-medium'>Cancelled</p>
            <h3 className='text-2xl font-bold text-red-500 mt-1'>{cancelledCount}</h3>
          </div>
        </div>

        {/* Filters Bar */}
        <div className='bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4'>
          {/* Status Tabs */}
          <div className='flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0'>
            {['all', 'confirmed', 'completed', 'cancelled', 'no_show'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Date Picker */}
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5 bg-gray-50 text-xs'>
              <FiCalendar className='text-gray-400' />
              <input
                type='date'
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className='bg-transparent outline-none text-gray-700'
              />
            </div>
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className='text-xs text-purple-600 font-medium hover:underline cursor-pointer'
              >
                Clear Date
              </button>
            )}
          </div>
        </div>

        {/* Bookings Table / List */}
        <div className='bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden'>
          {loading ? (
            <div className='p-12 text-center text-gray-400'>
              <FiRefreshCw className='animate-spin inline-block text-2xl mb-2 text-purple-600' />
              <p className='text-sm'>Loading reservations...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className='p-12 text-center'>
              <FiCalendar className='text-4xl text-gray-300 mx-auto mb-3' />
              <h3 className='text-lg font-bold text-gray-700'>No Reservations Found</h3>
              <p className='text-sm text-gray-400 mt-1'>
                {dateFilter || statusFilter !== 'all'
                  ? 'Try clearing the active filters above.'
                  : 'Customer reservations made through the assistant widget will appear here in real time.'}
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-left text-sm'>
                <thead className='bg-[#f8fafc] text-xs font-semibold text-gray-500 uppercase border-b border-gray-100'>
                  <tr>
                    <th className='px-6 py-4'>Booking Ref</th>
                    <th className='px-6 py-4'>Date & Time</th>
                    <th className='px-6 py-4'>Customer</th>
                    <th className='px-6 py-4'>Party / Tables</th>
                    <th className='px-6 py-4'>Status</th>
                    <th className='px-6 py-4 text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {bookings.map((b) => (
                    <tr key={b._id} className='hover:bg-gray-50/60 transition-colors'>
                      <td className='px-6 py-4 font-mono font-bold text-purple-700 text-xs'>{b.bookingReference}</td>
                      <td className='px-6 py-4'>
                        <div className='font-medium text-gray-900'>{b.bookingDate}</div>
                        <div className='text-xs text-gray-400 flex items-center gap-1 mt-0.5'>
                          <FiClock size={12} /> {b.startTime} - {b.endTime}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='font-semibold text-gray-800'>{b.customerName}</div>
                        <div className='text-xs text-gray-500 flex items-center gap-1 mt-0.5'>
                          <FiPhone size={12} /> {b.customerPhone}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <span className='inline-flex items-center gap-1 font-medium text-gray-700'>
                          <FiUsers size={14} className='text-purple-500' /> {b.partySize} guests
                        </span>
                        <div className='text-xs text-gray-400 mt-0.5'>{b.allocatedCapacity} table(s)</div>
                      </td>
                      <td className='px-6 py-4'>
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${
                            STATUS_COLORS[b.status] || 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className='px-6 py-4 text-right'>
                        {b.status === 'confirmed' ? (
                          <div className='flex items-center justify-end gap-1.5'>
                            <button
                              onClick={() => handleStatusUpdate(b._id, 'completed')}
                              disabled={updatingId === b._id}
                              title='Mark Completed'
                              className='px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium cursor-pointer transition-colors'
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(b._id, 'cancelled')}
                              disabled={updatingId === b._id}
                              title='Cancel Reservation'
                              className='px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium cursor-pointer transition-colors'
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(b._id, 'no_show')}
                              disabled={updatingId === b._id}
                              title='Mark No Show'
                              className='px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-medium cursor-pointer transition-colors'
                            >
                              No-Show
                            </button>
                          </div>
                        ) : (
                          <span className='text-xs text-gray-400 italic'>No actions</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Bookings;
