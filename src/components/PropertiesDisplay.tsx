import React, { useState } from 'react';
import { Building2, Star, MapPin, BedDouble, ArrowRight, Eye, Calendar, Sparkles, LayoutGrid, Map as MapIcon } from 'lucide-react';
import PropertyDetailsModal from './PropertyDetailsModal';
import { BookingModal } from './BookingModal';
import InteractiveMap from './InteractiveMap';
import GeminiRecommendedSection from './GeminiRecommendedSection';
import { cn } from '../lib/utils';
import PropertyCard from './PropertyCard';

interface PropertiesDisplayProps {
  userType: 'regular' | 'vip';
  properties: any[];
  currentUser?: any;
  userProfile?: any;
  exchangeRate?: number;
  language?: 'ar' | 'en';
  onBookingSuccess?: () => void;
  appointments?: any[];
  favorites?: any;
  brokers?: any[];
}

export default function PropertiesDisplay({ 
  userType, 
  properties, 
  currentUser, 
  userProfile, 
  exchangeRate = 15000, 
  language = 'ar',
  onBookingSuccess,
  appointments = [],
  favorites = {},
  brokers = []
}: PropertiesDisplayProps) {
  const [selectedPropertyForDetails, setSelectedPropertyForDetails] = useState<any | null>(null);
  const [selectedPropertyForBooking, setSelectedPropertyForBooking] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const t = (arStr: string, enStr?: string) => language === 'ar' ? arStr : (enStr || arStr);

  const formatPrice = (priceStr: string, currency: 'SYP' | 'USD', rate: number): string => {
    if (!priceStr) return '';
    const cleanStr = priceStr.replace(/[^\d]/g, '');
    const parsed = parseInt(cleanStr, 10);
    if (isNaN(parsed) || parsed === 0) return priceStr;
    if (currency === 'SYP') {
      return parsed.toLocaleString('en-US') + ' ل.س';
    } else {
      const usdValue = Math.round(parsed / rate);
      return '$' + usdValue.toLocaleString('en-US');
    }
  };

  // Filter properties based on type
  const filteredProperties = properties.filter(p => {
    if (userType === 'vip') {
      return p.classification === 'vip' || p.isPremium === true;
    } else {
      // Regular properties should show non-vip ones
      return p.classification !== 'vip' && !p.isPremium;
    }
  });

  return (
    <div className="p-6 sm:p-8 pb-24 text-right bg-brand-cream/10 min-h-screen" dir="rtl">
      {/* Header section with branding */}
      <div className="w-full max-w-full mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-navy/10 pb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-brand-navy flex items-center gap-3">
            {userType === 'vip' ? (
              <span className="flex items-center gap-2">
                <Star className="text-brand-gold fill-brand-gold animate-pulse shrink-0" size={28} />
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-brand-gold via-brand-gold-light to-amber-600 drop-shadow-xs">
                  {t('عقارات النخبة المتميزة (VIP)', 'Premium Elite Properties (VIP)')}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Building2 className="text-brand-navy shrink-0" size={28} />
                <span>{t('العقارات والمشاريع المتاحة', 'Available Properties & Projects')}</span>
              </span>
            )}
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-2">
            {userType === 'vip' 
              ? t('تصفح أرقى الفلل والمجمعات التجارية المعروضة بضمانة تسويقية حصرية ورعاية النخبة.', 'Browse the finest villas and commercial complexes with exclusive marketing guarantees.') 
              : t('استكشف خيارات السكن والاستثمار الممتازة المتاحة في مختلف المحافظات السورية عبر الشبكة أو الخريطة التفاعلية.', 'Explore excellent residential and investment options across Syrian governorates.')
            }
          </p>
        </div>

        {/* View Toggles & Live Counters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white p-1 rounded-2xl border border-brand-navy/10 shadow-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                viewMode === 'grid' 
                  ? "bg-brand-navy text-brand-gold shadow-sm" 
                  : "text-zinc-600 hover:text-brand-navy"
              )}
            >
              <LayoutGrid size={15} />
              <span>{t('شبكة العرض', 'Grid View')}</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                viewMode === 'map' 
                  ? "bg-brand-navy text-brand-gold shadow-sm" 
                  : "text-zinc-600 hover:text-brand-navy"
              )}
            >
              <MapIcon size={15} className="text-brand-gold" />
              <span>{t('الخريطة التفاعلية 🗺️', 'Interactive Map 🗺️')}</span>
            </button>
          </div>

          <div className="flex gap-2 bg-white px-4 py-2.5 rounded-2xl border border-brand-navy/5 shadow-xs shrink-0 font-bold text-xs text-brand-navy">
            <Sparkles className="text-brand-gold shrink-0" size={16} />
            <span>
              {t('المعروض:', 'Listed:')} <span className="text-brand-gold font-mono">{filteredProperties.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Gemini AI Smart Recommendations Section */}
      <GeminiRecommendedSection 
        properties={filteredProperties}
        appointments={appointments}
        favorites={favorites}
        onSelectProperty={(prop) => setSelectedPropertyForDetails(prop)}
        language={language}
      />

      {/* Conditional Display: Grid or Map */}
      {filteredProperties.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-16 bg-white border border-brand-navy/5 rounded-3xl p-8 shadow-sm">
          <Building2 className="mx-auto text-zinc-300 mb-4" size={48} />
          <h3 className="font-serif font-bold text-lg text-brand-navy mb-2">{t('لا توجد عقارات متوفرة حالياً', 'No properties currently available')}</h3>
          <p className="text-xs text-zinc-400 font-semibold">{t('يرجى مراجعة لوحة التحكم لإضافة عقارات جديدة أو تغيير معايير التصفية.', 'Please check back later or check the control panel.')}</p>
        </div>
      ) : viewMode === 'map' ? (
        <div className="bg-white p-3 rounded-[2.5rem] shadow-xl border border-brand-navy/10 overflow-hidden space-y-3">
          <div className="px-4 py-2 bg-brand-cream/30 rounded-2xl flex items-center justify-between text-xs font-bold text-brand-navy">
            <span className="flex items-center gap-2">
              <MapPin size={16} className="text-brand-gold animate-bounce" />
              <span>{t('خريطة المواقع الجغرافية للعقارات السورية المتاحة (انقر على أي علامة لمشاهدة التفاصيل والحجز)', 'Syrian Properties Geographic Map (Click any marker for details & booking)')}</span>
            </span>
            <span className="text-brand-gold bg-brand-navy px-3 py-1 rounded-full font-mono">
              {filteredProperties.length} مواقع
            </span>
          </div>
          <div className="h-[600px] w-full rounded-2xl overflow-hidden shadow-inner">
            <InteractiveMap 
              properties={filteredProperties}
              onSelectProperty={(prop) => setSelectedPropertyForDetails(prop)}
              buttonLabel={t('معاينة وحجز العقار', 'View & Book Property')}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 w-full max-w-full mx-auto">
          {filteredProperties.map(prop => (
            <PropertyCard
              key={prop.id}
              prop={prop}
              exchangeRate={exchangeRate}
              language={language}
              onDetails={() => setSelectedPropertyForDetails(prop)}
              onBook={() => setSelectedPropertyForBooking(prop)}
            />
          ))}
        </div>
      )}

      {/* Conditionally Render Property Details Modal */}
      {selectedPropertyForDetails && (
        <PropertyDetailsModal 
          property={selectedPropertyForDetails}
          onClose={() => setSelectedPropertyForDetails(null)}
          onBook={() => {
            setSelectedPropertyForBooking(selectedPropertyForDetails);
            setSelectedPropertyForDetails(null);
          }}
          currentUser={currentUser}
          userProfile={userProfile}
          displayCurrency="SYP"
          exchangeRate={exchangeRate}
          language={language}
        />
      )}

      {/* Conditionally Render Booking Modal */}
      {selectedPropertyForBooking && (
        <BookingModal 
          propertyId={selectedPropertyForBooking.id}
          serviceTitle={selectedPropertyForBooking.title}
          onClose={() => setSelectedPropertyForBooking(null)}
          property={selectedPropertyForBooking}
          exchangeRate={exchangeRate}
          language={language}
          currentUser={currentUser}
          userProfile={userProfile}
          onBookingSuccess={onBookingSuccess}
          brokers={brokers}
        />
      )}
    </div>
  );
}
