import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpenIcon, UserIcon, Bars3Icon, XMarkIcon, PlusIcon, ArrowRightOnRectangleIcon, UsersIcon, ShareIcon, ChartBarIcon, UserGroupIcon, MagnifyingGlassIcon, HomeIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
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
      label: 'Create Note', 
      icon: PlusIcon,
      iconClassName: 'spice-gradient text-white rounded-lg px-4 py-2 shadow-sm transition-all duration-200 ease-in-out flex items-center hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
    },
    { 
      path: '/app/tasting-notes', 
      label: 'Notes', 
      icon: BookOpenIcon,
      dropdownItems: [
        { path: '/app/tasting-notes', label: 'My notes', icon: BookOpenIcon },
        { path: '/app/restaurants', label: 'My restaurants', icon: BuildingStorefrontIcon },
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
        { path: '/app', label: 'Dashboard', icon: HomeIcon },
        { path: '/app/users/me', label: 'View Profile', icon: UserIcon },
        { path: '/app/profile/edit', label: 'Edit Profile', icon: UserIcon },
        { path: '#', label: 'Logout', icon: ArrowRightOnRectangleIcon, onClick: handleSignOut },
      ]
    },
  ];

  return (
    <nav className="bg-[#E76F51]" role="navigation" aria-label="Main navigation">
      <div>
        <div className="flex items-center justify-between h-16">
          <Link to="/app" className="text-xl font-serif font-bold text-white hover:text-white/90 transition-colors ml-4">
            Taste
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-white/80 
                     hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 
                     focus:ring-white/20 mr-4"
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
          <div className="hidden md:flex md:items-center md:space-x-4 mr-4">
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
                        className={`inline-flex items-center px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors ${
                          isActive(item.path) ? 'bg-white/20' : ''
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-2" aria-hidden="true" />
                        {item.label}
                      </button>
                      
                      {/* Dropdown menu */}
                      {openDropdowns.includes(item.path) && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                          {item.dropdownItems.map((dropdownItem) => {
                            const DropdownIcon = dropdownItem.icon;
                            return (
                              <Link
                                key={dropdownItem.path}
                                to={dropdownItem.path}
                                onClick={dropdownItem.onClick}
                                className={`block px-4 py-2 text-[#E76F51] hover:bg-[#E76F51]/5 ${
                                  isActive(dropdownItem.path) ? 'bg-[#E76F51]/10' : ''
                                }`}
                              >
                                <DropdownIcon className="h-5 w-5 mr-2 inline-block" aria-hidden="true" />
                                {dropdownItem.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    item.iconClassName?.includes('spice-gradient') ? (
                      <Link
                        to={item.path}
                        className="inline-flex items-center px-4 py-2 bg-white text-[#E76F51] rounded-lg hover:bg-white/90 transition-colors shadow-sm"
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        {item.label && <span className="ml-2 font-medium">{item.label}</span>}
                      </Link>
                    ) : (
                      <Link
                        to={item.path}
                        className={`inline-flex items-center px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors ${
                          isActive(item.path) ? 'bg-white/20' : ''
                        }`}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        {item.label && <span className="ml-2">{item.label}</span>}
                        {item.badge && (
                          <span className="ml-2 bg-white text-[#E76F51] text-xs px-2 py-0.5 rounded-full font-medium">
                            {item.badge}
                          </span>
                        )}
                        {item.srLabel && <span className="sr-only">{item.srLabel}</span>}
                      </Link>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#E76F51] border-t border-white/10" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.path}>
                  {item.dropdownItems ? (
                    <>
                      <button
                        onClick={() => toggleDropdown(item.path)}
                        className={`w-full text-left flex items-center px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors ${
                          isActive(item.path) ? 'bg-white/20' : ''
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-2" aria-hidden="true" />
                        {item.label}
                      </button>
                      
                      {openDropdowns.includes(item.path) && (
                        <div className="pl-4 space-y-1 mt-1">
                          {item.dropdownItems.map((dropdownItem) => {
                            const DropdownIcon = dropdownItem.icon;
                            return (
                              <Link
                                key={dropdownItem.path}
                                to={dropdownItem.path}
                                onClick={dropdownItem.onClick}
                                className={`flex items-center px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors ${
                                  isActive(dropdownItem.path) ? 'bg-white/20' : ''
                                }`}
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
                    item.iconClassName?.includes('spice-gradient') ? (
                      <Link
                        to={item.path}
                        className="flex items-center px-4 py-2 bg-white text-[#E76F51] rounded-lg hover:bg-white/90 transition-colors shadow-sm"
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        {item.label && <span className="ml-2 font-medium">{item.label}</span>}
                      </Link>
                    ) : (
                      <Link
                        to={item.path}
                        className={`flex items-center px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors ${
                          isActive(item.path) ? 'bg-white/20' : ''
                        }`}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        {item.label && <span className="ml-2">{item.label}</span>}
                        {item.badge && (
                          <span className="ml-2 bg-white text-[#E76F51] text-xs px-2 py-0.5 rounded-full font-medium">
                            {item.badge}
                          </span>
                        )}
                        {item.srLabel && <span className="sr-only">{item.srLabel}</span>}
                      </Link>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation; 