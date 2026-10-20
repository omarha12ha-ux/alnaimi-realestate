import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Scale, FileText, CheckCircle, ArrowRight, BookOpen, AlertTriangle } from 'lucide-react';

export default function TermsOfUseView({ onBack, language = 'ar' }: { onBack: () => void; language?: 'ar' | 'en' }) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const sections = [
    {
      icon: <BookOpen className="text-brand-gold w-6 h-6" />,
      titleAr: "1. قبول الشروط والأحكام",
      titleEn: "1. Acceptance of Terms",
      descAr: "باستخدامك لمنصة البراء النعيمي العقارية الفاخرة، فإنك توافق بشكل كامل وغير مشروط على الالتزام بجميع بنود هذه الاتفاقية. إذا كنت لا توافق على أي بند، يرجى التوقف عن استخدام المنصة فوراً.",
      descEn: "By accessing and using Al-Baraa Al-Nuaimi Premium Real Estate platform, you agree to be bound by these Terms of Use in full. If you do not agree to these terms, please discontinue using our services immediately."
    },
    {
      icon: <Scale className="text-brand-gold w-6 h-6" />,
      titleAr: "2. شروط حجز المعاينات والخدمات العقارية",
      titleEn: "2. Real Estate Viewing & Services Booking Terms",
      descAr: "عند طلب حجز معاينة لعقار أو خدمة استشارية، يتوجب عليك تقديم معلومات اتصال صحيحة ودقيقة (الاسم، الهاتف، البريد الإلكتروني). نلتزم بمراجعة الحجوزات والتواصل الهاتفي لتأكيدها. في حال تعذر الاتصال أو تقديم بيانات وهمية، يحق للإدارة إلغاء الحجز فوراً.",
      descEn: "When scheduling a property viewing or service, you must provide accurate, current contact information. We verify all bookings by phone. In case of inaccurate information or unreachable contacts, the administration reserves the right to cancel the booking immediately."
    },
    {
      icon: <Shield className="text-brand-gold w-6 h-6" />,
      titleAr: "3. خصوصية البيانات وأمان المعاملات",
      titleEn: "3. Data Privacy & Transaction Security",
      descAr: "نحن في شركة النعيمي نلتزم بحماية بياناتك الشخصية وسجل تفاعلاتك. بموجب هذه الاتفاقية، فإنك تأذن لنا بمشاركة تفاصيل طلبك مع الوسيط العقاري المعتمد والمخصص لتلبية طلبك، لضمان أعلى مستويات الخدمة والمتابعة الفعالة.",
      descEn: "We are committed to protecting your personal data and transaction history. Under this agreement, you authorize us to share your request details with the designated, certified real estate broker strictly for service fulfillment."
    },
    {
      icon: <FileText className="text-brand-gold w-6 h-6" />,
      titleAr: "4. دقة وصحة المعلومات المعروضة",
      titleEn: "4. Accuracy of Displayed Information",
      descAr: "تبذل الشركة أقصى جهودها للتحقق من مواصفات وأسعار ومواقع العقارات المعروضة. ومع ذلك، فإن جميع الأسعار والمواصفات تعتبر استرشادية وتخضع للتغيير بناءً على تقلبات السوق وعقود المالكين الرسمية.",
      descEn: "While we make every effort to verify all property pricing, features, and locations, all displayed details are informational and subject to change based on market fluctuations and formal owner agreements."
    },
    {
      icon: <AlertTriangle className="text-brand-gold w-6 h-6" />,
      titleAr: "5. الاستخدام المقبول والمسؤولية القانونية",
      titleEn: "5. Acceptable Use & Legal Liabilities",
      descAr: "يُحظر تماماً استخدام المنصة لإرسال رسائل وهمية، أو استغلال خدمة الاستشارات الفورية لإرسال بريد مزعج، أو محاولة حجز مواعيد متعددة ومتعارضة بغرض إعاقة الخدمة. يخضع المخالفون للحظر الفوري والمساءلة القانونية بموجب قوانين المعاملات الإلكترونية.",
      descEn: "It is strictly prohibited to submit fake requests, spam our instant consultation chat, or book conflicting mock appointments to disrupt services. Violators will face immediate ban and legal action under electronic commerce regulations."
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-brand-cream/10 py-12 px-4 sm:px-6 lg:px-8 font-sans"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-brand-navy/15 pb-6 gap-4">
          <div className="text-right">
            <span className="text-[10px] uppercase font-black tracking-widest text-brand-gold block mb-1">
              {t("النعيمي للعقارات الفاخرة", "AL-NAIMI PREMIUM REAL ESTATE")}
            </span>
            <h1 className="text-3xl font-serif font-black text-brand-navy">
              {t("شروط وأحكام الاستخدام", "Terms of Use & Service Agreement")}
            </h1>
            <p className="text-xs text-brand-navy/60 mt-1">
              {t("آخر تحديث: 29 يونيو 2026", "Last updated: June 29, 2026")}
            </p>
          </div>
          
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-brand-gold hover:bg-brand-gold hover:text-brand-navy font-bold text-xs rounded-xl shadow-md transition-all duration-300 cursor-pointer self-start"
          >
            <ArrowRight size={16} className={language === 'ar' ? "rotate-0" : "rotate-180"} />
            <span>{t("العودة إلى الرئيسية", "Back to Home")}</span>
          </button>
        </div>

        {/* Intro Banner */}
        <div className="bg-gradient-to-r from-brand-navy to-brand-navy/95 text-white p-8 rounded-[2.5rem] border border-brand-gold/20 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-2xl -translate-x-8 -translate-y-8 pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <h3 className="text-lg font-serif font-bold text-brand-gold">
              {t("عزيزنا العميل والزائر الكريم 🤝", "Dear Customer & Estimated Visitor 🤝")}
            </h3>
            <p className="text-xs leading-relaxed text-zinc-200">
              {t(
                "يرجى قراءة هذه الاتفاقية بعناية قبل استخدام المنصة. نسعى في شركة البراء النعيمي للتسويق العقاري الفاخر إلى توفير أقصى درجات الشفافية والوضوح القانوني لضمان تجربة سكنية واستثمارية مثالية تفوق توقعاتكم.",
                "Please read this agreement carefully before using our platform. At Al-Baraa Al-Nuaimi Luxury Real Estate, we strive to establish full transparency and legal clarity to ensure a flawless residential and investment journey."
              )}
            </p>
          </div>
        </div>

        {/* Terms Sections Grid */}
        <div className="space-y-6">
          {sections.map((sec, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={idx}
              className="bg-white p-6 sm:p-8 rounded-[2rem] border border-brand-navy/5 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-center gap-3.5 border-b border-zinc-100 pb-3">
                <div className="p-2.5 bg-brand-gold/10 rounded-xl">
                  {sec.icon}
                </div>
                <h3 className="text-base font-serif font-extrabold text-brand-navy">
                  {t(sec.titleAr, sec.titleEn)}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-brand-navy/70 leading-relaxed font-sans font-medium">
                {t(sec.descAr, sec.descEn)}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Acceptance Note Card */}
        <div className="bg-brand-gold/5 p-6 rounded-[2rem] border border-brand-gold/15 text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-brand-gold/10 rounded-full text-brand-gold">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h4 className="text-sm font-bold text-brand-navy font-serif">
            {t("الالتزام الكامل بالشفافية والمسؤولية", "Full Commitment to Transparency & Responsibility")}
          </h4>
          <p className="text-[11px] text-brand-navy/60 leading-relaxed max-w-xl mx-auto">
            {t(
              "نحن نعتبر حجزك لأي موعد أو استخدامك للخدمات بمثابة توقيع إلكتروني متبادل على هذه الشروط، مما يعزز الثقة المتبادلة بين الشركة وعملائها الكرام.",
              "We regard every booking and active usage of our platform as a mutual digital sign-off on these terms, strengthening the trust between our company and esteemed clients."
            )}
          </p>
        </div>

        {/* Footer Support Info */}
        <div className="text-center text-xs text-brand-navy/40 font-medium">
          <p>{t("لديك استفسار قانوني حول شروط الاستخدام؟ لا تتردد بالتواصل مع فريق المستشارين القانونيين للشركة.", "Have a legal inquiry about our terms? Feel free to contact our legal advisory department.")}</p>
          <p className="mt-1 font-bold text-brand-gold font-mono">legal@alnaimi.com • 0982448702</p>
        </div>

      </div>
    </motion.div>
  );
}
