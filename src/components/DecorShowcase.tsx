import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Image as ImageIcon, 
  Palette, 
  Layers, 
  Home, 
  CheckCircle2, 
  Download, 
  Bookmark, 
  BookmarkCheck, 
  Send, 
  Calculator, 
  SlidersHorizontal, 
  Search, 
  Maximize2, 
  RefreshCw, 
  Upload, 
  Lightbulb, 
  DollarSign, 
  Info, 
  X,
  Zap,
  ArrowRight,
  Eye,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';

interface DecorShowcaseProps {
  currentUser: any;
  userProfile: any;
  language?: 'ar' | 'en';
  onBookExecution?: (decorItem: any) => void;
  onBack?: () => void;
}

// Initial curated decor showcase items
const DECOR_GALLERY_SAMPLES = [
  {
    id: 'decor-1',
    title: 'مجلس أنيق بأسلوب النيو كلاسيك الملكي',
    roomType: 'مجلس رجال',
    style: 'نيو كلاسيك',
    colorScheme: 'ترابي وذهبي مذهب',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop',
    description: 'تصميم مجلس عربي أصيل بلمسات نيو كلاسيك حديثة. يتميز ببديل رخام ميامي مع إضاءات LED دافئة وألواح بديل خشب الجوز.',
    materials: ['بديل رخام ميامي 3D', 'ألواح خشب جوز طبيعي', 'دهان جوتن مفيّف', 'سبوت لايت موجه 3000K'],
    lighting: 'إضاءة مخفية LED سقفية وجدارية متكاملة',
    estimatedCostUSD: '60 - 90 $ / م²',
    likes: 142
  },
  {
    id: 'decor-2',
    title: 'غرفة نوم رئيسية مودرن مع جدار رخامي',
    roomType: 'غرفة نوم',
    style: 'مودرن',
    colorScheme: 'رمادي فحم وذهبي دافئ',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1200&auto=format&fit=crop',
    description: 'جناح نوم رئيسي يجمع بين الهدوء والفخامة المطلقة. سرير مخملي منجد بظهر مرتفع مع مرايا داكنة وإضاءات معلقة مودرن.',
    materials: ['خلفية سرير مخمل أوف وايت', 'بورشيلان إسباني رمادي', 'استيل ذهبي مقاوم للصدأ'],
    lighting: 'ثريا مودرن معلقة وإضاءة سرير دافئة',
    estimatedCostUSD: '55 - 80 $ / م²',
    likes: 98
  },
  {
    id: 'decor-3',
    title: 'صالون ضيوف فاخر بطابع أندلسي حديث',
    roomType: 'صالون ضيوف',
    style: 'أندلسي شرقي',
    colorScheme: 'أزرق ملكي وبيج ذهبي',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
    description: 'مزج بين النقوش الشرقية الأندلسية والخطوط العصرية. تتوسط الصالون طاولة وسط من الرخام الإيطالي مع إطار مذهب.',
    materials: ['بديل رخام كالاكاتا', 'جبسين بورد مغربي دقيق', 'أقمشة شامواه إيطالية'],
    lighting: 'إضاءة ثريا كريستال أندلسية مع إضاءات مخفية',
    estimatedCostUSD: '70 - 110 $ / م²',
    likes: 210
  },
  {
    id: 'decor-4',
    title: 'مطبخ إيطالي مودرن بأسطح كوارنز رخامية',
    roomType: 'مطبخ',
    style: 'مودرن',
    colorScheme: 'أبيض وخشب طبيعي',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1200&auto=format&fit=crop',
    description: 'مطبخ مفتوح ذو خزاين أكريليك مقاومة للخدش والحرارة مع جزيرة رخامية بأسلوب الهيدروليك وإضاءات أسفل الخزائن.',
    materials: ['خزائن خشب HDF إسباني', 'سطح كوارنز أبيض مقاوم للبقع', 'إكسسوارات بلوم هيدروليك'],
    lighting: 'سبوت لايت IP65 مقاوم للرطوبة مع شريط LED سفلي',
    estimatedCostUSD: '80 - 120 $ / م²',
    likes: 175
  },
  {
    id: 'decor-5',
    title: 'حمام ماستر فندقي بجدار رخام وبانيو مستقل',
    roomType: 'حمام ماستر',
    style: 'لكشري مذهب',
    colorScheme: 'أسود وذهبي ورخام أبيض',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200&auto=format&fit=crop',
    description: 'تصميم حمام فندقي فاخر يحتوي على دش مطري زجاجي وبانيو قائم بذاته مع حنفيات ستانلس ذهبية جدارية.',
    materials: ['بورشيلان 120×240 رخامي', 'حنفيات ذهبية جدارية PVD', 'زجاج سيكوريت 10 ملم'],
    lighting: 'مرآة ذكية لمش إضاءة LED دائرية',
    estimatedCostUSD: '65 - 95 $ / م²',
    likes: 130
  },
  {
    id: 'decor-6',
    title: 'مكتب تنفيذي فخم مع جدارية مكتبة خشبية',
    roomType: 'مكتب تنفيذي',
    style: 'نيو كلاسيك',
    colorScheme: 'خشب داكن وكحلي',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop',
    description: 'مكتب إداري وتنفيذي يعكس الهيبة والاحترافية. مكتبة جدارية مضاءة مع مكتب خشبي ضخم بلمسات جلد طبيعي.',
    materials: ['خشب الجوز الإفريقي', 'جلد طبيعي ممتاذ', 'ورق جدران بلجيكي'],
    lighting: 'مصباح مكتب كلاسيكي وإضاءة رفوف جدارية',
    estimatedCostUSD: '75 - 110 $ / م²',
    likes: 115
  },
  {
    id: 'decor-7',
    title: 'تراس وحديقة خارجية بأسلوب السكاندينافي',
    roomType: 'تراس وحديقة',
    style: 'سكاندينافي',
    colorScheme: 'أخضر وزيتي وخشبي',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop',
    description: 'جلسة خارجية ساحرة مع أرضيات خشبية WPC مقاومة للعوامل الجوية وإضاءة حديقة أرضية وجدارية متناسقة.',
    materials: ['أرضيات WPC معالجة', 'جلسات خيزران طبيعي', 'نباتات ظل خارجية'],
    lighting: 'سبوتات أرضية IP67 ضد الماء وجداريات دافئة',
    estimatedCostUSD: '40 - 70 $ / م²',
    likes: 160
  },
  {
    id: 'decor-8',
    title: 'جلسة معيشة بوهيمية دافئة مع مدفأة حجرية',
    roomType: 'غرفة معيشة',
    style: 'بوهيمي',
    colorScheme: 'ترابي بيج وخشب فاتح',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop',
    description: 'جلسة عائلية مريحة تعتمد المواد الطبيعية مثل الحجر المقصوص والكتان مع مدفأة بيوإيثانول جدارية عصرية.',
    materials: ['حجر طبيعي مقصوص', 'كتان ناعم للجلسات', 'خشب بلوط فاتح'],
    lighting: 'إضاءات بامبو معلقة وإضاءة مدفأة هادئة',
    estimatedCostUSD: '50 - 75 $ / م²',
    likes: 188
  }
];

