import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, CheckCircle2, ChevronLeft, AlertCircle } from 'lucide-react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';

export default function NewsletterSubscription() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Direct email regex validation
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('يرجى إدخال بريد إلكتروني صحيح.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Check if the email already exists to prevent duplicate spamming
      const q = query(
        collection(db, 'newsletter_subscriptions'),
        where('email', '==', email.trim().toLowerCase())
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('هذا البريد الإلكتروني مشترك بالفعل في نشرتنا البريدية.');
      }

      // 2. Add document to Firestore newsletter_subscriptions
      await addDoc(collection(db, 'newsletter_subscriptions'), {
        email: email.trim().toLowerCase(),
        createdAt: new Date().toISOString()
      });

      setSuccess(true);
      setEmail('');
      
      // Auto dismiss success toast after 6 seconds
      setTimeout(() => setSuccess(false), 6000);
    } catch (err: any) {
      console.error("Newsletter submission error: ", err);
      setError(err.message || 'حدث خطأ أثناء الاشتراك. يرجى المحاولة لاحقاً.');
      
      if (err.code || err.message?.includes('permission-denied')) {
        try {
          handleFirestoreError(err, 'create', 'newsletter_subscriptions');
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 px-6 bg-brand-cream/40 border-t border-brand-navy/5 text-right rtl-dir" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative bg-white rounded-3xl border border-brand-navy/5 shadow-xl p-8 md:p-12 overflow-hidden"
          id="newsletter-container"
        >
          {/* Subtle gold visual accent */}
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-brand-gold to-brand-gold-light" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Header copy */}
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-gold/10 text-brand-gold text-xs font-bold rounded-full mb-2">
                <Mail size={14} />
                <span>النشرة البريدية الحصرية</span>
              </div>
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-brand-navy leading-tight">
                ابقَ على اطلاع بأحدث العقارات والاستثمارات
              </h3>
              <p className="text-sm text-brand-navy/60 leading-relaxed font-semibold">
                اشترك الآن لتصلك إشعارات فورية بكل عقار جديد يُضاف على المنصة، وأقوى الفرص العقارية والتحليلات السوقية الحصرية في دمشق والمحافظات السورية.
              </p>
            </div>

            {/* Form component */}
            <div className="lg:col-span-5 w-full">
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-green-50/80 border border-green-200 rounded-2xl p-6 text-center flex flex-col items-center gap-3"
                    id="newsletter-success-box"
                  >
                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center animate-bounce">
                      <CheckCircle2 size={24} />
                    </div>
                    <h4 className="font-serif font-bold text-lg text-green-900">مبارك، تم الاشتراك بنجاح!</h4>
                    <p className="text-xs text-green-700 font-semibold leading-relaxed">
                      شكرًا لك! ستصلك التحديثات العقارية والفرص الاستثمارية الحصرية مباشرةً عبر بريدك المميز قريباً.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    id="newsletter-form"
                  >
                    <div className="relative">
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-brand-navy/30">
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="أدخل بريدك الإلكتروني هنا..."
                        className="w-full pl-4 pr-12 py-3.5 bg-brand-cream/25 border border-brand-navy/10 rounded-2xl hover:border-brand-navy/20 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all text-sm font-semibold text-brand-navy placeholder-brand-navy/40 text-right"
                        dir="ltr"
                        id="newsletter-email-input"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-brand-navy hover:bg-brand-navy/90 text-brand-gold hover:text-white px-6 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      id="newsletter-submit-btn"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>اشترك في النشرة مجاناً</span>
                          <ChevronLeft size={16} />
                        </>
                      )}
                    </button>

                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2 text-xs text-red-600 font-bold bg-red-50 p-3 rounded-xl border border-red-100"
                          id="newsletter-error-box"
                        >
                          <AlertCircle size={14} className="shrink-0" />
                          <span>{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
