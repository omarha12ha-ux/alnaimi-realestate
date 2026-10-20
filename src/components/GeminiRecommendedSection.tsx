import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, ArrowRight, Building2, MapPin, CheckCircle2, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

interface GeminiRecommendedSectionProps {
  properties: any[];
  appointments: any[];
  favorites: any;
  onSelectProperty: (property: any) => void;
  language?: 'ar' | 'en';
}

export default function GeminiRecommendedSection({
  properties,
  appointments,
  favorites,
  onSelectProperty,
  language = 'ar'
}: GeminiRecommendedSectionProps) {
  const [loading, setLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState<string>('');
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [reasonsMap, setReasonsMap] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fetchRecommendations = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const favoriteIds = Object.keys(favorites || {}).filter(k => (favorites[k] || []).length > 0);
      const favProps = properties.filter(p => favoriteIds.includes(p.id));
      const userApps = appointments.filter(a => a.status !== 'cancelled');

      const res = await fetch('/api/gemini/recommend-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointments: userApps,
          favoriteProperties: favProps.map(p => ({ title: p.title, location: p.location, price: p.price, category: p.category })),
          allProperties: properties
        })
      });

      const data = await res.json();
      if (data.success) {
        setAnalysisText(data.analysis || '');
        setRecommendedIds(data.recommendedIds || []);
        setReasonsMap(data.reasons || {});
      } else {
        setErrorMsg('تعذر جلب التوصيات الذكية حالياً.');
      }
    } catch (err: any) {
      console.error("Failed to load Gemini recommendations:", err);
      setErrorMsg('حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (properties.length > 0) {
      fetchRecommendations();
    }
  }, [properties.length]);

  const recommendedProperties = properties.filter(p => recommendedIds.includes(p.id));

  if (!loading && recommendedProperties.length === 0 && !analysisText) {
    return null;
  }

  return (
    <div className="mb-10 bg-gradient-to-tr from-[#0A192F] via-[#102A45] to-[#1A365D] text-white rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-brand-gold/30 relative overflow-hidden" dir="rtl">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center shrink-0 shadow-inner">
            <Brain size={26} className="text-brand-gold animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-gold/20 text-brand-gold rounded-full text-[11px] font-black mb-1">
              <Sparkles size={12} />
              <span>تحليل ذكي بواسطة Gemini AI</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-black text-white">
              موصى به لك (توصيات الاستثمار الذكية)
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchRecommendations}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-brand-gold rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/15"
        >
          <RefreshCw size={14} className={cn(loading && "animate-spin")} />
          <span>تحديث التحليل والتوصيات</span>
        </button>
      </div>

      {/* Analysis text summary */}
      {analysisText && (
        <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-2xl relative z-10 backdrop-blur-md">
          <p className="text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed">
            <strong className="text-brand-gold ml-1">تحليل ملف العميل:</strong> {analysisText}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-12 text-center space-y-3 relative z-10">
          <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-300 font-bold">جاري تحليل تاريخ مواعيدك وعقاراته المفضلة لاختيار الفرص المثالية...</p>
        </div>
      )}

      {/* Error State */}
      {errorMsg && !loading && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-200 font-bold relative z-10">
          {errorMsg}
        </div>
      )}

      {/* Recommended Properties Grid */}
      {!loading && recommendedProperties.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {recommendedProperties.map((prop) => {
            const reason = reasonsMap[prop.id] || "فرصة استثمارية متوافقة تماماً مع تفضيلاتك وسجل مواعيدك السابقة.";
            return (
              <div 
                key={prop.id}
                onClick={() => onSelectProperty(prop)}
                className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-3xl p-4 transition-all duration-300 cursor-pointer flex flex-col justify-between group shadow-lg hover:border-brand-gold/50"
              >
                <div className="space-y-3">
                  {/* Property Image & Badge */}
                  <div className="relative h-44 rounded-2xl overflow-hidden shadow-inner">
                    <img 
                      src={prop.image || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800"} 
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 right-3 bg-brand-navy/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-brand-gold border border-brand-gold/30">
                      {prop.category || 'عقاري'}
                    </div>
                  </div>

                  {/* Title & Location */}
                  <div>
                    <h4 className="text-sm font-serif font-black text-white group-hover:text-brand-gold transition-colors line-clamp-1">
                      {prop.title}
                    </h4>
                    <p className="text-[11px] text-zinc-300 flex items-center gap-1 mt-1 font-medium">
                      <MapPin size={13} className="text-brand-gold shrink-0" />
                      <span className="truncate">{prop.location}</span>
                    </p>
                  </div>

                  {/* AI Recommendation Reason */}
                  <div className="p-3 bg-brand-gold/10 border border-brand-gold/20 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-brand-gold flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>لماذا ننصحك بهذا العقار؟</span>
                    </span>
                    <p className="text-[11px] text-zinc-200 line-clamp-2 font-medium">
                      {reason}
                    </p>
                  </div>
                </div>

                {/* Footer Price & Action */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">السعر المقدر</span>
                    <span className="text-xs font-black font-mono text-brand-gold">{prop.price}</span>
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-brand-gold flex items-center gap-1 transition-colors">
                    <span>التفاصيل</span>
                    <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
