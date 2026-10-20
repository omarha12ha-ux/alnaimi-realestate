import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Eye, MapPin, Building2, Trash2, ChevronLeft, ShieldCheck, Coins, Compass } from 'lucide-react';
import { Property } from '../types';
import { cn } from '../lib/utils';

interface PropertyCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  compareProperties: Property[];
  onRemove: (id: string) => void;
  onBook: (property: Property) => void;
  onViewDetails: (property: Property) => void;
}

export default function PropertyCompareModal({
  isOpen,
  onClose,
  compareProperties,
  onRemove,
  onBook,
  onViewDetails
}: PropertyCompareModalProps) {
  if (!isOpen) return null;

  // Custom lists of features to compare
  const specs = [
    {
      category: 'التفاصيل المالية والأساسية',
      icon: <Coins size={16} className="text-brand-gold shrink-0" />,
      items: [
        {
          label: 'سعر العقار التقريبي',
          render: (p: Property) => (
            <span className="font-serif font-black text-[#B8943B] text-base md:text-lg block text-right">
              {p.price}
            </span>
          )
        },
        {
          label: 'التصنيف الهيكلي',
          render: (p: Property) => {
            const label = p.type === 'Residential' ? '🏡 سكني' : p.type === 'Commercial' ? '🏢 تجاري' : '⛰️ أراضي ومزارع';
            const color = p.type === 'Residential' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : p.type === 'Commercial' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200';
            return (
              <span className={cn("px-2.5 py-1 rounded-xl text-xs font-bold border inline-block", color)}>
                {label}
              </span>
            );
          }
        }
      ]
    },
    {
      category: 'الموقع والتوزيع المكتبي',
      icon: <MapPin size={16} className="text-brand-gold shrink-0" />,
      items: [
        {
          label: 'المحافظة والمنطقة الإدارية',
          render: (p: Property) => (
            <span className="text-brand-navy font-bold text-sm block">
              📍 {p.governorate || 'دمشق وريفها'}
            </span>
          )
        },
        {
          label: 'العنوان التفصيلي وموقع الموعد',
          render: (p: Property) => (
            <span className="text-brand-navy/80 text-xs font-medium leading-relaxed block text-right">
              {p.location}
            </span>
          )
        },
        {
          label: 'الرمز والإحداثيات الجغرافية',
          render: (p: Property) => (
            <span className="font-mono text-[10px] bg-brand-navy/5 text-brand-navy/70 px-2 py-1 rounded-md block max-w-max">
              🌐 {p.coordinates ? `${p.coordinates[0].toFixed(5)}, ${p.coordinates[1].toFixed(5)}` : 'غير متوفر'}
            </span>
          )
        }
      ]
    },
    {
      category: 'المساحة والتقسيم الداخلي',
      icon: <Compass size={16} className="text-brand-gold shrink-0" />,
      items: [
        {
          label: 'عدد الغرف والتقسيمات',
          render: (p: Property) => {
            const r = p.rooms;
            if (r === undefined || r === 0) return <span className="text-brand-navy/40 text-xs">مساحة مفتوحة</span>;
            return (
              <span className="text-brand-navy font-bold text-sm flex items-center gap-1">
                <span>🛏️</span>
                <span>{r} {r === 1 ? 'غرفة منفردة' : r === 2 ? 'غرفتين' : `${r} غرف رئيسية`}</span>
              </span>
            );
          }
        }
      ]
    },
    {
      category: 'حالة العرض والطلب الميداني',
      icon: <ShieldCheck size={16} className="text-brand-gold shrink-0" />,
      items: [
        {
          label: 'حالة توفر العقار',
          render: (p: Property) => {
            const status = p.status || 'available';
            const color = status === 'sold'
              ? "bg-red-50 text-red-700 border-red-150"
              : status === 'reserved'
              ? "bg-amber-50 text-amber-700 border-amber-150"
              : "bg-emerald-50 text-emerald-800 border-emerald-150";
            return (
              <span className={cn("px-2.5 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border shadow-sm", color)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", status === 'sold' || status === 'reserved' ? "bg-red-500" : "bg-emerald-500 animate-pulse")} />
                {status === 'sold' ? 'مباع بالكامل' : status === 'reserved' ? 'محجوز مؤقتاً' : 'متاح للطلب'}
              </span>
            );
          }
        },
        {
          label: 'تفاعل واهتمام العملاء الميداني',
          render: (p: Property) => (
            <span className="text-brand-navy/80 text-xs font-bold flex items-center gap-1 bg-[#1A2E40]/5 px-2.5 py-1.5 rounded-xl max-w-max text-right">
              <Eye size={13} className="text-brand-gold" />
              <span>{p.views || 0} مشاهدة حية للتواصل</span>
            </span>
          )
        }
      ]
    },
    {
      category: 'التوصيف العقاري العام',
      icon: <Building2 size={16} className="text-brand-gold shrink-0" />,
      items: [
        {
          label: 'ملخص مواصفات البناء والتشطيب',
          render: (p: Property) => (
            <p className="text-brand-navy/60 text-xs leading-relaxed max-w-xs text-justify font-medium line-clamp-5 whitespace-pre-line pr-1">
              {p.description}
            </p>
          )
        }
      ]
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-navy/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-10" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 35 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 35 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="bg-[#faf8f4] w-full max-w-[1750px] rounded-[2.5rem] shadow-2xl border border-brand-navy/5 overflow-hidden flex flex-col max-h-[85vh] md:max-h-[90vh]"
        >
          {/* Header Banner */}
          <div className="p-6 md:p-8 border-b border-brand-navy/5 flex items-center justify-between bg-brand-navy text-white relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 w-52 h-52 bg-brand-gold rounded-full opacity-5 pointer-events-none"></div>
            <div className="absolute -left-16 -top-16 w-40 h-40 bg-brand-gold rounded-full opacity-5 pointer-events-none"></div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-brand-gold rounded-2xl flex items-center justify-center text-brand-navy shadow-lg shadow-brand-gold/15 shrink-0">
                <span className="text-2xl">⚖️</span>
              </div>
              <div className="text-right">
                <h3 className="font-serif text-2xl md:text-3xl font-extrabold text-brand-gold leading-tight">مقارنة المواصفات التفصيلية</h3>
                <p className="text-xs md:text-sm text-white/70 font-bold mt-1">جدول تحليلي متكامل للمقارنة الطولية لتسهيل قرار الشراء والاستثمار العقاري.</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-brand-gold flex items-center justify-center transition-all cursor-pointer relative z-10 hover:rotate-90 duration-300"
              title="إغلاق تبويب المقارنة"
            >
              <X size={22} />
            </button>
          </div>

          {/* Table Container area */}
          <div className="flex-1 overflow-auto p-6 md:p-8 bg-[#faf8f4]">
            {compareProperties.length === 0 ? (
              <div className="py-24 text-center flex flex-col items-center justify-center gap-6">
                <div className="w-24 h-24 bg-brand-navy/5 rounded-full flex items-center justify-center text-5xl border border-brand-navy/10 animate-pulse">
                  📋
                </div>
                <div>
                  <h4 className="font-serif text-xl font-black text-brand-navy">سلة المقارنة فارغة تماماً</h4>
                  <p className="text-xs text-brand-navy/50 font-bold mt-1.5 max-w-sm leading-relaxed">
                    يرجى الرجوع لعروض العقارات وتثبيت زر المقارنة على بطاقتين أو أكثر لتستطيع استخلاص النتائج والتباينات الفنية والمالية بينهما.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-8 py-3.5 bg-brand-navy text-brand-gold hover:bg-brand-gold hover:text-brand-navy hover:scale-105 font-bold text-sm rounded-2xl transition-all cursor-pointer shadow-xl shadow-brand-navy/10"
                >
                  تصفح واختيار العقارات الآن
                </button>
              </div>
            ) : (
              <div className="w-full overflow-x-auto rounded-[2rem] border border-brand-navy/10 shadow-lg bg-white">
                <table className="w-full text-right border-collapse min-w-[760px]">
                  <thead>
                    <tr className="bg-brand-navy/5 border-b border-brand-navy/10">
                      {/* Empty top-right label cell */}
                      <th className="p-6 text-sm font-black text-brand-navy w-[260px] border-l border-brand-navy/10 tracking-wide align-middle bg-brand-navy/10">
                        📋 المعيار والسمة الفنية
                      </th>
                      
                      {/* Dynamically shared headers columns based on chosen items duration */}
                      {compareProperties.map((property) => (
                        <th key={property.id} className="p-6 align-top w-[320px] relative border-l border-brand-navy/10 last:border-l-0">
                          <div className="flex flex-col gap-4">
                            {/* Card Image element container */}
                            <div className="relative h-44 w-full overflow-hidden rounded-[1.5rem] shadow-md border border-brand-navy/5 group/image">
                              <img
                                src={property.images[0]}
                                alt={property.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-110"
                                referrerPolicy="no-referrer"
                              />
                              <button
                                onClick={() => onRemove(property.id)}
                                className="absolute top-3 left-3 w-9 h-9 rounded-full bg-red-500/90 text-white hover:bg-red-600 flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-110 active:scale-90"
                                title="إزالة هذا العقار من قائمة المقارنة"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            
                            <div className="space-y-1.5 pr-2">
                              <h4 className="font-serif font-black text-brand-navy text-sm md:text-base leading-snug line-clamp-2 min-h-[46px]">
                                {property.title}
                              </h4>
                              <p className="text-[11px] font-sans font-black text-brand-navy/40 uppercase">المعرف: {property.id}</p>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  
                  <tbody>
                    {specs.map((cat, catIdx) => (
                      <React.Fragment key={cat.category}>
                        {/* Section Header Row */}
                        <tr className="bg-[#1A2E40]/10 border-b border-brand-navy/10">
                          <td 
                            colSpan={compareProperties.length + 1} 
                            className="p-4 text-xs font-black text-brand-navy uppercase tracking-widest text-right flex items-center gap-2 bg-[#1A2E40]/5"
                          >
                            {cat.icon}
                            <span>{cat.category}</span>
                          </td>
                        </tr>
                        
                        {/* Dynamic Rows in category */}
                        {cat.items.map((item, itemIdx) => (
                          <tr 
                            key={item.label} 
                            className={cn(
                              "border-b border-brand-navy/5 hover:bg-brand-navy/5 transition-all",
                              itemIdx % 2 === 0 ? "bg-white" : "bg-brand-cream/10"
                            )}
                          >
                            {/* Left side static criteria label */}
                            <td className="p-4 font-bold text-xs text-brand-navy/75 border-l border-brand-navy/10 bg-brand-navy/[0.01] align-middle">
                              {item.label}
                            </td>
                            
                            {/* Corresponding comparisons values columns */}
                            {compareProperties.map((p) => (
                              <td key={p.id} className="p-4 align-middle border-l border-brand-navy/10 last:border-l-0">
                                {item.render(p)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}

                    {/* Quick Booking Actions Row in bottom list footer */}
                    <tr className="bg-brand-navy/5 border-t border-brand-navy/10 font-bold text-sm">
                      <td className="p-5 text-brand-navy/55 border-l border-brand-navy/10 bg-brand-navy/5 align-middle font-black">
                        🏛️ القرار النهائي المباشر
                      </td>
                      
                      {compareProperties.map((p) => (
                        <td key={p.id} className="p-5 align-middle border-l border-brand-navy/10 last:border-l-0 bg-white">
                          <div className="flex flex-col gap-2.5">
                            <button
                              onClick={() => onViewDetails(p)}
                              className="w-full py-3 rounded-2xl border-2 border-brand-navy/10 font-extrabold text-xs text-brand-navy hover:bg-brand-navy hover:text-brand-gold hover:border-brand-navy transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.01]"
                            >
                              <span>معاينة الصور والخرائط</span>
                              <ChevronLeft size={13} />
                            </button>
                            
                            <button
                              onClick={() => onBook(p)}
                              className="w-full py-3.5 rounded-2xl bg-[#1A2E40] text-brand-gold hover:bg-brand-gold hover:text-brand-navy font-black text-xs transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:scale-[1.01]"
                            >
                              <Calendar size={13} />
                              <span>حجز موعد معاينة مجاني</span>
                            </button>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer of modal */}
          {compareProperties.length > 0 && (
            <div className="p-6 md:p-8 border-t border-brand-navy/5 bg-brand-cream/35 flex justify-between items-center px-8 md:px-10">
              <span className="text-xs text-brand-navy/45 font-black tracking-wide">
                مجموعة البراء النعيمي العقارية للوساطة والتجارة © {new Date().getFullYear()}
              </span>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-[#1A2E40] hover:bg-brand-gold hover:text-brand-navy text-brand-gold font-extrabold text-sm rounded-2xl transition-all shadow-md cursor-pointer hover:scale-105"
              >
                الرجوع لإضافة المزيد
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
