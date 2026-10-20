import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2, AlertCircle, Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';

export default function ContactUs({ language = 'ar' }: { language?: 'ar' | 'en' }) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate data before submission
      if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
        throw new Error(t('يرجى ملء جميع الحقول المطلوبة.', 'Please fill out all required fields.'));
      }

      const inquiryId = Math.random().toString(36).substr(2, 9);
      
      // Write database entry using direct addDoc to Firestore 'inquiries' collection
      await addDoc(collection(db, 'inquiries'), {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        createdAt: new Date().toISOString()
      });

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      
      // Auto-dismiss success status after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error("Error submitting inquiry: ", err);
      setError(err.message || t('حدث خطأ أثناء إرسال استفسارك. يرجى المحاولة مرة أخرى.', 'An error occurred while sending your inquiry. Please try again.'));
      // Handle using the enterprise logging pattern from our integration guide if it's a Firestore error
      if (err.code || err.message?.includes('permission-denied')) {
        try {
          handleFirestoreError(err, 'create', 'inquiries');
        } catch (wrappedErr) {
          // Keep local user-facing error message updated
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const socialLinks = [
    {
      name: t('فيسبوك', 'Facebook'),
      icon: <Facebook size={18} />,
      url: 'https://facebook.com',
      color: 'hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]'
    },
    {
      name: t('إنستغرام', 'Instagram'),
      icon: <Instagram size={18} />,
      url: 'https://instagram.com',
      color: 'hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:text-white hover:border-transparent'
    },
    {
      name: t('لينكد إن', 'LinkedIn'),
      icon: <Linkedin size={18} />,
      url: 'https://linkedin.com',
      color: 'hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]'
    },
    {
      name: t('يوتيوب', 'YouTube'),
      icon: <Youtube size={18} />,
      url: 'https://youtube.com',
      color: 'hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]'
    },
    {
      name: t('واتساب', 'WhatsApp'),
      icon: <Phone size={18} />,
      url: 'https://wa.me/963945430030',
      color: 'hover:bg-[#25D366] hover:text-white hover:border-[#25D366]'
    },
    {
      name: t('تلغرام', 'Telegram'),
      icon: <Send size={18} />,
      url: 'https://t.me',
      color: 'hover:bg-[#26A5E4] hover:text-white hover:border-[#26A5E4]'
    }
  ];

  return (
    <div className="max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fadeIn" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Title Section */}
      <div className="text-center mb-16">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-gold/10 text-brand-gold px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-brand-gold/15"
        >
          {t('تواصل معنا المباشر', 'Direct Contact')}
        </motion.span>
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-serif font-black text-brand-navy mt-4 mb-3"
        >
          {language === 'ar' ? (
            <>نسعد دائماً <span className="text-brand-gold">بخدمتكم والإجابة</span> على استفساراتكم</>
          ) : (
            <>We are always happy <span className="text-brand-gold">to serve you & answer</span> your inquiries</>
          )}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-brand-navy/60 max-w-2xl mx-auto text-sm md:text-base leading-relaxed"
        >
          {t(
            'فريق عمل شركة البراء النعيمي للاستشارات والتطوير العقاري جاهز للرد على جميع تساؤلاتكم وتقديم الدعم العقاري والخدمي الفاخر على مدار الساعة.',
            'Al-Baraa Al-Nuaimi team for consulting and real estate development is ready to answer all your questions and provide luxurious support around the clock.'
          )}
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        {/* Contact info card (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-brand-navy p-8 rounded-[2rem] text-white space-y-8 h-full shadow-lg border border-brand-gold/20 flex flex-col justify-between">
            <div className="space-y-6">
              <h3 className="text-2xl font-serif font-bold text-brand-gold border-b border-white/10 pb-4">
                {t('معلومات الاتصال', 'Contact Information')}
              </h3>
              <p className="text-white/70 text-xs leading-relaxed">
                {t(
                  'تفضلوا بزيارة مقرنا الرئيسي أو تواصلوا معنا مباشرة عبر القنوات الرسمية التالية:',
                  'Please visit our main office or contact us directly through the following official channels:'
                )}
              </p>

              <div className="space-y-5 pt-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-brand-gold shrink-0 mt-0.5">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase">{t('الرقم الموحد / واتساب', 'Unified Number / WhatsApp')}</p>
                    <a href="tel:0945430030" className="font-mono text-sm font-bold hover:text-brand-gold transition-colors tracking-wide block mt-0.5" dir="ltr">
                      0945430030
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-brand-gold shrink-0 mt-0.5">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase">{t('بريد الاستفسارات الإلكتروني', 'Inquiries Email')}</p>
                    <a href="mailto:alnuimialbaraa@gmail.com" className="font-mono text-sm hover:text-brand-gold transition-colors block mt-0.5">
                      alnuimialbaraa@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-brand-gold shrink-0 mt-0.5">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase">{t('العنوان والموقع الرئيسي', 'Main Address & Location')}</p>
                    <p className="text-sm font-medium leading-relaxed block mt-0.5 text-white/90">
                      {t('الجمهورية العربية السورية، ريف دمشق، قرى الشام', 'Syrian Arab Republic, Damascus Countryside, Qura Al-Sham')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-brand-gold shrink-0 mt-0.5">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase">{t('أوقات العمل واستقبال المراجعين', 'Business & Visitors Hours')}</p>
                    <p className="text-sm font-semibold block mt-0.5 text-white/90">
                      {t('الأحد - الخميس: 9:00 ص - 5:00 م', 'Sunday - Thursday: 9:00 AM - 5:00 PM')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media Channels Integration */}
              <div className="pt-6 border-t border-white/10">
                <h4 className="text-sm font-bold text-brand-gold mb-3">
                  {t('قنوات التواصل الاجتماعي', 'Social Media Channels')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/80 transition-all duration-300 ${social.color}`}
                      title={social.name}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 text-[10px] text-white/30 text-center font-bold uppercase tracking-widest">
              {t('شركة البراء النعيمي للتطوير والاستشارات العقارية', 'Al-Baraa Al-Nuaimi Real Estate Consulting & Development')}
            </div>
          </div>
        </div>

        {/* Form panel (8 cols) */}
        <div className="lg:col-span-8">
          <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-brand-navy/10 shadow-sm h-full flex flex-col justify-between">
            <div className="mb-6">
              <h3 className="text-2xl font-serif font-bold text-brand-navy mb-1.5">{t('أرسل لنا استفساراً', 'Send us an inquiry')}</h3>
              <p className="text-brand-navy/55 text-xs">{t('سيسعد ممثلو الخدمات العقارية لدينا بالتواصل معكم في غضون 24 ساعة عمل كحد أقصى.', 'Our real estate services representatives will be pleased to contact you within 24 business hours maximum.')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {success && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-2xl flex items-center gap-3 text-xs md:text-sm font-medium text-right"
                >
                  <CheckCircle2 className="text-emerald-600 shrink-0" size={22} />
                  <div>
                    <h5 className="font-bold text-emerald-900 text-sm">{t('تم إرسال رسالتك بنجاح!', 'Message sent successfully!')}</h5>
                    <p className="text-emerald-700/90 text-xs mt-0.5">{t('نشكرك على اهتمامك وتواصلك. فريق خدمة العملاء لدينا سيقوم بالتنسيق والرد عليك قريباً.', 'Thank you for your interest and communication. Our customer service team will coordinate and respond to you soon.')}</p>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 border border-red-200 text-red-950 p-4 rounded-2xl flex items-center gap-3 text-xs md:text-sm font-medium text-right"
                >
                  <AlertCircle className="text-red-600 shrink-0" size={22} />
                  <p>{error}</p>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-navy/60 mb-2">{t('الاسم الكامل', 'Full Name')} <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-cream/5 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all text-sm font-medium text-brand-navy"
                    placeholder={t('أدخل اسمك الكريم', 'Enter your full name')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy/60 mb-2">{t('البريد الإلكتروني', 'Email Address')} <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-cream/5 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all text-sm font-mono text-brand-navy"
                    placeholder="example@domain.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-navy/60 mb-2">{t('رقم الهاتف (اختياري)', 'Phone Number (Optional)')}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-cream/5 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all text-sm font-mono text-brand-navy"
                    placeholder={t('مثال: 0991234567', 'e.g. 0991234567')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy/60 mb-2">{t('موضوع الاستفسار', 'Inquiry Subject')} <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-cream/5 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all text-sm font-medium text-brand-navy"
                    placeholder={t('مثال: حجز موعد معاينة خاصة، استفسار تطوير عقاري', 'e.g. Special view appointment, real estate consulting')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-navy/60 mb-2">{t('تفاصيل الرسالة والاستفسار', 'Message & Inquiry Details')} <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-cream/5 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all text-sm font-medium text-brand-navy"
                  placeholder={t('يرجى كتابة كافة التفاصيل التي ترغب في الاستفسار عنها لخدمتكم بشكل أدق...', 'Please write all the details you wish to inquire about to serve you accurately...')}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-8 py-3.5 bg-brand-navy hover:bg-brand-navy/95 text-brand-gold rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-60 disabled:pointer-events-none cursor-pointer shadow-lg shadow-brand-navy/10"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></span>
                    <span>{t('جاري إرسال الرسالة...', 'Sending message...')}</span>
                  </>
                ) : (
                  <>
                    <Send size={16} className={language === 'ar' ? 'rotate-180' : ''} />
                    <span>{t('إرسال الاستفسار الآن 🔒', 'Submit Inquiry Now 🔒')}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Google Maps Embed Section */}
      <div className="bg-white rounded-[2.5rem] border border-brand-navy/10 overflow-hidden shadow-xl">
        <div className={`p-8 border-b border-brand-navy/5 ${language === 'ar' ? 'text-right' : 'text-left'} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
          <div>
            <h3 className="text-2xl font-serif text-brand-navy flex items-center gap-2">
              <span>{t('خريطة الوصول لمقرنا الرئيسي', 'Main Office Location Map')}</span>
              <span className="text-xl">📍</span>
            </h3>
            <p className="text-brand-navy/60 text-sm mt-1">{t('تجدوننا في ريف دمشق، قرى الشام الاستراتيجية.', 'Find us in Damascus Countryside, strategic Qura Al-Sham.')}</p>
          </div>
          <a
            href="https://maps.google.com/?q=33.513807,36.276451"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-gold/10 hover:bg-brand-gold/15 text-brand-navy rounded-xl text-xs font-bold border border-brand-gold/30 transition-all"
          >
            <span>{t('فتح عبر خرائط Google مفرداً 🗺️', 'Open in Google Maps 🗺️')}</span>
          </a>
        </div>
        
        {/* Full Interactive Google Maps Iframe */}
        <div className="h-[450px] w-full relative bg-brand-cream/10">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13303.421731671954!2d36.276451!3d33.513807!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1518e6dc413cc6a7%3A0x877546f48a2bc62!2sDamascus%2C%20Syria!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
            className="w-full h-full border-0"
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer"
            title={t('موقع شركة البراء النعيمي على خرائط جوجل', 'Al-Baraa Al-Nuaimi Office Location on Google Maps')}
          ></iframe>
        </div>
      </div>
    </div>
  );
}
