import React, { useState, useMemo } from 'react';
import { Appointment } from '../types';
import { Calendar, Search, User, Clock, ChevronDown, ChevronUp, Sparkles, CloudSun, MapPin, Info, ArrowUpRight, Briefcase } from 'lucide-react';
import { cn } from '../lib/utils';
import { getWeatherForLocationAndDate, getSmartRealEstateAdvice } from '../utils/weatherHelper';

interface AppointmentsListProps {
  appointments: Appointment[];
  properties?: any[];
  onViewAppointment?: (app: Appointment) => void;
  onNotifyBroker?: (app: Appointment) => void;
}

export function AppointmentsList({ appointments, properties = [], onViewAppointment, onNotifyBroker }: AppointmentsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const matchesSearch = 
        app.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.serviceTitle?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDate = dateFilter ? app.date === dateFilter : true;
      
      return matchesSearch && matchesDate;
    }).sort((a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime());
  }, [appointments, searchTerm, dateFilter]);

  const toggleExpand = (app: Appointment) => {
    setExpandedAppId(prev => prev === app.id ? null : app.id);
    if (onViewAppointment) {
      onViewAppointment(app);
    }
  };

  return (
    <div className="bg-white border border-brand-navy/5 rounded-[2.5rem] p-6 md:p-8 shadow-xl" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-serif font-black text-brand-navy flex items-center gap-2">
            <span>قائمة المواعيد المنظمة</span>
            <span className="bg-brand-gold/15 text-brand-navy text-[10px] px-2.5 py-0.5 rounded-full font-black border border-brand-gold/20 flex items-center gap-1">
              <Sparkles size={10} className="text-brand-gold animate-pulse" />
              <span>مستشار الطقس العقاري الذكي مفعل</span>
            </span>
          </h2>
          <p className="text-[11px] text-zinc-500 font-bold mt-1">عرض المواعيد وإرشادات المعاينة الميدانية المصاحبة للطقس تلقائياً</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy/40" size={16} />
            <input 
              type="text"
              placeholder="بحث باسم العميل أو العنوان..."
              className="w-full pr-10 pl-4 py-2 bg-brand-cream/20 rounded-xl border border-brand-navy/10 text-xs font-bold text-brand-navy placeholder:text-brand-navy/40 focus:border-brand-gold outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <input 
            type="date"
            className="w-full sm:w-40 px-3 py-2 bg-brand-cream/20 rounded-xl border border-brand-navy/10 text-xs font-bold text-brand-navy focus:border-brand-gold outline-none"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b border-brand-navy/10 text-brand-navy/60 text-xs font-black uppercase tracking-wider">
              <th className="pb-3 pr-4">العميل</th>
              <th className="pb-3">عنوان الموعد</th>
              <th className="pb-3">التاريخ والوقت</th>
              <th className="pb-3 text-center">الحالة</th>
              <th className="pb-3 text-center">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-navy/5">
            {filteredAppointments.map((app) => {
              const isExpanded = expandedAppId === app.id;
              return (
                <React.Fragment key={app.id}>
                  <tr className={cn(
                    "text-xs font-bold text-brand-navy transition-all hover:bg-brand-cream/5",
                    isExpanded && "bg-brand-cream/10"
                  )}>
                    <td className="py-4 pr-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-navy/5 flex items-center justify-center text-brand-navy">
                        <User size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span>{app.clientName}</span>
                        {app.clientPhone && <span className="text-[10px] text-zinc-400 font-mono" dir="ltr">{app.clientPhone}</span>}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span>{app.serviceTitle || 'معاينة ميدانية'}</span>
                        {app.propertyId && (
                          <span className="text-[9px] text-zinc-500 font-bold">عقار رقم: {app.propertyId}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 font-mono text-brand-navy/70">
                      {app.date} <span className="text-brand-navy/40">|</span> <span className="text-brand-gold font-bold">{app.time}</span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black",
                        app.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        app.status === 'confirmed' ? 'bg-blue-50 text-blue-700' :
                        'bg-amber-50 text-amber-700'
                      )}>
                        {app.status === 'completed' ? 'مكتمل ✅' :
                         app.status === 'confirmed' ? 'مؤكّد' :
                         app.status === 'cancelled' ? 'ملغى' : 'قيد المراجعة'}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {onNotifyBroker && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNotifyBroker(app);
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white shadow-sm hover:scale-105 active:scale-95 border border-amber-500 cursor-pointer"
                            title="إرسال إشعار وتنبيه للوسيط الذي دعا هذا العميل"
                          >
                            <Briefcase size={12} />
                            <span>تنبيه الوسيط 💼</span>
                          </button>
                        )}
                        <button 
                          onClick={() => toggleExpand(app)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer",
                            isExpanded 
                              ? "bg-brand-gold text-brand-navy hover:bg-brand-gold/90" 
                              : "bg-brand-navy text-white hover:bg-brand-navy/90"
                          )}
                        >
                          <span>{isExpanded ? 'إخفاء' : 'عرض'}</span>
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} className="p-4 bg-brand-cream/10 border-t border-b border-brand-navy/5">
                        {(() => {
                          const property = properties.find(p => p.id === app.propertyId);
                          const gov = property?.governorate || 'دمشق';
                          const weather = getWeatherForLocationAndDate(gov, new Date(app.date));
                          const advice = getSmartRealEstateAdvice(gov, app.date);
                          
                          return (
                            <div className="bg-white rounded-3xl border-2 border-brand-gold/20 p-5 shadow-lg space-y-4 text-right">
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-zinc-100">
                                <div>
                                  <h4 className="text-xs font-black text-brand-navy flex items-center gap-1.5">
                                    <Sparkles size={14} className="text-brand-gold animate-pulse" />
                                    <span>النصيحة العقارية الذكية والتحليل البيئي للزيارة</span>
                                  </h4>
                                  <p className="text-[10px] text-zinc-500 font-bold mt-1">📍 الموقع الفعلي: {property?.location || 'مقر العقار المختار'} • محافظة {gov}</p>
                                </div>
                                <div className="flex items-center gap-2 bg-brand-navy/5 px-3 py-1.5 rounded-xl border border-brand-navy/10 text-brand-navy font-bold text-[11px]">
                                  <span className="text-sm shrink-0">{weather.icon}</span>
                                  <span className="shrink-0">حالة الطقس المجدولة:</span>
                                  <span className="text-brand-gold font-black shrink-0">{weather.conditionText.ar}</span>
                                  <span className="bg-brand-navy/10 px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0">{weather.temp}°م</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Real Estate Advice Card */}
                                <div className="p-4 bg-gradient-to-br from-amber-50/40 to-orange-50/20 rounded-2xl border border-brand-gold/30 space-y-3">
                                  <div className="flex items-center gap-2 text-brand-navy font-black text-[11px]">
                                    <div className="w-5 h-5 rounded-lg bg-brand-gold/20 flex items-center justify-center text-brand-gold shrink-0">
                                      <Sparkles size={12} />
                                    </div>
                                    <span>💡 توقيت المعاينة المقترح وإرشادات المندوب والعميل:</span>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div>
                                      <span className="block text-[9px] text-zinc-500 font-black">⏰ نطاق التوقيت الأنسب للطقس الحالي:</span>
                                      <span className="inline-block bg-white text-brand-navy font-black text-[11px] px-2.5 py-1 rounded-lg border border-brand-gold/30 mt-1 shadow-2xs">
                                        {advice.bestTimeSlot}
                                      </span>
                                    </div>
                                    
                                    <div className="pt-1">
                                      <span className="block text-[9px] text-zinc-500 font-black">🎯 النصيحة العقارية الميدانية المباشرة:</span>
                                      <p className="text-[11px] text-zinc-700 font-bold leading-relaxed mt-1">
                                        {advice.adviceText}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Dynamic Analysis & Tech Feasibility */}
                                <div className="p-4 bg-blue-50/20 rounded-2xl border border-blue-100 space-y-3">
                                  <div className="flex items-center gap-2 text-brand-navy font-black text-[11px]">
                                    <div className="w-5 h-5 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                                      <Info size={12} />
                                    </div>
                                    <span>🔬 التحليل الفني والجدوى المعمارية للزيارة:</span>
                                  </div>
                                  
                                  <p className="text-[11px] text-zinc-650 font-semibold leading-relaxed">
                                    {advice.reason}
                                  </p>

                                  <div className="pt-2 border-t border-blue-100/60 flex items-center justify-between text-[10px] font-bold text-zinc-500">
                                    <span>التوقيت المختار: <span className="text-brand-navy font-black font-mono">{app.time}</span></span>
                                    <span className="flex items-center gap-1">
                                      <span>تقييم ملاءمة الموعد:</span>
                                      {(() => {
                                        if (!app.time) return <span className="text-zinc-400">غير محدد</span>;
                                        const [hours, minutes] = app.time.split(':').map(Number);
                                        const totalMins = hours * 60 + minutes;
                                        let isIdeal = false;
                                        if (weather.condition === 'sunny') {
                                          isIdeal = (totalMins >= 540 && totalMins <= 660) || (totalMins >= 960 && totalMins <= 1080);
                                        } else if (weather.condition === 'rainy') {
                                          isIdeal = (totalMins >= 660 && totalMins <= 840);
                                        } else if (weather.condition === 'windy') {
                                          isIdeal = (totalMins >= 600 && totalMins <= 780);
                                        } else {
                                          isIdeal = (totalMins >= 660 && totalMins <= 900);
                                        }
                                        return isIdeal ? (
                                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[9px] font-black">توقيت مثالي متطابق 🌟</span>
                                        ) : (
                                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[9px] font-black">توقيت مقبول (يرجى الانتباه للأمطار/الحرارة) ⚠️</span>
                                        );
                                      })()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-zinc-100 flex flex-wrap justify-between items-center gap-2 text-[10px] font-bold text-zinc-400">
                                <div className="flex items-center gap-2">
                                  {onNotifyBroker && (
                                    <button
                                      type="button"
                                      onClick={() => onNotifyBroker(app)}
                                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Briefcase size={14} />
                                      <span>💼 إرسال إشعار وتنبيه للوسيط الداعي 📱</span>
                                    </button>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <MapPin size={12} className="text-zinc-300" />
                                    <span>مستشار المعاينات العقارية الذكية برعاية البراء النعيمي © 2026</span>
                                  </span>
                                </div>
                                <button 
                                  onClick={() => setExpandedAppId(null)}
                                  className="text-brand-navy hover:text-brand-gold transition-all font-black"
                                >
                                  إغلاق التفاصيل ↑
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {filteredAppointments.length === 0 && (
          <div className="text-center py-10 text-brand-navy/40 font-bold text-xs">
            لا توجد مواعيد تطابق معايير البحث
          </div>
        )}
      </div>
    </div>
  );
}

