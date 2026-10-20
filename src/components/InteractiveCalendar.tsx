import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Building,
  Mail,
  FileText,
  CreditCard
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { getWeatherForLocationAndDate } from '../utils/weatherHelper';
import { Broker, Appointment } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface InteractiveCalendarProps {
  brokers: Broker[];
  appointments: Appointment[];
  properties: any[];
  currentUser: any;
  userProfile: any;
  onBookingSuccess: () => void;
  exchangeRate?: number;
  language?: 'ar' | 'en';
}

const arabicMonths = [
  "كانون الثاني (يناير)",
  "شباط (فبراير)",
  "آذار (مارس)",
  "نيسان (أبريل)",
  "أيار (مايو)",
  "حزيران (يونيو)",
  "تموز (يوليو)",
  "آب (أغسطس)",
  "أيلول (سبتمبر)",
  "تشرين الأول (أكتوبر)",
  "تشرين الثاني (نوفمبر)",
  "كانون الأول (ديسمبر)"
];

const weekdays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

// Available hours (9:00 AM to 6:00 PM)
const timeSlots = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00"
];

export function InteractiveCalendar({ 
  brokers, 
  appointments, 
  properties, 
  currentUser, 
  userProfile, 
  onBookingSuccess,
  exchangeRate = 15000,
  language = 'ar'
}: InteractiveCalendarProps) {
  
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  
  // Booking Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedBrokerId, setSelectedBrokerId] = useState('auto'); // 'auto' or specific broker ID
  const [bookingNotes, setBookingNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [smartScheduleNotice, setSmartScheduleNotice] = useState<string | null>(null);

  const handleSmartAutoSchedule = () => {
    let found = false;
    const scanDate = new Date(today);

    for (let d = 0; d < 10; d++) {
      const checkDate = new Date(scanDate.getFullYear(), scanDate.getMonth(), scanDate.getDate() + d);
      const dateString = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

      for (const slot of timeSlots) {
        const availableBrokers = brokers.filter(broker => {
          if (broker.status !== 'active') return false;
          const hasTaskConflict = broker.tasks?.some(task => {
            if (task.status === 'disabled') return false;
            const taskDate = task.dueDate || task.appointmentDate;
            return taskDate === dateString && task.dueTime === slot;
          });
          if (hasTaskConflict) return false;

          const hasAppointmentConflict = appointments.some(appt => {
            return appt.preferredBrokerId === broker.id &&
                   appt.date === dateString &&
                   appt.time === slot &&
                   appt.status !== 'cancelled';
          });
          if (hasAppointmentConflict) return false;

          return true;
        });

        if (availableBrokers.length > 0) {
          setCurrentDate(checkDate);
          setSelectedDate(checkDate);
          setSelectedSlot(slot);
          setSelectedBrokerId('auto');
          setStep(1);
          setErrorMsg('');
          setSmartScheduleNotice(`🤖 الجدولة الذكية: تم اختيار أقرب وقت متاح في ${dateString} الساعة ${slot} مع المستشار الأقرب (${availableBrokers[0].name} - ${availableBrokers[0].governorate || 'دمشق'}) بناءً على مطابقة الموقع وجدول المهام بنجاح!`);
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      setErrorMsg("عذراً، لم يتم العثور على مواعيد خالية في الأيام العشرة القادمة.");
    }
  };

  // Payment states for Paid Calendar Booking
  const [step, setStep] = useState<1 | 2>(1);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'syriatel' | 'mtn'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pinCode, setPinCode] = useState('');

  const feeSYP = 50000;
  const feeUSD = Math.round((feeSYP / exchangeRate) * 100) / 100;

  // Pre-populate fields if user is logged in
  useEffect(() => {
    if (userProfile) {
      setClientName(userProfile.name || '');
      setClientPhone(userProfile.phone || '');
      setClientEmail(userProfile.email || currentUser?.email || '');
    } else if (currentUser) {
      setClientName(currentUser.displayName || '');
      setClientEmail(currentUser.email || '');
    }
  }, [currentUser, userProfile]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calendar calculations
  const firstDayOfMonth = useMemo(() => new Date(year, month, 1).getDay(), [year, month]);
  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  // Weather guidance based on the selected date and governorate (defaults to Damascus)
  const weatherInfo = useMemo(() => {
    if (!formattedSelectedDate) return null;
    const linkedProp = properties.find(p => p.id === selectedPropertyId);
    const gov = linkedProp?.governorate || 'دمشق';
    return getWeatherForLocationAndDate(gov, new Date(formattedSelectedDate));
  }, [formattedSelectedDate, selectedPropertyId, properties]);

  // Fetch available brokers and conflicts for each slot of the selected day
  const slotsWithAvailability = useMemo(() => {
    if (!formattedSelectedDate) return [];

    return timeSlots.map(slot => {
      // Find active brokers who DO NOT have a conflict at this date & time
      const availableBrokers = brokers.filter(broker => {
        if (broker.status !== 'active') return false;

        // 1. Check broker's tasks conflict
        const hasTaskConflict = broker.tasks?.some(task => {
          if (task.status === 'disabled') return false;
          const taskDate = task.dueDate || task.appointmentDate;
          return taskDate === formattedSelectedDate && task.dueTime === slot;
        });

        if (hasTaskConflict) return false;

        // 2. Check global appointments conflict assigned to this broker
        const hasAppointmentConflict = appointments.some(appt => {
          return appt.preferredBrokerId === broker.id &&
                 appt.date === formattedSelectedDate &&
                 appt.time === slot &&
                 appt.status !== 'cancelled';
        });

        if (hasAppointmentConflict) return false;

        return true;
      });

      return {
        time: slot,
        availableBrokers,
        isAvailable: availableBrokers.length > 0
      };
    });
  }, [formattedSelectedDate, brokers, appointments]);

  const selectedSlotData = useMemo(() => {
    return slotsWithAvailability.find(s => s.time === selectedSlot);
  }, [slotsWithAvailability, selectedSlot]);

  const handleSelectDay = (day: number) => {
    const clickedDate = new Date(year, month, day);
    // Do not allow booking past dates
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (clickedDate < startOfToday) return;

    setSelectedDate(clickedDate);
    setSelectedSlot(null);
    setSelectedBrokerId('auto');
    setErrorMsg('');
    setStep(1);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) {
      setErrorMsg("يرجى تحديد التاريخ والوقت أولاً.");
      return;
    }
    if (!clientName.trim() || !clientPhone.trim()) {
      setErrorMsg("الاسم ورقم الهاتف مطلوبان لإتمام الحجز.");
      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }

    // Validate Step 2 Payment details
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardHolder || !expiry || !cvv) {
        setErrorMsg("يرجى تعبئة كافة تفاصيل بطاقة الائتمان.");
        return;
      }
    } else {
      if (!phoneNumber || !pinCode) {
        setErrorMsg("يرجى إدخال رقم خط الدفع والرمز الشخصي PIN للمحفظة.");
        return;
      }
    }

    const availableBrokers = selectedSlotData?.availableBrokers || [];
    if (availableBrokers.length === 0) {
      setErrorMsg("عذراً، لا يوجد وسطاء متاحين في هذا الوقت.");
      return;
    }

    // Determine chosen broker
    let assignedBroker: Broker;
    if (selectedBrokerId === 'auto') {
      // Select the broker with fewer tasks today or simply the first available
      assignedBroker = availableBrokers[0];
    } else {
      const found = availableBrokers.find(b => b.id === selectedBrokerId);
      if (!found) {
        setErrorMsg("الوسيط المختار غير متاح في هذا الوقت.");
        return;
      }
      assignedBroker = found;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const selectedProp = properties.find(p => p.id === selectedPropertyId);
      const serviceTitle = selectedProp 
        ? `معاينة عقار: ${selectedProp.title}`
        : 'معاينة عقارية مجدولة عبر التقويم';

      // 1. Create Appointment document
      const appRef = await addDoc(collection(db, 'appointments'), {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim() || currentUser?.email || '',
        date: formattedSelectedDate,
        time: selectedSlot,
        propertyId: selectedPropertyId || '',
        serviceTitle,
        status: 'pending',
        userId: currentUser?.uid || 'anonymous',
        preferredBrokerId: assignedBroker.id,
        preferredBrokerName: assignedBroker.name,
        createdAt: new Date().toISOString(),
        paymentStatus: 'paid',
        paymentMethod: paymentMethod,
        paymentAmount: feeSYP,
        paymentAmountUSD: feeUSD,
        notes: bookingNotes.trim()
      });

      // 2. Create Broker Task
      const newTask = {
        id: `task_${Date.now()}`,
        title: serviceTitle,
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        dueDate: formattedSelectedDate,
        dueTime: selectedSlot,
        appointmentId: appRef.id,
        notes: `موعد ميداني لـ: ${clientName.trim()} | هاتف: ${clientPhone.trim()}. ملاحظات العميل: ${bookingNotes.trim()}`
      };

      const updatedTasks = [...(assignedBroker.tasks || []), newTask];
      await updateDoc(doc(db, 'brokers', assignedBroker.id), {
        tasks: updatedTasks
      });

      // 3. Create Notification for the Broker
      await addDoc(collection(db, 'notifications'), {
        userId: assignedBroker.id,
        title: '📅 موعد ميداني جديد مجدول',
        body: `تم إسناد موعد معاينة جديد لك بتاريخ ${formattedSelectedDate} الساعة ${selectedSlot} مع العميل ${clientName}.`,
        type: 'info',
        read: false,
        createdAt: new Date().toISOString()
      });

      // 4. Create Notification for Admin
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin',
        title: '🔔 حجز موعد مباشر من العميل',
        body: `قام العميل ${clientName} بحجز موعد معاينة مع الوسيط ${assignedBroker.name} بتاريخ ${formattedSelectedDate} الساعة ${selectedSlot}.`,
        type: 'success',
        read: false,
        createdAt: new Date().toISOString()
      });

      setBookingSuccess(true);
      onBookingSuccess();
    } catch (err) {
      console.error("Error creating direct booking:", err);
      setErrorMsg("حدث خطأ غير متوقع أثناء معالجة الحجز. يرجى المحاولة لاحقاً.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Padding for first day of the week
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null, isPast: true, isSelected: false });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const isPast = dateObj < startOfToday;
      const isSelected = selectedDate 
        ? dateObj.getDate() === selectedDate.getDate() && 
          dateObj.getMonth() === selectedDate.getMonth() && 
          dateObj.getFullYear() === selectedDate.getFullYear()
        : false;

      days.push({
        day: d,
        date: dateObj,
        isPast,
        isSelected
      });
    }

    return days;
  }, [year, month, firstDayOfMonth, daysInMonth, selectedDate, today]);

  // Check if a specific date in calendar has any available slots
  const hasAvailabilityOnDay = (dateObj: Date) => {
    const dateString = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    
    // Check if at least one slot has any active broker without conflict
    return timeSlots.some(slot => {
      const available = brokers.filter(broker => {
        if (broker.status !== 'active') return false;

        const hasTaskConflict = broker.tasks?.some(task => {
          if (task.status === 'disabled') return false;
          const taskDate = task.dueDate || task.appointmentDate;
          return taskDate === dateString && task.dueTime === slot;
        });
        if (hasTaskConflict) return false;

        const hasAppointmentConflict = appointments.some(appt => {
          return appt.preferredBrokerId === broker.id &&
                 appt.date === dateString &&
                 appt.time === slot &&
                 appt.status !== 'cancelled';
        });
        if (hasAppointmentConflict) return false;

        return true;
      });
      return available.length > 0;
    });
  };

  return (
    <div className="bg-white border border-brand-navy/5 rounded-[2.5rem] p-6 md:p-8 shadow-xl text-right" dir="rtl" id="direct-booking-calendar">
      
      {bookingSuccess ? (
        <div className="text-center py-12 space-y-6 max-w-md mx-auto">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={48} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-serif font-black text-2xl text-brand-navy mb-2">تم تأكيد الموعد مباشرة! 🎉</h3>
            <p className="text-sm text-zinc-500 font-bold leading-relaxed">
              شكراً لاختيارك خدماتنا الميدانية المتميزة. لقد تم تسجيل الموعد بنظام حجز الوسطاء التلقائي، وإسناد المهمة مباشرة لجدول المستشار العقاري المسؤول.
            </p>
          </div>
          
          <div className="bg-brand-cream/20 p-5 rounded-2xl border border-brand-navy/5 text-right space-y-3 text-xs font-bold shadow-sm">
            <p className="text-zinc-500 flex justify-between">
              <span>📅 تاريخ المعاينة:</span>
              <span className="text-brand-navy font-black">{formattedSelectedDate}</span>
            </p>
            <p className="text-zinc-500 flex justify-between">
              <span>⏰ التوقيت المعتمد:</span>
              <span className="text-brand-navy font-black">{selectedSlot}</span>
            </p>
            <p className="text-zinc-500 flex justify-between">
              <span>👤 المستشار العقاري:</span>
              <span className="text-brand-gold font-black">
                {selectedBrokerId === 'auto' 
                  ? selectedSlotData?.availableBrokers[0]?.name 
                  : brokers.find(b => b.id === selectedBrokerId)?.name}
              </span>
            </p>
            {selectedPropertyId && (
              <p className="text-zinc-500 flex justify-between">
                <span>🏠 العقار المستهدف:</span>
                <span className="text-brand-navy font-black truncate max-w-[180px]">
                  {properties.find(p => p.id === selectedPropertyId)?.title}
                </span>
              </p>
            )}
          </div>

          <button 
            type="button"
            onClick={() => {
              setBookingSuccess(false);
              setSelectedSlot(null);
              setBookingNotes('');
              setStep(1);
            }}
            className="px-8 py-3 bg-brand-navy hover:bg-brand-gold text-brand-gold hover:text-brand-navy rounded-2xl text-xs font-black transition-all duration-300 cursor-pointer border-0 w-full"
          >
            حجز موعد آخر 📅
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Column 1: Calendar & Slots */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="text-[10px] font-black text-brand-gold tracking-widest uppercase bg-brand-navy/5 px-2.5 py-1 rounded-md">
                جدولة حجز فوري مباشر
              </span>
              <h3 className="text-2xl font-serif font-black text-brand-navy mt-2 flex items-center gap-2">
                <CalendarIcon className="text-brand-gold shrink-0" size={24} />
                <span>اختر تاريخ ووقت الموعد</span>
              </h3>
              <p className="text-xs text-zinc-500 font-bold mt-1">
                تظهر المواعيد المتاحة تلقائياً بعد استقصاء ومطابقة جداول العمل الميداني لكافة المستشارين العقاريين المسجلين بالشركة بدمشق وريفها.
              </p>

              {/* Smart Auto-Scheduler Trigger Button */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleSmartAutoSchedule}
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-3 bg-gradient-to-r from-brand-navy to-[#1A365D] hover:from-brand-gold hover:to-brand-gold-dark text-brand-gold hover:text-brand-navy rounded-2xl text-xs font-black shadow-md transition-all duration-300 cursor-pointer border border-brand-gold/20"
                >
                  <Sparkles size={16} className="text-brand-gold animate-spin" />
                  <span>🤖 تفعيل الجدولة التلقائية الذكية (حسب الموقع الجغرافي والمهام)</span>
                </button>
              </div>

              {/* Smart Auto-Schedule Success/Info Notice */}
              {smartScheduleNotice && (
                <div className="mt-3 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-start gap-2.5 shadow-sm">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p>{smartScheduleNotice}</p>
                    <button 
                      type="button" 
                      onClick={() => setSmartScheduleNotice(null)}
                      className="text-[10px] text-emerald-700 underline mt-1 font-semibold hover:text-emerald-900 cursor-pointer"
                    >
                      إخفاء التنبيه
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Calendar Widget */}
            <div className="border border-brand-navy/10 rounded-3xl p-5 bg-brand-cream/5 shadow-inner">
              <div className="flex justify-between items-center mb-4">
                <button 
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-brand-navy/5 rounded-xl transition-all duration-200 cursor-pointer text-brand-navy"
                >
                  <ChevronRight size={18} />
                </button>
                <span className="text-sm font-black text-brand-navy font-serif">
                  {arabicMonths[month]} {year}
                </span>
                <button 
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-brand-navy/5 rounded-xl transition-all duration-200 cursor-pointer text-brand-navy"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {weekdays.map((day, idx) => (
                  <span key={idx} className="text-[10px] font-black text-brand-navy/60 py-1">{day}</span>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((item, idx) => {
                  if (item.day === null) {
                    return <div key={idx} className="aspect-square" />;
                  }

                  const hasAvailability = !item.isPast && hasAvailabilityOnDay(item.date);

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={item.isPast}
                      onClick={() => handleSelectDay(item.day!)}
                      className={cn(
                        "aspect-square rounded-2xl text-xs font-bold flex flex-col items-center justify-center relative transition-all duration-200 cursor-pointer border-0",
                        item.isPast && "text-zinc-300 bg-transparent cursor-not-allowed",
                        !item.isPast && !item.isSelected && "text-brand-navy hover:bg-brand-gold/10 bg-brand-navy/5",
                        item.isSelected && "bg-brand-navy text-white shadow-md transform scale-105 font-black",
                        hasAvailability && !item.isSelected && "border-2 border-emerald-500/30"
                      )}
                    >
                      <span>{item.day}</span>
                      {hasAvailability && !item.isPast && (
                        <span className={cn(
                          "absolute bottom-1 w-1.5 h-1.5 rounded-full",
                          item.isSelected ? "bg-brand-gold" : "bg-emerald-500 animate-pulse"
                        )} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-brand-navy">
                  <Clock size={16} className="text-brand-gold" />
                  <span>الأوقات المتاحة ليوم {selectedDate.toLocaleDateString('ar-SY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}:</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {slotsWithAvailability.map((slot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => {
                        setSelectedSlot(slot.time);
                        setSelectedBrokerId('auto');
                        setErrorMsg('');
                        setStep(1);
                      }}
                      className={cn(
                        "p-3 rounded-2xl text-[11px] font-black transition-all duration-200 flex flex-col items-center justify-center gap-1 border-0 cursor-pointer",
                        !slot.isAvailable && "bg-zinc-100 text-zinc-400 cursor-not-allowed line-through",
                        slot.isAvailable && selectedSlot !== slot.time && "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-100",
                        selectedSlot === slot.time && "bg-brand-gold text-brand-navy shadow-md scale-105 font-extrabold"
                      )}
                    >
                      <span className="font-mono text-xs">{slot.time}</span>
                      <span className="text-[8px] font-black">
                        {slot.isAvailable ? `متاح (${slot.availableBrokers.length})` : 'غير متاح'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Booking Details Form */}
          <div className="lg:col-span-5 bg-zinc-50/50 border border-zinc-100 rounded-[2rem] p-6 space-y-6">
            <div>
              <h4 className="font-serif font-black text-lg text-brand-navy">تفاصيل الحجز والاتصال</h4>
              <p className="text-[10px] text-zinc-500 font-bold mt-0.5">يرجى تأكيد وسيط المعاينة وتفاصيل الاتصال الخاصة بك.</p>
            </div>

            {selectedSlot ? (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                
                {/* Visual Confirmation Summary Card */}
                <div className="bg-brand-navy text-white rounded-2xl p-4 space-y-2 text-xs relative overflow-hidden shadow-md">
                  <div className="absolute top-0 left-0 translate-y-[-20%] translate-x-[-20%] w-24 h-24 bg-brand-gold/10 rounded-full blur-xl pointer-events-none" />
                  <p className="font-black text-brand-gold flex items-center gap-1">
                    <Sparkles size={14} />
                    <span>ملخص الموعد المختار:</span>
                  </p>
                  <p className="font-semibold flex justify-between border-b border-white/10 pb-1.5">
                    <span>التاريخ:</span>
                    <span className="font-black font-mono">{formattedSelectedDate}</span>
                  </p>
                  <p className="font-semibold flex justify-between">
                    <span>التوقيت الميداني:</span>
                    <span className="font-black font-mono">{selectedSlot}</span>
                  </p>
                </div>

                {/* Stepper Header */}
                <div className="flex justify-between items-center bg-brand-navy/5 p-2 rounded-xl text-[10px] font-bold">
                  <span className={cn(
                    "px-2 py-1 rounded-md",
                    step === 1 ? "bg-brand-navy text-brand-gold" : "bg-emerald-100 text-emerald-800"
                  )}>
                    {step === 1 ? "1. تفاصيل الاتصال" : "✓ تفاصيل الاتصال"}
                  </span>
                  <div className="flex-1 border-t border-dashed border-zinc-300 mx-2" />
                  <span className={cn(
                    "px-2 py-1 rounded-md",
                    step === 2 ? "bg-brand-gold text-brand-navy font-black" : "bg-zinc-100 text-zinc-400"
                  )}>
                    2. دفع الرسوم (٥٠ ألف ل.س)
                  </span>
                </div>

                {step === 1 ? (
                  <>
                    {/* Client Name Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-brand-navy flex items-center gap-1">
                        <User size={12} className="text-brand-gold" />
                        <span>الاسم الكريم *</span>
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full p-3 bg-white rounded-xl border border-zinc-200 focus:border-brand-gold outline-none text-xs font-semibold"
                        placeholder="الاسم الثلاثي الكامل"
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                      />
                    </div>

                    {/* Client Phone Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-brand-navy flex items-center gap-1">
                        <Phone size={12} className="text-brand-gold" />
                        <span>رقم الهاتف (الواتساب) *</span>
                      </label>
                      <input
                        required
                        type="tel"
                        className="w-full p-3 bg-white rounded-xl border border-zinc-200 focus:border-brand-gold outline-none text-xs font-semibold font-mono text-left"
                        placeholder="09xxxxxxxx"
                        value={clientPhone}
                        onChange={e => setClientPhone(e.target.value)}
                      />
                    </div>

                    {/* Client Email Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-brand-navy flex items-center gap-1">
                        <Mail size={12} className="text-brand-gold" />
                        <span>البريد الإلكتروني</span>
                      </label>
                      <input
                        type="email"
                        className="w-full p-3 bg-white rounded-xl border border-zinc-200 focus:border-brand-gold outline-none text-xs font-semibold text-left"
                        placeholder="example@email.com"
                        value={clientEmail}
                        onChange={e => setClientEmail(e.target.value)}
                      />
                    </div>

                    {/* Linked Property Dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-brand-navy flex items-center gap-1">
                        <Building size={12} className="text-brand-gold" />
                        <span>اربط الموعد بعقار (اختياري)</span>
                      </label>
                      <select
                        className="w-full p-3 bg-white rounded-xl border border-zinc-200 focus:border-brand-gold outline-none text-xs font-semibold"
                        value={selectedPropertyId}
                        onChange={e => setSelectedPropertyId(e.target.value)}
                      >
                        <option value="">-- غير مرتبط بعقار محدد --</option>
                        {properties.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.governorate})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Preferred Broker Dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-brand-navy flex items-center gap-1">
                        <User size={12} className="text-brand-gold" />
                        <span>اختيار المستشار العقاري</span>
                      </label>
                      <select
                        className="w-full p-3 bg-white rounded-xl border border-zinc-200 focus:border-brand-gold outline-none text-xs font-semibold"
                        value={selectedBrokerId}
                        onChange={e => setSelectedBrokerId(e.target.value)}
                      >
                        <option value="auto">⚡ تعيين تلقائي (للمستشار الأنسب والأسرع)</option>
                        {selectedSlotData?.availableBrokers.map(b => (
                          <option key={b.id} value={b.id}>
                            👤 {b.name} ({b.specialties ? b.specialties.slice(0, 2).join(' / ') : 'مستشار عام'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Booking Notes Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-brand-navy flex items-center gap-1">
                        <FileText size={12} className="text-brand-gold" />
                        <span>ملاحظات المعاينة والموقع التفصيلي</span>
                      </label>
                      <textarea
                        rows={2}
                        className="w-full p-3 bg-white rounded-xl border border-zinc-200 focus:border-brand-gold outline-none text-xs font-semibold"
                        placeholder="اكتب أي ملاحظات إضافية أو إرشادات للوصول لعنوانك لخدمتك بدقة..."
                        value={bookingNotes}
                        onChange={e => setBookingNotes(e.target.value)}
                      />
                    </div>

                    {/* Weather advice widget */}
                    {weatherInfo && (
                      <div className="p-3.5 bg-brand-navy/5 border border-brand-navy/10 rounded-2xl text-[10px] space-y-1.5">
                        <div className="flex items-center gap-1 text-brand-navy font-black">
                          <span className="text-sm">{weatherInfo.icon}</span>
                          <span>إرشاد الطقس لليوم المختار ({weatherInfo.conditionText.ar}):</span>
                        </div>
                        <p className="text-zinc-600 font-bold">{weatherInfo.description.ar}</p>
                        <div className="pt-1.5 border-t border-dashed border-zinc-200 text-zinc-500 font-semibold">
                          💡 {weatherInfo.tips.ar[0]}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Invoice Overview */}
                    <div className="bg-brand-cream/10 border border-brand-navy/5 p-4 rounded-2xl text-right space-y-2 text-xs font-semibold">
                      <div className="flex justify-between items-center border-b border-brand-navy/5 pb-2">
                        <span className="text-zinc-500">تفاصيل الخدمة المستهدفة:</span>
                        <span className="text-brand-navy font-black">جدولة وحجز موعد ميداني للتقويم</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-500">رسوم حجز الموعد كاش:</span>
                        <span className="text-brand-navy font-black text-base font-mono">50,000 ل.س</span>
                      </div>
                      <div className="flex justify-between items-center text-xxs text-brand-gold-dark border-t border-brand-navy/5 pt-2">
                        <span>القيمة التقريبية بالدولار:</span>
                        <span className="font-bold font-mono">${feeUSD}</span>
                      </div>
                    </div>

                    {/* Payment Channel Selector */}
                    <div className="space-y-1 text-right">
                      <label className="text-xs font-black text-brand-navy block mb-1.5">بوابة دفع كاش آمنة</label>
                      <div className="flex gap-1.5">
                        {[
                          { id: 'card', label: 'بطاقة ائتمان' },
                          { id: 'syriatel', label: 'سيريتل كاش' },
                          { id: 'mtn', label: 'MTN كاش' }
                        ].map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setPaymentMethod(method.id as any)}
                            className={cn(
                              "flex-1 py-2 px-1 rounded-xl border font-bold text-[10px] sm:text-xs text-center transition-all cursor-pointer",
                              paymentMethod === method.id 
                                ? "bg-brand-navy text-brand-gold border-brand-navy shadow"
                                : "bg-white text-zinc-600 border-zinc-200"
                            )}
                          >
                            <span>{method.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Payment Sub-Forms */}
                    {paymentMethod === 'card' ? (
                      <div className="space-y-3">
                        <div className="space-y-1 text-right">
                          <label className="text-[10px] text-zinc-500 font-bold block">رقم البطاقة الائتمانية</label>
                          <input 
                            type="text" 
                            required
                            placeholder="••••  ••••  ••••  ••••" 
                            value={cardNumber}
                            onChange={e => setCardNumber(e.target.value)}
                            className="w-full bg-white border border-zinc-200 rounded-xl p-2.5 text-xs text-center tracking-widest focus:border-brand-gold outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1 text-right">
                          <label className="text-[10px] text-zinc-500 font-bold block">اسم حامل البطاقة الكامل</label>
                          <input 
                            type="text" 
                            required
                            placeholder="الاسم الثلاثي الكامل"
                            value={cardHolder}
                            onChange={e => setCardHolder(e.target.value)}
                            className="w-full bg-white border border-zinc-200 rounded-xl p-2.5 text-xs focus:border-brand-gold outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1 text-right">
                            <label className="text-[10px] text-zinc-500 font-bold block">تاريخ الانتهاء</label>
                            <input 
                              type="text" 
                              required
                              placeholder="MM/YY" 
                              value={expiry}
                              onChange={e => setExpiry(e.target.value)}
                              className="w-full bg-white border border-zinc-200 rounded-xl p-2.5 text-xs text-center focus:border-brand-gold outline-none font-mono"
                            />
                          </div>
                          <div className="space-y-1 text-right">
                            <label className="text-[10px] text-zinc-500 font-bold block">CVV</label>
                            <input 
                              type="password" 
                              maxLength={3}
                              required
                              placeholder="•••" 
                              value={cvv}
                              onChange={e => setCvv(e.target.value)}
                              className="w-full bg-white border border-zinc-200 rounded-xl p-2.5 text-xs text-center focus:border-brand-gold outline-none font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-1 text-right">
                          <label className="text-[10px] text-zinc-500 font-bold block">رقم حساب خط المحفظة الكاش</label>
                          <input 
                            type="tel" 
                            required
                            placeholder="09••••••••" 
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            className="w-full bg-white border border-zinc-200 rounded-xl p-2.5 text-xs text-center tracking-widest focus:border-brand-gold outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1 text-right">
                          <label className="text-[10px] text-zinc-500 font-bold block">رمز PIN الشخصي للمحفظة</label>
                          <input 
                            type="password" 
                            required
                            maxLength={4}
                            placeholder="••••" 
                            value={pinCode}
                            onChange={e => setPinCode(e.target.value)}
                            className="w-full bg-white border border-zinc-200 rounded-xl p-2.5 text-xs text-center focus:border-brand-gold outline-none font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {errorMsg && (
                  <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-rose-100">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit / Stepper Buttons */}
                <div className="flex gap-3 pt-2">
                  {step === 2 && (
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-2xl font-bold text-xs cursor-pointer border-0 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                    >
                      تعديل التفاصيل
                    </button>
                  )}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    className="group relative flex-1 py-4 bg-gradient-to-r from-brand-navy via-[#1F374C] to-brand-navy hover:from-[#1F374C] hover:to-brand-navy text-brand-gold rounded-2xl font-black text-xs sm:text-sm transition-all duration-300 shadow-xl hover:shadow-brand-gold/20 flex items-center justify-center gap-2.5 cursor-pointer border border-brand-gold/40 overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-brand-gold/0 via-brand-gold/25 to-brand-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
                        <span className="animate-pulse">جاري المعالجة وتأكيد الحجز...</span>
                      </div>
                    ) : step === 1 ? (
                      <>
                        <Sparkles size={16} className="text-brand-gold shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                        <span className="tracking-wide">الاستمرار لخطوة الدفع 🚀</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} className="text-brand-gold shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                        <span className="tracking-wide">تأكيد الدفع وحجز الموعد 👑</span>
                      </>
                    )}
                  </motion.button>
                </div>

              </form>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 bg-white rounded-3xl border border-zinc-100 shadow-inner space-y-2">
                <CalendarIcon className="text-zinc-300 stroke-[1.5]" size={36} />
                <p className="text-xs font-black text-brand-navy">التقويم جاهز بانتظارك!</p>
                <p className="text-[10px] text-zinc-400 font-bold max-w-[200px]">يرجى اختيار تاريخ أولاً من الجانب الأيمن، ثم النقر على وقت مناسب لبدء الحجز.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
