import React from 'react';
import { Outlet } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

import { TopNav, BottomNav } from './ui/Navigation';

function AppLayout() {
  const { profile } = useAuth();

  return (
    <>
      <TopNav />
      <div className='app-content' style={{ paddingBottom: profile ? 84 : 0 }}>
        <Outlet />
      </div>
      {profile && <BottomNav />}
    </>
  );
}

export default AppLayout;
