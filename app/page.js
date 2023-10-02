'use client'

import ApiButton from './components/api_button';
import { useState, useEffect, useRef, useCallback } from 'react'

export default function Home() {
  const [query, setQuery] = useState('');

  return ( <main className="flex min-h-screen flex-col items-center justify-center p-12">
  <h1 className="text-5xl font-bold mb-2 text-center">Recently in Machine Learning</h1>
  <h2 className="text-2xl mb-4 text-center">I'm curious about ...</h2>

  <input
    className="w-full max-w-xs p-2 border border-gray-300 rounded mb-4"
    type="text"
    placeholder="Enter text here"
    onInput={e => {
        setQuery(e.target.value);
    }}
  />

<ApiButton searchQuery={query}/>
</main>)
}