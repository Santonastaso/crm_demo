import React from 'react';
import { ExactHeader } from '@santonastaso/shared';
import { useConfigurationContext } from '../root/ConfigurationContext';
import { useAuthProvider, useGetIdentity, useLogout } from 'ra-core';

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
    <ExactHeader
      title={title}
      darkModeLogo={darkModeLogo}
      lightModeLogo={lightModeLogo}
      navigationItems={navigationItems}
      user={{
        name: identity?.fullName || identity?.email?.split('@')[0] || 'User',
        email: identity?.email,
        avatar: identity?.avatar
      }}
      onLogout={() => logout()}
      onRefresh={() => window.location.reload()}
    />
  );
};

export default Header;
