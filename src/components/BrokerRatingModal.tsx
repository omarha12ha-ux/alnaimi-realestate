import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError } from '../lib/firebase';
import { 
  X, Star, MessageSquare, Send, Check, Loader, Award, Calendar, Clock, MapPin
} from 'lucide-react';
import { doc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { Appointment } from '../types';

interface BrokerRatingModalProps {
  currentUser: FirebaseUser;
  userProfile: any;
  appointment: Appointment;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function BrokerRatingModal({
  currentUser,
  userProfile,
  appointment,
  onClose,
  onSuccess
}: BrokerRatingModalProps) {
  const initialBroker = userProfile?.broker || 'مباشر';
  const [brokerName, setBrokerName] = useState(initialBroker === 'مباشر' ? '' : initialBroker);
  
  // Overall rating
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  
  // Aspect levels (Default to 5, or match overall rating once set)
  const [punctuality, setPunctuality] = useState<number>(5);
  const [honesty, setHonesty] = useState<number>(5);
  const [communication, setCommunication] = useState<number>(5);
  
  // Tag features
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [feedbackText, setFeedbackText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const availableTags = [
    "🤝 لباقة واحترام واحترافية",
    "⏱️ التزام دقيق بالمواعيد",
    "💡 أمانة وخبرة عقارية واسعة",
    "📞 رد سريع ومتابعة حثيثة",
    "⚖️ وضوح وشفافية مطلقة",
    "🚗 كياسة وسهولة في المعاينة"
  ];

  // Helper to sync sub-ratings with overall rating on first change to keep UX fast
  const handleMainRatingChange = (newVal: number) => {
    setRating(newVal);
    setPunctuality(newVal);
    setHonesty(newVal);
    setCommunication(newVal);
  };

  // Check if a rating already exists for this appointment and load it
  useEffect(() => {
    const fetchExistingRating = async () => {
      try {
        const q = query(
          collection(db, 'broker_ratings'),
          where('appointmentId', '==', appointment.id),
          where('userId', '==', currentUser.uid)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const ratingDoc = snapshot.docs[0];
          const data = ratingDoc.data();
          setRating(data.rating || 0);
          
          const rawFeedback = data.feedback || '';
          if (rawFeedback.startsWith('DETAILED_RATING:')) {
            try {
              const parsed = JSON.parse(rawFeedback.slice('DETAILED_RATING:'.length));
              setFeedbackText(parsed.notes || '');
              setPunctuality(parsed.punctuality || 5);
              setHonesty(parsed.honesty || 5);
              setCommunication(parsed.communication || 5);
              setSelectedTags(parsed.pros || []);
            } catch (jsonErr) {
              setFeedbackText(rawFeedback);
            }
          } else {
            setFeedbackText(rawFeedback);
          }

          if (data.brokerName) {
            setBrokerName(data.brokerName);
          }
        }
      } catch (e) {
        console.error("Error fetching existing rating for appointment:", e);
      }
    };

    fetchExistingRating();
  }, [appointment.id, currentUser.uid]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMessage('يرجى تحديد تفضيل التقييم بالنجوم أولاً للوسيط.');
      return;
    }
    if (!brokerName.trim()) {
      setErrorMessage('يرجى إدخال اسم الوسيط العقاري المراد تقييمه.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const ratingId = `br_${currentUser.uid}_${appointment.id}`;
      const ratingDocRef = doc(db, 'broker_ratings', ratingId);

      // Structure all detailed metrics into feedback
      const detailPayload = {
        pros: selectedTags,
        punctuality: punctuality,
        honesty: honesty,
        communication: communication,
        notes: feedbackText.trim()
      };

      const stringifiedFeedback = `DETAILED_RATING:${JSON.stringify(detailPayload)}`;

      const ratingData = {
        userId: currentUser.uid,
        userName: userProfile?.name || currentUser.displayName || 'زبون النعيمي',
        brokerName: brokerName.trim(),
        rating: rating,
        feedback: stringifiedFeedback,
        appointmentId: appointment.id,
        createdAt: new Date().toISOString()
      };

      await setDoc(ratingDocRef, ratingData, { merge: true });
      
      onSuccess(`تم بحمد الله حفظ التقييم المفصل للوسيط "${brokerName.trim()}"! شكراً لك لتعزيز الشفافية والمصداقية في السوق العقاري. ⭐`);
      onClose();
    } catch (e) {
      console.error("Error saving broker rating:", e);
      setErrorMessage('حدث خطأ أثناء حفظ التقييم. يرجى المحاولة مرة أخرى.');
      handleFirestoreError(e, 'write', `broker_ratings/br_${currentUser.uid}_${appointment.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 text-brand-navy overflow-y-auto font-sans" dir="rtl">
      {/* Backdrop Closer */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="bg-brand-cream border border-brand-navy/10 w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden text-right my-8"
      >
        {/* Header */}
        <div className="bg-[#1A2E40] text-brand-gold p-6 relative flex justify-between items-center border-b-2 border-brand-gold/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-gold/15 text-brand-gold rounded-2xl border border-brand-gold/10">
              <Award size={22} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg">تقييم الأداء الميداني للوسيط العقاري</h3>
              <p className="text-[10px] text-brand-cream/60 font-medium">ساعدنا في الحفاظ على أعلى معايير الشفافية والمصداقية العقارية</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-brand-cream/60 hover:text-brand-gold transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Appointment Summary Box */}
          <div className="bg-white p-5 rounded-2xl border border-brand-navy/5 space-y-2.5 text-xs text-brand-navy/60 shadow-sm relative overflow-hidden">
            <span className="absolute -left-4 -top-4 text-brand-navy/5 font-serif font-bold text-5xl pointer-events-none select-none">🏡</span>
            <div className="flex justify-between items-center border-b border-brand-navy/5 pb-2">
              <span className="font-black text-brand-navy">معلومات الموعد الميداني المقيد:</span>
              <span className="font-mono bg-brand-navy/5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-brand-navy">#{appointment.id.slice(0, 6)}</span>
            </div>
            <p className="font-black text-brand-navy text-sm">{appointment.serviceTitle || 'معاينة ميدانية بموقع العقار'}</p>
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 bg-[#FAF8F4] px-2.5 py-1 rounded-lg border border-brand-navy/5"><Calendar size={13} className="text-brand-gold" /> {appointment.date}</span>
              <span className="flex items-center gap-1.5 bg-[#FAF8F4] px-2.5 py-1 rounded-lg border border-brand-navy/5"><Clock size={13} className="text-brand-gold" /> {appointment.time}</span>
            </div>
          </div>

          {/* Broker Input */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-brand-navy/80 mr-1">
              اسم الوسيط العقاري المسؤول عن معاينتكم: <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={brokerName}
              onChange={(e) => setBrokerName(e.target.value)}
              required
              className="w-full p-4 rounded-2xl bg-white border border-brand-navy/10 focus:ring-2 focus:ring-brand-gold focus:border-transparent focus:outline-none transition-all text-right font-black text-sm shadow-sm"
              placeholder="اكتب اسم الوسيط العقاري بكامل الدقة والشفافية..."
            />
            {initialBroker !== 'مباشر' && !brokerName && (
              <p className="text-[10px] text-brand-navy/40 font-bold mr-1">
                * تم جلب وسيطك المتابع آلياً: <strong className="text-brand-navy/70">{initialBroker}</strong>
              </p>
            )}
          </div>

          {/* Core Star Rating Slider Section */}
          <div className="bg-[#FAF8F4] p-5 rounded-2xl border border-brand-navy/5 space-y-4">
            <div>
              <label className="block text-xs font-black text-brand-navy/80 mr-1">
                التقييم العام للمتابعة العقارية الشاملة: <span className="text-red-500">*</span>
              </label>
              <p className="text-[10px] text-brand-navy/40 mr-1 mt-0.5">اضغط على النجوم لتحديد تقييم الخدمة الإجمالي</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2.5" dir="ltr">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isGold = hoveredRating ? star <= hoveredRating : star <= rating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleMainRatingChange(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1.5 hover:scale-115 transition-transform cursor-pointer"
                    >
                      <Star 
                        size={36} 
                        className={isGold ? "fill-brand-gold text-brand-gold filter drop-shadow-[0_2px_4px_rgba(212,175,55,0.3)]" : "text-brand-navy/20"} 
                      />
                    </button>
                  );
                })}
              </div>

              {rating > 0 && (
                <span className="text-xs font-black text-brand-gold bg-brand-gold/5 px-3.5 py-1.5 border border-brand-gold/15 rounded-xl transition-all select-none">
                  {rating === 5 ? 'ممتاز جداً ⭐' : rating === 4 ? 'جيد جداً 👍' : rating === 3 ? 'متوسط 🤝' : rating === 2 ? 'مقبول 👎' : 'ضعيف جداً ⚠️'}
                </span>
              )}
            </div>

            {/* Split Star Subsections for Detailed Metrics in Accordion UI */}
            {rating > 0 && (
              <div className="border-t border-brand-navy/5 pt-4 space-y-3.5 mt-2 animate-fadeIn text-right">
                <span className="text-[10px] font-black uppercase text-brand-navy/50 tracking-wide block">⚖️ مؤشرات الأداء العقاري الفرعية بالتفصيل لكفاءة أفضل:</span>
                
                {/* 1. Punctuality */}
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-brand-navy/70">الالتزام بالوقت والدقة في المواعيد:</span>
                  <div className="flex gap-1" dir="ltr">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setPunctuality(s)}
                        className="hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star 
                          size={18} 
                          className={s <= punctuality ? "fill-brand-gold text-brand-gold" : "text-brand-navy/20"} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Manners & Professionalism */}
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-brand-navy/70">أخلاق اللباقة والتعامل وحسن الترحاب:</span>
                  <div className="flex gap-1" dir="ltr">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCommunication(s)}
                        className="hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star 
                          size={18} 
                          className={s <= communication ? "fill-brand-gold text-brand-gold" : "text-brand-navy/20"} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Honesty & Market Knowledge */}
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-brand-navy/70">المصداقية، الأمانة، والخبرة بقيمة السوق:</span>
                  <div className="flex gap-1" dir="ltr">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setHonesty(s)}
                        className="hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star 
                          size={18} 
                          className={s <= honesty ? "fill-brand-gold text-brand-gold" : "text-brand-navy/20"} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Strengths Badges Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-brand-navy/80 mr-1">
              ما هي أكثر السمات التي نالت رضاك في خدمته؟
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-2 rounded-xl text-[11px] font-black tracking-wide border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      isSelected 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-bold shadow-sm' 
                        : 'bg-white text-brand-navy/60 border-brand-navy/5 hover:bg-brand-cream/10'
                    }`}
                  >
                    {tag}
                    {isSelected && <span className="text-[9px] bg-emerald-700/10 px-1 py-0.2 rounded text-emerald-800 font-black">✔</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spacious Detailed Text Notes Container */}
          <div className="space-y-2">
            <div className="flex justify-between items-center mr-1">
              <label className="block text-xs font-black uppercase text-brand-navy/80">
                ملاحظات نصية تفصيلية ومقترحاتك (الرأي الكامل): <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-brand-navy/50 font-bold bg-[#FAF8F4] border border-brand-navy/5 px-2 py-0.5 rounded-lg">إجباري</span>
            </div>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              required
              rows={4}
              maxLength={1000}
              className="w-full p-4 rounded-2xl bg-white border border-brand-navy/10 focus:ring-2 focus:ring-brand-gold focus:border-transparent focus:outline-none transition-all text-right text-xs font-bold leading-relaxed bg-left-bottom bg-no-repeat shadow-sm"
              placeholder="اكتب بالتفصيل رأيك في أخلاقيات ومصداقية الوسيط، والتزامه بالوقت، وهل ساعدك بالدقة المرجوة للحجز أو المعاينة الميدانية؟"
            />
            <div className="flex justify-between items-center text-[10px] text-brand-navy/40 font-bold mr-1">
              <span>* ساهم بكتابة مايزيد عن 10 كلمات لتقييم عالي القيمة للمشرفين.</span>
              <span className="font-mono bg-brand-navy/5 px-1.5 py-0.5 rounded">{feedbackText.length}/1000 حرف</span>
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs font-bold text-red-600 bg-red-50 p-4 rounded-2xl border border-red-200">{errorMessage}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={rating === 0 || !brokerName.trim() || !feedbackText.trim() || isSaving}
              className="flex-1 py-4 bg-[#1A2E40] text-brand-gold rounded-2xl font-black text-xs hover:bg-brand-navy/95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-brand-gold/15 shadow-xl shadow-brand-navy/10 hover:-translate-y-0.5 active:translate-y-0"
            >
              {isSaving ? (
                <>
                  <Loader className="animate-spin" size={14} />
                  جاري تسجيل تقييمك الذكي وحفظه...
                </>
              ) : (
                <>
                  <Send size={13} className="text-brand-gold" />
                  تسجيل وإرسال تقييمك التفصيلي للمشرفين ⭐🔍
                </>
              )}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-6 py-4 bg-white text-brand-navy border border-brand-navy/10 rounded-2xl font-bold text-xs hover:bg-brand-cream/30 transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0"
            >
              تراجع وإطباق
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
