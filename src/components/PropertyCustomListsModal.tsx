import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Check, Bookmark } from 'lucide-react';
import { Property } from '../types';

interface PropertyCustomListsModalProps {
  property: Property;
  userFavorites: { [propertyId: string]: string[] };
  allCustomLists: string[];
  onToggleList: (propertyId: string, listName: string) => Promise<void>;
  onCreateAndAddToList: (propertyId: string, listName: string) => Promise<void>;
  onClose: () => void;
  priceDropAlertEnabled?: boolean;
  onTogglePriceDropAlert?: (propertyId: string) => Promise<void> | void;
}

export default function PropertyCustomListsModal({
  property,
  userFavorites,
  allCustomLists,
  onToggleList,
  onCreateAndAddToList,
  onClose,
  priceDropAlertEnabled = false,
  onTogglePriceDropAlert
}: PropertyCustomListsModalProps) {
  const [newListName, setNewListName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentLists = userFavorites[property.id] || [];

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newListName.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      await onCreateAndAddToList(property.id, trimmed);
      setNewListName('');
    } catch (err) {
      console.error("Error creating and adding to list: ", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-brand-navy/5 shadow-2xl relative text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 w-8 h-8 rounded-full bg-brand-navy/5 hover:bg-brand-navy/10 flex items-center justify-center text-brand-navy transition-all cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-brand-navy/5 pb-4 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
            <Bookmark size={20} className="fill-brand-gold" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-brand-navy">حفظ في قائمة مخصصة</h3>
            <p className="text-xs text-brand-navy/50">قم بتنظيم عقاراتك المفضلة لتسهيل الوصول إليها لاحقاً</p>
          </div>
        </div>

        {/* Property Brief */}
        <div className="bg-brand-navy/5 p-4 rounded-2xl flex gap-3 mb-6 items-center">
          <img
            src={property.images && property.images.length > 0 ? property.images[0] : "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"}
            alt={property.title}
            className="w-16 h-16 rounded-xl object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-sans font-bold text-sm text-brand-navy truncate">{property.title}</h4>
            <p className="text-xs text-brand-navy/50 mt-0.5 truncate">{property.location}</p>
            <p className="text-brand-gold font-bold text-xs mt-1 font-mono">{property.price}</p>
          </div>
        </div>

        {/* Lists List */}
        <div className="space-y-2.5 mb-6 max-h-48 overflow-y-auto pr-1">
          <p className="text-xs font-bold text-brand-navy/60 mb-2">اختر القوائم:</p>
          {allCustomLists.map((listName) => {
            const isChecked = currentLists.includes(listName);
            return (
              <button
                key={listName}
                onClick={() => onToggleList(property.id, listName)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-right font-sans text-sm font-semibold select-none cursor-pointer ${
                  isChecked
                    ? 'border-brand-gold bg-brand-gold/5 text-brand-navy'
                    : 'border-brand-navy/10 hover:border-brand-gold/50 bg-white text-brand-navy/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    isChecked ? 'bg-brand-gold border-brand-gold text-white' : 'border-brand-navy/20 bg-white'
                  }`}>
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span>{listName}</span>
                </div>
                <span className="text-[10px] text-brand-navy/30">
                  {isChecked ? 'مضاف' : 'إضافة'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Add New List Form */}
        <form onSubmit={handleCreateList} className="border-t border-brand-navy/5 pt-5">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="اسم القائمة الجديدة... (مثال: للزيارة)"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-brand-navy/10 text-xs font-semibold focus:outline-none focus:border-brand-gold bg-white text-brand-navy text-right"
              required
              maxLength={40}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newListName.trim()}
              className="px-4 py-2.5 bg-brand-navy hover:bg-brand-navy/90 text-brand-gold rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Plus size={14} />
              <span>إنشاء</span>
            </button>
          </div>
        </form>

        {/* Price Drop Alert Toggle section */}
        {onTogglePriceDropAlert && (
          <div className="border-t border-brand-navy/5 pt-5 mt-5">
            <div className="flex justify-between items-center bg-brand-gold/5 p-4 rounded-3xl border border-brand-gold/20">
              <div className="text-right">
                <label className="text-xs font-black text-brand-navy block">تنبيه انخفاض السعر 🔔</label>
                <p className="text-[10px] text-brand-navy/60 font-semibold mt-0.5">سنرسل لك إشعاراً فورياً وتلقائياً عند انخفاض سعر هذا العقار</p>
              </div>
              <button
                type="button"
                onClick={() => onTogglePriceDropAlert(property.id)}
                className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                  priceDropAlertEnabled ? "bg-brand-gold justify-start" : "bg-zinc-300 justify-end"
                }`}
              >
                <span className="bg-white w-5 h-5 rounded-full shadow-md" />
              </button>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-brand-gold hover:bg-brand-gold/90 text-white rounded-2xl text-sm font-bold transition-all cursor-pointer text-center shadow-lg hover:shadow-xl hover:scale-[1.01]"
          >
            حفظ وإغلاق
          </button>
        </div>
      </motion.div>
    </div>
  );
}
