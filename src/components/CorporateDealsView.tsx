import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignatureModal } from './SignatureModal';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Users, 
  Mail, 
  Phone, 
  Clock, 
  ChevronLeft, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  Zap,
  Briefcase,
  Globe,
  Award,
  Car,
  FileText,
  UserCheck,
  Send,
  Building
} from 'lucide-react';
import { CorporateDeal, Appointment } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { getWeatherForLocationAndDate } from '../utils/weatherHelper';

// Authentic default corporate complexes as premium fallbacks
const DEFAULT_CORPORATE_DEALS: CorporateDeal[] = [
  {
    id: 'corp_deal_1',
    title: 'مجمع ميرادور يعفور السكني المتكامل للشركات والوفود',
    description: 'مجمع فيلات سكنية فاخرة ومستقلة مغلق بالكامل (Gated Community) مصمم خصيصاً لاستقطاب كوادر وممثلي الشركات الكبرى ورجال الأعمال والوفود الاستثمارية في دمشق. يحتوي المجمع على بنية أساسية وهندسية قوية متكاملة ومستقلة تماماً، ومحطة طاقة شمسية احتياطية تضمن استمرارية الأعمال والخدمات طيلة 24 ساعة بدون انقطاع، بالإضافة لمركز ترفيهي وصحي مركزي راقٍ لعقد المؤتمرات والاجتماعات المهمة.',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    location: 'يعفور الفاخرة، ريف دمشق',
    totalUnits: 32,
    retailPrice: '$14,400,000',
    corporatePrice: '$10,800,000',
    discountPercent: 25,
    keyFeatures: [
      'توليد ذاتي للطاقة الشمسية النظيفة بقدرة 3.5 MW مع تشفير الشبكات.',
      'صالة اجتماعات ذكية مركّبة وقاعات عرض ومؤتمرات لرجال الأعمال وممثلي الشركات والوفود.',
      'مرافقة وحراسة أمنية مخصصة ومصنفة رفيعة المستوى على مدار الساعة 24/7.',
      'عقود صيانة وتنسيق وإدارة أصول مجانية مكفولة بالكامل لمدة سنتين.'
    ],
    status: 'available',
    createdAt: new Date().toISOString()
  },
  {
    id: 'corp_deal_2',
    title: 'برج الشام التجاري والمالي الذكي',
    description: 'مركز مالي وتجاري متكامل يستوعب مقرات إدارية كبرى وصالات بنكية ومقاهي أعمال ذكية في قلب دمشق. البرج مجهز بالكامل بأحدث أنظمة تكييف الطاقة المتغيرة VRF والإنترنت البصري فائق السرعة، إلى جانب 3 طوابق تحت الأرض من المواقف المخصصة لوفود الشركات وكبار زوار رجال الأعمال مع تخديم تقني ذكي مستمر بكافة الملحقات القياسية.',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    location: 'أوتوستراد المزة، مركز المال بدمشق',
    totalUnits: 15,
    retailPrice: '$21,500,000',
    corporatePrice: '$17,200,000',
    discountPercent: 20,
    keyFeatures: [
      'جدران زجاجية مزدوجة ممتصة للحرارة والضوضاء وموفرة للطاقة بنسبة 40%.',
      'بوابة ربط الألياف الضوئية المستقلة وسريعة النقل للبيانات الإدارية التناظرية واللاسلكية.',
      'مرآب تحت الأرض مخصص يتسع لأكثر من 180 مركبة لرجال السيادة وممثلي الكيانات.',
      'صالات مخصصة لاستضافة البنوك في الطابقين الأرضي والميزانين المساعد.'
    ],
    status: 'available',
    createdAt: new Date().toISOString()
  }
];

interface CorporateDealsViewProps {
  currentUser: any;
  userProfile: any;
  onAuthTrigger: () => void;
  language?: 'ar' | 'en';
}

