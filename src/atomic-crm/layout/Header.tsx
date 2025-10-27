import React from 'react';
import { Settings, User } from 'lucide-react';
import { AppHeader } from '@santonastaso/shared';
import { useConfigurationContext } from '../root/ConfigurationContext';
import { useAuthProvider, useGetIdentity, useLogout } from 'ra-core';
import { Link } from 'react-router';

const Header = () => {
  const { darkModeLogo, lightModeLogo, title } = useConfigurationContext();
  const authProvider = useAuthProvider();
  const { data: identity } = useGetIdentity();
  const logout = useLogout();

  // Navigation items for CRM
  const navigationItems = [
    { label: 'Dashboard', to: '/', isActive: true },
    { label: 'Contacts', to: '/contacts' },
    { label: 'Companies', to: '/companies' },
    { label: 'Deals', to: '/deals' },
    { label: 'Activity', to: '/activity' },
    { label: 'Workflows', to: '/workflows' },
    { label: 'Reminders', to: '/reminders' },
  ];

  return (
    <AppHeader
      title={title}
      logo={{
        light: lightModeLogo,
        dark: darkModeLogo
      }}
      navigationItems={navigationItems}
      user={{
        name: identity?.fullName || identity?.email?.split('@')[0] || 'User',
        email: identity?.email,
        avatar: identity?.avatar
      }}
      onLogout={() => logout()}
      onRefresh={() => window.location.reload()}
      onSettings={() => window.location.href = '/settings'}
      onUsers={() => window.location.href = '/sales'}
      customMenuItems={
        <>
          <Link to="/settings" className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm">
            <Settings className="h-4 w-4" />
            My info
          </Link>
          <Link to="/sales" className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm">
            <User className="h-4 w-4" />
            Users
          </Link>
        </>
      }
    />
  );
};

export default Header;
