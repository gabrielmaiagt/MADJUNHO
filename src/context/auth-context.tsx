
'use client';
import React from 'react';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const useAuth = () => ({ user: null, loading: false });
