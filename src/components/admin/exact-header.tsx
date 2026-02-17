import React, { Children, useCallback, useState } from 'react';
import { Link, useMatch } from 'react-router';
import { LogOut, Settings, User, LoaderCircle, RotateCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ThemeSwitch } from '@santonastaso/shared';

// UserMenu Context
export type UserMenuContextValue = {
  onClose: () => void;
};

export const UserMenuContext = React.createContext<UserMenuContextValue | undefined>(undefined);

export const useUserMenu = () => React.useContext(UserMenuContext);

// RefreshButton Component
export const RefreshButton = ({ onRefresh, loading = false }: { onRefresh?: () => void; loading?: boolean }) => {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <Button
      onClick={handleRefresh}
      variant="ghost"
      size="icon"
      className="hidden sm:inline-flex"
    >
      {loading ? <LoaderCircle className="animate-spin" /> : <RotateCw />}
    </Button>
  );
};

// UserMenu Component
export type UserMenuProps = {
  children?: React.ReactNode;
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  onLogout?: () => void;
};

export function UserMenu({ children, user, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);

  const handleToggleOpen = useCallback(() => {
    setOpen((prevOpen) => !prevOpen);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setOpen(false);
  };

  return (
    <UserMenuContext.Provider value={{ onClose: handleClose }}>
      <DropdownMenu open={open} onOpenChange={handleToggleOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 w-8 ml-2 rounded-full"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} role="presentation" />
              <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user?.name || 'User'}
              </p>
              {user?.email && (
                <p className="text-xs text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {children}
          {Children.count(children) > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </UserMenuContext.Provider>
  );
}

// NavigationTab Component (vertical)
const NavigationTab = ({ label, to }: { label: string; to: string }) => {
  const match = useMatch({ path: to, end: to === '/' });
  const isActive = !!match;
  return (
    <Link
      to={to}
      className={`block px-4 py-2 text-sm font-medium transition-colors rounded-md ${
        isActive
          ? "bg-secondary-foreground/10 text-secondary-foreground"
          : "text-secondary-foreground/70 hover:text-secondary-foreground/80 hover:bg-secondary-foreground/5"
      }`}
    >
      {label}
    </Link>
  );
};

// UsersMenu Component
const UsersMenu = () => {
  const { onClose } = useUserMenu() ?? {};
  return (
    <DropdownMenuItem asChild onClick={onClose}>
      <Link to="/sales" className="flex items-center gap-2">
        <User /> Users
      </Link>
    </DropdownMenuItem>
  );
};

// ConfigurationMenu Component
const ConfigurationMenu = () => {
  const { onClose } = useUserMenu() ?? {};
  return (
    <DropdownMenuItem asChild onClick={onClose}>
      <Link to="/settings" className="flex items-center gap-2">
        <Settings />
        My info
      </Link>
    </DropdownMenuItem>
  );
};

// Main Header Component
export interface ExactHeaderProps {
  title: string;
  darkModeLogo?: string;
  lightModeLogo?: string;
  navigationItems?: Array<{ label: string; to: string }>;
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  onLogout?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export const ExactHeader: React.FC<ExactHeaderProps> = ({
  title,
  darkModeLogo,
  lightModeLogo,
  navigationItems = [],
  user,
  onLogout,
  onRefresh,
  loading = false,
}) => {
  return (
    <aside className="w-52 shrink-0 bg-secondary flex flex-col h-screen">
      <Link
        to="/"
        className="flex items-center gap-2 p-4 text-secondary-foreground no-underline border-b border-secondary-foreground/10"
      >
        {darkModeLogo && (
          <img className="[.light_&]:hidden h-6" src={darkModeLogo} alt={title} />
        )}
        {lightModeLogo && (
          <img className="[.dark_&]:hidden h-6" src={lightModeLogo} alt={title} />
        )}
        <h1 className="text-lg font-semibold truncate">{title}</h1>
      </Link>
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navigationItems.map((item) => (
          <NavigationTab key={item.to} label={item.label} to={item.to} />
        ))}
      </nav>
      <div className="p-2 border-t border-secondary-foreground/10 flex items-center gap-1">
        <ThemeSwitch />
        <RefreshButton onRefresh={onRefresh} loading={loading} />
        <UserMenu user={user} onLogout={onLogout}>
          <ConfigurationMenu />
          <UsersMenu />
        </UserMenu>
      </div>
    </aside>
  );
};

export default ExactHeader;