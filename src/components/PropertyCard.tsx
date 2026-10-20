import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  BedDouble, 
  Eye, 
  Calendar, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Layers,
  Thermometer,
  Zap,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { cn } from '../lib/utils';

interface PropertyCardProps {
  prop: any;
  exchangeRate: number;
  language: 'ar' | 'en';
  onDetails: () => void;
  onBook: () => void;
}

export default function PropertyCard({ 
  prop, 
  exchangeRate, 
  language, 
  onDetails, 
  onBook 
}: PropertyCardProps) {
  const t = (arStr: string, enStr?: string) => language === 'ar' ? arStr : (enStr || arStr);
  const isAr = language === 'ar';

  const formatPrice = (priceStr: string, currency: 'SYP' | 'USD', rate: number): string => {
    if (!priceStr) return '';
    const cleanStr = priceStr.replace(/[^\d]/g, '');
    const parsed = parseInt(cleanStr, 10);
    if (isNaN(parsed) || parsed === 0) return priceStr;
    if (currency === 'SYP') {
      return parsed.toLocaleString(isAr ? 'ar-SY' : 'en-US') + ' ل.س';
    } else {
      const usdValue = Math.round(parsed / rate);
      return '$' + usdValue.toLocaleString('en-US');
    }
  };

  const statusLabel = prop.status === 'sold' ? t('مباع', 'Sold') : prop.status === 'reserved' ? t('محجوز', 'Reserved') : t('متاح', 'Available');
  
  // Setup Slideshow Data
  const hasImages = prop.images && prop.images.length > 0;
  const rawImages = hasImages ? prop.images : [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"
  ];

  // We construct slides: 
  // - First slide: Cover image with main details
  // - Dynamic image slides: with specific overlay specs
  // - Final slide: Dedicated Features & Benefits slide
  const slides: any[] = [];

  // Slide 0: Main cover
  slides.push({
    type: 'image',
    image: rawImages[0],
    title: t('العرض الرئيسي والواجهة', 'Main Cover & View'),
    overlay: null
  });

  // Slide 1: If there's a second image, or we fallback with custom spec overlays on the first image
  if (rawImages.length > 1) {
    slides.push({
      type: 'image',
      image: rawImages[1],
      title: t('التفاصيل الهندسية والمساحة', 'Architectural details & Area'),
      overlay: {
        title: t('📐 المساحة والتصميم', '📐 Area & Layout'),
        items: [
          `${t('المساحة:', 'Area:')} ${prop.area || 150} م²`,
          `${t('عدد الغرف:', 'Rooms:')} ${prop.rooms || 3} ${t('غرف', 'Rooms')}`,
          `${t('الطابق:', 'Floor:')} ${prop.floors || t('متعدد', 'Multiple')}`
        ]
      }
    });
  } else {
    // Overlay on the same single image
    slides.push({
      type: 'image',
      image: rawImages[0],
      title: t('المساحة والتصميم الداخلي', 'Area & Interior Layout'),
      overlay: {
        title: t('📐 المساحة والتقسيم الداخلي', '📐 Area & Division'),
        items: [
          `${t('المساحة الإجمالية:', 'Total Area:')} ${prop.area || 150} م²`,
          `${t('عدد الغرف والصالونات:', 'Rooms & Lounges:')} ${prop.rooms || 3}`,
          `${t('الحمامات:', 'Toilets:')} ${prop.toiletCount || 1}`
        ]
      }
    });
  }

  // Slide 2: Specs overlay (Third image or first image if none)
  const thirdImage = rawImages[2] || rawImages[0];
  slides.push({
    type: 'image',
    image: thirdImage,
    title: t('التجهيز والتشطيبات الفاخرة', 'High-end Finishing & Specs'),
    overlay: {
      title: t('💎 التجهيز والمواصفات الفنية', '💎 Premium Finishing Levels'),
      items: [
        `${t('مستوى الكسوة:', 'Finishing:')} ${prop.finishingLevel || t('سوبر ديلوكس فاخر', 'Super Deluxe')}`,
        `${t('نوع الملكية:', 'Deeds:')} ${prop.deedsStatus || t('طابو أخضر سهمي', 'Green Deed / Shares')}`,
        `${t('التدفئة:', 'Heating:')} ${prop.heatingSystem || t('تكييف مركزي مسبق', 'Central A/C pre-installed')}`
      ]
    }
  });

  // Slide 3: Utilities overlay (Fourth image or first image if none)
  const fourthImage = rawImages[3] || rawImages[0];
  slides.push({
    type: 'image',
    image: fourthImage,
    title: t('الخدمات والشبكات المتصلة', 'Utilities & Services'),
    overlay: {
      title: t('⚡ خدمات البنية التحتية والراحة', '⚡ Infrastructure & Comfort'),
      items: [
        `${t('نوع الكهرباء:', 'Electricity:')} ${prop.electricityType || t('خط منزلي مستقر', 'Stable Domestic Line')}`,
        `${t('إطلالة الشرفات:', 'Balconies:')} ${prop.balconyCount || 1} ${t('شرفات بإطلالة مميزة', 'balconies with view')}`,
        `${t('تصنيف العقار:', 'Classification:')} ${
          prop.classification === 'ready_to_move' ? t('جاهز للسكن الفوري', 'Ready to move') :
          prop.classification === 'under_construction' ? t('قيد الإنشاء / فرصة ممتازة', 'Under Construction') :
          t('فرصة استثمارية واعدة', 'Investment Offer')
        }`
      ]
    }
  });

  // Final Slide: Rich Features dashboard card replacing image area
  slides.push({
    type: 'dashboard',
    title: t('💎 لوحة المزايا والخدمات الشاملة', '💎 Full Perks & Amenities Dashboard')
  });

  const [activeSlide, setActiveSlide] = useState(0);

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const currentSlide = slides[activeSlide];

  return (
    <div 
      className="group bg-white rounded-3xl border border-brand-navy/5 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col text-right h-full cursor-pointer hover:border-brand-gold/30"
      onClick={onDetails}
    >
      {/* Interactive Slideshow Area */}
      <div className="relative h-56 sm:h-64 overflow-hidden bg-brand-navy/5 shrink-0 select-none">
        
        {currentSlide.type === 'image' ? (
          <div className="relative w-full h-full">
            {/* Slide Image */}
            <img 
              src={currentSlide.image} 
              alt={prop.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102" 
              referrerPolicy="no-referrer"
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

            {/* Float Label showing Slide Title */}
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-black/60 text-[10px] text-brand-gold font-bold px-2.5 py-1 rounded-xl backdrop-blur-md border border-brand-gold/20">
                {currentSlide.title}
              </span>
            </div>

            {/* Feature Overlay if defined */}
            {currentSlide.overlay && (
              <div className="absolute inset-x-4 bottom-14 bg-brand-navy/90 backdrop-blur-md p-3 rounded-2xl border border-brand-gold/20 text-right animate-fadeIn">
                <h5 className="text-[11px] font-black text-brand-gold flex items-center gap-1.5 mb-1.5 justify-start" dir="rtl">
                  <span>✨</span> {currentSlide.overlay.title}
                </h5>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-zinc-150 font-bold" dir="rtl">
                  {currentSlide.overlay.items.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-1 justify-start">
                      <span className="text-brand-gold text-xs">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Full Feature Dashboard Slide */
          <div className="w-full h-full bg-gradient-to-br from-[#061325] via-[#0E203A] to-[#061325] p-5 flex flex-col justify-between text-white animate-fadeIn border-b-2 border-brand-gold/30">
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs text-brand-gold font-black flex items-center gap-1">
                  <Sparkles size={12} className="animate-spin text-brand-gold" />
                  {t('ملخص مزايا العقار الحصرية', 'Exclusive Real Estate Perks')}
                </span>
                <span className="text-[9px] bg-brand-gold text-brand-navy font-bold px-2 py-0.5 rounded-lg">
                  {t('لوحة المواصفات', 'SPECS')}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/5 border border-white/5 p-2 rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] text-zinc-400 font-bold mb-0.5">{t('المساحة الإجمالية', 'Total Area')}</span>
                  <span className="font-extrabold text-brand-gold font-mono">{prop.area || 150} م²</span>
                </div>
                <div className="bg-white/5 border border-white/5 p-2 rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] text-zinc-400 font-bold mb-0.5">{t('التقسيم الداخلي', 'Rooms')}</span>
                  <span className="font-extrabold text-brand-gold font-mono">{prop.rooms || 3} {t('غرف وصالون', 'Rooms')}</span>
                </div>
                <div className="bg-white/5 border border-white/5 p-2 rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] text-zinc-400 font-bold mb-0.5">{t('الكسوة والتجهيز', 'Finishing Level')}</span>
                  <span className="font-extrabold text-white text-[10px] truncate max-w-full">{prop.finishingLevel || t('سوبر ديلوكس', 'Super Deluxe')}</span>
                </div>
                <div className="bg-white/5 border border-white/5 p-2 rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] text-zinc-400 font-bold mb-0.5">{t('الملكية وسند الطابو', 'Deeds Status')}</span>
                  <span className="font-extrabold text-white text-[10px] truncate max-w-full">{prop.deedsStatus || t('طابو أخضر', 'Green Deed')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/5 mt-2">
              <span className="text-[10px] text-zinc-300 font-medium truncate leading-relaxed">
                {t('اضغط "حجز معاينة" لمشاهدة الموقع على الطبيعة', 'Click "Book Viewing" to visit the property')}
              </span>
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            </div>
          </div>
        )}

        {/* Static Header Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 items-end z-10">
          <span className={cn(
            "px-3 py-1 rounded-xl text-[10px] font-black border uppercase tracking-wider shadow-md backdrop-blur-md",
            prop.classification === 'ready_to_move' ? "bg-emerald-600/95 text-white border-emerald-500/35" :
            prop.classification === 'under_construction' ? "bg-amber-500/95 text-brand-navy border-amber-400/35" :
            "bg-brand-navy/95 text-brand-gold border-brand-gold/35"
          )}>
            {prop.classification === 'ready_to_move' ? t('جاهز للسكن 🔑', 'Ready to Move 🔑') :
             prop.classification === 'under_construction' ? t('تحت الإنشاء 👷', 'Under Construction 👷') :
             t('عرض استثماري 💎', 'Investment Offer 💎')}
          </span>
          {prop.isPremium && (
            <span className="bg-brand-gold/95 text-brand-navy border border-brand-gold-light/45 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest shadow-md">
              VIP ELITE
            </span>
          )}
        </div>

        {/* Status Badge (Stays constant) */}
        <div className="absolute bottom-4 right-4 z-10">
          <span className={cn(
            "px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-md border",
            prop.status === 'sold' ? "bg-red-500 text-white border-red-400" :
            prop.status === 'reserved' ? "bg-amber-500 text-brand-navy border-amber-400" :
            "bg-emerald-500 text-white border-emerald-400"
          )}>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full bg-white",
              prop.status !== 'sold' && prop.status !== 'reserved' && "animate-ping"
            )} />
            {statusLabel}
          </span>
        </div>

        {/* Dual Pricing Badge (Only visible when not on dashboard slide) */}
        {currentSlide.type === 'image' && (
          <div className="absolute bottom-4 left-4 flex flex-col items-end z-10">
            <span className="text-white font-mono font-black text-sm bg-black/50 backdrop-blur-md px-3 py-1 rounded-xl">
              {formatPrice(prop.price, 'SYP', exchangeRate)}
            </span>
            <span className="text-brand-gold font-mono font-bold text-xs bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-lg mt-1">
              {formatPrice(prop.price, 'USD', exchangeRate)}
            </span>
          </div>
        )}

        {/* Left & Right Interactive Slideshow Controls */}
        <button
          type="button"
          onClick={handlePrevSlide}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-brand-gold hover:text-brand-navy text-white flex items-center justify-center transition-all duration-200 border border-white/10 active:scale-90"
          title={t('السابق', 'Previous')}
        >
          <ChevronLeft size={18} />
        </button>

        <button
          type="button"
          onClick={handleNextSlide}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-brand-gold hover:text-brand-navy text-white flex items-center justify-center transition-all duration-200 border border-white/10 active:scale-90"
          title={t('التالي', 'Next')}
        >
          <ChevronRight size={18} />
        </button>

        {/* Bullet Progress Indicators */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-black/30 px-2 py-1 rounded-full backdrop-blur-xs">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveSlide(index);
              }}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-200",
                activeSlide === index ? "bg-brand-gold scale-125 shadow-xs" : "bg-white/40 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      </div>

      {/* Property Card Body */}
      <div className="p-5 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="font-serif font-black text-base text-brand-navy mb-2 leading-snug group-hover:text-brand-gold transition-colors">
            {prop.title}
          </h3>
          
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold justify-end mb-4">
            <span>{prop.location}</span>
            <MapPin size={14} className="text-brand-gold" />
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed font-medium mb-4 line-clamp-2">
            {prop.description}
          </p>
        </div>

        {/* Core specifications */}
        <div className="border-t border-brand-navy/5 pt-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {prop.rooms !== undefined && prop.rooms > 0 && (
              <div className="flex items-center gap-2 justify-end bg-brand-cream/5 p-2 rounded-xl border border-brand-navy/5">
                <span className="text-[10px] font-bold text-zinc-400 font-serif">{t('الغرف', 'Rooms')}</span>
                <span className="text-xs font-black text-brand-navy font-mono">{prop.rooms}</span>
                <BedDouble size={14} className="text-brand-gold shrink-0" />
              </div>
            )}
            {prop.area !== undefined && prop.area > 0 && (
              <div className="flex items-center gap-2 justify-end bg-brand-cream/5 p-2 rounded-xl border border-brand-navy/5">
                <span className="text-[10px] font-bold text-zinc-400 font-serif">{t('المساحة', 'Area')}</span>
                <span className="text-xs font-black text-brand-navy font-mono">{prop.area} م²</span>
                <Building2 size={14} className="text-brand-gold shrink-0" />
              </div>
            )}
          </div>

          {/* Interactive Info Banner for Slideshow Navigation hint */}
          <div className="bg-brand-gold/5 border border-brand-gold/10 p-2.5 rounded-2xl mb-4 text-center text-[10px] text-brand-navy/80 font-bold flex items-center justify-center gap-1.5">
            <span>📊</span>
            <span>{t('يمكنك التنقل بين صور ومزايا العقار بالأعلى مباشرة!', 'Swipe/Navigate through images and features above!')}</span>
          </div>

          {/* Booking Trigger Buttons - Unified Visual Identity */}
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // prevent card detail click trigger
                onBook();
              }}
              className="flex-1 py-2.5 bg-brand-navy hover:bg-brand-gold text-brand-gold hover:text-brand-navy rounded-xl text-xs font-black transition-all duration-200 shadow-xs flex items-center justify-center gap-1.5 border-0 cursor-pointer"
            >
              <Calendar size={14} />
              <span>{t('حجز معاينة', 'Book Viewing')}</span>
            </button>

            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDetails();
              }}
              className="px-3.5 py-2.5 bg-brand-cream/30 hover:bg-brand-cream/60 border border-brand-navy/10 text-brand-navy hover:text-brand-navy/80 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center cursor-pointer"
            >
              <Eye size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
