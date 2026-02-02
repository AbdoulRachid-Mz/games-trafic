"use client"

import { useState, useEffect } from 'react';
import { User, getIdToken } from 'firebase/auth';
import { auth } from '@/configs/firebase/config';

export function useFirebaseToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
      if (user) {
        try {
          const idToken = await getIdToken(user);
          setToken(idToken);
        } catch (error) {
          console.error('Error getting ID token:', error);
          setToken(null);
        }
      } else {
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshToken = async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      // Forcer le rafraîchissement du token
      await user.getIdToken(true);
      const newToken = await getIdToken(user);
      setToken(newToken);
      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  };

  return { token, loading, refreshToken };
}