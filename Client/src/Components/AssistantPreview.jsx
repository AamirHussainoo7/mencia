import { useState } from 'react';
import { FiVolume2, FiArrowRight, FiMic } from 'react-icons/fi';
import kitchenHomeImg from '../assets/kitchen_home.jpg';

function AssistantPreview({ onActionClick }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '👋 Hi! Welcome to Kitchen Home. How can I help you today?' },
  ]);
  const [inputValue, setInputValue] = useState('');

  const quickActions = [
    { label: 'Book a Table', message: "I'd like to book a table for tonight" },
    { label: 'View Menu', message: 'What are your signature dishes and popular specials?' },
    { label: 'Our Location', message: 'Where are you located and is parking available?' },
    { label: 'Opening Hours', message: 'What are your lunch and dinner opening hours?' },
  ];

  const handleAction = (action) => {
    if (onActionClick) {
      onActionClick(action.message);
      return;
    }
    // Interactive local simulation
    const userMsg = { role: 'user', text: action.label };
    let replyText = '';
    if (action.label === 'Book a Table') {
      replyText = 'We have slots open today from 20:00 – 21:00. Would you like to reserve a table for 2 guests?';
    } else if (action.label === 'View Menu') {
      replyText = 'Our house specialties include Woodfired Truffle Pizza, Hand-rolled Gnocchi, and Slow-braised Ossobuco.';
    } else if (action.label === 'Our Location') {
      replyText = 'We are located at Housing Board, Bhilai. Dedicated valet parking is available right at our front entrance.';
    } else {
      replyText = 'We are open Monday to Saturday from 10:00 AM to 10:00 PM (Dinner service starts at 7:00 PM).';
    }

    setMessages((prev) => [
      ...prev,
      userMsg,
      { role: 'assistant', text: replyText },
    ]);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue('');
    setMessages((prev) => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: `Thanks for asking! Our dining team is happy to assist with "${text}". Let me check that for you.` },
    ]);
  };

  return (
    <div className='relative w-full max-w-[340px] sm:max-w-[370px] pt-3.5 transition-all'>
      {/* Prominent Floating Voice AI Badge (Zero Clipping, 100% Visible & Above Card) */}
      <div className='absolute top-0 right-6 z-30 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#382017] text-[#F5E2D1] text-[11px] font-bold shadow-lg border border-[#A34720]/40'>
        <FiMic className='text-[#A34720] text-xs animate-pulse' />
        <span className='tracking-tight'>Voice Active</span>
        <span className='flex gap-0.5 items-end h-3 ml-0.5'>
          <span className='w-0.5 h-2 bg-[#F5E2D1] rounded-full animate-pulse'></span>
          <span className='w-0.5 h-3 bg-[#A34720] rounded-full animate-pulse'></span>
          <span className='w-0.5 h-1.5 bg-[#F5E2D1] rounded-full animate-pulse'></span>
        </span>
      </div>

      {/* Main Card */}
      <div className='bg-[#FFFCF7] rounded-[32px] border border-[#E6DDD1] shadow-[0_20px_60px_rgba(56,32,23,0.14)] overflow-hidden'>
        {/* Widget Header */}
        <div className='p-5 pb-4 border-b border-[#EFE9DF] flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <img
              src={kitchenHomeImg}
              alt='Kitchen Home'
              className='w-11 h-11 rounded-2xl object-cover border border-[#E6DDD1]'
            />
            <div>
              <h4 className='font-bold text-sm text-[#201A17] leading-tight'>Kitchen Home</h4>
              <p className='text-xs text-[#6B5E57] font-medium'>AI Business Assistant</p>
            </div>
          </div>

          <div className='flex items-center gap-1.5 text-xs font-semibold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1 rounded-full'>
            <span className='w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse'></span>
            <span>Online</span>
          </div>
        </div>

        {/* Conversation Area */}
        <div className='p-5 space-y-3.5 max-h-[320px] overflow-y-auto'>
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`text-xs leading-relaxed px-4 py-3 rounded-2xl max-w-[88%] ${
                  m.role === 'user'
                    ? 'bg-[#A34720] text-white rounded-tr-xs'
                    : 'bg-[#FBF7F0] text-[#201A17] border border-[#EFE9DF] rounded-tl-xs'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {/* Quick Action Buttons (Peach Pills matching moodboard) */}
          {messages.length <= 3 && (
            <div className='space-y-2 pt-2'>
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleAction(action)}
                  className='w-full py-2.5 px-4 rounded-2xl bg-[#F5E2D1] hover:bg-[#EBD2BD] text-[#382017] text-xs font-bold text-center transition-all cursor-pointer shadow-2xs hover:scale-[1.01]'
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className='p-3.5 bg-[#FBF7F0] border-t border-[#EFE9DF]'>
          <div className='flex items-center gap-2 bg-white rounded-full border border-[#E6DDD1] pl-3.5 pr-1.5 py-1.5 shadow-inner'>
            <input
              type='text'
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder='Type or ask by voice...'
              className='flex-1 bg-transparent text-xs text-[#201A17] outline-none focus:outline-none focus:ring-0 focus-visible:outline-none border-none placeholder-[#968880]'
            />
            {/* Voice Mic Button */}
            <button
              type='button'
              onClick={() => handleAction({ label: 'Voice Question', message: 'What are your popular services and availability?' })}
              title='Speak to assistant'
              className='w-8 h-8 rounded-full bg-[#F5E2D1] hover:bg-[#EBD2BD] text-[#A34720] flex items-center justify-center transition-all cursor-pointer flex-shrink-0'
            >
              <FiMic size={14} />
            </button>
            {/* Send Arrow Button */}
            <button
              onClick={handleSend}
              className='w-8 h-8 rounded-full bg-[#382017] hover:bg-[#A34720] text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0'
            >
              <FiArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssistantPreview;
