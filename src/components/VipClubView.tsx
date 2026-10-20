import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown, 
  Check, 
  Lock, 
  ChevronRight, 
  CreditCard, 
  Sparkles, 
  PhoneCall, 
  Map, 
  Send, 
  Building, 
  Compass, 
  ShieldCheck, 
  ArrowLeft,
  CircleAlert
} from 'lucide-react';
import { Property } from '../types';
import { cn } from '../lib/utils';

interface VipClubViewProps {
  allProperties: Property[];
  isVipSubscriber: boolean;
  onSubscribeSuccess: () => void;
  onBook: (property?: Property) => void;
  onViewDetails: (property: Property) => void;
  favorites: Record<string, any>;
  toggleFavorite: (propertyId: string) => void;
  compareIds: string[];
  toggleCompare: (propertyId: string) => void;
  displayCurrency: 'SYP' | 'USD';
  exchangeRate: number;
  vipRequestStatus?: 'pending' | 'approved' | 'rejected' | null;
  vipRequestDetails?: any;
  onRequestSubscription?: (details: any) => Promise<void>;
  currentUser?: any;
  onAuthTrigger?: () => void;
  language?: 'ar' | 'en';
}

export function VipClubView({
  allProperties,
  isVipSubscriber,
  onSubscribeSuccess,
  onBook,
  onViewDetails,
  favorites,
  toggleFavorite,
  compareIds,
  toggleCompare,
  displayCurrency,
  exchangeRate,
  vipRequestStatus,
  vipRequestDetails,
  onRequestSubscription,
  currentUser,
  onAuthTrigger,
  language = 'ar'
}: VipClubViewProps) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'syriatel' | 'mtn'>('card');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Custom request states
  const [requestBudget, setRequestBudget] = useState('');
  const [requestType, setRequestType] = useState('سكنية فاخرة');
  const [requestRegion, setRequestRegion] = useState('دمشق - المالكي / أبو رمانة');
  const [requestNotes, setRequestNotes] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // Filter VIP listings
  const vipProperties = allProperties.filter(p => p.isPremium);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      if (onAuthTrigger) {
        onAuthTrigger();
      } else {
        alert("يرجى تسجيل الدخول أولاً لإرسال طلب الاشتراك.");
      }
      return;
    }

    setIsSubmittingPayment(true);
    
    const requestDetails = {
      paymentMethod,
      phoneNumber: paymentMethod !== 'card' ? phoneNumber : null,
      cardNumber: paymentMethod === 'card' ? cardNumber : null,
      cardHolder: paymentMethod === 'card' ? cardHolder : null,
      expiry: paymentMethod === 'card' ? expiry : null,
      cvv: paymentMethod === 'card' ? cvv : null,
      requestedAt: new Date().toISOString(),
      amount: 75000,
    };

    try {
      if (onRequestSubscription) {
        await onRequestSubscription(requestDetails);
      }
      setIsSubmittingPayment(false);
      setPaymentSuccess(true);
    } catch (err) {
      console.error("Payment registration error:", err);
      setIsSubmittingPayment(false);
      alert("حدث خطأ أثناء معالجة طلبك، يرجى المحاولة لاحقاً.");
    }
  };

  const handleCustomRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingRequest(true);
    setTimeout(() => {
      setIsSendingRequest(false);
      setRequestSent(true);
      setTimeout(() => {
        setRequestSent(false);
        setRequestBudget('');
        setRequestNotes('');
      }, 4000);
    }, 1500);
  };

  // Local helper to parse localized prices based on selected display currency
  const getDisplayPrice = (priceStr: string) => {
    if (!priceStr) return '';
    if (displayCurrency === 'USD') {
      const numeric = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
      if (isNaN(numeric)) return priceStr;
      const usdVal = Math.round(numeric / exchangeRate);
      return `$${usdVal.toLocaleString('en-US')}`;
    }
    return priceStr;
  };

  return (
    <div className={`bg-gradient-to-b from-[#0A192F] via-[#0F2647] to-[#0A192F] text-white min-h-screen ${language === 'ar' ? 'text-right' : 'text-left'} font-sans selection:bg-brand-gold selection:text-brand-navy pb-24`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Premium Header/Banner */}
      <div className="relative pt-36 pb-20 overflow-hidden border-b border-brand-gold/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.15),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(10,25,47,0.85),rgba(10,25,47,0.95))] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-brand-gold/10 border border-brand-gold/30 rounded-full text-brand-gold text-xs font-bold tracking-wide mb-6 mx-auto"
          >
            <Crown size={12} className="animate-spin" style={{ animationDuration: '8s' }} />
            <span>{t('تنظيم العقود والفرص الاستثمارية الحصرية', 'Managing exclusive contracts & investment opportunities')}</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-6xl font-serif font-black tracking-tight leading-tight"
          >
            {language === 'ar' ? (
              <>مجلس ونادي <span className="text-transparent bg-clip-text bg-gradient-to-l from-brand-gold via-amber-400 to-amber-200">الـ VIP العقاري</span></>
            ) : (
              <>The VIP <span className="text-transparent bg-clip-text bg-gradient-to-l from-brand-gold via-amber-400 to-amber-200">Real Estate Club</span> & Board</>
            )}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white/60 max-w-2xl mx-auto mt-6 text-sm md:text-base leading-relaxed"
          >
            {t(
              'نخبة المحفظة العقارية السورية مطروحة خصيصاً لرجال الأعمال والمستثمرين الطامحين لتحقيق عوائد سنوية تتعدى الـ 25%. خيارات ممتازة مجهزة برقع طابو خضراء وتسهيلات قانونية كاملة.',
              'The elite of the Syrian real estate portfolio, presented specifically for business owners and investors aspiring to achieve annual returns exceeding 25%. Premium options with green title deeds.'
            )}
          </motion.p>
        </div>
      </div>

      <div className="max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        {!isVipSubscriber ? (
          /* Subscription Sales Page Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left: Benefits list */}
            <div className="lg:col-span-7 space-y-8">
              <h2 className="text-2xl font-serif font-bold text-brand-gold pr-3 border-r-4 border-brand-gold">مزايا عضوية النخبة الحصرية</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    title: "تصفح أسبق للفرص العقارية",
                    desc: "اطلع على العقارات والصفقات المطروحة بداعي السفر أو التخارج المالي 48 ساعة قبل نشرها للعامة."
                  },
                  {
                    title: "الخرائط الإحداثية والموقع الدقيق",
                    desc: "الوصول اللامحدود لكافة تفاصيل الموقع، أسماء شوارع المعاينة، وإحداثيات GPS المباشرة."
                  },
                  {
                    title: "ملفات CAD والوثائق الموثقة",
                    desc: "تحميل مخططات AutoCAD ثنائية الأبعاد، التفاصيل الإنشائية، وسندات طابو الـ 2400 سهم."
                  },
                  {
                    title: "مستشار استثماري مخصص",
                    desc: "خط هاتف ساخن وفريق مخصص على مدار الساعة لتحليل الجدوى الاستثمارية ومتابعة المعاملات."
                  },
                  {
                    title: "معاينة ممتازة بسيارة خاصة",
                    desc: "طلب جولات ميدانية مجانية مرفهة لك ولكافة أفراد عائلتك لمعاينة المواقع برفقة وكيل مميز."
                  },
                  {
                    title: "رسوم وساطة مخفضة",
                    desc: "خصم 50% كاملة على رسوم السمسرة والوساطة والتوثيق القانوني عند إتمام البيع والشراء."
                  }
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-brand-gold/30 hover:bg-white/[0.05] transition-all group flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm mb-1">{item.title}</h4>
                      <p className="text-white/50 text-[11px] leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* VIP Customer Testimonial block */}
              <div className="p-8 rounded-3xl bg-gradient-to-r from-brand-gold/5 to-amber-500/10 border border-brand-gold/20 relative mt-10">
                <Crown className="absolute left-6 top-6 text-brand-gold/15 w-24 h-24 pointer-events-none" />
                <p className="text-sm italic leading-relaxed text-brand-gold">"ساعدني اشتراك نادي VIP العقاري في حسم صفقة مجمع تجاري في حلب بأقل من السعر السائد بنحو 12%. الخدمة الاستشارية والتنسيق القانوني على أعلى مستوى."</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-gold text-brand-navy font-bold flex items-center justify-center text-xs">م م</div>
                  <div>
                    <h5 className="text-xs font-bold">مجد الملاخ</h5>
                    <p className="text-[10px] text-white/50">مستثمر ورجل أعمال، دمشق</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Simulated Checkout Panel or Pending Status Container */}
            <div className="lg:col-span-5 bg-[#0D223F] p-8 md:p-10 rounded-3xl border border-brand-gold/25 shadow-2xl relative">
              {vipRequestStatus === 'pending' || paymentSuccess ? (
                <div className="text-center py-6 space-y-6 animate-fadeIn">
                  <div className="w-20 h-20 bg-brand-gold/15 border border-brand-gold/30 text-brand-gold rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Crown size={36} className="text-brand-gold" />
                  </div>
                  
                  <div className="space-y-2">
                    <span className="bg-amber-500/20 text-brand-gold text-[10px] font-black px-3 py-1 rounded-full inline-block">
                      ⏳ قيد المراجعة والتدقيق
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-white">تم استلام طلبك بنجاح</h3>
                    <p className="text-xs text-white/75 leading-relaxed">
                      طلب تفعيل اشتراك <span className="text-brand-gold font-bold">VIP</span> الخاص بك قيد التحقق الإداري حالياً.
                    </p>
                  </div>

                  <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl text-xs text-right space-y-2.5">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/40">حالة الفوترة:</span>
                      <span className="text-brand-gold font-bold">بانتظار تأكيد الدفع يدوياً</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">قيمة الاشتراك:</span>
                      <span className="text-white font-mono font-bold">75,000 ل.س / شهرياً</span>
                    </div>
                    {(vipRequestDetails?.paymentMethod || paymentMethod) && (
                      <div className="flex justify-between">
                        <span className="text-white/40">طريقة التحويل:</span>
                        <span className="text-white font-bold">
                          {(vipRequestDetails?.paymentMethod || paymentMethod) === 'card' ? '💳 بطاقة ائتمان' :
                           (vipRequestDetails?.paymentMethod || paymentMethod) === 'syriatel' ? '📱 سيريتل كاش' : '📱 MTN كاش'}
                        </span>
                      </div>
                    )}
                    {vipRequestDetails?.requestedAt && (
                      <div className="flex justify-between text-[10px] text-white/30 pt-1 border-t border-white/5">
                        <span>تاريخ تقديم الطلب:</span>
                        <span>{new Date(vipRequestDetails.requestedAt).toLocaleString('ar-SY')}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-white/50 leading-relaxed">
                    يقوم المسؤولون بمطابقة الحسابات وتفعيل الأذونات خلال دقائق قليلة. سيتم فتح قسم كبار الشخصيات تلقائياً فور تأكيد عملية الدفع من لوحة التحكم.
                  </p>

                  <div className="pt-4 border-t border-white/5 text-[10px] text-brand-gold font-bold">
                    🛡️ خط الدعم المباشر لنادي VIP: 0945 430 030
                  </div>
                </div>
              ) : (
                <>
                  {vipRequestStatus === 'rejected' && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6 text-xs text-red-200 text-right leading-relaxed font-sans">
                      ⚠️ <strong>تم رفض طلبك السابق:</strong> لم نتمكن من مطابقة تحويل الرسوم للمعلومات المدخلة. يرجى إعادة المحاولة والتأكد من صحة إدخال بيانات التحويل، أو الاتصال بالدعم.
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <span className="text-brand-gold text-[10px] font-bold tracking-widest uppercase mb-1 block">تفعيل فوري آمن</span>
                    <h3 className="font-serif text-2xl font-bold">بوابة اشتراك النخبة</h3>
                    <div className="mt-4 py-2 bg-brand-gold/10 border border-brand-gold/20 rounded-2xl inline-block px-5">
                      <span className="text-brand-gold font-bold font-mono text-2xl">75,000 ل.س</span>
                      <span className="text-xs text-white/60"> / شهرياً</span>
                    </div>
                    <p className="text-[10px] text-white/40 mt-2">السعر يعادل تقريباً 5$ فقط. رسوم إدارية تدعم الصيانة المستمرة والوكلاء الاستشاريين.</p>
                  </div>

                  <div className="flex gap-2.5 mb-6">
                    {[
                      { id: 'card', label: 'بطاقة فيزا/ماستر', icon: <CreditCard size={15} /> },
                      { id: 'syriatel', label: 'سيريتل كاش', icon: <strong className="text-[10px]">S</strong> },
                      { id: 'mtn', label: 'MTN كاش', icon: <strong className="text-[10px]">M</strong> }
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={cn(
                          "flex-1 py-3 px-2 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                          paymentMethod === method.id 
                            ? "bg-brand-gold text-brand-navy border-brand-gold shadow-lg shadow-brand-gold/10 scale-102"
                            : "bg-white/[0.03] text-white/60 border-white/5 hover:bg-white/[0.06]"
                        )}
                      >
                        {method.icon}
                        <span>{method.label}</span>
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    {paymentMethod === 'card' ? (
                      <>
                        <div>
                          <label className="block text-[11px] text-white/50 mb-1.5 font-bold">رقم بطاقة الائتمان</label>
                          <input 
                            type="text" 
                            required
                            placeholder="••••  ••••  ••••  ••••" 
                            value={cardNumber}
                            onChange={e => setCardNumber(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-center tracking-widest focus:border-brand-gold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-white/50 mb-1.5 font-bold">اسم حامل البطاقة بالكامل</label>
                          <input 
                            type="text" 
                            required
                            placeholder="أدخل الاسم الثلاثي بالبريد الإداري" 
                            value={cardHolder}
                            onChange={e => setCardHolder(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-brand-gold focus:outline-none placeholder:text-white/25 text-right font-medium"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] text-white/50 mb-1.5 font-bold">تاريخ الانتهاء</label>
                            <input 
                              type="text" 
                              required
                              placeholder="MM/YY" 
                              value={expiry}
                              onChange={e => setExpiry(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-center focus:border-brand-gold focus:outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-white/50 mb-1.5 font-bold">الرمز السري (CVV)</label>
                            <input 
                              type="password" 
                              maxLength={3}
                              required
                              placeholder="•••" 
                              value={cvv}
                              onChange={e => setCvv(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-center focus:border-brand-gold focus:outline-none font-mono"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 mb-4 text-xs text-orange-200 flex gap-2.5 items-start">
                          <CircleAlert size={20} className="shrink-0" />
                          <div>
                            <span className="font-bold block mb-0.5">تعليمات التحويل والفوترة</span>
                            يرجى تعيين رمز الدفع السريع بعد إدخال رقم خطك. سيتم إرسال USSD موجه لتأكيد قبول الخصم التلقائي بقيمة 75,000 ليرة سورية.
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] text-white/50 mb-1.5 font-bold">رقم حساب محفظة الكاش المستهدفة</label>
                          <input 
                            type="tel" 
                            required
                            placeholder="09••••••••" 
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-center tracking-widest focus:border-brand-gold focus:outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-white/50 mb-1.5 font-bold">الرمز الشخصي للمحفظة PIN</label>
                          <input 
                            type="password" 
                            required
                            maxLength={4}
                            placeholder="••••" 
                            value={pinCode}
                            onChange={e => setPinCode(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-center focus:border-brand-gold focus:outline-none"
                          />
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingPayment}
                      className="w-full bg-gradient-to-r from-brand-gold via-amber-500 to-brand-gold text-brand-navy font-bold py-4 rounded-xl shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 mt-4"
                    >
                      {isSubmittingPayment ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-brand-navy" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          جاري إرسال طلب تفعيل النخبة...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Crown size={15} />
                          إرسال طلب تفعيل النخبة ⏳
                        </span>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 pt-5 border-t border-white/5 text-center flex justify-around items-center text-[10px] text-white/40">
                    <span className="flex items-center gap-1 font-bold"><ShieldCheck size={12} className="text-brand-gold" /> حماية SSL آمنة</span>
                    <span className="flex items-center gap-1 font-bold">● نظام تفعيل يدوي موثوق</span>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          /* VIP Active Lounge Room Layout */
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-16"
          >
            {/* VIP Welcoming Hub Card */}
            <div className="bg-gradient-to-r from-[#1E304C] to-[#122238] p-8 md:p-12 rounded-3xl border border-brand-gold/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="absolute right-0 top-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,rgba(197,160,89,0.1),transparent_60%)] pointer-events-none" />
              <div className="absolute left-0 bottom-0 w-64 h-64 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.05),transparent_60%)] pointer-events-none" />
              
              <div className="space-y-4 max-w-2xl relative z-10 text-right">
                <span className="text-brand-gold font-serif font-black text-xs tracking-widest uppercase flex items-center gap-1">
                  <Crown size={14} className="text-brand-gold" /> مجلس النخبة مفعّل
                </span>
                <h2 className="text-3xl md:text-4xl font-serif font-bold">بوابة النخبة الخاصة بك</h2>
                <p className="text-white/70 text-sm leading-relaxed">
                  أهلاً بك مستشارنا ومستثمرنا الفاضل. كافة العقارات الاستثنائية والصفقات المغلقة مسرحة الآن لمشاهدتك الكاملة. لقد قمنا بتصفية المحفظة لتشمل الأصول المجهزة بأقصى معايير السلامة والتأجير السريع.
                </p>
                <div className="flex flex-wrap gap-4 pt-3 text-xs">
                  <span className="bg-brand-gold/15 border border-brand-gold/30 text-brand-gold px-4 py-2 rounded-xl font-bold flex items-center gap-1.5">
                    ⏱️ اشتراكك صالح حتى: 2027-05-30
                  </span>
                  <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-xl font-bold flex items-center gap-1.5">
                    ● مستشارك الشخصي: نشط ومتصل حالياً
                  </span>
                </div>
              </div>

              {/* Direct Support Hub numbers */}
              <div className="text-center md:text-left shrink-0 relative z-10 bg-white/[0.02] border border-white/5 p-6 rounded-2xl w-full md:w-auto">
                <span className="text-white/40 text-[10px] uppercase font-bold block mb-1">خط التواصل السريع لنادي النخبة</span>
                <a href="tel:0945430030" className="text-brand-gold text-2xl font-serif font-black flex items-center justify-center md:justify-end gap-2 hover:scale-105 transition-transform">
                  <PhoneCall size={20} className="animate-pulse" />
                  <span>0945 430 030</span>
                </a>
                <span className="text-white/50 text-[9px] mt-1.5 block">معاينات مباشرة، عقود مسودة فورياً، ومستشار قانوني مخصص لك.</span>
              </div>
            </div>

            {/* Premium Listings Section */}
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="text-right">
                  <span className="text-brand-gold font-bold tracking-widest text-xs uppercase">الصفقات الفاخرة المعتمدة</span>
                  <h3 className="text-3xl font-serif font-bold mt-2">عقارات الـ VIP الحصرية</h3>
                  <p className="text-white/50 text-xs mt-1.5">تم التحقق من الوثائق القانونية والسجل الطابو الأخضر للملكية.</p>
                </div>
                <span className="text-xs text-brand-gold bg-brand-gold/10 px-4 py-2 rounded-xl font-bold border border-brand-gold/20">
                  مجموع الأصول المغلقة: {vipProperties.length} عقار استثماري
                </span>
              </div>

              {/* Grid of VIP Properties (Fully unlocked) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {vipProperties.map((property) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -8 }}
                    className="group bg-slate-900 border border-brand-gold/25 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
                  >
                    <div>
                      {/* Image block directly accessible with controls */}
                      <div className="relative h-64 overflow-hidden cursor-pointer" onClick={() => onViewDetails(property)}>
                        <img 
                          src={property.images && property.images.length > 0 ? property.images[0] : "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"} 
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute top-4 right-4 bg-brand-navy border border-brand-gold/30 text-brand-gold text-[10px] px-3 py-1.5 rounded-xl font-bold font-sans">
                          عقد تسويق حصري ومسجل 🛡️
                        </div>
                        {property.governorate && (
                          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-md font-bold">
                            📍 {property.governorate}
                          </div>
                        )}
                      </div>

                      {/* Content block */}
                      <div className="p-6 text-right space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-brand-gold bg-brand-gold/10 border border-brand-gold/20 text-[10px] p-1 px-2.5 rounded-lg font-black">{property.type === 'Residential' ? 'سكني ملكي' : 'تجاري استثماري'}</span>
                          <span className="text-[10px] text-white/50 font-bold">طراز: {property.yearBuilt} م</span>
                        </div>
                        <h4 className="font-serif font-bold text-lg text-white group-hover:text-brand-gold transition-colors">{property.title}</h4>
                        <p className="text-white/60 text-xs line-clamp-2 leading-relaxed">{property.description}</p>
                        
                        {/* Area & Rooms details */}
                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5 text-center text-[10px]">
                          <div className="space-y-1">
                            <span className="text-white/40 block">المساحة</span>
                            <span className="font-bold text-brand-gold">{property.area} م²</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-white/40 block">الغرف</span>
                            <span className="font-bold text-brand-gold">{property.rooms} غرف</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-white/40 block">التدفئة</span>
                            <span className="font-bold text-brand-gold truncate max-w-[70px] inline-block">ذكية</span>
                          </div>
                        </div>

                        {/* Power details */}
                        <div className="p-2.5 rounded-xl bg-amber-500/5 border border-brand-gold/10 text-[9px] text-brand-gold font-bold leading-relaxed flex gap-2 items-center justify-end">
                          <span>{property.electricityType || "كهرباء مستمرة على مدار الساعة"}</span>
                          <span>⚡</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom controls */}
                    <div className="p-6 pt-0 space-y-4">
                      {/* Price Section */}
                      <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
                        <span className="text-xs text-white/50">السعر المعزز:</span>
                        <span className="text-base font-serif font-black text-brand-gold">{getDisplayPrice(property.price)}</span>
                      </div>

                      {/* CTAs */}
                      <div className="flex gap-2.5">
                        <button 
                          onClick={() => onViewDetails(property)}
                          className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
                        >
                          تصفح كامل التفاصيل 🔍
                        </button>
                        <button 
                          onClick={() => onBook(property)}
                          className="flex-1 py-3 bg-brand-gold text-brand-navy hover:scale-102 font-bold text-xs rounded-xl shadow-lg shadow-brand-gold/5 transition-all cursor-pointer"
                        >
                          معاينة ميدانية فورية 🚗
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Secret off-market sourcing request form */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-16 items-start border-t border-white/10">
              <div className="lg:col-span-4 space-y-4 text-right">
                <span className="text-brand-gold text-[10px] font-bold tracking-widest uppercase">تلبية الطلبات الصعبة</span>
                <h3 className="font-serif text-2xl font-bold">طلب عقار بمواصفات حصرية</h3>
                <p className="text-white/60 text-xs leading-relaxed">
                  إذا لم تجد ما توافق مع متطلباتك الدقيقة في محفظة الـ VIP، قم بملء هذا الطلب الموجه مباشرة للبراء النعيمي للاستحواذ الصامت على العقارات المستهدفة عبر دمشق والمحافظات.
                </p>
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3.5 text-xs">
                  <div className="flex gap-2 items-center text-brand-gold font-bold">
                    <Compass size={15} /> <span>تنقيب شامل خارج السوق الرسمي</span>
                  </div>
                  <div className="flex gap-2 items-center text-brand-gold font-bold">
                    <Building size={15} /> <span>مفاوضات بالوكالة لضمان الكتمان</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 bg-white/[0.01] border border-white/5 p-8 md:p-10 rounded-3xl">
                <form onSubmit={handleCustomRequest} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] text-white/50 mb-1.5 font-bold">نوع العقار المستهدف</label>
                    <select 
                      value={requestType}
                      onChange={e => setRequestType(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs focus:border-brand-gold focus:outline-none"
                    >
                      <option>سكنية فاخرة (مالكي، تنظيم كفرسوسة، رمانة)</option>
                      <option>فيلا مستقلة أو قصر ريفي</option>
                      <option>مبنى تجاري كامل أو برج إداري</option>
                      <option>أرض زراعية أو صناعية ممتازة</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/50 mb-1.5 font-bold">الميزانية التقديرية المرصودة</label>
                    <input 
                      type="text" 
                      required
                      placeholder="مثال: 15 مليار ليرة سورية" 
                      value={requestBudget}
                      onChange={e => setRequestBudget(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs focus:border-brand-gold focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-white/50 mb-1.5 font-bold">المنطقة الجغرافية المفضلة بالتفصيل</label>
                    <input 
                      type="text" 
                      required
                      placeholder="مثال: دمشق مأمون، أبو رمانة الشارع الرئيسي" 
                      value={requestRegion}
                      onChange={e => setRequestRegion(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs focus:border-brand-gold focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-white/50 mb-1.5 font-bold">متطلبات إنشائية أو وساطة محددة</label>
                    <textarea 
                      rows={4}
                      placeholder="يرجى كتابة أي معايير خاصة، كوجود سارية حماية من الصواريخ، مدفئة حطب حجرية، خطوط ذهبية معفاة من التقنين الكهربائي أو ترخيص باركينغ لعدة سيارات..." 
                      value={requestNotes}
                      onChange={e => setRequestNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs focus:border-brand-gold focus:outline-none leading-relaxed"
                    />
                  </div>
                  
                  <div className="md:col-span-2 flex justify-between items-center gap-4 flex-wrap pt-2">
                    {requestSent ? (
                      <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl">
                        ✓ تم تسجيل طلب الاستحواذ الحصري بنجاح. سيقوم الأستاذ البراء بالاتصال الهاتفي بك خلال 4 ساعات.
                      </span>
                    ) : (
                      <span className="text-white/40 text-[10px]">
                        * هذا الطلب يستلم بخصوصية سرية تامة ولا يطلع عليه أي طرف ثالث.
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={isSendingRequest || requestSent}
                      className="px-6 py-3.5 bg-brand-gold hover:bg-opacity-90 text-brand-navy font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                    >
                      {isSendingRequest ? (
                        <span>جاري إرسال طلب مجلس النخبة...</span>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>إرسال طلب الاستملاك السري 🛡️</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
