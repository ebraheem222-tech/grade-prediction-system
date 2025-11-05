import React from 'react';
import { AlertCircle, Check } from 'lucide-react';

export default function Notification({ notification }) {
  if (!notification) return null;
  return (
    <div
      className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
        notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
      }`}
    >
      {notification.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
      {notification.message}
    </div>
  );
}
