'use client';

import React from 'react';
import AppContainer from './AppContainer';

interface ClientAppContainerProps {
  children: React.ReactNode;
}

export default function ClientAppContainer({ children }: ClientAppContainerProps) {
  return <AppContainer>{children}</AppContainer>;
}
