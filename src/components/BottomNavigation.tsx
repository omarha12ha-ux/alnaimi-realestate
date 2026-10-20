import React, { useState } from 'react';
import { Home, LayoutDashboard, Calendar, Users, Phone, Building2, Palette, Briefcase, Moon, Sun, Bell } from 'lucide-react';
import { cn } from '../lib/utils';

interface BottomNavigationProps {
  currentView: string;
  setView: (view: string) => void;
  isAdmin?: boolean;
  onOpenNotifications?: () => void;
  unreadCount?: number;
}

export function BottomNavigation({ currentView, setView, isAdmin, onOpenNotifications, unreadCount = 0 }: BottomNavigationProps) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || localStorage.getItem('app-dark-mode') === 'true';
    }
    return false;
  });

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('app-dark-mode', String(next));
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const navItems = [
    { name: 'home', label: 'الرئيسية', icon: Home },
    { name: 'properties', label: 'العقارات', icon: Building2 },
    { name: 'corporate-deals', label: 'الشركات', icon: Briefcase },
    { name: 'decor-showcase', label: 'الديكور', icon: Palette },
    { name: 'vip-properties', label: 'VIP', icon: Users },
    { name: 'user-schedule', label: 'المواعيد', icon: Calendar },
    { name: 'contact-us', label: 'اتصل بنا', icon: Phone },
    ...(isAdmin ? [{ name: 'dashboard', label: 'التحكم 🛡️', icon: LayoutDashboard }] : [])
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0A192F] border-t border-brand-navy/10 dark:border-white/10 pb-safe z-50 flex justify-around items-center h-16 shadow-lg transition-colors px-1" dir="rtl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.name;
        return (
          <button
            key={item.name}
            onClick={() => setView(item.name)}
            className={cn(
              "flex flex-col items-center gap-0.5 p-1.5 transition-all cursor-pointer",
              isActive ? "text-brand-gold" : "text-brand-navy/60 dark:text-zinc-400 hover:text-brand-navy dark:hover:text-white"
            )}
          >
            <Icon size={18} />
            <span className="text-[9px] font-bold truncate max-w-[50px]">{item.label}</span>
          </button>
        );
      })}

      {/* Notifications Drawer Button for Mobile */}
      {onOpenNotifications && (
        <button
          type="button"
          onClick={onOpenNotifications}
          className="flex flex-col items-center gap-0.5 p-1.5 text-brand-navy/70 dark:text-zinc-300 hover:text-brand-gold transition-all cursor-pointer relative"
          title="التنبيهات والإشعارات 🔔"
        >
          <div className="relative">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold">التنبيهات</span>
        </button>
      )}

      {/* Dark Mode Toggle Button */}
      <button
        type="button"
        onClick={toggleDarkMode}
        className="flex flex-col items-center gap-0.5 p-1.5 text-brand-gold hover:opacity-85 transition-all cursor-pointer"
        title={darkMode ? "التحويل للوضع النهاري ☀️" : "التحويل للوضع الليلي 🌙"}
      >
        {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-brand-navy" />}
        <span className="text-[9px] font-bold">{darkMode ? "نهاري" : "ليلي"}</span>
      </button>
    </div>
  );
}
