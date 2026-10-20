import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Star, 
  Users, 
  ArrowRight, 
  Briefcase, 
  HelpCircle,
  TrendingUp,
  Award,
  Globe,
  Palette,
  Sparkles,
  Wand2,
  Moon,
  Sun
} from 'lucide-react';

interface LandingPageProps {
  brandingSettings: {
    logoText: string;
    logoIcon: string;
    colorNavy: string;
    colorGold: string;
    colorCream: string;
  };
  socialLinks: {
    facebook?: string;
    instagram?: string;
    telegram?: string;
    whatsapp?: string;
    tiktok?: string;
  };
  onStart: (initialTab?: 'list' | 'offers' | 'services' | 'whatsapp' | 'decor-showcase' | 'corporate-deals') => void;
  language?: 'ar' | 'en';
  changeLanguage?: (lang: 'ar' | 'en') => void;
  t?: (ar: string, en: string) => string;
}

export default function LandingPage({ 
  brandingSettings, 
  socialLinks, 
  onStart,
  language = 'ar',
  changeLanguage = () => {},
  t = (ar, en) => language === 'ar' ? ar : en
}: LandingPageProps) {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: any = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8 }
    }
  };

  const cardVariants: any = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  return (
    <div className="min-h-screen bg-[#071324] text-white flex flex-col font-sans overflow-x-hidden selection:bg-brand-gold/30 selection:text-white" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background Decorative Radial Gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-gold/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Header / Nav */}
      <header className="w-full max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <span className="text-3xl sm:text-4xl filter drop-shadow-[0_2px_10px_rgba(156,124,69,0.3)]">{brandingSettings.logoIcon || "🏛️"}</span>
          <div className={`flex flex-col ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <h1 className="text-lg sm:text-xl font-serif font-black tracking-tight text-white leading-tight">
              {brandingSettings.logoText || (language === 'ar' ? "شركة البراء النعيمي" : "Al-Baraa Al-Nuaimi Co.")}
            </h1>
            <span className="text-[10px] sm:text-xs font-black text-brand-gold tracking-widest">
              {t("للاستثمارات والتطوير العقاري المتكامل", "For Integrated Real Estate Investments & Development")}
            </span>
          </div>
        </div>

        {/* Dynamic Badge & Language switcher & Dark Mode Toggle */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              const isDark = document.documentElement.classList.toggle('dark');
              localStorage.setItem('app-dark-mode', String(isDark));
            }}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-bold transition-all cursor-pointer text-brand-gold"
            title="تبديل الوضع الليلي والنهاري"
          >
            <span className="dark:hidden flex items-center gap-1"><Moon size={13} /><span>ليلي</span></span>
            <span className="hidden dark:flex items-center gap-1"><Sun size={13} className="text-amber-400" /><span>نهاري</span></span>
          </button>

          <button
            onClick={() => changeLanguage(language === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-bold transition-all cursor-pointer text-brand-gold"
            title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <Globe size={13} />
            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-[10px] sm:text-xs font-bold text-zinc-300">
              {t("الاستشارات والطلبات نشطة حياً", "Live Consultations Active")}
            </span>
          </div>
        </div>
      </header>

      {/* Hero Content Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 z-10 max-w-[1750px] mx-auto w-full">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl space-y-8"
        >
          {/* Subheading Badge */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-xs font-bold shadow-lg">
            <Award size={14} />
            <span>{t("الخيار العقاري الأول والآمن في سورية", "The First & Safe Real Estate Choice in Syria")}</span>
          </motion.div>

          {/* Main Display Typography Headline */}
          <motion.h2 variants={itemVariants} className="text-4xl sm:text-5xl md:text-6xl font-serif font-black text-white leading-tight tracking-tight">
            {t("بوابتكم للامتلاك العقاري والفرص", "Your Gateway to Real Estate Ownership & Guaranteed ")} <span className="text-transparent bg-clip-text bg-gradient-to-l from-brand-gold via-brand-gold-light to-amber-200 drop-shadow-sm">{t("الاستثمارية المضمونة", "Investment Opportunities")}</span>
          </motion.h2>

          {/* Overview / Value Proposition paragraph */}
          <motion.p variants={itemVariants} className="text-sm sm:text-base md:text-lg text-zinc-300 leading-relaxed max-w-3xl mx-auto font-medium">
            {t("نربطكم بأهم المشاريع العقارية والفرص الاستثمارية في كافة أرجاء الجمهورية العربية السورية. نقدم لكم خدمات الوساطة المعتمدة، الرعاية القانونية والاستشارية المتكاملة، وتغطية حية وحصرية للمشاريع قيد الإنجاز بضمانة شركة النعيمي.", "We connect you with major real estate projects and guaranteed investment opportunities across the Syrian Arab Republic. We offer certified brokerage, comprehensive legal & advisory support, and live coverage of ongoing projects, guaranteed by Al-Nuaimi Company.")}
          </motion.p>

          {/* Achievements Grid */}
          <motion.div 
            variants={itemVariants} 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 max-w-4xl mx-auto"
          >
            {[
              { label: t("عقارات متميزة ونخبوية", "Premium Real Estate"), count: "+1,500", icon: <Building2 className="text-brand-gold" size={18} /> },
              { label: t("توثيق قانوني ورعاية كاملة", "Legal Escrow & Verification"), count: "100%", icon: <ShieldCheck className="text-brand-gold" size={18} /> },
              { label: t("وسطاء وشركاء عقاريين", "Brokers & Partners"), count: "+50", icon: <Users className="text-brand-gold" size={18} /> },
              { label: t("تغطية المحافظات السورية", "Syrian Governorates Covered"), count: "14", icon: <MapPin className="text-brand-gold" size={18} /> }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-[1.5rem] flex flex-col items-center justify-center text-center backdrop-blur-md hover:border-brand-gold/20 transition-colors">
                <div className="bg-brand-gold/10 p-2 rounded-xl mb-2">
                  {stat.icon}
                </div>
                <span className="text-xl sm:text-2xl font-black text-brand-gold font-mono">{stat.count}</span>
                <span className="text-[10px] sm:text-xs text-zinc-400 font-bold mt-1">{stat.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Call-to-Actions (Direct Launch Buttons) */}
          <motion.div 
            variants={itemVariants} 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
          >
            <button
              onClick={() => onStart('list')}
              className="w-full sm:w-auto px-8 py-4 bg-brand-gold text-brand-navy hover:bg-brand-gold-light font-bold text-sm sm:text-base rounded-2xl shadow-xl hover:shadow-brand-gold/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>{t("ابدأ استعراض العقارات والمشاريع", "Start Browsing Properties & Projects")}</span>
              <ArrowRight size={18} className={language === 'ar' ? "rotate-180" : ""} />
            </button>

            <button
              onClick={() => onStart('decor-showcase')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500/20 to-brand-gold/20 hover:from-amber-500/30 hover:to-brand-gold/30 border border-brand-gold/40 font-bold text-sm sm:text-base rounded-2xl transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-brand-gold shadow-lg"
            >
              <Palette size={18} />
              <span>{t("معرض الديكور والذكاء الاصطناعي ✨", "AI Decor Gallery & Generator ✨")}</span>
            </button>

            <button
              onClick={() => onStart('corporate-deals')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-900/40 to-slate-800/40 hover:from-blue-900/60 hover:to-slate-800/60 border border-brand-gold/30 font-bold text-sm sm:text-base rounded-2xl transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-white shadow-lg"
            >
              <Briefcase size={18} className="text-brand-gold" />
              <span>{t("قسم الشركات والوفود 🏢", "Companies & Delegations Hub 🏢")}</span>
            </button>

            <button
              onClick={() => onStart('services')}
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/10 font-bold text-sm sm:text-base rounded-2xl transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-white"
            >
              <Briefcase size={18} className="text-brand-gold" />
              <span>{t("الخدمات الاستشارية والقانونية", "Advisory & Legal Services")}</span>
            </button>
          </motion.div>
        </motion.div>

        {/* Highlighted Interactive Categories / Features Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full pt-16"
        >
          {/* Card 1: AI Decor Generator */}
          <motion.div 
            variants={cardVariants}
            whileHover={{ y: -5 }}
            onClick={() => onStart('decor-showcase')}
            className={`bg-gradient-to-b from-brand-gold/10 to-transparent border border-brand-gold/30 p-6 rounded-[2rem] cursor-pointer hover:border-brand-gold transition-all group flex flex-col justify-between h-52 relative overflow-hidden ${language === 'ar' ? 'text-right' : 'text-left'}`}
          >
            <div className="absolute top-2 left-2 bg-brand-gold text-brand-navy font-extrabold text-[10px] px-2 py-0.5 rounded-full">
              {t("جديد بالذكاء الاصطناعي", "AI Powered")}
            </div>
            <div>
              <div className="bg-brand-gold/20 w-10 h-10 rounded-xl flex items-center justify-center text-brand-gold mb-4 group-hover:scale-110 transition-transform">
                <Palette size={20} />
              </div>
              <h3 className="font-serif font-black text-base text-white group-hover:text-brand-gold transition-colors">{t("معرض الديكور والذكاء الاصطناعي", "AI Interior Decor Showcase")}</h3>
              <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                {t("تصفح أحدث صور وتصاميم الديكور الداخلي، أو قم بتوليد تصميم مخصص بالذكاء الاصطناعي لغرفتك واطلب تنفيذه فوراً.", "Browse interior decor showcases or generate custom AI room designs and request immediate execution.")}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-brand-gold mt-4">
              <span>{t("ابدأ الابتكار وتصفح الديكورات", "Explore & Generate AI Decor")}</span>
              <ArrowRight size={12} className={`${language === 'ar' ? 'rotate-180' : ''} group-hover:-translate-x-1 transition-transform`} />
            </div>
          </motion.div>

          {/* Card 2: Exclusive Offers */}
          <motion.div 
            variants={cardVariants}
            whileHover={{ y: -5 }}
            onClick={() => onStart('offers')}
            className={`bg-gradient-to-b from-white/[0.08] to-transparent border border-white/5 p-6 rounded-[2rem] cursor-pointer hover:border-brand-gold/30 transition-all group flex flex-col justify-between h-52 ${language === 'ar' ? 'text-right' : 'text-left'}`}
          >
            <div>
              <div className="bg-brand-gold/10 w-10 h-10 rounded-xl flex items-center justify-center text-brand-gold mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-serif font-black text-base text-white group-hover:text-brand-gold transition-colors">{t("عروض الاستثمار الحصرية", "Exclusive Investment Offers")}</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                {t("اكتشف فرصاً عقارية ممتازة من شقق سكنية ومحلات تجارية مدروسة بعناية لتحقيق أفضل العوائد الاستثمارية في سورية.", "Discover outstanding residential apartments and commercial properties carefully curated for prime investment returns in Syria.")}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-brand-gold mt-4">
              <span>{t("تصفح العروض الآن", "Browse Offers Now")}</span>
              <ArrowRight size={12} className={`${language === 'ar' ? 'rotate-180' : ''} group-hover:-translate-x-1 transition-transform`} />
            </div>
          </motion.div>

          {/* Card 3: Legal Assistance */}
          <motion.div 
            variants={cardVariants}
            whileHover={{ y: -5 }}
            onClick={() => onStart('services')}
            className={`bg-gradient-to-b from-white/[0.08] to-transparent border border-white/5 p-6 rounded-[2rem] cursor-pointer hover:border-brand-gold/30 transition-all group flex flex-col justify-between h-52 ${language === 'ar' ? 'text-right' : 'text-left'}`}
          >
            <div>
              <div className="bg-brand-gold/10 w-10 h-10 rounded-xl flex items-center justify-center text-brand-gold mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-serif font-black text-base text-white group-hover:text-brand-gold transition-colors">{t("الحماية والتوثيق القانوني", "Legal Protection & Escrow")}</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                {t("فريق من الخبراء والمستشارين القانونيين يتولى صياغة العقود وتدقيق الملكيات لضمان أمان معاملاتكم العقارية وتجنب المشاكل.", "A dedicated team of legal experts and advisors handles contract drafting and title audits to guarantee absolute security.")}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-brand-gold mt-4">
              <span>{t("عرض الخدمات المتكاملة", "View Integrated Services")}</span>
              <ArrowRight size={12} className={`${language === 'ar' ? 'rotate-180' : ''} group-hover:-translate-x-1 transition-transform`} />
            </div>
          </motion.div>

          {/* Card 4: Live Consultant Chat */}
          <motion.div 
            variants={cardVariants}
            whileHover={{ y: -5 }}
            onClick={() => onStart('whatsapp')}
            className={`bg-gradient-to-b from-white/[0.08] to-transparent border border-white/5 p-6 rounded-[2rem] cursor-pointer hover:border-brand-gold/30 transition-all group flex flex-col justify-between h-52 ${language === 'ar' ? 'text-right' : 'text-left'}`}
          >
            <div>
              <div className="bg-brand-gold/10 w-10 h-10 rounded-xl flex items-center justify-center text-brand-gold mb-4 group-hover:scale-110 transition-transform">
                <Phone size={20} />
              </div>
              <h3 className="font-serif font-black text-base text-white group-hover:text-brand-gold transition-colors">{t("استشارة مباشرة فورية", "Instant Live Consultation")}</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                {t("تواصل مباشرة مع المستشارين العقاريين لتقديم طلبك المخصص، تتبع معاملتك، أو الإجابة على جميع الاستفسارات.", "Connect directly with on-duty advisors to submit your custom request, track your transaction, or ask any questions.")}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-brand-gold mt-4">
              <span>{t("ابدأ المحادثة عبر واتساب", "Start Chat on WhatsApp")}</span>
              <ArrowRight size={12} className={`${language === 'ar' ? 'rotate-180' : ''} group-hover:-translate-x-1 transition-transform`} />
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer Branding & Social Media Links */}
      <footer className="w-full bg-[#040c17]/80 border-t border-white/5 py-8 mt-12 z-10 backdrop-blur-md">
        <div className="max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className={`space-y-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <p className="text-xs text-zinc-400 font-bold">
              {t("جميع الحقوق محفوظة ©", "All Rights Reserved ©")} {new Date().getFullYear()} {brandingSettings.logoText || (language === 'ar' ? "شركة البراء النعيمي" : "Al-Baraa Al-Nuaimi Co.")}.
            </p>
            <p className="text-[10px] text-zinc-500 font-semibold">
              {t("دمشق، الجمهورية العربية السورية • ترخيص وتوثيق رقم عقاري متميز.", "Damascus, Syrian Arab Republic • Certified & Licensed Real Estate Brokerage.")}
            </p>
          </div>

          <div className="flex gap-4 items-center">
            {socialLinks.whatsapp && (
              <a 
                href={socialLinks.whatsapp} 
                target="_blank" 
                rel="noreferrer" 
                className="bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white p-2 rounded-xl border border-emerald-500/20 transition-all text-xs font-black flex items-center gap-1.5"
              >
                <Phone size={14} />
                <span>{t("الواتساب العقاري", "Real Estate WhatsApp")}</span>
              </a>
            )}
            {socialLinks.facebook && (
              <a 
                href={socialLinks.facebook} 
                target="_blank" 
                rel="noreferrer" 
                className="text-zinc-400 hover:text-white transition-colors text-xs font-bold"
              >
                {t("فيسبوك", "Facebook")}
              </a>
            )}
            {socialLinks.telegram && (
              <a 
                href={socialLinks.telegram} 
                target="_blank" 
                rel="noreferrer" 
                className="text-zinc-400 hover:text-white transition-colors text-xs font-bold"
              >
                {t("تليغرام", "Telegram")}
              </a>
            )}
            {socialLinks.instagram && (
              <a 
                href={socialLinks.instagram} 
                target="_blank" 
                rel="noreferrer" 
                className="text-zinc-400 hover:text-white transition-colors text-xs font-bold"
              >
                {t("إنستغرام", "Instagram")}
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