export default function DecorShowcase({
  currentUser,
  userProfile,
  language = 'ar',
  onBookExecution,
  onBack
}: DecorShowcaseProps) {
  const isAr = language === 'ar';
  const t = (arStr: string, enStr?: string) => isAr ? arStr : (enStr || arStr);

  const [activeTab, setActiveTab] = useState<'gallery' | 'ai-generator' | 'consultant' | 'saved'>('gallery');
  
  // Gallery states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState('all');
  const [selectedStyle, setSelectedStyle] = useState('all');
  const [selectedDecorItem, setSelectedDecorItem] = useState<any | null>(null);
  const [savedItems, setSavedItems] = useState<string[]>([]);

  // AI Decor Generator states
  const [aiRoomType, setAiRoomType] = useState('مجلس رجال');
  const [aiStyle, setAiStyle] = useState('نيو كلاسيك');
  const [aiColorScheme, setAiColorScheme] = useState('ألوان ترابية وذهبي مذهب');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiAspectRatio, setAiAspectRatio] = useState('1:1');
  const [aiUploadedImage, setAiUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);
  const [genError, setGenError] = useState('');

  // AI Decor Consultant states
  const [consultRoomType, setConsultRoomType] = useState('صالون ضيوف ومجلس');
  const [consultDimensions, setConsultDimensions] = useState('30 متر مربع');
  const [consultStyle, setConsultStyle] = useState('نيو كلاسيك فاخر');
  const [consultBudget, setConsultBudget] = useState('متوسطة فاخرة VIP');
  const [consultDetails, setConsultDetails] = useState('');
  const [isConsulting, setIsConsulting] = useState(false);
  const [consultationResult, setConsultationResult] = useState<any | null>(null);

  // User's saved AI designs from Firestore
  const [mySavedDesigns, setMySavedDesigns] = useState<any[]>([]);

  // Load user saved items from Firestore
  useEffect(() => {
    if (currentUser?.uid) {
      fetchMySavedDesigns();
    }
  }, [currentUser]);

  const fetchMySavedDesigns = async () => {
    if (!currentUser?.uid) return;
    try {
      const q = query(collection(db, 'saved_decor_designs'), where('userId', '==', currentUser.uid));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });
      setMySavedDesigns(list);
    } catch (e) {
      console.warn("Could not fetch saved decor designs:", e);
    }
  };

  const toggleSaveGalleryItem = (itemId: string) => {
    if (savedItems.includes(itemId)) {
      setSavedItems(savedItems.filter(i => i !== itemId));
    } else {
      setSavedItems([...savedItems, itemId]);
    }
  };

  // Image Upload handler for Room Redesign
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert(t("حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 10 ميجابايت.", "Image file size too large. Please select an image under 10MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAiUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Trigger AI Decor Generation Call
  const handleGenerateDecor = async () => {
    setIsGenerating(true);
    setGenError('');
    setGeneratedResult(null);

    try {
      const res = await fetch('/api/gemini/generate-decor-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomType: aiRoomType,
          style: aiStyle,
          colorScheme: aiColorScheme,
          customPrompt: aiCustomPrompt,
          imageBase64: aiUploadedImage,
          aspectRatio: aiAspectRatio
        })
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedResult(data);
      } else {
        setGenError(data.error || t("عذراً، تعذر توليد الصورة بالذكاء الاصطناعي حالياً.", "Failed to generate decor image."));
      }
    } catch (err: any) {
      console.error("AI Decor generation fetch error:", err);
      setGenError(t("حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.", "Server error. Please try again."));
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Generated AI Design to Firestore
  const handleSaveGeneratedDesign = async () => {
    if (!generatedResult) return;
    try {
      await addDoc(collection(db, 'saved_decor_designs'), {
        userId: currentUser?.uid || 'guest',
        userEmail: currentUser?.email || '',
        title: `${aiRoomType} - ${aiStyle}`,
        imageUrl: generatedResult.imageUrl,
        roomType: aiRoomType,
        style: aiStyle,
        colorScheme: aiColorScheme,
        analysis: generatedResult.analysis,
        createdAt: new Date().toISOString()
      });
      alert(t("تم حفظ تصميم الديكور في قائمتك بنجاح! 🎨", "Design saved to your list successfully!"));
      fetchMySavedDesigns();
    } catch (e) {
      console.error("Error saving design:", e);
      alert(t("حدث خطأ أثناء حفظ التصميم.", "Error saving design."));
    }
  };

  // Trigger AI Decor Consultant Call
  const handleGetConsultation = async () => {
    setIsConsulting(true);
    try {
      const res = await fetch('/api/gemini/decor-consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomType: consultRoomType,
          dimensions: consultDimensions,
          style: consultStyle,
          budget: consultBudget,
          customDetails: consultDetails
        })
      });

      const data = await res.json();
      if (data.success) {
        setConsultationResult(data.consultation);
      } else {
        alert(t("حدث خطأ في طلب الاستشارة. يرجى المحاولة لاحقاً.", "Error fetching consultation."));
      }
    } catch (err) {
      console.error("Consultant error:", err);
    } finally {
      setIsConsulting(false);
    }
  };

  // Filter gallery items
  const filteredGallery = DECOR_GALLERY_SAMPLES.filter(item => {
    const matchesRoom = selectedRoomType === 'all' || item.roomType === selectedRoomType;
    const matchesStyle = selectedStyle === 'all' || item.style === selectedStyle;
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.materials.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRoom && matchesStyle && matchesSearch;
  });

  return (
    <div className="w-full min-h-screen bg-slate-900 text-white pb-24" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-brand-navy via-slate-900 to-slate-900 pt-8 pb-12 px-4 sm:px-8 border-b border-white/10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-gold/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div>
              {onBack && (
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-2 text-xs font-bold text-brand-gold bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full mb-4 transition-all cursor-pointer"
                >
                  <ArrowRight size={14} className={isAr ? '' : 'rotate-180'} />
                  <span>{t("العودة للرئيسية", "Back to Home")}</span>
                </button>
              )}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-xs font-bold mb-3">
                <Sparkles size={14} />
                <span>{t("منصة التصميم الداخلي والديكور بالذكاء الاصطناعي", "AI Interior & Decor Design Platform")}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black tracking-tight text-white leading-tight">
                {t("معرض الديكورات وابتكار تصاميم", "Interior Decor Gallery & ")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold via-amber-200 to-brand-gold">{t("الذكاء الاصطناعي", "AI Generation")}</span>
              </h1>
              <p className="text-sm sm:text-base text-zinc-300 mt-2 max-w-2xl">
                {t("استعرض أحدث صيحات الديكور والتصميم الداخلي لمشاريع النعيمي، أو قم بتوليد تصميم مخصص لغرفتك ومساحتك باستخدام الذكاء الاصطناعي واطلب تنفيذه فوراً.", "Explore top luxury interior decor trends or generate custom AI room designs and request immediate execution.")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('ai-generator')}
                className="px-6 py-3.5 bg-gradient-to-r from-brand-gold to-amber-500 text-brand-navy font-bold text-sm rounded-2xl shadow-lg shadow-brand-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <Wand2 size={18} />
                <span>{t("توليد تصميم بالذكاء الاصطناعي", "Generate AI Design")}</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-t border-white/10 pt-4">
            {[
              { id: 'gallery', label: t("معرض صور وأعمال الديكور", "Decor Gallery"), icon: ImageIcon },
              { id: 'ai-generator', label: t("مُوَلِّد التصاميم بالذكاء الاصطناعي", "AI Decor Generator"), icon: Wand2, badge: 'جديد' },
              { id: 'consultant', label: t("مستشار الديكور والتكلفة الذكي", "AI Decor Consultant"), icon: Calculator },
              { id: 'saved', label: t("تصاميمي المحفوظة", "My Saved Designs"), icon: Bookmark, count: mySavedDesigns.length }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-gold text-brand-navy shadow-md shadow-brand-gold/20'
                      : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="bg-brand-navy/60 text-brand-gold text-[10px] px-2 py-0.5 rounded-full font-bold border border-brand-gold/30">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        {/* TAB 1: DECOR GALLERY SHOWCASE */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white/5 border border-white/10 p-4 sm:p-6 rounded-2xl backdrop-blur-md flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
              {/* Search input */}
              <div className="relative flex-1">
                <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder={t("ابحث عن نوع ديكور، خامات (بديل رخام، جبسين بورد...)، أو غرفة...", "Search decor, materials, or room...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-brand-gold transition-all"
                />
              </div>

              {/* Room type filter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                  <SlidersHorizontal size={14} />
                  {t("الغرفة:", "Room:")}
                </span>
                {['all', 'مجلس رجال', 'غرفة نوم', 'صالون ضيوف', 'مطبخ', 'حمام ماستر', 'مكتب تنفيذي', 'تراس وحديقة'].map(room => (
                  <button
                    key={room}
                    onClick={() => setSelectedRoomType(room)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedRoomType === room
                        ? 'bg-brand-gold text-brand-navy'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5'
                    }`}
                  >
                    {room === 'all' ? t("الكل", "All") : room}
                  </button>
                ))}
              </div>
            </div>

            {/* Decor Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredGallery.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/90 border border-white/10 rounded-2xl overflow-hidden hover:border-brand-gold/40 transition-all group flex flex-col justify-between shadow-xl"
                >
                  <div>
                    {/* Image Header */}
                    <div className="relative h-56 overflow-hidden bg-slate-900">
                      <img
                        src={item.image}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />

                      {/* Badges */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <span className="bg-brand-navy/90 text-brand-gold text-[11px] font-bold px-2.5 py-1 rounded-full border border-brand-gold/30 backdrop-blur-md">
                          {item.roomType}
                        </span>
                        <span className="bg-white/10 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10">
                          {item.style}
                        </span>
                      </div>

                      {/* Save Button */}
                      <button
                        onClick={() => toggleSaveGalleryItem(item.id)}
                        className="absolute top-3 left-3 p-2 bg-slate-900/80 hover:bg-slate-900 rounded-full text-brand-gold transition-all border border-white/10 cursor-pointer"
                        title={t("حفظ في المفضلة", "Save to Favorites")}
                      >
                        {savedItems.includes(item.id) ? (
                          <BookmarkCheck size={18} className="fill-brand-gold" />
                        ) : (
                          <Bookmark size={18} />
                        )}
                      </button>

                      {/* Quick View Button */}
                      <button
                        onClick={() => setSelectedDecorItem(item)}
                        className="absolute bottom-3 left-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/20 flex items-center gap-1 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        <Eye size={14} />
                        <span>{t("التفاصيل والمواد", "Details")}</span>
                      </button>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-bold text-base text-white group-hover:text-brand-gold transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Material Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.materials.slice(0, 3).map((mat, i) => (
                          <span key={i} className="text-[10px] bg-white/5 border border-white/10 text-zinc-300 px-2 py-0.5 rounded-md">
                            {mat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-5 pt-0 border-t border-white/5 mt-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">{t("تقدير التكلفة:", "Cost Est:")}</span>
                      <span className="text-xs font-bold text-brand-gold">{item.estimatedCostUSD}</span>
                    </div>

                    <button
                      onClick={() => {
                        if (onBookExecution) {
                          onBookExecution(item);
                        } else {
                          alert(t(`تم تسجيل طلب استشارة تنفيذ لـ (${item.title}). سيتواصل معك قسم هندسة الديكور فوراً! 📞`, `Execution consultation request logged for (${item.title}). Our engineering team will contact you shortly!`));
                        }
                      }}
                      className="px-4 py-2 bg-brand-gold hover:bg-amber-400 text-brand-navy font-bold text-xs rounded-xl transition-all shadow-md shadow-brand-gold/10 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send size={14} />
                      <span>{t("طلب تنفيذ", "Request Quote")}</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: AI DECOR GENERATOR */}
        {activeTab === 'ai-generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input Form Column */}
            <div className="lg:col-span-5 space-y-6 bg-slate-800/80 border border-white/10 p-6 sm:p-8 rounded-3xl backdrop-blur-md">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-brand-gold bg-brand-gold/10 border border-brand-gold/20 px-3 py-1 rounded-full mb-2">
                  <Zap size={14} />
                  <span>{t("توليد ثوانٍ محاكاة واقعية 8K", "Instant 8K Architectural AI Generation")}</span>
                </div>
                <h2 className="text-xl font-bold text-white">{t("إعدادات توليد الديكور بالذكاء الاصطناعي", "AI Decor Generation Parameters")}</h2>
                <p className="text-xs text-zinc-400 mt-1">{t("اختر نوع الغرفة والنمط والألوان لتوليد صورة ديكور حصرية متكاملة التفاصيل.", "Select room parameters to generate an exclusive high-end interior design.")}</p>
              </div>

              <div className="space-y-4">
                {/* Room Type */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">{t("1. نوع الغرفة أو المساحة:", "1. Room Type:")}</label>
                  <select
                    value={aiRoomType}
                    onChange={(e) => setAiRoomType(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                  >
                    <option value="مجلس رجال">مجلس رجال فخم (Majlis)</option>
                    <option value="صالون ضيوف">صالون ضيوف فاخر (Guest Salon)</option>
                    <option value="غرفة نوم رئيسية">غرفة نوم رئيسية ماستر (Master Bedroom)</option>
                    <option value="مطبخ مودرن">مطبخ إيطالي حديث (Modern Kitchen)</option>
                    <option value="حمام ماستر">حمام ماستر فندقي (Hotel Master Bath)</option>
                    <option value="مكتب تنفيذي">مكتب إداري وتنفيذي (Executive Office)</option>
                    <option value="تراس وحديقة">تراس وحديقة خارجية (Outdoor Terrace)</option>
                  </select>
                </div>

                {/* Style */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">{t("2. النمط المعماري والتصميم:", "2. Interior Architectural Style:")}</label>
                  <select
                    value={aiStyle}
                    onChange={(e) => setAiStyle(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                  >
                    <option value="نيو كلاسيك">نيو كلاسيك ملكي (Neoclassic Luxury)</option>
                    <option value="مودرن">مودرن حديث ومبسط (Modern Minimalist)</option>
                    <option value="أندلسي شرقي">أندلسي شرقي دافئ (Andalusian Oriental)</option>
                    <option value="لكشري مذهب">لُكشري مذهب ورخامي (Gold & Marble Luxury)</option>
                    <option value="بوهيمي">بوهيمي دافئ بحجر خشبي (Warm Bohemian)</option>
                    <option value="سكاندينافي">سكاندينافي مريح (Scandinavian)</option>
                  </select>
                </div>

                {/* Color Scheme */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">{t("3. لوحة الألوان والخامات:", "3. Color Palette & Materials:")}</label>
                  <select
                    value={aiColorScheme}
                    onChange={(e) => setAiColorScheme(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                  >
                    <option value="ألوان ترابية وذهبي مذهب">ألوان ترابية دافئة مع لمسات رخام وذهبي</option>
                    <option value="رمادي فحم وأسود ملكي">رمادي فحم وخشب داكن مع إضاءات دافئة</option>
                    <option value="أبيض ورخام ميامي بطلاء ذهبي">أبيض أوف وايت ورخام ميامي ناصع</option>
                    <option value="أزرق ملكي وبيج ذهبي">أزرق ملكي دافئ مع بيج وستانلس ستيل</option>
                    <option value="أخضر زمردي وخشب جوز">أخضر زمردي فاخر مع خشب الجوز الإفريقي</option>
                  </select>
                </div>

                {/* Custom Details / Prompt */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">{t("4. متطلبات وتفاصيل خاصة (اختياري):", "4. Custom Details (Optional):")}</label>
                  <textarea
                    rows={3}
                    placeholder={t("مثال: إضاءة مخفية LED خلف الشاشة، جدار بديل رخام، ثريا مودرن، مدفأة جدارية حديثة...", "Example: Hidden LED lighting behind TV, marble wall, modern chandelier...")}
                    value={aiCustomPrompt}
                    onChange={(e) => setAiCustomPrompt(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-brand-gold"
                  />
                </div>

                {/* Optional Image Upload for Room Transformation */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">{t("5. رفع صورة غرفتك الحالية لإعادة تصميمها (اختياري):", "5. Upload Current Room Image for Redesign (Optional):")}</label>
                  <div className="relative border-2 border-dashed border-white/20 hover:border-brand-gold rounded-2xl p-4 text-center bg-slate-900/60 transition-all">
                    {aiUploadedImage ? (
                      <div className="relative h-32 w-full rounded-xl overflow-hidden">
                        <img src={aiUploadedImage} alt="Uploaded Room" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setAiUploadedImage(null)}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center gap-2 py-2">
                        <Upload size={24} className="text-brand-gold animate-bounce" />
                        <span className="text-xs font-bold text-zinc-300">{t("انقر هنا لرفع صورة غرفتك الحالية", "Click to upload room image")}</span>
                        <span className="text-[10px] text-zinc-500">PNG, JPG, WEBP (حتى 10MB)</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">{t("6. أبعاد الصورة:", "6. Aspect Ratio:")}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '1:1', label: 'مربع (1:1)' },
                      { id: '16:9', label: 'عرضي (16:9)' },
                      { id: '4:3', label: 'استوديو (4:3)' }
                    ].map(ar => (
                      <button
                        key={ar.id}
                        type="button"
                        onClick={() => setAiAspectRatio(ar.id)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          aiAspectRatio === ar.id
                            ? 'bg-brand-gold text-brand-navy border-brand-gold'
                            : 'bg-slate-900 text-zinc-400 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {ar.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Generate Button */}
                <button
                  onClick={handleGenerateDecor}
                  disabled={isGenerating}
                  className="w-full py-4 bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold text-brand-navy font-black text-base rounded-2xl shadow-xl shadow-brand-gold/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={20} className="animate-spin text-brand-navy" />
                      <span>{t("جاري هندسة وتوليد التصميم بالذكاء الاصطناعي...", "Generating AI Interior Design...")}</span>
                    </>
                  ) : (
                    <>
                      <Wand2 size={20} />
                      <span>{t("✨ توليد تصميم الديكور فوراً", "Generate AI Decor Design Now")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Generated Result Output Column */}
            <div className="lg:col-span-7 space-y-6">
              {isGenerating && (
                <div className="bg-slate-800/80 border border-white/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[500px] space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin" />
                    <Sparkles size={32} className="text-brand-gold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">{t("جاري معالجة وتوليد تصميم الديكور...", "Processing AI Architectural Render...")}</h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto">
                      {t("يقوم نموذج الذكاء الاصطناعي الآن بتوزيع الإضاءة، ضبط درجات الرخام والأخشاب، وإنشاء بيئة معمارية عالية الدقة 8K.", "The AI model is creating a photorealistic 8K architectural render with material analysis.")}
                    </p>
                  </div>
                </div>
              )}

              {genError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-6 rounded-2xl text-center space-y-2">
                  <Info size={24} className="mx-auto text-red-400" />
                  <p className="font-bold">{genError}</p>
                </div>
              )}

              {!isGenerating && !generatedResult && !genError && (
                <div className="bg-slate-800/40 border border-dashed border-white/15 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[500px] space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-2">
                    <ImageIcon size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-white">{t("جاهز لتوليد تصميمك الخاص", "Ready to Generate Your Unique Design")}</h3>
                  <p className="text-xs text-zinc-400 max-w-md">
                    {t("حدد خيارات الغرفة والنمط من القائمة الجانبية ثم انقر على زر التوليد لمشاهدة التصميم وتقرير المواد والميزانية المقدرة.", "Configure your room settings on the left and click Generate to see your 8K interior design and materials breakdown.")}
                  </p>
                </div>
              )}

              {generatedResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-800/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl space-y-6"
                >
                  {/* Generated Image Header */}
                  <div className="relative bg-slate-950 overflow-hidden group">
                    <img
                      src={generatedResult.imageUrl}
                      alt="Generated AI Decor"
                      referrerPolicy="no-referrer"
                      className="w-full max-h-[520px] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />

                    <div className="absolute top-4 right-4 bg-brand-navy/90 border border-brand-gold/30 text-brand-gold text-xs font-black px-3.5 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5">
                      <Sparkles size={14} />
                      <span>{t("تصميم الذكاء الاصطناعي - حصرية النعيمي", "AI Exclusive Design")}</span>
                    </div>

                    <div className="absolute bottom-4 right-4 left-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-white">{aiRoomType} - {aiStyle}</h3>
                        <p className="text-xs text-zinc-300">{aiColorScheme}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveGeneratedDesign}
                          className="px-4 py-2 bg-slate-900/90 hover:bg-slate-900 text-brand-gold border border-brand-gold/40 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Bookmark size={16} />
                          <span>{t("حفظ التصميم", "Save Design")}</span>
                        </button>

                        <a
                          href={generatedResult.imageUrl}
                          download="ai-decor-design.jpg"
                          className="p-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all cursor-pointer"
                          title={t("تنزيل الصورة", "Download Image")}
                        >
                          <Download size={18} />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* AI Architectural Breakdown Report */}
                  {generatedResult.analysis && (
                    <div className="p-6 sm:p-8 space-y-6 pt-2">
                      <div className="border-b border-white/10 pb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-brand-gold">
                          <Layers size={20} />
                          <h4 className="font-bold text-base text-white">{t("تقرير المواد والديكور الميداني", "Materials & Architectural Breakdown")}</h4>
                        </div>

                        <span className="bg-brand-gold/10 text-brand-gold border border-brand-gold/30 text-xs font-extrabold px-3 py-1 rounded-full">
                          {generatedResult.analysis.estimatedCost || "50 - 85 $ / م²"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Materials */}
                        <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-2">
                          <span className="text-xs font-bold text-brand-gold flex items-center gap-1.5">
                            <Palette size={16} />
                            {t("المواد والخامات المستخدمة:", "Materials & Finishes:")}
                          </span>
                          <ul className="text-xs text-zinc-300 space-y-1.5">
                            {generatedResult.analysis.materials?.map((m: string, idx: number) => (
                              <li key={idx} className="flex items-center gap-2">
                                <Check size={14} className="text-emerald-400 shrink-0" />
                                <span>{m}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Lighting */}
                        <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-2">
                          <span className="text-xs font-bold text-brand-gold flex items-center gap-1.5">
                            <Lightbulb size={16} />
                            {t("توزيع الإضاءات:", "Lighting Distribution:")}
                          </span>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {generatedResult.analysis.lighting}
                          </p>
                        </div>
                      </div>

                      {/* Recommended Furniture */}
                      <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-2">
                        <span className="text-xs font-bold text-brand-gold flex items-center gap-1.5">
                          <Home size={16} />
                          {t("قطع الأثاث الموصى بها للتنفيذ:", "Recommended Furniture:")}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300 pt-1">
                          {generatedResult.analysis.furnitureList?.map((f: string, i: number) => (
                            <div key={i} className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-brand-gold" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Designer Gold Advice */}
                      {generatedResult.analysis.designerAdvice && (
                        <div className="bg-brand-gold/10 border border-brand-gold/20 p-4 rounded-2xl flex items-start gap-3">
                          <Info size={20} className="text-brand-gold shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-brand-gold block">{t("نصيحة مهندس النعيمي للديكور:", "Interior Architect's Pro Tip:")}</span>
                            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{generatedResult.analysis.designerAdvice}</p>
                          </div>
                        </div>
                      )}

                      {/* Request Quote Button */}
                      <button
                        onClick={() => {
                          if (onBookExecution) {
                            onBookExecution({
                              title: `${aiRoomType} - ${aiStyle}`,
                              roomType: aiRoomType,
                              style: aiStyle,
                              image: generatedResult.imageUrl
                            });
                          } else {
                            alert(t("تم إرسال طلب تسعير وتنفيذ لهذا التصميم المولد بالذكاء الاصطناعي. يتواصل معك فريقنا الهندسي بدمشق فوراً!", "Quote request submitted for AI design. Our engineering team will contact you shortly!"));
                          }
                        }}
                        className="w-full py-4 bg-brand-gold hover:bg-amber-400 text-brand-navy font-black text-base rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send size={18} />
                        <span>{t("طلب تسعير وتنفيذ ميداني لهذا التصميم", "Request On-Site Execution Quote")}</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: AI DECOR CONSULTANT */}
        {activeTab === 'consultant' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-slate-800/80 border border-white/10 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-brand-gold/10 text-brand-gold rounded-2xl flex items-center justify-center mx-auto">
                  <Calculator size={28} />
                </div>
                <h2 className="text-2xl font-bold text-white">{t("مستشار الديكور وتكلفة التنفيذ الذكي", "AI Interior Decor & Cost Calculator")}</h2>
                <p className="text-xs text-zinc-400 max-w-xl mx-auto">
                  {t("أدخل مساحة وتفاصيل غرفتك ليقوم المهندس الذكي بحساب التكلفة التقديرية (ل.س و $) ودرجات الألوان وخطة التنفيذ الميداني.", "Provide room details to calculate estimated execution budget, color codes, and step-by-step installation plan.")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">{t("نوع المساحة:", "Space Type:")}</label>
                  <input
                    type="text"
                    value={consultRoomType}
                    onChange={(e) => setConsultRoomType(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">{t("الأبعاد / المساحة المقدرة:", "Estimated Dimensions / Area:")}</label>
                  <input
                    type="text"
                    placeholder="مثال: 5×6 متر (30 م²)"
                    value={consultDimensions}
                    onChange={(e) => setConsultDimensions(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">{t("النمط المعماري المفضل:", "Preferred Style:")}</label>
                  <select
                    value={consultStyle}
                    onChange={(e) => setConsultStyle(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                  >
                    <option value="نيو كلاسيك فاخر">نيو كلاسيك فاخر (Neoclassic)</option>
                    <option value="مودرن حديث">مودرن حديث (Modern Minimalist)</option>
                    <option value="أندلسي شرقي">أندلسي شرقي (Andalusian)</option>
                    <option value="لكشري مذهب ورخام">لُكشري مذهب ورخام (Gold & Marble)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">{t("مستوى الميزانية والتنفيذ:", "Budget Tier:")}</label>
                  <select
                    value={consultBudget}
                    onChange={(e) => setConsultBudget(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                  >
                    <option value="اقتصادية جودة عالية">اقتصادية جودة عالية (Standard High Quality)</option>
                    <option value="متوسطة فاخرة VIP">متوسطة فاخرة VIP (Deluxe VIP)</option>
                    <option value="ملكاني سوبر ديلوكس">ملكاني سوبر ديلوكس (Ultra Super Deluxe)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">{t("ملاحظات إضافية أو يرغبات خاصة:", "Special Notes & Desired Items:")}</label>
                <textarea
                  rows={2}
                  placeholder={t("مثال: يرغب ببديل خشبي مع إضاءة مخفية في الأسقف وتغيير بلاط الأرضية...", "Example: Wood paneling with hidden lighting...")}
                  value={consultDetails}
                  onChange={(e) => setConsultDetails(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <button
                onClick={handleGetConsultation}
                disabled={isConsulting}
                className="w-full py-4 bg-brand-gold hover:bg-amber-400 text-brand-navy font-bold text-base rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isConsulting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>{t("جاري حساب دراسات التكلفة والألوان...", "Calculating Budget & Color Palette...")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>{t("احصل على دراسة الديكور والتكلفة فوراً", "Get Interior Consultation & Budget")}</span>
                  </>
                )}
              </button>
            </div>

            {/* Consultation Output */}
            {consultationResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/90 border border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl"
              >
                <div className="border-b border-white/10 pb-4">
                  <span className="text-xs font-bold text-brand-gold">{t("استشارة الديكور والتنفيذ الميداني", "Decoration Execution Report")}</span>
                  <h3 className="text-2xl font-bold text-white mt-1">{consultationResult.title}</h3>
                </div>

                {/* Budget Estimates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-brand-gold/10 border border-brand-gold/30 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-400 block">{t("التكلفة التقديرية بالدولار:", "Est. Cost USD:")}</span>
                      <span className="text-xl font-black text-brand-gold">{consultationResult.costEstimateUSD}</span>
                    </div>
                    <DollarSign size={28} className="text-brand-gold opacity-80" />
                  </div>

                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-400 block">{t("التكلفة التقديرية بالليرة السورية:", "Est. Cost SYP:")}</span>
                      <span className="text-lg font-bold text-white">{consultationResult.costEstimateSYP}</span>
                    </div>
                    <CoinsIcon size={28} className="text-amber-400 opacity-80" />
                  </div>
                </div>

                {/* Color Codes */}
                {consultationResult.colorCodes && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-brand-gold block">{t("درجات الألوان الموصى بها (Color Codes):", "Recommended Color Codes:")}</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {consultationResult.colorCodes.map((c: string, idx: number) => (
                        <div key={idx} className="bg-slate-900 p-3 rounded-xl border border-white/5 text-center text-xs font-mono font-bold text-zinc-200">
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Execution Checklist */}
                {consultationResult.keyFeatures && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-brand-gold block">{t("خطوات التنفيذ الميداني الموصى بها:", "Field Execution Steps:")}</span>
                    <div className="space-y-2">
                      {consultationResult.keyFeatures.map((feat: string, i: number) => (
                        <div key={i} className="bg-slate-900/60 p-3 rounded-xl border border-white/5 flex items-center gap-3 text-xs text-zinc-200">
                          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advisor Note */}
                <p className="text-xs text-zinc-300 bg-white/5 p-4 rounded-2xl leading-relaxed border border-white/5">
                  <strong className="text-brand-gold block mb-1">{t("نصيحة مهندس الديكور:", "Interior Architect Note:")}</strong>
                  {consultationResult.adviceText}
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* TAB 4: MY SAVED DESIGNS */}
        {activeTab === 'saved' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">{t("التصاميم والديكورات المحفوظة الخاصة بي", "My Saved AI Decor Designs")}</h2>
            
            {mySavedDesigns.length === 0 ? (
              <div className="bg-slate-800/40 border border-dashed border-white/10 rounded-3xl p-12 text-center space-y-4">
                <Bookmark size={40} className="text-zinc-600 mx-auto" />
                <h3 className="text-base font-bold text-zinc-300">{t("لم تقم بحفظ أي تصاميم ديكور بعد", "No saved decor designs yet")}</h3>
                <p className="text-xs text-zinc-500">{t("قم بتوليد تصاميم بالذكاء الاصطناعي ثم انقر على زر حفظ التصميم لتظهر هنا.", "Generate AI designs and click save to keep them accessible anytime.")}</p>
                <button
                  onClick={() => setActiveTab('ai-generator')}
                  className="px-6 py-2.5 bg-brand-gold text-brand-navy font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {t("الانتقال لمولد الذكاء الاصطناعي", "Go to AI Generator")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mySavedDesigns.map(design => (
                  <div key={design.id} className="bg-slate-800 border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl">
                    <div>
                      <div className="relative h-52 bg-slate-900">
                        <img src={design.imageUrl} alt={design.title} className="w-full h-full object-cover" />
                        <div className="absolute top-3 right-3 bg-brand-navy/90 text-brand-gold text-[10px] font-bold px-2.5 py-1 rounded-full border border-brand-gold/30">
                          {design.roomType}
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <h3 className="font-bold text-sm text-white">{design.title}</h3>
                        <p className="text-xs text-zinc-400">{design.style} - {design.colorScheme}</p>
                      </div>
                    </div>

                    <div className="p-4 pt-0 border-t border-white/5 mt-2 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          if (onBookExecution) {
                            onBookExecution(design);
                          } else {
                            alert(t("تم تسجيل طلب تنفيذ هذا التصميم!", "Execution request logged!"));
                          }
                        }}
                        className="w-full py-2 bg-brand-gold text-brand-navy text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Send size={14} />
                        <span>{t("طلب تنفيذ هذا التصميم", "Request Quote")}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Detail Modal for Gallery Items */}
      <AnimatePresence>
        {selectedDecorItem && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" dir={isAr ? 'rtl' : 'ltr'}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedDecorItem(null)}
                className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="relative h-64 rounded-2xl overflow-hidden bg-slate-950">
                <img src={selectedDecorItem.image} alt={selectedDecorItem.title} className="w-full h-full object-cover" />
              </div>

              <div>
                <span className="text-xs font-bold text-brand-gold">{selectedDecorItem.roomType} • {selectedDecorItem.style}</span>
                <h3 className="text-xl font-bold text-white mt-1">{selectedDecorItem.title}</h3>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{selectedDecorItem.description}</p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-2xl border border-white/5 space-y-2">
                <span className="text-xs font-bold text-brand-gold block">{t("المواد والخامات الأساسية:", "Key Materials:")}</span>
                <ul className="text-xs text-zinc-300 grid grid-cols-2 gap-2">
                  {selectedDecorItem.materials.map((m: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-400" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div>
                  <span className="text-[10px] text-zinc-400 block">{t("تكلفة التنفيذ التقديرية:", "Estimated Execution Cost:")}</span>
                  <span className="text-sm font-bold text-brand-gold">{selectedDecorItem.estimatedCostUSD}</span>
                </div>

                <button
                  onClick={() => {
                    const item = selectedDecorItem;
                    setSelectedDecorItem(null);
                    if (onBookExecution) {
                      onBookExecution(item);
                    } else {
                      alert(t(`تم تسجيل طلب معاينة وتسعير لـ (${item.title}) بنجاح! 📞`, `Quote request submitted for (${item.title})!`));
                    }
                  }}
                  className="px-6 py-3 bg-brand-gold text-brand-navy font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Send size={16} />
                  <span>{t("اطلب معاينة وتنفيذ الديكور", "Request Execution")}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Icon helper
function CoinsIcon(props: any) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M18 8a6 6 0 0 1-6 6" />
      <path d="M18 14a6 6 0 0 1-6 6" />
    </svg>
  );
}
