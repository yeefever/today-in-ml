'use client'

import ApiButton from './components/api_button';
import { useState, useEffect, useRef, useCallback } from 'react'

export default function Home() {
  const [query, setQuery] = useState('');
  const [date, setDate] = useState(7);
  return (<main className="flex min-h-screen flex-col items-center justify-center p-12">
    <h1 className="text-5xl font-bold mb-2 text-center">Recently in Research</h1>
    <h2 className="text-2xl mb-4 text-center">I'm curious about ...</h2>
  return (<main className="flex min-h-screen flex-col items-center justify-center p-12">
    <h1 className="text-5xl font-bold mb-2 text-center">Recently in Machine Learning</h1>
    <h2 className="text-2xl mb-4 text-center">I'm curious about ...</h2>

    <div className="flex space-x-4">
      <input
        className="w-full max-w-xs p-2 border border-gray-300 rounded mb-4"
        type="text"
        placeholder="Enter text here"
        onInput={e => {
          setQuery(e.target.value);
        }}
      />
      <select
        className="p-2 border border-gray-300 rounded mb-4"
        onChange={e => {
          const selectedOption = e.target.value;
          switch(selectedOption) {
            case 'last_week': setDate(7); break;
            case 'last_month': setDate(30); break;
            case 'last_3_month': setDate(90); break;
            case 'last_year': setDate(365); break;
          }
        }}
      >
        <option value="last_week">Last Week</option>
        <option value="last_month">Last Month</option>
        <option value="last_3_months">Last 3 Months</option>
        <option value="last_year">Last Year</option>
      </select>
    </div>


    <ApiButton searchQuery={query} dateDiff={date}/>
  </main>)
    <div className="flex space-x-4">
      <input
        className="w-full max-w-xs p-2 border border-gray-300 rounded mb-4"
        type="text"
        placeholder="Enter text here"
        onInput={e => {
          setQuery(e.target.value);
        }}
      />
      <select
        className="p-2 border border-gray-300 rounded mb-4"
        onChange={e => {
          const selectedOption = e.target.value;
          switch(selectedOption) {
            case 'last_week': setDate(7); break;
            case 'last_month': setDate(30); break;
            case 'last_3_month': setDate(90); break;
            case 'last_year': setDate(365); break;
          }
        }}
      >
        <option value="last_week">Last Week</option>
        <option value="last_month">Last Month</option>
        <option value="last_3_months">Last 3 Months</option>
        <option value="last_year">Last Year</option>
      </select>
    </div>


    <ApiButton searchQuery={query} dateDiff={date}/>
  </main>)
}