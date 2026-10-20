import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Plus, 
  Trash2, 
  MapPin, 
  BadgePercent, 
  Users, 
  Calendar, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle, 
  Save, 
  FileText,
  Briefcase
} from 'lucide-react';
import { CorporateDeal, Appointment } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';

// Initial defaults to pre-populate in Firestore if empty
const DEMO_INIT_DEALS: CorporateDeal[] = [
  {
    id: 'corp_deal_1',
    title: 'مجمع ميرادور يعفور السكني المتكامل',
    description: 'مجمع فيلات سكنية فاخرة ومستقلة مغلق بالكامل (Gated Community) مصمم خصيصاً لاستقطاب كوادر وممثلي الشركات الكبرى ورجال الأعمال في دمشق. يحتوي المجمع على بنية أساسية وهندسية قوية متكاملة ومستقلة تماماً، ومحطة طاقة شمسية احتياطية تضمن استمرارية الأعمال والخدمات طيلة 24 ساعة بدون انقطاع، بالإضافة لمركز ترفيهي وصحي مركزي راقٍ لعقد المؤتمرات والاجتماعات المهمة.',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    location: 'يعفور الفاخرة، ريف دمشق',
    totalUnits: 32,
    retailPrice: '$14,400,000',
    corporatePrice: '$10,800,000',
    discountPercent: 25,
    keyFeatures: [
      'توليد ذاتي للطاقة الشمسية النظيفة بقدرة 3.5 MW مع تشفير الشبكات.',
      'صالة اجتماعات ذكية مركّبة وقاعات عرض ومؤتمرات لرجال الأعمال وممثلي الشركات.',
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

export function CorporateDealsAdmin() {
  const [deals, setDeals] = useState<CorporateDeal[]>([]);
  const [corporateTours, setCorporateTours] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingMode, setIsAddingMode] = useState(false);

  // Form Field States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [location, setLocation] = useState('');
  const [totalUnits, setTotalUnits] = useState(24);
  const [retailPrice, setRetailPrice] = useState('$10,000,000');
  const [corporatePrice, setCorporatePrice] = useState('$8,000,000');
  const [discountPercent, setDiscountPercent] = useState(20);
  const [featureInput, setFeatureInput] = useState('');
  const [featuresList, setFeaturesList] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Corporate Deals
      const snapDeals = await getDocs(collection(db, 'corporate_deals'));
      let loadedDeals: CorporateDeal[] = [];
      snapDeals.forEach(docSnap => {
        loadedDeals.push({ id: docSnap.id, ...docSnap.data() } as CorporateDeal);
      });

      // If Firestore is empty, pre-populate with beautiful, authentic projects
      if (loadedDeals.length === 0) {
        for (const defaultDeal of DEMO_INIT_DEALS) {
          const docRef = doc(collection(db, 'corporate_deals'), defaultDeal.id);
          await setDoc(docRef, {
            title: defaultDeal.title,
            description: defaultDeal.description,
            imageUrl: defaultDeal.imageUrl,
            location: defaultDeal.location,
            totalUnits: defaultDeal.totalUnits,
            retailPrice: defaultDeal.retailPrice,
            corporatePrice: defaultDeal.corporatePrice,
            discountPercent: defaultDeal.discountPercent,
            keyFeatures: defaultDeal.keyFeatures,
            status: defaultDeal.status,
            createdAt: defaultDeal.createdAt
          });
        }
        loadedDeals = [...DEMO_INIT_DEALS];
      }
      setDeals(loadedDeals);

      // 2. Fetch Corporate Scheduled Tours from the main Appointments collection
      const snapApps = await getDocs(collection(db, 'appointments'));
      const activeTours: Appointment[] = [];
      snapApps.forEach(docSnap => {
        const app = { id: docSnap.id, ...docSnap.data() } as Appointment;
        if (app.isCorporateTour) {
          activeTours.push(app);
        }
      });
      // Sort tours descending
      activeTours.sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setCorporateTours(activeTours);

    } catch (err) {
      console.error('Error fetching admin corporate deals data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFeaturesList([...featuresList, featureInput.trim()]);
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (idx: number) => {
    setFeaturesList(featuresList.filter((_, i) => i !== idx));
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !location.trim()) {
      alert('❌ يرجى تعبئة الحقول المطلوبة لتسجيل مجمع كبرى الشركات.');
      return;
    }

    setIsSaving(true);
    try {
      const newDealData: Omit<CorporateDeal, 'id'> = {
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
        location: location.trim(),
        totalUnits: Number(totalUnits) || 12,
        retailPrice: retailPrice.trim() || '$12,000,000',
        corporatePrice: corporatePrice.trim() || '$9,000,000',
        discountPercent: Number(discountPercent) || 25,
        keyFeatures: featuresList.length > 0 ? featuresList : ['مجمع أمني مجهز بالكامل مغلق', 'توزيع طاقة مستقل 100%'],
        status: 'available',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'corporate_deals'), newDealData);
      alert('🎉 تم إنشاء وإضافة قسم مجمع الشركات الكبرى بنجاح على المنصة!');
      
      // Reset state
      setTitle('');
      setDescription('');
      setImageUrl('');
      setLocation('');
      setFeaturesList([]);
      setIsAddingMode(false);
      fetchData();
    } catch (err) {
      console.error('Error creating corporate deal:', err);
      alert('❌ فشل إضافة العرض الاستثماري الجديد.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDeal = async (id: string) => {
    if (!window.confirm('⚠️ هل أنت متأكد تماماً من إزالة هذا المجمع الاستثماري الفاخر من عروض الشركات الكبرى؟')) return;
    try {
      await deleteDoc(doc(db, 'corporate_deals', id));
      setDeals(deals.filter(d => d.id !== id));
      alert('✅ تم حذف مجمع الشركات بنجاح.');
    } catch (err) {
      console.error('Error deleting corporate deal:', err);
    }
  };

  const handleUpdateTourStatus = async (tourId: string, newStatus: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      await updateDoc(doc(db, 'appointments', tourId), { status: newStatus });
      setCorporateTours(corporateTours.map(t => t.id === tourId ? { ...t, status: newStatus } : t));
      alert('💼 تم تحديث حالة موعد المعاينة وتعيين الإشعار الحصري لوفد الشركة بنجاح!');
    } catch (err) {
      console.error('Error updating tour status:', err);
    }
  };

  return (
    <div className="space-y-10 text-right" dir="rtl">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-gradient-to-br from-brand-navy to-slate-900 border border-brand-gold/20 rounded-3xl text-white">
          <div className="flex justify-between items-center mb-4">
            <span className="text-3xl">🏢</span>
            <span className="text-xs font-bold text-brand-gold bg-brand-gold/15 px-2.5 py-1 rounded-full">استثمار جملة</span>
          </div>
          <p className="text-xs text-white/50 font-black">إجمالي مجمعات الفيلات والأبراج الذكية</p>
          <p className="text-3xl font-mono font-black text-brand-gold mt-1">{deals.length} مجمع</p>
        </div>

        <div className="p-6 bg-white border border-brand-navy/10 rounded-3xl">
          <div className="flex justify-between items-center mb-4">
            <span className="text-2xl">👥</span>
            <span className="text-xs font-black bg-brand-navy/5 text-brand-navy/60 px-2.5 py-1 rounded-full">الممثليات الرسمية</span>
          </div>
          <p className="text-xs text-brand-navy/40 font-black">مواعيد معاينات الشركات المستلمة</p>
          <p className="text-3xl font-mono font-black text-brand-navy mt-1">{corporateTours.length} حجز</p>
        </div>

        <div className="p-6 bg-brand-cream/40 border border-brand-navy/15 rounded-3xl flex flex-col justify-center">
          <div className="text-xs font-black text-brand-navy/70 leading-relaxed">
            💬 يتيح لك هذا القسم التحكم الكامل بحزم الجملة والمحافظ الإنشائية لتمكين ممثلي الكيانات من تنسيق المرافقة الميدانية.
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-b border-brand-navy/10 pb-4">
        <div>
          <h2 className="text-xl font-serif font-black text-brand-navy">إدارة عروض ومجمعات الشركات الكبرى 🏢</h2>
          <p className="text-xs text-brand-navy/50 font-bold mt-1">تعديل ونشر وتحديث المحاضر، ومتابعة بروتوكولات حجز المعاينات الخاصة.</p>
        </div>

        <button
          onClick={() => setIsAddingMode(!isAddingMode)}
          className="px-4.5 py-2.5 bg-brand-navy text-brand-gold hover:bg-brand-gold hover:text-brand-navy text-xs font-black rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5"
        >
          {isAddingMode ? '✕ إغلاق لوحة الإضافة' : <><Plus size={14} /> إضافة مجمع استثماري جديد</>}
        </button>
      </div>

      {/* Adding corporate deal FORM */}
      <AnimatePresence>
        {isAddingMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-brand-cream/15 p-6 rounded-3xl border border-brand-navy/10"
          >
            <form onSubmit={handleCreateDeal} className="space-y-5">
              <h3 className="font-serif font-black text-brand-navy text-sm border-r-4 border-brand-gold pr-2.5">استمارة تسجيل مجمع / برج مفرز جديد لقطاع الشركات</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-brand-navy">اسم المجمع أو البرج التجاري المتكامل *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: ضاحية النخيل السكنية الذكية"
                    className="w-full p-2.5 border border-brand-navy/10 rounded-xl text-xs font-bold focus:outline-none focus:border-brand-gold bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-brand-navy">المنطقة والموقع الدقيق للمشروع *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="مثال: بلدة الصبورة الفاخرة، ريف دمشق"
                    className="w-full p-2.5 border border-brand-navy/10 rounded-xl text-xs font-bold focus:outline-none focus:border-brand-gold bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-brand-navy">الوصف الفني التفصيلي للمجمع وما يميزه لقطاع الشركات *</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب مواصفات البنية الإنشائية المستقلة، أنظمة توليد الطاقة، تخديم الحراسة والخدمات المشتركة..."
                  rows={4}
                  className="w-full p-2.5 border border-brand-navy/10 rounded-xl text-xs font-bold focus:outline-none focus:border-brand-gold bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-brand-navy">عدد الفيلات/الوحدات الكلي</label>
                  <input
                    type="number"
                    value={totalUnits}
                    onChange={(e) => setTotalUnits(Number(e.target.value))}
                    className="w-full p-2.5 border border-brand-navy/10 rounded-xl text-xs font-bold bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-brand-navy">سعر التجزئة المقدر (Retail)</label>
                  <input
                    type="text"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    placeholder="مثال: $12,500,000"
                    className="w-full p-2.5 border border-brand-navy/10 rounded-xl text-xs font-bold font-mono text-left bg-white"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-brand-navy">سعر الجملة للشركات (Wholesale)</label>
                  <input
                    type="text"
                    value={corporatePrice}
                    onChange={(e) => setCorporatePrice(e.target.value)}
                    placeholder="مثال: $9,375,000"
                    className="w-full p-2.5 border border-brand-navy/10 rounded-xl text-xs font-bold font-mono text-left bg-white"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-brand-navy">نسبة الخصم الحصرية (%)</label>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full p-2.5 border border-brand-navy/10 rounded-xl text-xs font-bold bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-brand-navy">رابط الصورة المميزة للمجمع (الموقع)</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full p-2.5 border border-brand-navy/10 rounded-xl text-xs font-bold bg-white"
                  />
                </div>

                {/* Adding Features list dynamically */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-brand-navy">مزايا حصرية معتمدة (سجل الحزم فرادى)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      placeholder="امداد طاقة بديل متصل مجهز بالكامل"
                      className="flex-grow p-2.5 border border-brand-navy/10 rounded-xl text-xs font-bold bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-4 py-2 bg-brand-navy text-white text-xs font-black rounded-xl cursor-pointer hover:bg-brand-gold hover:text-brand-navy"
                    >
                      إضافة مزية
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {featuresList.map((feat, idx) => (
                      <span key={idx} className="bg-brand-gold/10 border border-brand-gold/30 text-brand-navy font-bold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span>{feat}</span>
                        <button type="button" onClick={() => handleRemoveFeature(idx)} className="text-red-600 hover:text-red-800 font-bold">✕</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-brand-navy hover:bg-brand-gold text-brand-gold hover:text-brand-navy rounded-xl font-black text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{isSaving ? 'جاري الحفظ والتشييد...' : 'نشر وتشييد مجمع قطاع الشركات الكبرى 💎'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingMode(false)}
                  className="px-5 py-3 bg-zinc-100 hover:bg-zinc-200 text-brand-navy rounded-xl font-bold text-xs"
                >
                  إلغاء الأمر
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs / Splitted Sections: 1. Available Complexes, 2. Tours Scheduled reservations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Section 1: Deals List */}
        <div className="space-y-4 bg-white p-6 rounded-3xl border border-brand-navy/10 shadow-sm">
          <h3 className="font-serif font-black text-brand-navy text-sm border-r-4 border-brand-navy pr-2.5">المجمعات الحالية المدرجة بالمنصة</h3>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {deals.length === 0 ? (
              <p className="text-xs text-brand-navy/40 font-bold py-10 text-center">لا توجد مجمعات مدرجة حالياً.</p>
            ) : (
              deals.map((deal) => (
                <div key={deal.id} className="p-4 rounded-2xl border border-brand-navy/5 bg-brand-cream/5 hover:bg-brand-cream/20 transition-all flex items-start gap-4">
                  <img 
                    src={deal.imageUrl} 
                    alt={deal.title} 
                    className="w-20 h-20 rounded-xl object-cover border border-zinc-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-grow space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs text-brand-navy truncate">{deal.title}</h4>
                      <button
                        onClick={() => handleDeleteDeal(deal.id)}
                        className="p-1 hover:bg-red-50 text-brand-navy/40 hover:text-red-600 rounded transition-all cursor-pointer"
                        title="حذف المجمع"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p className="text-[10px] text-brand-navy/50 font-bold flex items-center gap-1">
                      <MapPin size={10} className="text-brand-gold" />
                      <span>{deal.location}</span>
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-[9px] font-mono font-black text-red-600 bg-red-50 border border-red-200/50 px-1.5 py-0.5 rounded">-{deal.discountPercent}% OFF</span>
                      <span className="text-[10px] font-mono text-brand-navy/70 font-semibold">{deal.corporatePrice}</span>
                      <span className="text-[9px] text-brand-navy/40 font-bold">({deal.totalUnits} وحدة)</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 2: Scheduled Corporate tours reservations */}
        <div className="space-y-4 bg-white p-6 rounded-3xl border border-brand-navy/10 shadow-sm">
          <h3 className="font-serif font-black text-brand-navy text-sm border-r-4 border-brand-navy pr-2.5">طلبات ومواعيد معاينات الشركات المستلمة</h3>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {corporateTours.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <p className="text-3xl">📥</p>
                <p className="text-xs text-brand-navy/40 font-black">لم يتم تسجيل أية حجوزات أو طلبات وفود للشركات بعد.</p>
              </div>
            ) : (
              corporateTours.map((tour) => (
                <div key={tour.id} className="p-5 rounded-2xl border border-brand-gold/25 bg-[#FAF9F6] space-y-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-gold text-brand-navy text-[9px] font-black rounded-lg">
                        <Briefcase size={10} />
                        <span>معاينة كبار مسؤولين وشركات</span>
                      </div>
                      <h4 className="font-black text-xs text-brand-navy mt-1">الشركة: <span className="text-brand-gold font-serif underline">{tour.companyName}</span></h4>
                      <p className="text-[10px] text-brand-navy/80 font-bold">الممثل: {tour.clientName} ({tour.representativeRole || 'مفوض رسمي'})</p>
                    </div>

                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                      tour.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                      tour.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {tour.status === 'confirmed' ? 'مؤكد' : tour.status === 'cancelled' ? 'ملغي' : 'قيد المراجعة'}
                    </span>
                  </div>

                  {/* Tour details */}
                  <div className="p-3 bg-white rounded-xl border border-brand-navy/5 text-[10px] font-semibold text-brand-navy/70 space-y-1.5 leading-relaxed">
                    <p className="font-bold flex items-center gap-1.5 text-brand-navy"><Building2 size={12} className="text-brand-gold" /> المجمع المستهدف: {tour.corporateDealTitle}</p>
                    <p className="flex items-center gap-1.5"><Calendar size={12} /> تاريخ الموعد: {tour.date} | توقيت: {tour.time}</p>
                    <p className="flex items-center gap-1.5"><Phone size={12} /> هاتف الجوال: {tour.clientPhone}</p>
                    <p className="flex items-center gap-1.5"><Mail size={12} /> البريد: {tour.clientEmail}</p>
                  </div>

                  {/* Actions status triggers */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-brand-navy/5">
                    {tour.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateTourStatus(tour.id, 'confirmed')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black transition-all cursor-pointer"
                        >
                          ✓ تأكيد الموعد وإسناد الوفد
                        </button>
                        <button
                          onClick={() => handleUpdateTourStatus(tour.id, 'cancelled')}
                          className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-bold transition-all cursor-pointer"
                        >
                          إلغاء الموعد
                        </button>
                      </>
                    )}
                    {tour.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateTourStatus(tour.id, 'completed')}
                        className="px-3 py-1.5 rounded-lg bg-zinc-200 hover:bg-brand-navy text-brand-navy hover:text-white text-[10px] font-black transition-all cursor-pointer"
                      >
                        تحديد كـ "تمت المعاينة الميدانية"
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
