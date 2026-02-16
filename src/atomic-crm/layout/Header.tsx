import React from 'react';
import { ExactHeader } from '../../components/admin/exact-header';
import { useConfigurationContext } from '../root/ConfigurationContext';
import { useAuthProvider, useGetIdentity, useLogout } from 'ra-core';

const Header = () => {
  const { darkModeLogo, lightModeLogo, title } = useConfigurationContext();
  const authProvider = useAuthProvider();
  const { data: identity } = useGetIdentity();
  const logout = useLogout();

  const navigationItems = [
    { label: 'Dashboard', to: '/', isActive: true },
    { label: 'Contacts', to: '/contacts' },
    { label: 'Companies', to: '/companies' },
    { label: 'Deals', to: '/deals' },
    { label: 'Projects', to: '/projects' },
    { label: 'Units', to: '/property_units' },
    { label: 'Segments', to: '/segments' },
    { label: 'Templates', to: '/templates' },
    { label: 'Campaigns', to: '/campaigns' },
    { label: 'Discovery', to: '/discovery_scans' },
    { label: 'Conversations', to: '/conversations' },
    { label: 'Knowledge', to: '/knowledge_documents' },
    { label: 'Bookings', to: '/bookings' },
    { label: 'Email', to: '/settings/email' },
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
