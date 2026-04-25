'use client';
import { useState } from 'react';

interface Props {
  recipientName: string;
  onSend: (message: string) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function InterestModal({ recipientName, onSend, onClose, loading }: Props) {
  const [message, setMessage] = useState('');

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm" style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>
        <div className="mb-4">
          <h3 className="font-bold text-[#2A1A1A] text-lg mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>
            💌 Send Interest
          </h3>
          <p className="text-sm text-[#7A6A5A]">
            Write a message to <span className="font-semibold text-[#2A1A1A]">{recipientName}</span> (optional)
          </p>
        </div>

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          maxLength={500}
          placeholder={`Hi ${recipientName}, I came across your profile and would love to get to know you better…`}
          rows={4}
          className="w-full rounded-xl border border-[#D0C0B0] px-3 py-2.5 text-sm focus:outline-none focus:border-[#F4A435] focus:ring-2 resize-none"
          style={{ fontFamily: "'Outfit',sans-serif", lineHeight: 1.6 }}
          autoFocus
        />
        <div className="text-right text-[11px] text-[#9A8A7A] mt-1 mb-4">{message.length}/500</div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-full text-sm font-semibold cursor-pointer border border-[#D0C0B0] bg-white text-[#5A4A3A] transition-opacity disabled:opacity-60"
            style={{ fontFamily: "'Outfit',sans-serif" }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSend(message.trim())}
            disabled={loading}
            className="flex-[1.4] py-2.5 rounded-full text-sm font-bold text-white border-none cursor-pointer transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#F4A435,#E8735A)', fontFamily: "'Outfit',sans-serif" }}
          >
            {loading ? 'Sending…' : '💌 Send Interest'}
          </button>
        </div>
      </div>
    </div>
  );
}
