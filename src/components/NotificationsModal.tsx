import React, { useState, useMemo } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Search,
  Volume2,
  VolumeX,
  Smartphone,
  ExternalLink,
  Sparkles,
  Building2,
  Calendar,
  AlertCircle,
  Clock,
  ShieldAlert,
  TrendingDown,
  CheckCircle2,
  Inbox,
  Send,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InAppNotification } from '../types';
import { cn } from '../lib/utils';

interface NotificationsModalProps {
  notifications: InAppNotification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAllRead: () => void;
  onOpenPropertyDetails?: (propertyId: string) => void;
  onOpenAppointment?: (appointmentId: string) => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  notifPermission: string;
  onRequestPermission: () => void;
  onSendTestNotification?: () => void;
}

export default function NotificationsModal({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAllRead,
  onOpenPropertyDetails,
  onOpenAppointment,
  isSoundEnabled,
  onToggleSound,
  notifPermission,
  onRequestPermission,
  onSendTestNotification
}: NotificationsModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'property' | 'appointment' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Unread count calculation
  const unreadCount = useMemo(() => {
    return notifications.filter(n => n.status === 'unread').length;
  }, [notifications]);

  // Read count
  const readCount = useMemo(() => {
    return notifications.filter(n => n.status === 'read').length;
  }, [notifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((noti) => {
      // Tab filter
      if (activeTab === 'unread' && noti.status !== 'unread') return false;
      if (activeTab === 'property' && !['property_alert', 'price_drop', 'favorite_update'].includes(noti.type)) return false;
      if (activeTab === 'appointment' && !['appointment_accepted', 'booking'].includes(noti.type)) return false;
      if (activeTab === 'system' && !['general', 'system', 'broker_task'].includes(noti.type)) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = noti.title?.toLowerCase().includes(q);
        const msgMatch = noti.message?.toLowerCase().includes(q);
        return titleMatch || msgMatch;
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [notifications, activeTab, searchQuery]);

  // Format relative date
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return 'الآن';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays === 1) return 'أمس';
      if (diffDays < 7) return `منذ ${diffDays} أيام`;

      return d.toLocaleDateString('ar-SY', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  // Get notification visual badge style and icon
  const getNotificationBadge = (noti: InAppNotification) => {
    switch (noti.type) {
      case 'price_drop':
        return {
          icon: <TrendingDown size={16} className="text-emerald-600 dark:text-emerald-400" />,
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
          label: 'انخفاض سعر 📉'
        };
      case 'property_alert':
        return {
          icon: <Building2 size={16} className="text-amber-600 dark:text-amber-400" />,
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300',
          label: 'تنبيه عقار 🏠'
        };
      case 'appointment_accepted':
        return {
          icon: <Calendar size={16} className="text-blue-600 dark:text-blue-400" />,
          bg: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300',
          label: 'تأكيد موعد 📅'
        };
      case 'broker_task':
        return {
          icon: <ShieldAlert size={16} className="text-purple-600 dark:text-purple-400" />,
          bg: 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300',
          label: 'تنبيه وسيط 💼'
        };
      default:
        return {
          icon: <Bell size={16} className="text-brand-gold" />,
          bg: 'bg-brand-gold/10 border-brand-gold/20 text-brand-navy dark:text-brand-gold',
          label: 'إشعار إداري 📢'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-[99990] flex items-center justify-center p-3 sm:p-5 bg-brand-navy/60 backdrop-blur-md animate-fadeIn" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white dark:bg-[#0A192F] border border-brand-navy/10 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-right text-brand-navy dark:text-white"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-brand-navy/10 dark:border-white/10 bg-gradient-to-r from-brand-cream/60 via-white to-brand-cream/60 dark:from-[#0F223D] dark:via-[#0A192F] dark:to-[#0F223D] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 bg-brand-gold/10 dark:bg-brand-gold/20 border border-brand-gold/30 rounded-2xl shrink-0">
              <Bell size={22} className="text-brand-navy dark:text-brand-gold animate-wiggle" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black font-serif text-brand-navy dark:text-white">
                  مركز الإشعارات والتنبيهات
                </h3>
                {unreadCount > 0 ? (
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-full">
                    {unreadCount} غير مقروء
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    جميعها مقروءة
                  </span>
                )}
              </div>
              <p className="text-xs text-brand-navy/60 dark:text-white/60">
                متابعة تحديثات العقارات، المواعيد، وتنبيهات أسعار السوق المباشرة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound Toggle Button */}
            <button
              type="button"
              onClick={onToggleSound}
              className={cn(
                "p-2 rounded-xl transition-all border cursor-pointer",
                isSoundEnabled
                  ? "bg-brand-gold/10 text-brand-navy dark:text-brand-gold border-brand-gold/30"
                  : "bg-gray-100 dark:bg-white/5 text-gray-400 border-gray-200 dark:border-white/10"
              )}
              title={isSoundEnabled ? "صوت التنبيهات مفعّل 🔔" : "صوت التنبيهات مكتوم 🔇"}
            >
              {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-brand-navy/60 dark:text-white/60 hover:text-brand-navy dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar & Filter Tabs */}
        <div className="p-3 sm:p-4 bg-gray-50/70 dark:bg-[#071325] border-b border-brand-navy/10 dark:border-white/10 flex flex-col gap-3 shrink-0">
          {/* Search bar & Push Notification bar */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy/40 dark:text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في نص الإشعار أو العنوان..."
                className="w-full pl-3 pr-9 py-2 bg-white dark:bg-[#0F223D] border border-brand-navy/10 dark:border-white/10 rounded-xl text-xs font-bold text-brand-navy dark:text-white placeholder:text-brand-navy/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Browser Push Permission Trigger if not granted */}
            {notifPermission !== 'granted' && typeof window !== 'undefined' && 'Notification' in window && (
              <button
                type="button"
                onClick={onRequestPermission}
                className="w-full sm:w-auto px-3 py-2 bg-brand-gold hover:bg-brand-gold/90 text-brand-navy rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
                title="تفعيل إشعارات سطح المكتب والجوال المباشرة"
              >
                <Smartphone size={15} />
                <span>تفعيل إشعارات المتصفح 📲</span>
              </button>
            )}

            {/* Test Notification Trigger (For Admin / Testing) */}
            {onSendTestNotification && (
              <button
                type="button"
                onClick={onSendTestNotification}
                className="w-full sm:w-auto px-2.5 py-2 bg-brand-navy/10 dark:bg-white/10 hover:bg-brand-navy/20 text-brand-navy dark:text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0"
                title="إرسال إشعار تجريبي لاختبار الصوت والتنبيه"
              >
                <Send size={13} />
                <span>تجربة تنبيه 🧪</span>
              </button>
            )}
          </div>

          {/* Filter Tabs & Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
              {[
                { id: 'all', label: 'الكل', count: notifications.length },
                { id: 'unread', label: 'غير مقروء 🔴', count: unreadCount },
                { id: 'property', label: 'العقارات 🏠', count: notifications.filter(n => ['property_alert', 'price_drop', 'favorite_update'].includes(n.type)).length },
                { id: 'appointment', label: 'المواعيد 📅', count: notifications.filter(n => ['appointment_accepted', 'booking'].includes(n.type)).length },
                { id: 'system', label: 'النظام 📢', count: notifications.filter(n => ['general', 'system', 'broker_task'].includes(n.type)).length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0",
                    activeTab === tab.id
                      ? "bg-brand-navy text-white dark:bg-brand-gold dark:text-brand-navy shadow-sm"
                      : "bg-white/80 dark:bg-white/5 text-brand-navy/70 dark:text-white/70 hover:bg-white dark:hover:bg-white/10 border border-brand-navy/5 dark:border-white/5"
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-extrabold",
                      activeTab === tab.id
                        ? "bg-white/20 text-white dark:bg-brand-navy/20 dark:text-brand-navy"
                        : "bg-black/5 dark:bg-white/10 text-brand-navy dark:text-white"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Quick Bulk Actions */}
            <div className="flex items-center gap-2 mr-auto pt-1 sm:pt-0">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="text-[11px] font-bold text-brand-gold hover:underline flex items-center gap-1 cursor-pointer transition-all"
                  title="تحديد كافة الإشعارات كمقروءة"
                >
                  <CheckCheck size={14} />
                  <span>تحديد الكل كمقروء</span>
                </button>
              )}

              {readCount > 0 && (
                <button
                  type="button"
                  onClick={onClearAllRead}
                  className="text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1 cursor-pointer transition-all"
                  title="حذف الإشعارات المقروءة"
                >
                  <Trash2 size={13} />
                  <span>حذف المقروءة</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List Content */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-3 min-h-[250px] scrollbar-thin">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-12 flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl"
              >
                <div className="w-16 h-16 bg-brand-gold/10 dark:bg-brand-gold/20 text-brand-gold rounded-full flex items-center justify-center mb-3">
                  <Inbox size={32} />
                </div>
                <h4 className="text-sm font-black font-serif text-brand-navy dark:text-white mb-1">
                  لا يوجد إشعارات لتنسيق التصفية الحالي
                </h4>
                <p className="text-xs text-brand-navy/60 dark:text-white/60 max-w-sm">
                  {searchQuery ? 'لم يتم العثور على أي إشعارات تطابق كلمة البحث الحالية.' : 'سيتم إضافة كافة التنبيهات وتحديثات العقارات القادمة تلقائياً هنا.'}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-3 px-3 py-1.5 bg-brand-navy text-white dark:bg-brand-gold dark:text-brand-navy rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    إلغاء تصفية البحث
                  </button>
                )}
              </motion.div>
            ) : (
              filteredNotifications.map((noti) => {
                const isUnread = noti.status === 'unread';
                const badge = getNotificationBadge(noti);

                return (
                  <motion.div
                    key={noti.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 relative group flex flex-col sm:flex-row items-start justify-between gap-3",
                      isUnread
                        ? "bg-gradient-to-r from-brand-gold/5 via-white to-white dark:from-brand-gold/10 dark:via-[#0F223D] dark:to-[#0F223D] border-brand-gold/40 shadow-md"
                        : "bg-white dark:bg-[#0F223D]/60 border-brand-navy/10 dark:border-white/10 opacity-90 hover:opacity-100 hover:border-brand-navy/20 dark:hover:border-white/20"
                    )}
                  >
                    {/* Unread Glowing Dot */}
                    {isUnread && (
                      <span className="absolute top-3 left-3 w-2.5 h-2.5 bg-brand-gold rounded-full animate-ping" />
                    )}

                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Category Icon Badge */}
                      <div className={cn("p-2.5 rounded-xl border shrink-0 mt-0.5", badge.bg)}>
                        {badge.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={cn("px-2 py-0.5 text-[10px] font-extrabold rounded-md border", badge.bg)}>
                            {badge.label}
                          </span>
                          <span className="text-[11px] font-bold text-brand-navy/50 dark:text-white/50 flex items-center gap-1">
                            <Clock size={11} />
                            {formatTime(noti.createdAt)}
                          </span>
                        </div>

                        <h4 className={cn(
                          "text-xs sm:text-sm font-serif mb-1 leading-snug",
                          isUnread ? "font-black text-brand-navy dark:text-white" : "font-bold text-brand-navy/90 dark:text-white/90"
                        )}>
                          {noti.title}
                        </h4>

                        <p className="text-xs text-brand-navy/70 dark:text-white/70 leading-relaxed break-words">
                          {noti.message}
                        </p>

                        {/* Action Buttons inside Card */}
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-brand-navy/5 dark:border-white/5">
                          {/* Navigate to Property Details if propertyId exists */}
                          {noti.propertyId && onOpenPropertyDetails && (
                            <button
                              type="button"
                              onClick={() => {
                                onMarkAsRead(noti.id);
                                onOpenPropertyDetails(noti.propertyId!);
                                onClose();
                              }}
                              className="px-3 py-1.5 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                            >
                              <Building2 size={13} />
                              <span>معاينة العقار 🏠</span>
                            </button>
                          )}

                          {/* Navigate to Appointment if appointmentId exists */}
                          {noti.appointmentId && onOpenAppointment && (
                            <button
                              type="button"
                              onClick={() => {
                                onMarkAsRead(noti.id);
                                onOpenAppointment(noti.appointmentId!);
                                onClose();
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                            >
                              <Calendar size={13} />
                              <span>تفاصيل الموعد 📅</span>
                            </button>
                          )}

                          {/* Mark Read/Unread toggle */}
                          <button
                            type="button"
                            onClick={() => onMarkAsRead(noti.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-brand-navy/70 dark:text-white/70 hover:text-brand-navy dark:hover:text-white bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-all cursor-pointer"
                          >
                            {isUnread ? 'تحديد كمقروء ✓' : 'إعادة كغير مقروء'}
                          </button>

                          {/* Delete Notification */}
                          <button
                            type="button"
                            onClick={() => onDeleteNotification(noti.id)}
                            className="px-2 py-1 text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer mr-auto"
                            title="حذف الإشعار"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-brand-navy/10 dark:border-white/10 bg-gray-50/80 dark:bg-[#071325] flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] font-bold text-brand-navy/60 dark:text-white/60">
            إجمالي الإشعارات: {notifications.length} إشعار
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-brand-navy text-white dark:bg-brand-gold dark:text-brand-navy rounded-xl text-xs font-black hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md"
          >
            إغلاق المربع
          </button>
        </div>
      </motion.div>
    </div>
  );
}
