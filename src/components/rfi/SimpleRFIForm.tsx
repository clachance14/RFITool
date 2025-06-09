"use client";

import React, { useState } from 'react';

export function SimpleRFIForm() {
  console.log('🔄 SimpleRFIForm rendering...');
  
  const [subject, setSubject] = useState('');
  console.log('📝 Current subject state:', subject);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎯 handleChange triggered with value:', e.target.value);
    setSubject(e.target.value);
    console.log('✅ setSubject called with:', e.target.value);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Form submitted with subject:', subject);
    localStorage.setItem('simple_rfi', JSON.stringify({ subject }));
  };

  return (
    <div>
      <h2>Debug Form</h2>
      <form onSubmit={handleSubmit} className="p-4 border rounded-lg shadow-sm">
        <div className="space-y-2">
          <label htmlFor="simple-subject" className="block text-sm font-medium text-gray-700">
            Subject:
          </label>
          <input
            id="simple-subject"
            data-testid="simple-subject-input"
            type="text"
            value={subject}
            onChange={handleChange}
            placeholder="Enter subject..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyUp={(e) => console.log('⌨️ keyUp:', e.currentTarget.value)}
            onInput={(e) => console.log('📄 input event:', e.currentTarget.value)}
          />
        </div>
        <button 
          type="submit" 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Submit Simple Form
        </button>
        <div className="mt-4 p-2 bg-gray-50 rounded-md">
          Current value: <span className="font-medium">{subject}</span>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Debug: {JSON.stringify({ subject })}
        </div>
      </form>
    </div>
  );
} 