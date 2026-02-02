"use client"

import { useState, useEffect } from 'react';

export function useLocalStorage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getItem = (key: string) => {
    if (!isClient) return null;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting item ${key} from localStorage:`, error);
      return null;
    }
  };

  const setItem = (key: string, value: any) => {
    if (!isClient) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting item ${key} to localStorage:`, error);
    }
  };

  const removeItem = (key: string) => {
    if (!isClient) return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage:`, error);
    }
  };

  return { getItem, setItem, removeItem, isClient };
}