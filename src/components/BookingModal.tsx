import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CloudSun, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  CreditCard, 
  CircleAlert, 
  DollarSign 
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { getWeatherForLocationAndDate } from '../utils/weatherHelper';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface BookingModalProps {
  onClose: () => void;
  propertyId?: string;
  serviceId?: string;
  serviceTitle?: string;
  property?: any;
  exchangeRate?: number;
  language?: 'ar' | 'en';
  onBookingSuccess?: () => void;
  currentUser?: any;
  userProfile?: any;
  brokers?: any[];
}

export const BookingModal = ({ 
  onClose, 
  propertyId, 
  serviceId, 
  serviceTitle, 
  property,
  exchangeRate = 15000,
  language = 'ar',
  onBookingSuccess,
  currentUser,
  userProfile,
  brokers = []
}: BookingModalProps) => {
  const isAr = language === 'ar';
  const t = (arStr: string, enStr?: string) => isAr ? arStr : (enStr || arStr);

  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({ 
    clientName: userProfile?.displayName || currentUser?.displayName || '', 
    clientPhone: userProfile?.phone || '', 
    date: '', 
    time: '' 
  });
  const [weatherInfo, setWeatherInfo] = useState<any | null>(null);
  const [timeError, setTimeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'syriatel' | 'mtn'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pinCode, setPinCode] = useState('');

  // 50,000 SYP to USD conversion
  const feeSYP = 50000;
  const feeUSD = Math.round((feeSYP / exchangeRate) * 100) / 100;

  const handleDateChange = (date: string) => {
    setFormData(prev => ({ ...prev, date }));
    if (date) {
      const gov = property?.governorate || 'دمشق';
      const info = getWeatherForLocationAndDate(gov, new Date(date));
      setWeatherInfo(info);
    } else {
      setWeatherInfo(null);
    }
  };

  const handleTimeChange = (time: string) => {
    setFormData(p => ({ ...p, time }));
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes;
      const startMinutes = 9 * 60;
      const endMinutes = 18 * 60;
      if (totalMinutes < startMinutes || totalMinutes > endMinutes) {
        setTimeError(t('⚠️ المعاينات متاحة فقط من الساعة 9:00 صباحاً وحتى 6:00 مساءً.', '⚠️ Viewings are only available from 9:00 AM to 6:00 PM.'));
      } else {
        setTimeError('');
      }
    } else {
      setTimeError('');
    }
  };

  const goToPaymentStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.clientPhone || !formData.date || !formData.time) {
      alert(t("يرجى ملء جميع الحقول المطلوبة.", "Please fill in all required fields."));
      return;
    }

    const [hours, minutes] = formData.time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 9 * 60;
    const endMinutes = 18 * 60;
    if (totalMinutes < startMinutes || totalMinutes > endMinutes) {
      setTimeError(t('⚠️ المعاينات متاحة فقط من الساعة 9:00 صباحاً وحتى 6:00 مساءً.', '⚠️ Viewings are only available from 9:00 AM to 6:00 PM.'));
      alert(t("عذراً، يجب اختيار وقت معاينة مابين الساعة التاسعة صباحاً والسادسة مساءً.", "Sorry, viewings must be booked between 9:00 AM and 6:00 PM."));
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Step 2 Payment details
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardHolder || !expiry || !cvv) {
        alert(t("يرجى تعبئة كافة تفاصيل بطاقة الائتمان.", "Please fill in all credit card details."));
        return;
      }
    } else {
      if (!phoneNumber || !pinCode) {
        alert(t("يرجى إدخال رقم خط الدفع والرمز الشخصي PIN للمحفظة.", "Please enter the wallet phone number and PIN."));
        return;
      }
    }

    setLoading(true);
    try {
      const appRef = await addDoc(collection(db, 'appointments'), {
        clientName: formData.clientName.trim(),
        clientPhone: formData.clientPhone.trim(),
        clientEmail: currentUser?.email || '',
        date: formData.date,
        time: formData.time,
        propertyId: propertyId || '',
        serviceId: serviceId || '',
        serviceTitle: serviceTitle || property?.title || t('معاينة عقارية مخصصة', 'Custom Property Viewing'),
        status: 'pending',
        userId: currentUser?.uid || 'guest',
        createdAt: new Date().toISOString(),
        paymentStatus: 'paid',
        paymentMethod: paymentMethod,
        paymentAmount: feeSYP,
        paymentAmountUSD: feeUSD,
        paymentDetails: paymentMethod === 'card' ? {
          cardNumber: cardNumber.replace(/\s+/g, '').slice(-4), // Save only last 4 digits for privacy
          cardHolder: cardHolder.trim()
        } : {
          walletPhone: phoneNumber
        }
      });

      // Send admin notification
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: 'admin',
          title: '📅 طلب حجز معاينة جديد',
          body: `قام العميل ${formData.clientName.trim()} (هاتف: ${formData.clientPhone.trim()}) بحجز معاينة لـ (${serviceTitle || property?.title || 'عقار'}) بتاريخ ${formData.date} الساعة ${formData.time}.`,
          type: 'booking',
          read: false,
          createdAt: new Date().toISOString(),
          appointmentId: appRef.id
        });
      } catch (notifErr) {
        console.warn("Could not send admin notification:", notifErr);
      }

      // Automated WhatsApp notification to the broker from 0945430030 if the client came through them
      try {
        const assignedBrokerId = property?.brokerId || userProfile?.brokerId || userProfile?.broker;
        const matchedBroker = brokers.find(b => b.id === assignedBrokerId || b.name === assignedBrokerId || (userProfile?.broker && b.name === userProfile.broker));

        if (matchedBroker && matchedBroker.phone) {
          await addDoc(collection(db, 'whatsapp_logs'), {
            senderPhone: '0945430030',
            recipientName: matchedBroker.name,
            recipientPhone: matchedBroker.phone,
            message: `مرحباً ${matchedBroker.name}، قام عميلك (${formData.clientName.trim()} - ${formData.clientPhone.trim()}) بحجز موعد لمعاينة عقار (${serviceTitle || property?.title || 'عقار'}) بتاريخ ${formData.date} في تمام الساعة ${formData.time}.`,
            status: 'sent',
            createdAt: new Date().toISOString(),
            type: 'broker_appointment_notification'
          });
        }
      } catch (waErr) {
        console.warn("Could not send automated WhatsApp message to broker:", waErr);
      }

      setSuccess(true);
      if (onBookingSuccess) {
        onBookingSuccess();
      }
    } catch (err) {
      console.error("Failed to save booking:", err);
      alert(t("عذراً، حدث خطأ أثناء إرسال طلب الحجز. يرجى المحاولة مرة أخرى.", "Sorry, an error occurred while submitting the booking. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white dark:bg-[#0A192F] text-brand-navy dark:text-white rounded-[2.5rem] p-6 sm:p-8 w-full max-w-lg relative shadow-2xl border border-brand-navy/5 dark:border-white/10 max-h-[90vh] overflow-y-auto my-auto">
        
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-gold/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-brand-navy/5 rounded-full blur-2xl pointer-events-none" />

        <button 
          onClick={onClose} 
          className={cn(
            "absolute top-5 p-2 text-zinc-400 hover:text-brand-navy hover:bg-zinc-100 rounded-full transition-all duration-200 cursor-pointer",
            isAr ? "left-5" : "right-5"
          )}
        >
          <X size={20} />
        </button>

        {!success ? (
          <div>
            <div className="mb-6 text-center sm:text-right">
              <span className="text-[10px] font-black text-brand-gold tracking-widest uppercase bg-brand-navy/5 px-2.5 py-1 rounded-md">
                {t('نظام الحجز والدفع الذكي 💳', 'Smart Booking & Payment 💳')}
              </span>
              <h2 className={cn("text-2xl font-serif font-black text-brand-navy mt-2 flex items-center gap-2", isAr ? "justify-start" : "justify-start flex-row-reverse")}>
                <Calendar className="text-brand-gold shrink-0" size={24} />
                <span>{t('حجز موعد معاينة ميدانية', 'Book Viewing Appointment')}</span>
              </h2>
              {serviceTitle && (
                <p className="text-xs text-zinc-500 font-bold mt-1 bg-brand-cream/30 p-2 rounded-xl border border-brand-navy/5 inline-block text-right">
                  🏠 {t('العقار:', 'Property:')} <span className="text-brand-navy font-black">{serviceTitle}</span>
                </p>
              )}
            </div>

            {/* Stepper Header */}
            <div className="flex justify-between items-center bg-brand-navy/5 p-2.5 rounded-2xl mb-6">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  step === 1 ? "bg-brand-navy text-brand-gold" : "bg-emerald-100 text-emerald-800"
                )}>
                  {step === 1 ? "1" : "✓"}
                </span>
                <span className="text-xs font-bold text-brand-navy">{t('تفاصيل الموعد', 'Appointment Details')}</span>
              </div>
              <div className="w-8 h-0.5 bg-brand-navy/10" />
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  step === 2 ? "bg-brand-gold text-brand-navy font-black" : "bg-zinc-200 text-zinc-500"
                )}>
                  2
                </span>
                <span className="text-xs font-bold text-brand-navy">{t('تأكيد الدفع (٥٠ ألف ل.س)', 'Pay Booking Fee (50K SYP)')}</span>
              </div>
            </div>

            {step === 1 ? (
              /* STEP 1: Details form */
              <form onSubmit={goToPaymentStep} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 text-right">
                    <label className="text-xs font-bold text-brand-navy block">{t('الاسم الكريم', 'Your Name')}</label>
                    <div className="relative">
                      <input 
                        required 
                        type="text"
                        className="w-full p-3 pr-10 rounded-xl border border-zinc-200 focus:border-brand-gold focus:outline-none text-xs font-semibold" 
                        placeholder={t("الاسم الكامل", "Full Name")} 
                        value={formData.clientName}
                        onChange={e => setFormData(p => ({...p, clientName: e.target.value}))} 
                      />
                      <User className="absolute top-3.5 right-3 text-zinc-400" size={16} />
                    </div>
                  </div>

                  <div className="space-y-1 text-right">
                    <label className="text-xs font-bold text-brand-navy block">{t('رقم الواتساب', 'WhatsApp Phone')}</label>
                    <div className="relative">
                      <input 
                        required 
                        type="tel"
                        className="w-full p-3 pr-10 rounded-xl border border-zinc-200 focus:border-brand-gold focus:outline-none text-xs font-semibold font-mono text-left" 
                        placeholder="09xxxxxxxx" 
                        value={formData.clientPhone}
                        onChange={e => setFormData(p => ({...p, clientPhone: e.target.value}))} 
                      />
                      <Phone className="absolute top-3.5 right-3 text-zinc-400" size={16} />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 text-right">
                    <label className="text-xs font-bold text-brand-navy block">{t('تاريخ الزيارة', 'Date of Visit')}</label>
                    <input 
                      required 
                      type="date" 
                      className="w-full p-3 rounded-xl border border-zinc-200 focus:border-brand-gold focus:outline-none text-xs font-semibold" 
                      value={formData.date}
                      onChange={e => handleDateChange(e.target.value)} 
                    />
                  </div>

                  <div className="space-y-1 text-right">
                    <label className="text-xs font-bold text-brand-navy block">{t('توقيت المعاينة (9:00 ص - 6:00 م)', 'Time (9:00 AM - 6:00 PM)')}</label>
                    <input 
                      required 
                      type="time" 
                      min="09:00"
                      max="18:00"
                      className={cn(
                        "w-full p-3 rounded-xl border focus:border-brand-gold focus:outline-none text-xs font-semibold",
                        timeError ? 'border-amber-500 bg-amber-50/20' : 'border-zinc-200'
                      )} 
                      value={formData.time}
                      onChange={e => handleTimeChange(e.target.value)} 
                    />
                    {timeError && (
                      <p className="text-[10px] text-amber-600 font-bold mt-1 text-right">{timeError}</p>
                    )}
                  </div>
                </div>

                {weatherInfo && (
                  <div className="p-4 bg-brand-navy/5 rounded-2xl border border-brand-navy/10 space-y-2 text-right">
                    <div className="flex flex-wrap items-center gap-2 text-brand-navy font-bold text-xs">
                      <span className="text-lg shrink-0">{weatherInfo.icon}</span>
                      <span className="shrink-0">{t('الطقس المتوقع (', 'Expected weather (')}{property?.governorate || 'دمشق'}):</span>
                      <span className="text-brand-gold font-black shrink-0">{weatherInfo.conditionText[language]}</span>
                      <span className="bg-brand-navy/10 text-brand-navy px-1.5 py-0.5 rounded-md text-[10px] font-mono shrink-0">{weatherInfo.temp}°م</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 font-semibold leading-relaxed">
                      {weatherInfo.description[language]}
                    </p>
                    <div className="pt-2 border-t border-dashed border-zinc-200">
                      <span className="block text-[10px] font-black text-brand-navy mb-1">💡 {t('نصائح المعاينة الميدانية لهذا الطقس:', 'Field viewing tips for this weather:')}</span>
                      <ul className="space-y-1">
                        {weatherInfo.tips[language].map((tip: string, idx: number) => (
                          <li key={idx} className="text-[10px] text-zinc-500 font-bold flex items-start gap-1">
                            <span className="text-brand-gold shrink-0">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full py-3.5 bg-brand-navy hover:bg-brand-gold text-brand-gold hover:text-brand-navy rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer border-0"
                >
                  <Sparkles size={16} />
                  <span>{t('الاستمرار لخطوة دفع رسوم الحجز 🚀', 'Continue to Payment Step 🚀')}</span>
                </button>
              </form>
            ) : (
              /* STEP 2: Checkout / Payment form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Invoice Overview */}
                <div className="bg-brand-cream/20 border border-brand-navy/5 p-4 rounded-2xl text-right space-y-2 text-xs font-semibold">
                  <div className="flex justify-between items-center border-b border-brand-navy/5 pb-2">
                    <span className="text-zinc-500">{t('تفاصيل رسوم الخدمة:', 'Service Fee details:')}</span>
                    <span className="text-brand-navy font-black">{t('حجز وتأمين موعد معاينة', 'Booking & Viewing Security')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500">{t('المبلغ المطلوب بالليرة السورية:', 'Required Amount (SYP):')}</span>
                    <span className="text-brand-navy font-black text-lg font-mono">50,000 ل.س</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-brand-gold-dark border-t border-brand-navy/5 pt-2">
                    <span>{t('القيمة التقريبية بالدولار الأمريكي:', 'Equivalent USD Value:')}</span>
                    <span className="font-bold font-mono">${feeUSD}</span>
                  </div>
                </div>

                {/* Payment Gateway Selector */}
                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-brand-navy block mb-1.5">{t('اختر بوابة الدفع الكاش الآمنة', 'Choose Secure Cash Channel')}</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'card', label: t('بطاقة ائتمان', 'Credit Card'), icon: <CreditCard size={14} /> },
                      { id: 'syriatel', label: t('سيريتل كاش', 'Syriatel Cash'), icon: <span className="font-extrabold text-[10px]">S</span> },
                      { id: 'mtn', label: t('MTN كاش', 'MTN Cash'), icon: <span className="font-extrabold text-[10px]">M</span> }
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={cn(
                          "flex-1 py-2.5 px-1.5 rounded-xl border font-bold text-xxs sm:text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                          paymentMethod === method.id 
                            ? "bg-brand-navy text-brand-gold border-brand-navy shadow-lg"
                            : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                        )}
                      >
                        {method.icon}
                        <span>{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-Forms */}
                {paymentMethod === 'card' ? (
                  <div className="space-y-3">
                    <div className="space-y-1 text-right">
                      <label className="text-[11px] text-zinc-500 font-bold block">{t('رقم البطاقة الائتمانية', 'Credit Card Number')}</label>
                      <input 
                        type="text" 
                        required
                        placeholder="••••  ••••  ••••  ••••" 
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-center tracking-widest focus:border-brand-gold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1 text-right">
                      <label className="text-[11px] text-zinc-500 font-bold block">{t('اسم حامل البطاقة الكامل', 'Cardholder Full Name')}</label>
                      <input 
                        type="text" 
                        required
                        placeholder={t("الاسم كما هو مكتوب على البطاقة", "Name on Card")}
                        value={cardHolder}
                        onChange={e => setCardHolder(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs focus:border-brand-gold focus:outline-none text-right"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1 text-right">
                        <label className="text-[11px] text-zinc-500 font-bold block">{t('تاريخ الانتهاء', 'Expiry Date')}</label>
                        <input 
                          type="text" 
                          required
                          placeholder="MM/YY" 
                          value={expiry}
                          onChange={e => setExpiry(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-center focus:border-brand-gold focus:outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1 text-right">
                        <label className="text-[11px] text-zinc-500 font-bold block">{t('رمز التحقق CVV', 'CVV Code')}</label>
                        <input 
                          type="password" 
                          maxLength={3}
                          required
                          placeholder="•••" 
                          value={cvv}
                          onChange={e => setCvv(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-center focus:border-brand-gold focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 text-right text-[10px] text-orange-800 flex gap-2 items-start leading-relaxed font-semibold">
                      <CircleAlert size={16} className="shrink-0 mt-0.5" />
                      <div>
                        {t(
                          'سيتم إرسال طلب USSD آمن لتأكيد خصم الرسوم البالغة ٥٠,٠٠٠ ل.س فور تأكيدك الطلب أدناه.',
                          'A secure USSD payment request will be sent to authorize the 50,000 SYP fee once you confirm below.'
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <label className="text-[11px] text-zinc-500 font-bold block">{t('رقم حساب خط المحفظة الكاش', 'Wallet Phone Account')}</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="09••••••••" 
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-center tracking-widest focus:border-brand-gold focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1 text-right">
                      <label className="text-[11px] text-zinc-500 font-bold block">{t('رمز PIN الشخصي للمحفظة', 'Wallet PIN Code')}</label>
                      <input 
                        type="password" 
                        required
                        maxLength={4}
                        placeholder="••••" 
                        value={pinCode}
                        onChange={e => setPinCode(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-center focus:border-brand-gold focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Safe Checkout Badge */}
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 justify-center">
                  <ShieldCheck className="text-emerald-500 shrink-0" size={14} />
                  <span>{t('معالجة الدفع مشفرة بالكامل ومتوافقة مع المعايير الأمنية.', 'Payments are encrypted and completely secure.')}</span>
                </div>

                {/* Back and Confirm Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-2xl font-bold text-xs cursor-pointer border-0 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                  >
                    {t('رجوع', 'Back')}
                  </button>
                  <motion.button 
                    disabled={loading} 
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    className="group relative flex-1 py-4 bg-gradient-to-r from-brand-navy via-[#1F374C] to-brand-navy hover:from-[#1F374C] hover:to-brand-navy text-brand-gold rounded-2xl font-black text-xs sm:text-sm transition-all duration-300 shadow-xl hover:shadow-brand-gold/20 flex items-center justify-center gap-2.5 cursor-pointer border border-brand-gold/40 overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-brand-gold/0 via-brand-gold/25 to-brand-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
                        <span className="animate-pulse">{t('جاري حجز الموعد ومعالجة الدفع...', 'Booking & Processing Securely...')}</span>
                      </div>
                    ) : (
                      <>
                        <ShieldCheck size={18} className="text-brand-gold shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                        <span className="tracking-wide">{t('تأكيد الدفع وحجز الموعد 👑', 'Pay & Secure Appointment 👑')}</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* SUCCESS SCREEN */
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="text-center py-6 sm:py-8 space-y-6"
          >
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
              <div className="relative p-4 bg-emerald-50 rounded-full border-2 border-emerald-500/30 text-emerald-600 shadow-lg">
                <CheckCircle2 size={56} className="animate-bounce" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="inline-block px-4 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold font-serif">
                {t('عملية ناجحة ١٠٠٪', '100% Successful Transaction')}
              </span>
              <h3 className="font-serif font-black text-xl sm:text-2xl text-brand-navy">
                {t('تم حجز الموعد وتأكيد الدفع بنجاح! 👑🎉', 'Appointment & Payment Confirmed! 👑🎉')}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 font-medium leading-relaxed max-w-md mx-auto px-4">
                {t(
                  'شكراً لكم! لقد تم تسوية رسوم الحجز البالغة ٥٠,٠٠٠ ل.س بنجاح. سنرسل إليك كود المعاينة وبطاقة المرور المباشرة عبر واتساب فوراً لمطابقة الزيارة.',
                  'Thank you! The booking fee of 50,000 SYP has been successfully processed. We will send the viewing pass and code via WhatsApp immediately.'
                )}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-brand-cream/60 to-brand-cream/30 p-5 rounded-3xl border border-brand-navy/10 text-right space-y-3 text-xs sm:text-sm font-semibold max-w-sm mx-auto shadow-inner">
              <div className="flex justify-between items-center pb-2 border-b border-brand-navy/5">
                <span className="text-zinc-500">📅 {t('التاريخ المحجوز:', 'Booked Date:')}</span>
                <span className="text-brand-navy font-black font-mono">{formData.date}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-brand-navy/5">
                <span className="text-zinc-500">⏰ {t('وقت المعاينة:', 'Viewing Time:')}</span>
                <span className="text-brand-navy font-black font-mono">{formData.time}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-brand-navy/5">
                <span className="text-zinc-500">📞 {t('رقم الواتساب:', 'WhatsApp Phone:')}</span>
                <span className="text-brand-navy font-black font-mono" dir="ltr">{formData.clientPhone}</span>
              </div>
              <div className="text-brand-navy pt-1 flex justify-between items-center">
                <span className="font-bold text-zinc-600">💰 {t('الرسوم المستقطعة:', 'Processed Fee:')}</span>
                <span className="font-black text-emerald-600 font-mono text-sm">50,000 ل.س / (${feeUSD})</span>
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose} 
              className="px-10 py-3.5 bg-gradient-to-r from-brand-navy to-[#0F223D] hover:from-[#0F223D] hover:to-brand-navy text-brand-gold rounded-2xl text-xs sm:text-sm font-black shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-brand-gold/30"
            >
              {t('موافق، إغلاق النافذة ✨', 'Ok, Close Window ✨')}
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
