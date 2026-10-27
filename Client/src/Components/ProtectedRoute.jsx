import { Navigate } from 'react-router-dom';

function ProtectedRoute({ user, loading, children }) {
  if (loading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-[#F8F3EB] gap-3'>
        <div className='w-10 h-10 border-3 border-[#A34720] border-t-transparent rounded-full animate-spin' />
        <span className='font-serif text-sm font-bold text-[#382017] tracking-wider uppercase'>Arin AI</span>
      </div>
    );
  }

  if (!user) return <Navigate to='/login' replace />;

  return children;
}

export default ProtectedRoute;
