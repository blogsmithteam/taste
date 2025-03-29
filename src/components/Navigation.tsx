import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpenIcon, UserIcon, Bars3Icon, XMarkIcon, PlusIcon, ArrowRightOnRectangleIcon, UsersIcon, ShareIcon, ChartBarIcon, UserGroupIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { BellIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import type { ForwardRefExoticComponent, SVGProps, RefAttributes } from 'react';

type HeroIcon = ForwardRefExoticComponent<Omit<SVGProps<SVGSVGElement>, "ref"> & { title?: string | undefined; titleId?: string | undefined; } & RefAttributes<SVGSVGElement>>;

interface DropdownItem {
  path: string;
  label: string;
  icon: HeroIcon;
  onClick?: () => void;
}

interface NavItem {
  path: string;
  label?: string;
  icon: HeroIcon;
  dropdownItems?: DropdownItem[];
  iconClassName?: string;
  badge?: number;
  srLabel?: string;
}

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const toggleDropdown = (path: string) => {
    setOpenDropdowns(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const handleMouseEnter = (path: string) => {
    if (window.innerWidth >= 768) { // Only for desktop
      setOpenDropdowns(prev => [...prev, path]);
    }
  };

  const handleMouseLeave = (path: string) => {
    if (window.innerWidth >= 768) { // Only for desktop
      setTimeout(() => {
        setOpenDropdowns(prev => prev.filter(p => p !== path));
      }, 350); // 250ms delay
    }
  };

  const navItems: NavItem[] = [
    { 
      path: '/app/create-note', 
      label: 'Note', 
      icon: PlusIcon,
      iconClassName: 'bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 shadow-sm transition-colors duration-150 ease-in-out flex items-center'
    },
    { 
      path: '/app/tasting-notes', 
      label: 'Notes', 
      icon: BookOpenIcon,
      dropdownItems: [
        { path: '/app/tasting-notes', label: 'My notes', icon: BookOpenIcon },
        { path: '/app/shared-with-me', label: 'Shared notes', icon: ShareIcon },
      ]
    },
    { 
      path: '/app/friends', 
      label: 'Friends', 
      icon: UsersIcon,
      dropdownItems: [
        { path: '/app/friends', label: 'All Friends', icon: UsersIcon },
        { path: '/app/activity', label: 'Activity', icon: ChartBarIcon },
        { path: '/app/family', label: 'Family', icon: UserGroupIcon },
        { path: '/app/discover', label: 'Find users', icon: MagnifyingGlassIcon },
      ]
    },
    { 
      path: '/app/notifications', 
      icon: BellIcon,
      iconClassName: unreadCount > 0 ? 'text-red-600' : 'text-gray-500',
      badge: unreadCount,
      srLabel: 'Notifications'
    },
    { 
      path: '/app/profile/edit', 
      icon: UserIcon,
      dropdownItems: [
        { path: '/app/users/me', label: 'View Profile', icon: UserIcon },
        { path: '/app/profile/edit', label: 'Edit Profile', icon: UserIcon },
        { path: '#', label: 'Logout', icon: ArrowRightOnRectangleIcon, onClick: handleSignOut },
      ]
    },
  ];

  return (
    <nav className="bg-white shadow-sm" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link to="/app" className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
            Taste
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            aria-controls="mobile-menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {isMobileMenuOpen ? (
              <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
            )}
          </button>

          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.path} 
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(item.path)}
                  onMouseLeave={() => handleMouseLeave(item.path)}
                >
                  {item.dropdownItems ? (
                    <>
                      <button
                        onClick={() => toggleDropdown(item.path)}
                        className={`inline-flex items-center px-1 pt-1 text-sm font-medium relative ${
                          isActive(item.path)
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-1" aria-hidden="true" />
                        {item.label}
                      </button>
                      {openDropdowns.includes(item.path) && (
                        <div
                          onMouseEnter={() => handleMouseEnter(item.path)}
                          onMouseLeave={() => handleMouseLeave(item.path)}
                          className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                        >
                          <div className="py-1">
                            {item.dropdownItems.map((dropdownItem) => {
                              const DropdownIcon = dropdownItem.icon;
                              return dropdownItem.onClick ? (
                                <button
                                  key={dropdownItem.path}
                                  onClick={() => {
                                    setOpenDropdowns([]);
                                    dropdownItem.onClick?.();
                                  }}
                                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <DropdownIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                  {dropdownItem.label}
                                </button>
                              ) : (
                                <Link
                                  key={dropdownItem.path}
                                  to={dropdownItem.path}
                                  className={`flex items-center px-4 py-2 text-sm ${
                                    isActive(dropdownItem.path)
                                      ? 'bg-gray-100 text-gray-900'
                                      : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                                  onClick={() => setOpenDropdowns([])}
                                >
                                  <DropdownIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                  {dropdownItem.label}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.path}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium relative ${
                        isActive(item.path)
                          ? `${item.iconClassName || ''} border-b-2 border-blue-600`
                          : `${item.iconClassName || ''} hover:text-gray-700 hover:border-gray-300`
                      }`}
                    >
                      <Icon 
                        className={`h-5 w-5 ${item.label ? 'mr-1' : ''}`} 
                        aria-hidden="true" 
                      />
                      {item.label}
                      {item.srLabel && (
                        <span className="sr-only">{item.srLabel}</span>
                      )}
                      {item.badge && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 block h-4 w-4 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden" id="mobile-menu">
            <div className="pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.path}>
                    {item.dropdownItems ? (
                      <>
                        <button
                          onClick={() => toggleDropdown(item.path)}
                          className={`flex w-full items-center px-3 py-2 text-base font-medium relative ${
                            isActive(item.path)
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                        >
                          <Icon className="h-5 w-5 mr-3" aria-hidden="true" />
                          {item.label}
                        </button>
                        {openDropdowns.includes(item.path) && (
                          <div className="pl-8">
                            {item.dropdownItems.map((dropdownItem) => {
                              const DropdownIcon = dropdownItem.icon;
                              return dropdownItem.onClick ? (
                                <button
                                  key={dropdownItem.path}
                                  onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    dropdownItem.onClick?.();
                                  }}
                                  className="flex w-full items-center px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                >
                                  <DropdownIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                  {dropdownItem.label}
                                </button>
                              ) : (
                                <Link
                                  key={dropdownItem.path}
                                  to={dropdownItem.path}
                                  className={`flex items-center px-3 py-2 text-sm font-medium ${
                                    isActive(dropdownItem.path)
                                      ? 'bg-blue-50 text-blue-600'
                                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                  }`}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  <DropdownIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                  {dropdownItem.label}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        to={item.path}
                        className={`flex items-center px-3 py-2 text-base font-medium relative ${
                          isActive(item.path)
                            ? `${item.iconClassName || ''} bg-blue-50`
                            : `${item.iconClassName || ''} hover:bg-gray-50 hover:text-gray-700`
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon 
                          className={`h-5 w-5 ${item.label ? 'mr-3' : ''}`} 
                          aria-hidden="true" 
                        />
                        {item.label}
                        {item.srLabel && (
                          <span className="sr-only">{item.srLabel}</span>
                        )}
                        {item.badge && item.badge > 0 && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 block h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation; 