// src/components/ModeSelector.tsx
'use client';

import React from 'react';
import { TransactionMode } from '@/types/subscription';

interface ModeSelectorProps {
  mode: TransactionMode;
  onChange: (mode: TransactionMode) => void;
}

export default function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
      <button
        type="button"
        onClick={() => onChange('expense')}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
          mode === 'expense'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <span className="text-lg">💰</span>
        普通支出
      </button>
      <button
        type="button"
        onClick={() => onChange('subscription')}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
          mode === 'subscription'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <span className="text-lg">🔄</span>
        订阅支出
      </button>
    </div>
  );
}
