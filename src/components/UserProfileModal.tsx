import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User as FirebaseUser, sendEmailVerification } from 'firebase/auth';
import { db, handleFirestoreError } from '../lib/firebase';
import { 
  X, User as UserIcon, Phone, Users, Star, MessageSquare, Send, Check, Loader, Award, HelpCircle,
  FileText, CheckCircle, Clock, PenTool, Eye, ShieldCheck
} from 'lucide-react';
import { 
  doc, updateDoc, collection, addDoc, getDocs, query, where, orderBy, writeBatch 
} from 'firebase/firestore';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface UserProfileModalProps {
  currentUser: FirebaseUser;
  userProfile: any;
  setUserProfile: React.Dispatch<React.SetStateAction<any>>;
  onClose: () => void;
  contracts?: any[];
  allProperties?: any[];
}

interface BrokerReview {
  id: string;
  userId: string;
  userName: string;
  brokerName: string;
  rating: number;
  feedback: string;
  createdAt: string;
}

export default function UserProfileModal({ 
  currentUser, 
  userProfile, 
  setUserProfile, 
  onClose,
  contracts = [],
  allProperties = []
}: UserProfileModalProps) {
  const [activeModalTab, setActiveModalTab] = useState<'profile' | 'contracts' | 'referrals'>('profile');

  const clientContracts = (contracts || []).filter(c => 
    c.userId === currentUser?.uid || 
    c.clientEmail === currentUser?.email || 
    c.clientPhone === userProfile?.phone
  );
  // Profile form state
  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [broker, setBroker] = useState(userProfile?.broker || 'مباشر');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Local verification email state
  const [isLocalSending, setIsLocalSending] = useState(false);
  const [localSuccess, setLocalSuccess] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleLocalSendVerification = async () => {
    setIsLocalSending(true);
    setLocalError('');
    setLocalSuccess(false);
    try {
      await sendEmailVerification(currentUser);
      setLocalSuccess(true);
      setTimeout(() => setLocalSuccess(false), 8000);
    } catch (e: any) {
      console.error("Local email verification sending error:", e);
      let errorMsg = "حدث خطأ أثناء محاولة إرسال بريد التحقق.";
      if (e.code === 'auth/too-many-requests') {
        errorMsg = "تم إرسال العديد من الرسائل مؤخراً. يرجى الانتظار قليلاً أو مراجعة البريد الوارد.";
      }
      setLocalError(errorMsg);
      setTimeout(() => setLocalError(''), 8000);
    } finally {
      setIsLocalSending(false);
    }
  };

  // Rating state
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [isRatingSaving, setIsRatingSaving] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [myReviewId, setMyReviewId] = useState<string | null>(null);

  // Broker reviews list
  const [brokerReviews, setBrokerReviews] = useState<BrokerReview[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Load reviews for the current broker
  useEffect(() => {
    const fetchBrokerReviews = async () => {
      const activeBroker = userProfile?.broker || 'مباشر';
      if (activeBroker === 'مباشر') {
        setBrokerReviews([]);
        setAverageRating(null);
        setMyReviewId(null);
        setRating(0);
        setFeedback('');
        return;
      }

      setIsLoadingReviews(true);
      try {
        const ratingsQuery = query(
          collection(db, 'broker_ratings'),
          where('brokerName', '==', activeBroker)
        );
        const querySnap = await getDocs(ratingsQuery);
        const fetchedReviews: BrokerReview[] = [];
        let totalStars = 0;
        let foundMyReview: BrokerReview | null = null;

        querySnap.docs.forEach((d) => {
          const data = d.data() as Omit<BrokerReview, 'id'> & { createdAt: any };
          const review: BrokerReview = {
            id: d.id,
            userId: data.userId,
            userName: data.userName || 'زبون مجهول',
            brokerName: data.brokerName,
            rating: data.rating,
            feedback: data.feedback || '',
            createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()
          };
          fetchedReviews.push(review);
          totalStars += review.rating;
          
          if (review.userId === currentUser.uid) {
            foundMyReview = review;
          }
        });

        // Sort reviews by creation date descending
        fetchedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setBrokerReviews(fetchedReviews);
        if (fetchedReviews.length > 0) {
          setAverageRating(Math.round((totalStars / fetchedReviews.length) * 10) / 10);
        } else {
          setAverageRating(null);
        }

        if (foundMyReview) {
          setMyReviewId((foundMyReview as BrokerReview).id);
          setRating((foundMyReview as BrokerReview).rating);
          const rawFeed = (foundMyReview as BrokerReview).feedback || '';
          if (rawFeed.startsWith('DETAILED_RATING:')) {
            try {
              const parsed = JSON.parse(rawFeed.slice('DETAILED_RATING:'.length));
              setFeedback(parsed.notes || '');
            } catch (err) {
              setFeedback(rawFeed);
            }
          } else {
            setFeedback(rawFeed);
          }
        } else {
          setMyReviewId(null);
          setRating(0);
          setFeedback('');
        }
      } catch (e) {
        console.error("Error fetching broker reviews:", e);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchBrokerReviews();
  }, [userProfile?.broker, currentUser.uid]);

  // Handle saving profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    setProfileSuccess(false);

    // Syrian number validation
    const cleanedPhone = phone.replace(/[\s\-()]+/g, '');
    const syrianPhoneRegex = /^(?:\+963|00963|963)?0?9\d{8}$/;
    if (!syrianPhoneRegex.test(cleanedPhone)) {
      setPhoneError('يرجى إدخال رقم هاتف سوري صحيح (مثال: 0988126547)');
      return;
    }

    setIsProfileSaving(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updateData = {
        name: name.trim(),
        phone: phone.trim(),
        broker: broker.trim() || 'مباشر'
      };

      await updateDoc(userDocRef, updateData);
      
      // Update local state in App.tsx
      setUserProfile((prev: any) => ({
        ...prev,
        ...updateData
      }));

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (e) {
      handleFirestoreError(e, 'update', `users/${currentUser.uid}`);
    } finally {
      setIsProfileSaving(false);
    }
  };

  // Handle saving rating
  const handleSaveRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setIsRatingSaving(true);
    setRatingSuccess(false);

    const activeBroker = userProfile?.broker || 'مباشر';

    try {
      // Create detailed rating payload even for self-review
      const detailPayload = {
        pros: [],
        punctuality: rating,
        honesty: rating,
        communication: rating,
        notes: feedback.trim()
      };
      
      const stringifiedFeedback = `DETAILED_RATING:${JSON.stringify(detailPayload)}`;

      const ratingData = {
        userId: currentUser.uid,
        userName: userProfile?.name || currentUser.displayName || 'زبون النعيمي',
        brokerName: activeBroker,
        rating: rating,
        feedback: stringifiedFeedback,
        createdAt: new Date().toISOString()
      };

      if (myReviewId) {
        // Update existing rating
        const ratingDocRef = doc(db, 'broker_ratings', myReviewId);
        await updateDoc(ratingDocRef, {
          rating: rating,
          feedback: stringifiedFeedback
        });
        
        // Update local list
        setBrokerReviews(prev => prev.map(r => r.id === myReviewId ? {
          ...r,
          rating,
          feedback: stringifiedFeedback
        } : r));
      } else {
        // Create new rating
        const addedDoc = await addDoc(collection(db, 'broker_ratings'), ratingData);
        setMyReviewId(addedDoc.id);

        // Update local list
        const newReview: BrokerReview = {
          id: addedDoc.id,
          ...ratingData
        };
        setBrokerReviews(prev => [newReview, ...prev]);
      }

      // Recalculate average rating locally
      setBrokerReviews(prev => {
        const total = prev.reduce((acc, curr) => acc + curr.rating, 0);
        setAverageRating(prev.length > 0 ? Math.round((total / prev.length) * 10) / 10 : null);
        return prev;
      });

      setRatingSuccess(true);
      setTimeout(() => setRatingSuccess(false), 3000);
    } catch (e) {
      handleFirestoreError(e, myReviewId ? 'update' : 'create', 'broker_ratings');
    } finally {
      setIsRatingSaving(false);
    }
  };

  const activeBroker = userProfile?.broker || 'مباشر';

  return (
    <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 text-brand-navy overflow-y-auto" dir="rtl">
      {/* Backdrop Closer */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="bg-brand-cream border border-brand-navy/10 w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Top Header & Tab Switcher Bar */}
        <div className="bg-white px-8 py-4 border-b border-brand-navy/5 flex flex-wrap items-center justify-between gap-4 shrink-0 relative">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveModalTab('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeModalTab === 'profile'
                  ? 'bg-brand-navy text-brand-gold shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              <UserIcon size={14} />
              <span>الملف الشخصي والوسيط</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModalTab('contracts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeModalTab === 'contracts'
                  ? 'bg-brand-navy text-brand-gold shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              <FileText size={14} />
              <span>عقودي الرقمية ✍️</span>
              {clientContracts.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-brand-gold text-brand-navy text-[10px] font-black flex items-center justify-center">
                  {clientContracts.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveModalTab('referrals')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeModalTab === 'referrals'
                  ? 'bg-brand-navy text-brand-gold shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              <Users size={14} />
              <span>نظام الدعوات والإحالات 🎁</span>
            </button>
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-brand-navy/5 text-brand-navy/60 hover:text-brand-navy transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {activeModalTab === 'contracts' ? (
            <div className="p-8 md:p-10 space-y-6 overflow-y-auto flex-1">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-full">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-brand-navy">عقودي الرقمية وقائمة المعاينة والتوقيع</h3>
                  <p className="text-xs text-brand-navy/50">تتبع حالة كل عقد (قيد المراجعة، بانتظار التوقيع، تم التوقيع) مع الأيقونات والألوان التوضيحية</p>
                </div>
              </div>

              {clientContracts.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-brand-navy/20 space-y-3 shadow-xs">
                <FileText size={48} className="mx-auto text-zinc-300" />
                <h4 className="font-bold text-brand-navy text-base">لا توجد عقود رقمية موثقة أو معروضة لك حالياً</h4>
                <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                  عندما يقوم المسؤولون أو الوسطاء بإنشاء وإرسال عقد إيجار أو بيع خاص برقم هاتفك أو بريدك الإلكتروني، ستتمكن من مراجعته وتوقيعه رقمياً هنا فوراً.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientContracts.map((contract) => {
                  const status = contract.status || 'pending';
                  return (
                    <div key={contract.id} className="bg-white p-6 rounded-3xl border border-brand-navy/10 shadow-sm space-y-4 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                          contract.contractType === 'rent'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {contract.contractType === 'rent' ? 'عقد إيجار سكني/تجاري' : 'عقد بيع نهائي'}
                        </span>
                        
                        {/* Status Badge with icons and colors */}
                        {status === 'signed' ? (
                          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs">
                            <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                            <span>تم التوقيع ✅</span>
                          </span>
                        ) : status === 'reviewing' || status === 'pending_review' || status === 'under_review' ? (
                          <span className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs">
                            <Eye size={14} className="text-blue-600 shrink-0" />
                            <span>قيد المراجعة 🔍</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs animate-pulse">
                            <PenTool size={14} className="text-amber-600 shrink-0" />
                            <span>بانتظار التوقيع ✍️</span>
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="font-bold text-base text-brand-navy">
                          {contract.propertyTitle || contract.title || 'عقد عقاري رقمي'}
                        </h4>
                        <p className="text-xs text-zinc-500 font-medium">
                          المبلغ: <span className="font-mono font-bold text-brand-navy">{contract.totalAmount || contract.price || '---'} ل.س</span>
                        </p>
                        <p className="text-[11px] text-zinc-400 font-mono">
                          تاريخ الإنشاء: {contract.createdAt ? format(new Date(contract.createdAt), 'yyyy/MM/dd HH:mm') : '---'}
                        </p>
                      </div>

                      {contract.digitalSignature?.signerName && (
                        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 flex items-center justify-between">
                          <span className="font-bold">الموقّع: {contract.digitalSignature.signerName}</span>
                          <span className="font-mono text-[10px]">
                            {contract.digitalSignature.signedAt ? format(new Date(contract.digitalSignature.signedAt), 'yyyy/MM/dd') : ''}
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 font-bold">معرف العقد: #{contract.id.slice(0, 8)}</span>
                        <span className="text-xs font-bold text-brand-navy bg-brand-cream px-3 py-1.5 rounded-xl border border-brand-navy/10">
                          {status === 'signed' ? 'مستند قانوني معتمد' : 'مطلوب اتخاذ إجراء'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeModalTab === 'referrals' ? (
          <div className="p-8 md:p-10 space-y-6 overflow-y-auto flex-1 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-full">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-brand-navy">نظام الدعوات والإحالات والوسطاء الاحترافي 🎁</h3>
                <p className="text-xs text-brand-navy/50">شارك رابط الإحالة الخاص بك مع أصدقائك واكسب عمولات ومكافآت حصرية عند إتمام أي صفقة عقارية!</p>
              </div>
            </div>

            {/* Referral Link Generator Box */}
            <div className="bg-brand-cream/60 p-6 rounded-3xl border border-brand-navy/10 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                  <span>🔗</span> رابط الإحالة الشخصي الخاص بك:
                </span>
                <span className="px-3 py-1 bg-brand-gold/20 text-brand-navy text-[10px] font-black rounded-full">
                  سفير معتمد 💎
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}${window.location.pathname}?ref=${currentUser.uid}`}
                  className="w-full bg-white px-4 py-3 rounded-2xl border border-brand-navy/20 text-xs font-mono text-zinc-700 outline-none select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    const link = `${window.location.origin}${window.location.pathname}?ref=${currentUser.uid}`;
                    navigator.clipboard.writeText(link);
                    alert("تم نسخ رابط الإحالة بنجاح! شاركه الآن مع أصدقائك.");
                  }}
                  className="px-6 py-3 bg-brand-navy hover:bg-brand-navy/90 text-brand-gold rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-md flex items-center gap-2"
                >
                  <span>📋</span>
                  <span>نسخ الرابط</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`مرحباً! أنصحك بزيارة منصة البراء النعيمي للتسويق والتطوير العقاري عبر رابط الدعوة الخاص بي لاكتشاف أرقى العقارات والخدمات:\n${window.location.origin}${window.location.pathname}?ref=${currentUser.uid}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                >
                  <span>📱</span>
                  <span>مشاركة عبر واتساب</span>
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?ref=${currentUser.uid}`)}&text=${encodeURIComponent('انضم إلى منصة البراء النعيمي للعقارات واستفد من عروض الإكساء والبناء والبيع!')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                >
                  <span>✈️</span>
                  <span>مشاركة عبر تلغرام</span>
                </a>
              </div>
            </div>

            {/* Referral Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-brand-cream/30 p-5 rounded-2xl border border-brand-navy/10 text-center space-y-1">
                <span className="text-2xl font-serif font-black text-brand-navy">{userProfile?.referralCount || 0}</span>
                <span className="text-xs text-zinc-500 block font-bold">الأصدقاء المسجلون</span>
              </div>
              <div className="bg-brand-cream/30 p-5 rounded-2xl border border-brand-navy/10 text-center space-y-1">
                <span className="text-2xl font-serif font-black text-emerald-700">{userProfile?.completedReferralDeals || 0}</span>
                <span className="text-xs text-zinc-500 block font-bold">الصفقات المنجزة عبر إحالتك</span>
              </div>
              <div className="bg-brand-cream/30 p-5 rounded-2xl border border-brand-navy/10 text-center space-y-1">
                <span className="text-2xl font-serif font-black text-brand-gold">{userProfile?.referralEarnings || 0} ل.س</span>
                <span className="text-xs text-zinc-500 block font-bold">إجمالي الأرباح والمكاسب</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed font-bold space-y-1">
              <p>💡 <strong>كيف تعمل مكافآت الإحالة؟</strong></p>
              <p className="font-normal">
                عندما يقوم أي زائر بفتح الموقع عبر رابط الإحالة الخاص بك ويسجل حساباً أو يحجز استشارة/عقاراً، يتم تسجيله تلقائياً في سجلاتك وتحصل على نسبة عمولة تنافسية من أرباح الوساطة فور اكتمال العقد.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row overflow-hidden flex-1 max-h-[calc(90vh-70px)]">
            {/* Right side: User Profile Editing */}
            <div className="w-full md:w-5/12 p-8 md:p-10 border-b md:border-b-0 md:border-l border-brand-navy/5 bg-white overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-full">
                  <UserIcon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold">الملف الشخصي والوسيط</h3>
                  <p className="text-xs text-brand-navy/50">تأكيد معلوماتك وتعيين وسيطك المرسل</p>
                </div>
              </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-brand-navy/60 mb-2 mr-1">البريد الإلكتروني (ثابت)</label>
              <input 
                type="email" 
                value={currentUser.email || ''} 
                disabled 
                className="w-full p-4 rounded-2xl bg-brand-cream/30 border border-brand-navy/5 text-brand-navy/40 font-bold font-mono text-right"
              />
              
              {/* Verification Status Banner inside Profile */}
              <div className="mt-2.5 flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-brand-cream/40 border border-brand-navy/5">
                <div className="flex items-center gap-1.5 select-none">
                  {currentUser.emailVerified ? (
                    <>
                      <span className="text-emerald-600 text-base">✅</span>
                      <span className="text-[11px] font-black text-emerald-800">بريد إلكتروني مؤكد وموثق</span>
                    </>
                  ) : (
                    <>
                      <span className="text-amber-500 text-base">⚠️</span>
                      <span className="text-[11px] font-black text-amber-700">بريد إلكتروني غير مؤكد</span>
                    </>
                  )}
                </div>
                
                {!currentUser.emailVerified && (
                  <button
                    type="button"
                    onClick={handleLocalSendVerification}
                    disabled={isLocalSending || localSuccess}
                    className="px-3.5 py-1.5 bg-brand-navy hover:bg-brand-navy/90 text-brand-gold font-bold text-[10px] rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isLocalSending ? (
                      <span className="flex items-center gap-1"><Loader className="animate-spin" size={10} /> جاري الإرسال...</span>
                    ) : localSuccess ? (
                      "تم الإرسال بنجاح!"
                    ) : (
                      "أرسل رابط التحقق ✉️"
                    )}
                  </button>
                )}
              </div>
              {localError && <p className="text-[10px] text-red-600 font-bold mt-1.5 text-center">{localError}</p>}
              {localSuccess && <p className="text-[10px] text-emerald-700 font-bold mt-1.5 text-center leading-relaxed">أرسلنا رسالة تحقق لبريدك الإلكتروني، يرجى مراجعة الصندوق الوارد أو البريد المزعج (Spam) وتأكيد حسابك.</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-brand-navy/60 mb-2 mr-1">الاسم الكامل</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full p-4 pr-12 rounded-2xl bg-brand-cream/40 border border-brand-navy/5 focus:border-brand-gold focus:outline-none transition-all text-right font-bold"
                  placeholder="أدخل اسمك الكامل"
                />
                <UserIcon className="absolute right-4 top-4 text-brand-navy/30" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-brand-navy/60 mb-2 mr-1">الرقم السوري الخاص بك</label>
              <div className="relative">
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full p-4 pr-12 rounded-2xl bg-brand-cream/40 border border-brand-navy/5 focus:border-brand-gold focus:outline-none transition-all text-right font-bold font-mono"
                  placeholder="مثال: 0988126547"
                />
                <Phone className="absolute right-4 top-4 text-brand-navy/30" size={18} />
              </div>
              {phoneError && (
                <p className="text-xs text-red-600 font-bold mt-1.5 mr-1">{phoneError}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-brand-navy/60 mb-2 mr-1">اسم الشريك أو الوسيط المتابع</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={broker}
                  onChange={(e) => setBroker(e.target.value)}
                  className="w-full p-4 pr-12 rounded-2xl bg-brand-cream/40 border border-brand-navy/5 focus:border-brand-gold focus:outline-none transition-all text-right font-bold"
                  placeholder="اسم الشخص الذي أرسل لك التطبيق أو الوسيط"
                />
                <Users className="absolute right-4 top-4 text-brand-navy/30" size={18} />
              </div>
              <p className="text-[10px] text-brand-navy/40 mt-1.5 mr-1 font-medium leading-relaxed">
                * يمكنك كتابة "مباشر" إذا قمت بالتسجيل من تلقاء نفسك وبشكل مباشر مع الشركة دون وسيط.
              </p>
            </div>

            <button 
              type="submit" 
              disabled={isProfileSaving}
              className="w-full py-4 bg-brand-navy text-brand-gold rounded-2xl font-bold hover:bg-brand-navy/95 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-navy/10 border border-brand-gold/10"
            >
              {isProfileSaving ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  جاري الحفظ والتحقق...
                </>
              ) : profileSuccess ? (
                <>
                  <Check size={18} />
                  تم تحديث الملف بنجاح!
                </>
              ) : (
                'حفظ تعديلات الملف 💾'
              )}
            </button>
          </form>

          {/* 10-day Long Session Security Badge */}
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] hover:border-emerald-300 transition-all select-none">
            <p className="font-bold text-emerald-800 flex items-center gap-1.5 justify-start">
              <span className="text-base">🔐</span>
              <span>تأمين جلسة الدخول النشطة لمدة 10 أيام</span>
            </p>
            <p className="text-emerald-700/80 mt-1 font-semibold leading-relaxed">
              ستبقى مسجلاً الدخول للمنصة بشكل آمن تماماً وتلقائي لمدة <span className="font-bold text-emerald-900">10 أيام متواصلة</span> دون الحاجة لتسجيل الخروج أو تكرار إدخال كلمة المرور.
            </p>
          </div>

          {/* Governorates Preferences Badge view */}
          {userProfile?.alertGovernorates && userProfile.alertGovernorates.length > 0 && (
            <div className="mt-6 pt-6 border-t border-brand-navy/5">
              <span className="block text-xs font-bold uppercase tracking-widest text-brand-navy/60 mb-2 mr-1">المحافظات المشترك بإشعاراتها:</span>
              <div className="flex flex-wrap gap-1.5">
                {userProfile.alertGovernorates.map((g: string) => (
                  <span key={g} className="px-2.5 py-1 bg-brand-gold/10 border border-brand-gold/15 text-brand-navy text-[10px] font-bold rounded-lg">
                    {g} 🔔
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Left side: Broker Ratings Engine */}
        <div className="w-full md:w-7/12 p-8 md:p-10 bg-brand-cream/40 flex flex-col justify-between overflow-y-auto">
          {activeBroker === 'مباشر' ? (
            <div className="my-auto text-center py-10 px-4 space-y-4">
              <div className="w-16 h-16 bg-brand-navy/5 text-brand-navy/40 rounded-full flex items-center justify-center mx-auto text-2xl">
                🤝
              </div>
              <h4 className="text-xl font-serif font-bold text-brand-navy">حساب مباشر بدون وسيط</h4>
              <p className="text-sm text-brand-navy/60 max-w-sm mx-auto leading-relaxed font-medium">
                تم تسجيل حسابك حالياً بصفة زبون "مباشر". لتقييم تجربة وسيط معين، يرجى كتابة اسمه في خانة "اسم الشريك أو الوسيط المتابع" على اليمين وحفظ التعديل ليظهر لك محرك التقييم والمراجعات فوراً!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="p-6 bg-white border border-brand-navy/5 rounded-3xl text-right flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="text-xs text-brand-navy/40 font-bold mb-1">الوسيط المتابع لحسابك</div>
                  <h4 className="text-lg font-bold text-brand-navy flex items-center gap-2">
                    {activeBroker}
                    <span className="text-brand-gold">✨</span>
                  </h4>
                </div>
                
                {/* Score badge */}
                <div className="bg-brand-gold/5 px-4 py-2 rounded-2xl border border-brand-gold/15 text-right sm:text-left shrink-0">
                  <div className="text-[10px] text-brand-navy/40 font-bold mb-0.5">متوسط تقييم العملاء</div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-lg font-bold text-brand-navy">
                      {averageRating !== null ? averageRating : '--'}
                    </span>
                    <Star size={16} className="fill-brand-gold text-brand-gold shrink-0" />
                    <span className="text-xs text-brand-navy/50 font-medium">
                      ({brokerReviews.length} تقييم)
                    </span>
                  </div>
                </div>
              </div>

              {/* Add rating Form */}
              <div className="bg-white p-6 border border-brand-navy/5 rounded-3xl">
                <h4 className="font-serif font-bold text-base text-brand-navy mb-4 flex items-center gap-2">
                  <span>قيم تجربتك مع {activeBroker}</span>
                  <Award size={18} className="text-brand-gold" />
                </h4>

                <form onSubmit={handleSaveRating} className="space-y-4">
                  {/* Star Selector */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-brand-navy/60 font-medium shrink-0 ml-1">تحديد النجوم:</span>
                    <div className="flex gap-1.5" dir="ltr">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isGold = hoveredRating ? star <= hoveredRating : star <= rating;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className="p-1 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star 
                              size={28} 
                              className={isGold ? "fill-brand-gold text-brand-gold" : "text-brand-navy/20"} 
                            />
                          </button>
                        );
                      })}
                    </div>
                    {rating > 0 && (
                      <span className="text-xs font-bold text-brand-gold bg-brand-gold/5 px-2 py-0.5 border border-brand-gold/10 rounded-md">
                        {rating === 5 ? 'ممتاز جداً ⭐' : rating === 4 ? 'جيد جداً 👍' : rating === 3 ? 'متوسط 🤝' : rating === 2 ? 'مقبول 👎' : 'ضعيف جداً ⚠️'}
                      </span>
                    )}
                  </div>

                  {/* Feedback comment */}
                  <div>
                    <label className="block text-xs font-bold text-brand-navy/60 mb-1.5 mr-1">تعليقك أو ملاحظاتك في المتابعة (اختياري)</label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={2}
                      maxLength={1500}
                      className="w-full p-4 rounded-xl bg-brand-cream/30 border border-brand-navy/5 focus:border-brand-gold focus:outline-none transition-all text-right text-sm font-semibold"
                      placeholder="صف تجربتك المهنية بالتفصيل والمصداقية..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={rating === 0 || isRatingSaving}
                    className="w-full sm:w-auto px-6 py-3 bg-brand-navy text-brand-gold rounded-xl font-bold text-xs hover:bg-brand-navy/95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-brand-gold/10"
                  >
                    {isRatingSaving ? (
                      <>
                        <Loader className="animate-spin" size={14} />
                        جاري إرسال التقييم...
                      </>
                    ) : ratingSuccess ? (
                      <>
                        <Check size={14} />
                        تم حفظ التقييم بنجاح!
                      </>
                    ) : (
                      <>
                        <Send size={12} />
                        {myReviewId ? 'تحديث التقييم الحالي' : 'تأكيد وحفظ التقييم ⭐️'}
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy/60 mr-1 flex items-center gap-1.5">
                  <MessageSquare size={14} />
                  <span>آراء المقيمين الآخرين لـ {activeBroker}</span>
                  <span className="text-[10px] text-brand-navy/40 font-medium">({brokerReviews.length} تقييم ومراجعة)</span>
                </h4>

                <div className="max-h-[14rem] overflow-y-auto space-y-3 divide-y divide-brand-navy/5 pr-1.5">
                  {isLoadingReviews ? (
                    <div className="text-center py-6 text-brand-navy/30 text-xs font-bold">جاري تحميل مراجعات الشركاء...</div>
                  ) : brokerReviews.length === 0 ? (
                    <div className="p-6 text-center text-xs font-bold text-brand-navy/40 bg-white/50 rounded-2xl border border-dotted border-brand-navy/10">
                      لا توجد مراجعات أو تقييمات مكتوبة لهذا الوسيط بعد. كن أول من يضيف رأيه الصادق!
                    </div>
                  ) : (
                    brokerReviews.map((rev) => {
                      const parseFeedback = (feedbackStr: string) => {
                        if (!feedbackStr) return { isDetailed: false, notes: '', pros: [], punctuality: 5, honesty: 5, communication: 5 };
                        if (feedbackStr.startsWith('DETAILED_RATING:')) {
                          try {
                            const json = JSON.parse(feedbackStr.slice('DETAILED_RATING:'.length));
                            return {
                              isDetailed: true,
                              notes: json.notes || '',
                              pros: json.pros || [],
                              punctuality: json.punctuality || 5,
                              honesty: json.honesty || 5,
                              communication: json.communication || 5
                            };
                          } catch (e) {
                            console.error("Failed to parse detailed rating JSON in profile modal:", e);
                          }
                        }
                        return { isDetailed: false, notes: feedbackStr, pros: [], punctuality: 5, honesty: 5, communication: 5 };
                      };

                      const info = parseFeedback(rev.feedback);

                      return (
                        <div key={rev.id} className="pt-3.5 pb-3 first:pt-0 bg-white/35 hover:bg-white/70 p-4 rounded-2xl transition-all border border-brand-navy/5 space-y-2.5">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="text-xs font-bold text-brand-navy block">{rev.userName}</span>
                              <span className="text-[9px] text-brand-navy/40 font-mono" dir="ltr">
                                {rev.createdAt ? format(new Date(rev.createdAt), 'yyyy/MM/dd') : ''}
                              </span>
                            </div>
                            <div className="flex gap-0.5" dir="ltr">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star 
                                  key={s} 
                                  size={12} 
                                  className={s <= rev.rating ? "fill-brand-gold text-brand-gold" : "text-brand-navy/10"} 
                                />
                              ))}
                            </div>
                          </div>

                          {/* Render Pros and detailed aspects if present */}
                          {info.isDetailed && (
                            <div className="space-y-2 pt-1 border-t border-brand-navy/5">
                              {/* Pros Tags */}
                              {info.pros && info.pros.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {info.pros.map((tag, i) => (
                                    <span key={i} className="text-[9px] px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg font-bold">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Custom sub ratings */}
                              <div className="grid grid-cols-3 gap-2 bg-brand-navy/5 p-2 rounded-xl text-[9px] font-bold">
                                <div className="space-y-0.5 text-right">
                                  <span className="text-brand-navy/50 block">⏱️ المواعيد:</span>
                                  <div className="flex gap-0.5 justify-end" dir="ltr">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star key={s} size={7} className={s <= info.punctuality ? "fill-brand-gold text-brand-gold" : "text-brand-navy/10"} />
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-0.5 text-right">
                                  <span className="text-brand-navy/50 block">🤝 التعامل:</span>
                                  <div className="flex gap-0.5 justify-end" dir="ltr">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star key={s} size={7} className={s <= info.communication ? "fill-brand-gold text-brand-gold" : "text-brand-navy/10"} />
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-0.5 text-right">
                                  <span className="text-brand-navy/50 block">💡 الأمانة:</span>
                                  <div className="flex gap-0.5 justify-end" dir="ltr">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star key={s} size={7} className={s <= info.honesty ? "fill-brand-gold text-brand-gold" : "text-brand-navy/10"} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {info.notes && (
                            <p className="text-xs text-brand-navy/85 leading-relaxed font-bold border-r border-[#1A2E40]/30 pr-1.5 whitespace-pre-wrap">
                              {info.notes}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </motion.div>
</div>
  );
}