export function CorporateDealsView({ currentUser, userProfile, onAuthTrigger, language = 'ar' }: CorporateDealsViewProps) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  const [activeTab, setActiveTab] = useState<'deals' | 'delegations' | 'request'>('deals');
  const [deals, setDeals] = useState<CorporateDeal[]>(DEFAULT_CORPORATE_DEALS);
  const [loading, setLoading] = useState(true);
  const [bookingDeal, setBookingDeal] = useState<CorporateDeal | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState<string | null>(null);
  
  // Form States for Corporate Deal Booking
  const [companyName, setCompanyName] = useState('');
  const [repName, setRepName] = useState('');
  const [repRole, setRepRole] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('11:00');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [weatherInfo, setWeatherInfo] = useState<any | null>(null);

  // Delegation Request Form States
  const [delegationEntity, setDelegationEntity] = useState('');
  const [delegationType, setDelegationType] = useState('وفد استثماري تجاري');
  const [delegationMembersCount, setDelegationMembersCount] = useState('5 - 10 أعضاء');
  const [delegationLeader, setDelegationLeader] = useState('');
  const [delegationPhone, setDelegationPhone] = useState('');
  const [delegationEmail, setDelegationEmail] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [delegationServicesRequested, setDelegationServicesRequested] = useState<string[]>([
    'استقبال ومرافقة أمنية وبروتوكولية',
    'استعراض المحفظة العقارية والمجمعات'
  ]);
  const [delegationNotes, setDelegationNotes] = useState('');
  const [isSubmittingDelegation, setIsSubmittingDelegation] = useState(false);
  const [delegationSuccessMsg, setDelegationSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDeals() {
      try {
        const q = query(collection(db, 'corporate_deals'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const list: CorporateDeal[] = [];
        snap.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as CorporateDeal);
        });
        if (list.length > 0) {
          setDeals(list);
        }
      } catch (err) {
        console.error('Error loading corporate deals:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDeals();
  }, []);

  const handleOpenBooking = (deal: CorporateDeal) => {
    if (!currentUser) {
      alert('🔒 للتواصل وجدولة المواعيد الخاصة بنخبة الشركات، يرجى تسجيل الدخول أو إنشاء حساب حقيقي عبر المنصة لتأمين الاتصال.');
      onAuthTrigger();
      return;
    }
    setBookingDeal(deal);
    setCompanyName(userProfile?.broker || '');
    setRepName(userProfile?.name || '');
    setRepEmail(currentUser?.email || '');
    setRepPhone(userProfile?.phone || '');
    setVisitDate('');
    setVisitTime('11:00');
    setWeatherInfo(null);
    setSuccessMessage(null);
  };

  const handleVisitDateChange = (date: string, deal: CorporateDeal) => {
    setVisitDate(date);
    if (date && deal) {
      const gov = deal.governorate || 'دمشق';
      const info = getWeatherForLocationAndDate(gov, new Date(date));
      setWeatherInfo(info);
    } else {
      setWeatherInfo(null);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDeal) return;
    if (!companyName.trim() || !repName.trim() || !repPhone.trim() || !visitDate) {
      alert('❌ يرجى ملء كافة الخانات الأساسية بشكل كامل وصحيح (رقم الهاتف، اسم الشركة والممثل، تحديد التاريخ).');
      return;
    }

    setIsSubmitting(true);
    try {
      const tourAppointment: Partial<Appointment> = {
        clientName: repName,
        clientEmail: repEmail,
        clientPhone: repPhone,
        date: visitDate,
        time: visitTime,
        status: 'pending',
        userId: currentUser?.uid || 'anonymous',
        createdAt: new Date().toISOString(),
        paymentMethod: 'free',
        preferredBrokerName: 'المدير العام البراء النعيمي',
        
        // Corporate Tour Metadata
        isCorporateTour: true,
        companyName: companyName,
        representativeName: repName,
        representativeRole: repRole,
        corporateDealId: bookingDeal.id,
        corporateDealTitle: bookingDeal.title
      };

      await addDoc(collection(db, 'appointments'), tourAppointment);
      
      // Auto-inject a system notification for the representative
      await addDoc(collection(db, 'notifications'), {
        userId: currentUser?.uid,
        title: '📋 استلام طلب معاينة الشركات كبرى',
        message: `تم قيد حجز معاينة مجمع "${bookingDeal.title}" بنجاح للشركة "${companyName}". سيتواصل معك البراء النعيمي لتأكيد تفاصيل الوفد والمرافقة العقارية المطلوبة.`,
        status: 'unread',
        type: 'general',
        createdAt: new Date().toISOString()
      });

      setSuccessMessage('🎉 تم تسجيل طلب المعاينة بصفة حصرية بنجاح! ستقوم إدارة شركة البراء النعيمي بمراجعة الطلب وفتح قنوات الاتصال والتنسيق للوفد الممثل فورياً.');
      setTimeout(() => {
        setBookingDeal(null);
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Error reserving corporate tour:', err);
      alert('❌ حدث خطأ أثناء تدوين الموعد، يرجى المحاولة لاحقاً أو الاتصال المباشر بقسم علاقات الشركات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delegation Service Request
  const handleDelegationRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegationEntity.trim() || !delegationLeader.trim() || !delegationPhone.trim()) {
      alert('❌ يرجى تعبئة كافة الحقول الأساسية لطلب الوفد (اسم الجهة/الشركة، رئيس الوفد، ورقم الهاتف).');
      return;
    }

    setIsSubmittingDelegation(true);
    try {
      const delegationDoc = {
        userId: currentUser?.uid || 'guest',
        clientName: delegationLeader,
        clientEmail: delegationEmail || currentUser?.email || '',
        clientPhone: delegationPhone,
        companyName: delegationEntity,
        delegationType,
        delegationMembersCount,
        arrivalDate: arrivalDate || 'لم يحدد بعد',
        servicesRequested: delegationServicesRequested,
        notes: delegationNotes,
        isDelegationBooking: true,
        status: 'pending',
        preferredBrokerName: 'المدير العام البراء النعيمي',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'appointments'), delegationDoc);

      if (currentUser?.uid) {
        await addDoc(collection(db, 'notifications'), {
          userId: currentUser.uid,
          title: '🤝 استلام طلب تنظيم استقبال وتخديم وفد',
          message: `تم استلام طلب تخديم الوفد لـ (${delegationEntity}) بنجاح. سيتواصل معكم فريق العلاقات العامة والتنسيق والدبلوماسية فوراً.`,
          status: 'unread',
          type: 'general',
          createdAt: new Date().toISOString()
        });
      }

      setDelegationSuccessMsg('🎉 تم تسجيل طلب تخديم وتنسيق الوفد بنجاح! تم تحويل الملف مباشرة إلى مكتب المدير العام ومسؤولي العلاقات للبدء بالترتيبات اللوجستية.');
      setTimeout(() => {
        setDelegationSuccessMsg(null);
        setDelegationEntity('');
        setDelegationLeader('');
        setDelegationPhone('');
        setDelegationEmail('');
        setArrivalDate('');
        setDelegationNotes('');
      }, 6000);
    } catch (err) {
      console.error("Error submitting delegation request:", err);
      alert("حدث خطأ أثناء إرسال طلب الوفد. يرجى المحاولة لاحقاً.");
    } finally {
      setIsSubmittingDelegation(false);
    }
  };

  const toggleDelegationService = (serviceName: string) => {
    if (delegationServicesRequested.includes(serviceName)) {
      setDelegationServicesRequested(delegationServicesRequested.filter(s => s !== serviceName));
    } else {
      setDelegationServicesRequested([...delegationServicesRequested, serviceName]);
    }
  };

  return (
    <div className="w-full min-h-screen bg-brand-cream/15 text-brand-navy px-4 sm:px-6 lg:px-8 py-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Upper Header */}
      <div className="max-w-[1750px] mx-auto mb-8">
        <div className="bg-gradient-to-tr from-brand-navy via-[#1f374c] to-brand-navy rounded-[2.5rem] p-8 md:p-12 text-white border border-brand-gold/25 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute inset-0 bg-[radial-gradient(#d39e31_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
          
          <div className={`space-y-4 max-w-2xl ${language === 'ar' ? 'text-right' : 'text-left'} z-10`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-xs font-black">
              <Sparkles size={14} className="animate-spin text-brand-gold" />
              <span>{t('قسم خاص بخدمات الشركات والوفود الاستثمارية والدبلوماسية', 'Special Hub for Corporate & Investment Delegations')}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-black tracking-tight leading-tight">
              {t('قسم الشركات والوفود 🏢🤝', 'Corporate & Delegations Hub 🏢🤝')}
            </h1>
            <p className="text-sm md:text-base text-white/80 leading-relaxed font-semibold">
              {t(
                'بوابة متخصصة تخدم الكيانات الاقتصادية والشركات القابضة والوفود الرسمية والدبلوماسية. نوفر مجمعات سكنية وتجارية بخصومات جملة تزيد عن 25%، مع خدمات الاستقبال اللوجستي، المرافقة الأمنية، وتنسيق الاجتماعات والمؤتمرات تحت إشراف المدير العام الأستاذ البراء النعيمي.',
                'A dedicated hub serving economic entities, holding companies, and diplomatic delegations. Providing wholesale residential & commercial complexes with 25%+ discounts, logistic reception, escort services, and conference coordination under General Manager Al-Baraa Al-Nuaimi.'
              )}
            </p>

            {/* Quick Action Buttons Header */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('deals')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'deals'
                    ? 'bg-brand-gold text-brand-navy shadow-lg'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                }`}
              >
                <Building2 size={16} />
                <span>{t("عروض المجمعات والأبراج 🏢", "Complexes & Towers")}</span>
              </button>

              <button
                onClick={() => setActiveTab('delegations')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'delegations'
                    ? 'bg-brand-gold text-brand-navy shadow-lg'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                }`}
              >
                <Users size={16} />
                <span>{t("بروتوكول واستقبال الوفود 🤝", "Delegation Protocol")}</span>
              </button>

              <button
                onClick={() => setActiveTab('request')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'request'
                    ? 'bg-brand-gold text-brand-navy shadow-lg'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                }`}
              >
                <Briefcase size={16} />
                <span>{t("تقديم طلب تخديم وفد 📋", "Request Delegation Service")}</span>
              </button>
            </div>
          </div>
          
          <div className="shrink-0 z-10 flex flex-col items-center justify-center p-6 bg-brand-gold/10 border border-brand-gold/20 rounded-3xl backdrop-blur-md shadow-inner text-center max-w-xs">
            <span className="text-5xl mb-3">🏛️</span>
            <p className="text-xs font-black text-brand-gold">{t('إدارة علاقات الشركات والوفود', 'Corporate & Delegations Management')}</p>
            <p className="text-[10px] text-white/60 font-bold mt-1.5 leading-relaxed">
              {t('تغطية أمنية ولوجستية شاملة، عقد صفقات جملة وتوثيق طابو أخضر محكم.', 'Comprehensive security, logistics, wholesale deals & verified title deeds.')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabbed Content Area */}
      <div className="max-w-[1750px] mx-auto space-y-12">
        {/* TAB 1: CORPORATE DEALS & COMPLEXES */}
        {activeTab === 'deals' && (
          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-brand-gold border-t-brand-navy rounded-full animate-spin" />
                <p className="text-xs font-bold text-brand-navy/60">جاري تحميل عروض المجمعات والمحافظ الاستثمارية للشركات...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-12">
                {deals.map((deal) => (
                  <motion.div
                    key={deal.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2.5rem] border border-brand-navy/10 overflow-hidden shadow-xl flex flex-col lg:flex-row"
                  >
                    {/* Visual Area */}
                    <div className="lg:w-2/5 h-72 lg:h-auto relative shrink-0">
                      <img 
                        src={deal.imageUrl} 
                        alt={deal.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4 bg-red-600 text-white font-black text-xs px-4 py-2 rounded-2xl shadow-lg border border-red-500/20 flex items-center gap-1">
                        <Zap size={14} className="animate-bounce" />
                        <span>خصم الجملة: {deal.discountPercent}% OFF</span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 text-white flex items-end justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🏢</span>
                          <span className="font-mono text-xs font-black bg-brand-gold text-brand-navy px-2.5 py-1 rounded-xl">مجموع {deal.totalUnits} وحدة مفرزة بالكامل</span>
                        </div>
                      </div>
                    </div>

                    {/* Info Text Area */}
                    <div className="p-8 md:p-10 flex-grow flex flex-col justify-between gap-6">
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <h3 className="text-2xl font-serif font-black text-brand-navy">{deal.title}</h3>
                          <div className="flex items-center gap-2 text-brand-navy/60 text-xs font-bold bg-brand-cream px-3 py-1.5 rounded-full border border-brand-navy/5">
                            <MapPin size={14} className="text-brand-gold" />
                            <span>{deal.location}</span>
                          </div>
                        </div>

                        <p className="text-sm font-semibold text-brand-navy/70 leading-relaxed text-justify">
                          {deal.description}
                        </p>

                        {/* Features list */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-brand-navy/5">
                          {deal.keyFeatures.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs text-brand-navy/80 font-bold leading-relaxed">
                              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pricing Comparison and Booking Button Section */}
                      <div className="pt-6 border-t border-brand-navy/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-right">
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-brand-navy/40 font-black">السعر الإجمالي بالتجزئة (Retail)</p>
                            <p className="text-sm font-mono font-black text-brand-navy/50 line-through">{deal.retailPrice}</p>
                          </div>
                          <div className="space-y-0.5 bg-brand-gold/10 px-4 py-2 rounded-2xl border border-brand-gold/30">
                            <p className="text-[10px] text-brand-gold font-black">سعر الشركات الحصري (Wholesale)</p>
                            <p className="text-xl font-mono font-black text-brand-navy">{deal.corporatePrice}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleOpenBooking(deal)}
                            className="flex-1 sm:flex-none px-6 py-4 bg-brand-navy hover:bg-brand-gold text-brand-gold hover:text-brand-navy rounded-2xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-brand-gold/20"
                          >
                            <Calendar size={15} />
                            <span>جدولة موعد معاينة الوفد 👥</span>
                          </button>

                          <button
                            onClick={() => setShowSignatureModal(deal.id)}
                            className="flex-1 sm:flex-none px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>توقيع رقمي للعقد ✍️</span>
                          </button>
                        </div>

                        {showSignatureModal === deal.id && (
                          <SignatureModal 
                            documentId={deal.id}
                            collectionName="corporate_deals"
                            onClose={() => setShowSignatureModal(null)} 
                            signerName={userProfile?.name || 'العميل'}
                          />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DELEGATION PROTOCOL & SERVICES */}
        {activeTab === 'delegations' && (
          <div className="space-y-8">
            {/* Delegation Services Banner */}
            <div className="bg-white rounded-[2.5rem] border border-brand-navy/10 p-8 sm:p-10 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-brand-navy/10 pb-6">
                <div>
                  <span className="text-xs font-bold text-brand-gold bg-brand-navy px-3.5 py-1.5 rounded-full inline-block mb-2">
                    {t("منظومة التخديم الدبلوماسي والاستثماري", "Diplomatic & Investment Support System")}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-brand-navy">
                    {t("حزمة الاستقبال والبروتوكول للوفود الزائرة", "Visiting Delegation Reception & Protocol Package")}
                  </h2>
                  <p className="text-xs sm:text-sm text-brand-navy/70 mt-1 max-w-3xl">
                    {t("نقدم للوفود الاستثمارية، التجارية، والدبلوماسية تجربة استقبال واستضافة استثنائية تشمل المرافقة الأمنية، الأسطول الفاخر، القاعات المغلقة للمؤتمرات، ودراسات الطابو والعقارات المعتمدة.", "We offer investment, commercial, and diplomatic delegations an exceptional reception experience including security escort, luxury fleet, private conference halls, and certified title deed audits.")}
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('request')}
                  className="px-6 py-3.5 bg-brand-navy hover:bg-brand-gold text-brand-gold hover:text-brand-navy font-black text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Send size={16} />
                  <span>{t("طلب تخديم وفد جديد", "Request Delegation Package")}</span>
                </button>
              </div>

              {/* 4 Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: Car,
                    title: t("الاستقبال والمواكب الفاخرة", "Luxury Protocol Fleet"),
                    desc: t("تأمين أسطول سيارات فاخرة ومصفحة مع سائقين ومرافقين أمنيين معتمدين من مطار دمشق إلى كافة المحافظات.", "Luxury fleet & armored vehicles with private drivers & security escorts from Damascus airport to all governorates.")
                  },
                  {
                    icon: Building,
                    title: t("استضافة القاعات والمؤتمرات", "Halls & Conference Hosting"),
                    desc: t("قاعات اجتماعات مغلقة ومجهزة في يعفور وصيدنايا لعقد المؤتمرات، وتوقيع اتفاقيات الشراكة والعقود.", "Equipped private conference halls in Yaafour & Saydnaya for hosting meetings, signing MOUs and contracts.")
                  },
                  {
                    icon: FileText,
                    title: t("الحقائب الاستثمارية المعتمدة", "Certified Investment Audits"),
                    desc: t("إعداد دراسات جدوى عقارية وقانونية متكاملة بضمانة طابو أخضر 100% مع ترجمة فورية للوفود الأجنبية.", "Feasibility & legal studies with 100% verified title deeds and live translation for international delegations.")
                  },
                  {
                    icon: ShieldCheck,
                    title: t("حماية وتوثيق العقود المشفّرة", "Encrypted Contracts & Security"),
                    desc: t("توثيق مالي وقانوني معتمد وتشفير للعقود مع متابعة شخصية مباشرة من المدير العام الأستاذ البراء النعيمي.", "Certified legal documentation & encrypted contract signing with direct management by General Manager Al-Baraa Al-Nuaimi.")
                  }
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="bg-brand-cream/30 p-6 rounded-3xl border border-brand-navy/10 space-y-3 hover:border-brand-gold transition-all">
                      <div className="w-12 h-12 rounded-2xl bg-brand-navy text-brand-gold flex items-center justify-center font-bold">
                        <Icon size={24} />
                      </div>
                      <h3 className="font-serif font-black text-base text-brand-navy">{item.title}</h3>
                      <p className="text-xs text-brand-navy/70 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DELEGATION SERVICE REQUEST FORM */}
        {activeTab === 'request' && (
          <div className="bg-white rounded-[2.5rem] border border-brand-navy/10 p-8 sm:p-12 shadow-xl max-w-4xl mx-auto">
            <div className="border-b border-brand-navy/10 pb-6 mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-gold/15 text-brand-navy text-xs font-black mb-2">
                <Briefcase size={14} className="text-brand-gold" />
                <span>{t("نموذج طلب تخديم وتنسيق الوفود الاستثمارية والتجارية", "Delegation Coordination & Service Request Form")}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-brand-navy">
                {t("طلب استقبال وتنسيق للوفود الرسمية والشركات", "Official Delegation Reception & Coordination Request")}
              </h2>
              <p className="text-xs sm:text-sm text-brand-navy/70 mt-1">
                {t("يرجى تعبئة بيانات الوفد والجهة الطالبة. سيتم تحويل الطلب فوراً إلى المكتب التنفيذي للبدء بالترتيبات اللوجستية وتجهيز العروض العقارية المناسبة.", "Fill in your delegation details. The request will be immediately routed to our executive office for logistics & property matching.")}
              </p>
            </div>

            {delegationSuccessMsg ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-8 rounded-3xl text-center space-y-4"
              >
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                  ✓
                </div>
                <h3 className="font-serif font-black text-xl">{delegationSuccessMsg}</h3>
                <p className="text-xs text-emerald-700">
                  {t("سيتواصل مع رئيس الوفد مسؤول علاقات الوفود الأستاذ البراء النعيمي عبر الهاتف المرفق.", "Delegation Manager Al-Baraa Al-Nuaimi will contact the delegation leader directly via phone.")}
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleDelegationRequestSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Entity Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-brand-navy block">{t("اسم الشركة أو الكيان الطالب *", "Company / Entity Name *")}</label>
                    <input
                      type="text"
                      required
                      placeholder={t("مثال: مجموعة الخاليج القابضة / شركة الاستثمار الدولية", "e.g. Gulf Investment Holding / Int. Trade Co.")}
                      value={delegationEntity}
                      onChange={(e) => setDelegationEntity(e.target.value)}
                      className="w-full p-3.5 border border-brand-navy/15 rounded-2xl text-xs font-bold focus:outline-none focus:border-brand-gold bg-slate-50"
                    />
                  </div>

                  {/* Delegation Type */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-brand-navy block">{t("نوع الوفد والزيارة *", "Delegation Type *")}</label>
                    <select
                      value={delegationType}
                      onChange={(e) => setDelegationType(e.target.value)}
                      className="w-full p-3.5 border border-brand-navy/15 rounded-2xl text-xs font-bold focus:outline-none focus:border-brand-gold bg-slate-50"
                    >
                      <option value="وفد استثماري تجاري">وفد استثماري تجاري (Commercial Investment)</option>
                      <option value="وفد تطوير عقاري وإنشاءات">وفد تطوير عقاري وإنشاءات (Real Estate Developers)</option>
                      <option value="وفد دبلوماسي / هجينة">وفد دبلوماسي ورسمي (Diplomatic & Official)</option>
                      <option value="مجلس إدارة شركة رجال أعمال">مجلس إدارة شركة رجال أعمال (Board of Directors)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Delegation Leader */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-brand-navy block">{t("اسم رئيس الوفد / الشخص المفوض *", "Delegation Leader Name *")}</label>
                    <input
                      type="text"
                      required
                      placeholder={t("الاسم الكامل مع الصفة الوظيفية", "Full name with official title")}
                      value={delegationLeader}
                      onChange={(e) => setDelegationLeader(e.target.value)}
                      className="w-full p-3.5 border border-brand-navy/15 rounded-2xl text-xs font-bold focus:outline-none focus:border-brand-gold bg-slate-50"
                    />
                  </div>

                  {/* Members Count */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-brand-navy block">{t("عدد أعضاء الوفد الزائر *", "Number of Members *")}</label>
                    <select
                      value={delegationMembersCount}
                      onChange={(e) => setDelegationMembersCount(e.target.value)}
                      className="w-full p-3.5 border border-brand-navy/15 rounded-2xl text-xs font-bold focus:outline-none focus:border-brand-gold bg-slate-50"
                    >
                      <option value="1 - 4 أعضاء (وفد مصغر)">1 - 4 أعضاء (وفد مصغر)</option>
                      <option value="5 - 10 أعضاء (وفد متوسط)">5 - 10 أعضاء (وفد متوسط)</option>
                      <option value="11 - 25 عضو (وفد موسع)">11 - 25 عضو (وفد موسع)</option>
                      <option value="أكثر من 25 عضو (بعثة كاملة)">أكثر من 25 عضو (بعثة كاملة)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-brand-navy block">{t("رقم للتواصل المباشر (واتساب/هاتف) *", "Direct Contact Phone *")}</label>
                    <input
                      type="tel"
                      required
                      placeholder="0988123456"
                      value={delegationPhone}
                      onChange={(e) => setDelegationPhone(e.target.value)}
                      className="w-full p-3.5 border border-brand-navy/15 rounded-2xl text-xs font-bold text-left font-mono focus:outline-none focus:border-brand-gold bg-slate-50"
                      dir="ltr"
                    />
                  </div>

                  {/* Date of arrival */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-brand-navy block">{t("تاريخ الوصول المتوقع (اختياري)", "Expected Arrival Date")}</label>
                    <input
                      type="date"
                      value={arrivalDate}
                      onChange={(e) => setArrivalDate(e.target.value)}
                      className="w-full p-3.5 border border-brand-navy/15 rounded-2xl text-xs font-bold focus:outline-none focus:border-brand-gold bg-slate-50"
                    />
                  </div>
                </div>

                {/* Requested Delegation Services Checkboxes */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-black text-brand-navy block">{t("الخدمات والبروتوكول المطلوب للوفد:", "Services & Protocol Required:")}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      'استقبال ومرافقة أمنية وبروتوكولية',
                      'تأمين أسطول موكب وسائقين خاصين',
                      'استعراض المحفظة العقارية والمجمعات',
                      'تجهيز حجز قاعات مؤتمرات واجتماعات',
                      'تقديم دراسات جدوى وتدقيق طابو',
                      'ترجمة فورية واستضافة مخصصة'
                    ].map((svc, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-brand-navy/10 bg-slate-50 hover:bg-brand-gold/10 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={delegationServicesRequested.includes(svc)}
                          onChange={() => toggleDelegationService(svc)}
                          className="w-4 h-4 text-brand-gold rounded border-brand-navy/30 focus:ring-brand-gold"
                        />
                        <span className="text-xs font-bold text-brand-navy">{svc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-brand-navy block">{t("ملاحظات وشروط خاصة للوفد:", "Special Protocol Notes:")}</label>
                  <textarea
                    rows={3}
                    placeholder={t("اكتب أية شروط خاصة ببروتوكول الوفد، الإقامة، المرافقة، أو متطلبات الفنادق...", "Specify any security protocol, accommodation, or transportation requirements...")}
                    value={delegationNotes}
                    onChange={(e) => setDelegationNotes(e.target.value)}
                    className="w-full p-3.5 border border-brand-navy/15 rounded-2xl text-xs font-bold focus:outline-none focus:border-brand-gold bg-slate-50"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmittingDelegation}
                  className="w-full py-4 bg-brand-navy hover:bg-brand-gold text-brand-gold hover:text-brand-navy font-black text-sm rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingDelegation ? (
                    <div className="w-5 h-5 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      <span>{t("إرسال طلب تخديم الوفد إلى المكتب التنفيذي 🤝", "Submit Delegation Request 🤝")}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Corporate Viewing Form Modal */}
      <AnimatePresence>
        {bookingDeal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-navy/85 backdrop-blur-md"
              onClick={() => { if (!isSubmitting) setBookingDeal(null); }}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden p-8 md:p-10 text-right max-h-[92vh] overflow-y-auto"
            >
              {/* Gold Header accent */}
              <div className="absolute top-0 right-0 left-0 h-2.5 bg-gradient-to-r from-brand-gold via-brand-navy to-brand-gold" />
              
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xl md:text-2xl font-serif font-black text-brand-navy">تنسيق زيارة وتعيين موعد معاينة ممثلي الشركات</h4>
                <button
                  onClick={() => setBookingDeal(null)}
                  disabled={isSubmitting}
                  className="w-8 h-8 rounded-full bg-brand-cream hover:bg-red-100 flex items-center justify-center text-brand-navy/70 hover:text-red-600 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-brand-gold/5 border border-brand-gold/15 text-xs text-brand-navy/80 leading-relaxed font-bold mb-6 flex items-start gap-2">
                <ShieldCheck size={18} className="text-brand-gold shrink-0 mt-0.5 animate-pulse" />
                <p>
                  يتم إحالة وتعيين طلبات وفود الشركات الكبرى مباشرة إلى المدير العام <strong className="text-brand-navy font-black">الأستاذ البراء النعيمي</strong>، وذلك للتأكد من تسليم الكشوفات القانونية والهندسية وعقود تشفير الأصول مع المرافقة الرسمية لكبار الشخصيات للوفد الزائر.
                </p>
              </div>

              {successMessage ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-8 rounded-3xl text-center space-y-4"
                >
                  <p className="text-4xl">✅</p>
                  <p className="font-serif font-black text-lg">{successMessage}</p>
                </motion.div>
              ) : (
                <form onSubmit={handleScheduleSubmit} className="space-y-5">
                  <div className="p-4 rounded-xl bg-zinc-50 border border-brand-navy/5 font-mono text-xs font-black inline-flex items-center gap-1">
                    <span>🏢 المجمع المطلوب عينه:</span>
                    <span className="text-brand-gold underline">{bookingDeal.title}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Company Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-brand-navy">اسم الكيان / الشركة الطالبة للمعاينة *</label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="مثال: شركة الميرادور القابضة للاستثمار"
                        className="w-full p-3 border border-brand-navy/15 rounded-xl text-xs font-bold focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    {/* Representative Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-brand-navy">اسم الممثل المفوض بالزيارة *</label>
                      <input
                        type="text"
                        required
                        value={repName}
                        onChange={(e) => setRepName(e.target.value)}
                        placeholder="الاسم الثلاثي المعتمد"
                        className="w-full p-3 border border-brand-navy/15 rounded-xl text-xs font-bold focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Representative Role */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-brand-navy">المسمى الوظيفي للمفوض</label>
                      <input
                        type="text"
                        value={repRole}
                        onChange={(e) => setRepRole(e.target.value)}
                        placeholder="مثال: مدير التطوير والاستثمار العقاري"
                        className="w-full p-3 border border-brand-navy/15 rounded-xl text-xs font-bold focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    {/* Official Representative Phone */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-brand-navy">رقم الهاتف للتواصل المباشر والوفد *</label>
                      <input
                        type="tel"
                        required
                        value={repPhone}
                        onChange={(e) => setRepPhone(e.target.value)}
                        placeholder="مثال: 0988126547"
                        className="w-full p-3 border border-brand-navy/15 rounded-xl text-xs font-bold text-left font-mono focus:outline-none focus:border-brand-gold"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Representative Official Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-brand-navy">البريد الإلكتروني للشركة / المراسلات الرسمية</label>
                    <input
                      type="email"
                      value={repEmail}
                      onChange={(e) => setRepEmail(e.target.value)}
                      placeholder="business@company.com"
                      className="w-full p-3 border border-brand-navy/15 rounded-xl text-xs font-bold text-left font-mono focus:outline-none focus:border-brand-gold"
                      dir="ltr"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Visit Date */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-brand-navy">التاريخ المقترح للزيارة الميدانية *</label>
                      <input
                        type="date"
                        required
                        value={visitDate}
                        onChange={(e) => handleVisitDateChange(e.target.value, bookingDeal)}
                        className="w-full p-3 border border-brand-navy/15 rounded-xl text-xs font-bold focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    {/* Visit Time */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-brand-navy">التوقيت المفضل للمعاينة</label>
                      <select
                        value={visitTime}
                        onChange={(e) => setVisitTime(e.target.value)}
                        className="w-full p-3 border border-brand-navy/15 rounded-xl text-xs font-bold focus:outline-none focus:border-brand-gold"
                      >
                        <option value="09:00">09:00 صباحاً</option>
                        <option value="11:00">11:00 قبل الظهر</option>
                        <option value="13:00">01:00 ظهراً</option>
                        <option value="15:00">03:00 عصراً</option>
                      </select>
                    </div>
                  </div>

                  {weatherInfo && (
                    <div className="p-4 bg-brand-navy/5 rounded-2xl border border-brand-navy/10 space-y-2 text-right">
                      <div className="flex flex-wrap items-center gap-2 text-brand-navy font-bold text-xs">
                        <span className="text-lg shrink-0">{weatherInfo.icon}</span>
                        <span className="shrink-0">توقعات الطقس في ({bookingDeal.governorate || 'دمشق'}):</span>
                        <span className="text-brand-gold font-black shrink-0">{weatherInfo.conditionText.ar}</span>
                        <span className="bg-brand-navy/10 text-brand-navy px-1.5 py-0.5 rounded-md text-[10px] font-mono shrink-0">{weatherInfo.temp}°م</span>
                      </div>
                      <p className="text-[11px] text-zinc-600 font-semibold leading-relaxed">
                        {weatherInfo.description.ar}
                      </p>
                      <div className="pt-2 border-t border-dashed border-zinc-200">
                        <span className="block text-[10px] font-black text-brand-navy mb-1">💡 نصائح المعاينة الخاصة بوفود الشركات:</span>
                        <ul className="space-y-1">
                          {weatherInfo.tips.ar.map((tip: string, idx: number) => (
                            <li key={idx} className="text-[10px] text-zinc-500 font-bold flex items-start gap-1">
                              <span className="text-brand-gold shrink-0">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Additional notes/requests */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-brand-navy">شروط أو متطلبات خاصة (مثال: طلب وفد مرافق، مترجم، تزويد مسبق بالمخططات)</label>
                    <textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder="اكتب أية شروط بروتوكولية أو متطلبات فنية للزيارة والمعاينة..."
                      rows={3}
                      className="w-full p-3 border border-brand-navy/15 rounded-xl text-xs font-bold focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  {/* Submission buttons */}
                  <div className="pt-4 flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-4 bg-brand-navy hover:bg-brand-gold text-brand-gold hover:text-brand-navy rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>تسجيل حجز معاينة الشركات الكبرى 🏢</span>
                          <ChevronLeft size={16} />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setBookingDeal(null)}
                      className="px-6 py-4 bg-zinc-100 hover:bg-zinc-200 text-brand-navy rounded-2xl font-bold text-xs cursor-pointer"
                    >
                      إلغاء الحجز
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
