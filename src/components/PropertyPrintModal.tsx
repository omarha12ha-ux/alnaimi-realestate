import { useEffect } from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import type { Appointment, Property } from '../types';

/**
 * Print-optimised property / appointment summary that drives window.print().
 */
interface PropertyPrintModalProps {
  property: Property;
  appointment?: Appointment;
  onClose: () => void;
  language?: 'ar' | 'en';
}

export function PropertyPrintModal({ property, appointment, onClose, language = 'ar' }: PropertyPrintModalProps) {
  useEffect(() => {
    // Scroll to top of preview modal when opened
    const elem = document.getElementById('property-print-container');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[10000] bg-zinc-950/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 no-print" 
      dir="rtl"
    >
      {/* Dynamic Style injection for print hiding everything else with scroll resets */}
      <style>{`
        @media print {
          html, body {
            overflow: visible !important;
            height: auto !important;
          }
          body * {
            visibility: hidden !important;
          }
          #property-print-container, #property-print-container * {
            visibility: visible !important;
          }
          #property-print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative border border-brand-navy/10 text-right"
      >
        {/* Preview Header - Hidden during print */}
        <div className="bg-brand-navy text-brand-gold p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center no-print gap-4 select-none">
          <div className="text-right">
            <h3 className="text-base font-serif font-black tracking-wide">🔍 معاينة مستند العقار المحجوز قبل الطباعة</h3>
            <p className="text-[10px] text-brand-gold/60 mt-1">💡 يرجى التأكد من تفعيل خيار <b>"رسومات الخلفية" (Background Graphics)</b> في خيارات متصفحك للطباعة لتظهر الصور والألوان بوضوح.</p>
          </div>
          <div className="flex gap-2.5 shrink-0">
            <button
              onClick={handlePrint}
              className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy px-5 py-2.5 rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-brand-gold/10"
            >
              <span>🖨️</span>
              <span>تأكيد الطباعة / حفظ كـ PDF</span>
            </button>
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer border border-white/10"
            >
              إلغاء وإغلاق
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area for the User */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-50 scrollbar-thin">
          {/* This is the container that will be printed */}
          <div id="property-print-container" className="bg-white p-6 md:p-10 rounded-2xl border border-zinc-200 shadow-sm max-w-[210mm] mx-auto text-right text-zinc-900 font-sans leading-relaxed">
            
            {/* Top decorative gold border */}
            <div className="h-2 w-full bg-gradient-to-r from-brand-gold via-brand-navy to-brand-gold mb-6 rounded-full" />

            {/* Letterhead */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-200 pb-5 mb-6 gap-4">
              <div className="text-right space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏛️</span>
                  <span className="text-lg font-serif font-black text-brand-navy">شركة البراء النعيمي للتنمية والتطوير العقاري</span>
                </div>
                <p className="text-[11px] text-zinc-500 font-bold">دمشق، سوريا - أوتوستراد المزة، برج النعيمي الفاخر</p>
                <p className="text-[10px] text-zinc-400">تاريخ المعاينة والطباعة: {format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
              </div>
              <div className="text-right sm:text-left space-y-1">
                <span className="bg-brand-gold/15 text-brand-navy px-3.5 py-1 rounded-full text-[10px] font-black inline-block border border-brand-gold/20 select-none">وثيقة تفصيلية معتمدة لزيارة عقارية</span>
                {appointment && (
                  <p className="text-[10px] text-zinc-400 font-bold">معرف الحجز: <span className="font-mono text-zinc-600">#{appointment.id.toUpperCase().slice(0, 8)}</span></p>
                )}
              </div>
            </div>

            {/* Main Details Grid */}
            <div className="space-y-6">
              {/* Property Main Header */}
              <div>
                <h1 className="text-xl md:text-2xl font-serif font-black text-brand-navy leading-tight mb-2">{property.title}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-600 font-bold">
                  <div className="flex items-center gap-1">
                    <span>📍</span>
                    <span>{property.location}</span>
                  </div>
                  {property.governorate && (
                    <div className="flex items-center gap-1">
                      <span>🏙️</span>
                      <span>{property.governorate}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 bg-brand-gold/10 px-2 py-0.5 rounded-lg border border-brand-gold/20">
                    <span>💰</span>
                    <span className="text-brand-navy font-black text-sm">القيمة الاستثمارية: {property.price}</span>
                  </div>
                </div>
              </div>

              {/* Reserved Badge and Appointment Date Card */}
              {appointment && (
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/60 space-y-2">
                  <h3 className="font-bold text-xs text-brand-navy flex items-center gap-1.5 border-b pb-1.5 border-zinc-200/50">
                    <span>📅</span>
                    <span>تفاصيل موعد المعاينة المحجوز للعميل:</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold text-zinc-700">
                    <div>
                      <span className="text-zinc-400 block text-[10px] mb-0.5">تاريخ المعاينة</span>
                      <span className="text-zinc-900">{appointment.date}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] mb-0.5">توقيت المعاينة</span>
                      <span className="text-zinc-900">{appointment.time}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] mb-0.5">طريقة الحجز والمتابعة</span>
                      <span className="text-emerald-700">بوابة المواعيد الإلكترونية</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] mb-0.5">حالة الطلب الحالية</span>
                      <span className="text-brand-navy">مؤكد ومقرر ميدانياً</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Property Specifications Grid */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-brand-navy border-b pb-1.5 border-zinc-100">📋 المواصفات الهندسية للعقار:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold text-zinc-700">
                  <div className="bg-zinc-50/50 p-2.5 rounded-lg border border-zinc-150">
                    <span className="text-zinc-400 block text-[10px] mb-0.5">نوع العقار</span>
                    <span className="text-zinc-900">
                      {property.type === 'Residential' ? 'سكني (Residential)' : property.type === 'Commercial' ? 'تجاري (Commercial)' : 'أرض فضاء'}
                    </span>
                  </div>
                  <div className="bg-zinc-50/50 p-2.5 rounded-lg border border-zinc-150">
                    <span className="text-zinc-400 block text-[10px] mb-0.5">المساحة الكلية</span>
                    <span className="text-zinc-900 font-mono">{property.area ? `${property.area} م²` : 'غير محدد'}</span>
                  </div>
                  <div className="bg-zinc-50/50 p-2.5 rounded-lg border border-zinc-150">
                    <span className="text-zinc-400 block text-[10px] mb-0.5">عدد الغرف</span>
                    <span className="text-zinc-900">{property.rooms ? `${property.rooms} غرف` : 'غير محدد'}</span>
                  </div>
                  <div className="bg-zinc-50/50 p-2.5 rounded-lg border border-zinc-150">
                    <span className="text-zinc-400 block text-[10px] mb-0.5">عدد الحمامات</span>
                    <span className="text-zinc-900">{property.toiletCount ? `${property.toiletCount} حمام` : 'غير محدد'}</span>
                  </div>
                  <div className="bg-zinc-50/50 p-2.5 rounded-lg border border-zinc-150">
                    <span className="text-zinc-400 block text-[10px] mb-0.5">مستوى الإكساء</span>
                    <span className="text-zinc-900">{property.finishingLevel || 'إكساء فاخر'}</span>
                  </div>
                  <div className="bg-zinc-50/50 p-2.5 rounded-lg border border-zinc-150">
                    <span className="text-zinc-400 block text-[10px] mb-0.5">سند الملكية</span>
                    <span className="text-zinc-900">{property.deedsStatus || 'طابو أخضر نظامي'}</span>
                  </div>
                  <div className="bg-zinc-50/50 p-2.5 rounded-lg border border-zinc-150">
                    <span className="text-zinc-400 block text-[10px] mb-0.5">الطابق الحالي</span>
                    <span className="text-zinc-900">{property.floors ? `الطابق ${property.floors}` : 'غير محدد'}</span>
                  </div>
                  <div className="bg-zinc-50/50 p-2.5 rounded-lg border border-zinc-150">
                    <span className="text-zinc-400 block text-[10px] mb-0.5">سنة البناء</span>
                    <span className="text-zinc-900 font-mono">{property.yearBuilt || 'حديث'}</span>
                  </div>
                </div>
              </div>

              {/* Property Description */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs text-brand-navy border-b pb-1.5 border-zinc-100">📝 الوصف والخصائص العامة:</h3>
                <p className="text-xs text-zinc-700 leading-relaxed font-medium whitespace-pre-line bg-zinc-50/30 p-3.5 rounded-lg border border-zinc-100">{property.description}</p>
              </div>

              {/* Images Grid */}
              {property.images && property.images.length > 0 && (
                <div className="space-y-3 break-inside-avoid">
                  <h3 className="font-bold text-xs text-brand-navy border-b pb-1.5 border-zinc-100">📸 صور المعاينة الميدانية:</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {property.images.slice(0, 4).map((img, idx) => (
                      <div key={idx} className="relative aspect-video bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200">
                        <img 
                          src={img} 
                          alt={`صورة العقار ${idx + 1}`} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                  {property.images.length > 4 && (
                    <p className="text-[9px] text-zinc-400 text-center font-bold">تم تضمين الصور الأربعة الأساسية لضمان كفاءة الطباعة ونظام الحجم الموحد.</p>
                  )}
                </div>
              )}

              {/* Footer Stamp / QR Info */}
              <div className="border-t border-zinc-200 pt-5 mt-8 flex flex-col sm:flex-row justify-between items-center text-[11px] font-bold text-zinc-500 gap-4 break-inside-avoid">
                <div className="text-right space-y-1">
                  <p className="text-brand-navy font-black text-xs">🏛️ شركة البراء النعيمي للتنمية والتطوير والاستثمار العقاري</p>
                  <p>نشكركم لثقتكم المستمرة في اختيار مشاريعنا الفاخرة المعتمدة بدمشق وكافة المحافظات السورية.</p>
                  <p className="text-[10px] text-zinc-400">هاتف الاستفسارات: 011-2345678 | بريد: info@albarraa-naimi.sy | موقعنا: albaraa-naimi.sy</p>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 p-2.5 rounded-lg text-center shrink-0 min-w-[120px] flex flex-col items-center justify-center shadow-2xs">
                  <span className="text-brand-navy font-serif font-black mb-0.5 text-xs">البراء النعيمي</span>
                  <span className="text-[8px] text-zinc-400">خاتم وثيقة إلكترونية معتمدة</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
