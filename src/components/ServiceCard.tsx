import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ChevronRight, ChevronLeft, Maximize2, X } from 'lucide-react';
import { Service } from '../types';

interface ServiceCardProps {
  service: Service;
  onBook: (service: Service) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onBook }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const images = service.images && service.images.length > 0 ? service.images : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80'];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Human-friendly titles/captions based on service category and image index to describe different service aspects
  const getImageCaption = (index: number) => {
    if (service.category === 'legal') {
      const captions = [
        "التدقيق والمراجعة القانونية الشاملة لسندات الطابو",
        "صياغة العقود الرسمية وتوثيق المعاملات وتسييرها في الدوائر الحكومية",
        "تأمين تسليم الملكيات العقارية وتوثيق الأسهم بطرق قانونية آمنة",
        "جلسات استشارية متكاملة لحماية حقوق الملاك والمستثمرين"
      ];
      return captions[index % captions.length];
    } else if (service.category === 'internet') {
      const captions = [
        "تأسيس البنية التحتية المتطورة لشبكات الإنترنت الفايبر البصري السريع",
        "تمديد كابلات الألياف الضوئية وحلول التوصيل والاتصال الموثوق",
        "أنظمة وتطبيقات التحكم المنزلي الذكي للفلل والمجمعات السكنية",
        "توزيع مقويات إشارة اللاسلكي والتحكم الذكي بالإضاءة والتكييف والأمان"
      ];
      return captions[index % captions.length];
    } else {
      const captions = [
        "أعمال الحفر والتشييد الهيكلي المتكامل بالبيتون المسلح للأبنية والقصور",
        "تصميم وإكساء الواجهات الخارجية الفخمة بأحدث الفنون المعمارية ورقائق الحجر",
        "التشطيبات والإكساءات الداخلية الراقية (الجبس بورد الفني والتمديدات الحديثة)",
        "أدق تفاصيل التشطيبات النهائية وتصميم المساحات الفاخرة سوبر ديلوكس"
      ];
      return captions[index % captions.length];
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-[2.5rem] border border-brand-navy/5 shadow-md hover:shadow-2xl overflow-hidden flex flex-col justify-between h-full group"
        dir="rtl"
      >
        <div>
          {/* Main Image Container */}
          <div className="relative h-60 w-full overflow-hidden bg-zinc-950">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeIndex}
                src={images[activeIndex]}
                alt={`${service.title} - صورة ${activeIndex + 1}`}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>

            {/* Dark overlay for indicators legibility */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

            {/* Hoverable Arrows */}
            {images.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <button
                  onClick={handlePrev}
                  className="w-9 h-9 rounded-full bg-black/60 hover:bg-brand-gold hover:text-brand-navy text-white flex items-center justify-center transition-all cursor-pointer pointer-events-auto"
                  title="الصورة السابقة"
                >
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={handleNext}
                  className="w-9 h-9 rounded-full bg-black/60 hover:bg-brand-gold hover:text-brand-navy text-white flex items-center justify-center transition-all cursor-pointer pointer-events-auto"
                  title="الصورة التالية"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>
            )}

            {/* Category Badge */}
            <div className="absolute top-4 right-4 bg-brand-navy/95 text-brand-gold px-4 py-2 rounded-xl text-xs font-bold shadow-md border border-brand-gold/20">
              {service.category === 'legal' ? '⚖️ قانوني وعقود' : service.category === 'internet' ? '🌐 اتصالات ومنزل ذكي' : '🏗️ بناء ومقاولات'}
            </div>

            {/* Zoom Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
              className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-black/60 hover:bg-brand-gold hover:text-brand-navy text-white flex items-center justify-center transition-all cursor-pointer"
              title="عرض معرض الصور كاملة"
            >
              <Maximize2 size={16} />
            </button>

            {/* Image Indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === activeIndex ? 'w-5 bg-brand-gold shadow-xs' : 'w-1.5 bg-white/60 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Service Details */}
          <div className="p-8">
            <h4 className="font-serif text-2xl font-bold text-brand-navy mb-4 leading-tight min-h-[3.5rem] flex items-center">
              {service.title}
            </h4>
            
            {/* Aspect Highlight Caption */}
            <div className="text-[11px] font-black text-brand-gold/90 bg-brand-navy/5 border border-brand-gold/10 rounded-lg px-3 py-1.5 inline-block mb-4 font-sans leading-relaxed">
              🔍 {getImageCaption(activeIndex)}
            </div>

            <p className="text-brand-navy/60 text-sm leading-loose font-medium line-clamp-4 min-h-[6.5rem]">
              {service.description}
            </p>
          </div>
        </div>

        {/* Action Controls & Price */}
        <div className="p-8 pt-0 border-t border-brand-navy/5 bg-brand-cream/10">
          <div className="flex items-center justify-between mt-6">
            <span className="text-brand-navy/40 font-bold text-xs uppercase tracking-wider">التكلفة والرسوم المبدئية</span>
            <span className="text-brand-gold bg-brand-navy/5 px-4 py-2 rounded-xl text-sm font-bold border border-brand-gold/10">
              {service.price}
            </span>
          </div>
          <button
            onClick={() => onBook(service)}
            className="mt-6 w-full py-4 bg-brand-navy text-brand-gold rounded-2xl font-bold hover:bg-brand-gold hover:text-brand-navy transition-all shadow-md shadow-brand-navy/10 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <Calendar size={18} />
            طلب حجز الخدمة
          </button>
        </div>
      </motion.div>

      {/* Full-screen Lightbox Gallery Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <div className="fixed inset-0 bg-brand-navy/95 backdrop-blur-md z-[99999] flex flex-col justify-between p-4 md:p-8 select-none">
            {/* Header Toolbar */}
            <div className="flex justify-between items-center w-full max-w-[1750px] mx-auto py-2 border-b border-white/10 shrink-0" dir="rtl">
              <div>
                <h4 className="text-lg md:text-xl font-serif text-white font-bold">{service.title}</h4>
                <p className="text-brand-gold text-xs mt-1">معرض الصور التفصيلية للخدمة والحلول المعمارية والتقنية</p>
              </div>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand-gold hover:text-brand-navy text-white flex items-center justify-center transition-all cursor-pointer"
                title="إغلاق المعرض"
              >
                <X size={20} />
              </button>
            </div>

            {/* Central Stage */}
            <div className="flex-1 flex items-center justify-center relative max-w-[1750px] mx-auto w-full py-4">
              {images.length > 1 && (
                <button
                  onClick={handlePrev}
                  className="absolute right-2 md:right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-brand-gold hover:text-brand-navy text-white flex items-center justify-center transition-all cursor-pointer z-20"
                  title="الصورة السابقة"
                >
                  <ChevronRight size={24} />
                </button>
              )}

              <div className="max-w-full max-h-[60vh] md:max-h-[70vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
                <img
                  src={images[activeIndex]}
                  alt={`${service.title} - ${activeIndex + 1}`}
                  className="max-w-full max-h-[60vh] md:max-h-[70vh] object-contain mx-auto"
                  referrerPolicy="no-referrer"
                />
              </div>

              {images.length > 1 && (
                <button
                  onClick={handleNext}
                  className="absolute left-2 md:left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-brand-gold hover:text-brand-navy text-white flex items-center justify-center transition-all cursor-pointer z-20"
                  title="الصورة التالية"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
            </div>

            {/* Bottom Panel (Captions & Thumbnails) */}
            <div className="w-full max-w-4xl mx-auto shrink-0 flex flex-col items-center gap-4 text-center pb-4" dir="rtl">
              <div className="bg-brand-navy border border-brand-gold/20 p-4 rounded-2xl w-full">
                <span className="text-xs text-brand-gold uppercase tracking-widest font-bold">زاوية ولفتة توضيحية للخدمة ({activeIndex + 1} من {images.length})</span>
                <p className="text-white text-sm md:text-base font-medium mt-1 leading-relaxed">
                  {getImageCaption(activeIndex)}
                </p>
              </div>

              {/* Thumbnails list */}
              {images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto py-2 px-4 bg-white/5 rounded-2xl max-w-full scrollbar-none justify-center">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        idx === activeIndex ? 'border-brand-gold scale-105 shadow-md shadow-brand-gold/10' : 'border-transparent opacity-50 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt="مصغرة"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
