// Comprehensive Translation System for Al-Baraa Al-Nuaimi Real Estate
// نظام الترجمة الشامل لشركة البراء النعيمي للتسويق والاستشارات العقارية

import enLocale from './locales/en.json';

export const EN_TRANSLATIONS_JSON = enLocale;

export interface TranslationDictionary {
  [key: string]: {
    ar: string;
    en: string;
    tr?: string;
    fr?: string;
    es?: string;
    de?: string;
    ru?: string;
    zh?: string;
  };
}

export const APP_TRANSLATIONS: TranslationDictionary = {
  // Navigation & Sections
  nav_home: {
    ar: "الرئيسية",
    en: "Home",
    tr: "Anasayfa",
    fr: "Accueil",
    es: "Inicio",
    de: "Startseite",
    ru: "Главная",
    zh: "首页"
  },
  nav_vip_club: {
    ar: "نادي كبار الشخصيات VIP",
    en: "VIP Club",
    tr: "VIP Kulübü",
    fr: "Club VIP",
    es: "Club VIP",
    de: "VIP-Club",
    ru: "VIP Клуб",
    zh: "VIP俱乐部"
  },
  nav_services: {
    ar: "خدماتنا العقارية والتقنية",
    en: "Services & Tech",
    tr: "Hizmetler ve Teknoloji",
    fr: "Services & Tech",
    es: "Servicios y Tecnología",
    de: "Dienstleistungen & Technik",
    ru: "Услуги и Технологии",
    zh: "服务 & 技术"
  },
  nav_contact: {
    ar: "اتصل بنا",
    en: "Contact Us",
    tr: "Bize Ulaşın",
    fr: "Contactez-nous",
    es: "Contáctenos",
    de: "Kontakt",
    ru: "Контакты",
    zh: "联系我们"
  },
  nav_admin_dashboard: {
    ar: "لوحة تحكم المدير الإدارية",
    en: "Admin Dashboard",
    tr: "Yönetici Paneli",
    fr: "Tableau de Bord Admin",
    es: "Panel de Administración",
    de: "Admin-Dashboard",
    ru: "Панель Администратора",
    zh: "管理后台"
  },
  nav_corporate: {
    ar: "عروض الشركات والمؤسسات",
    en: "Corporate & B2B",
    tr: "Kurumsal ve B2B",
    fr: "Entreprises & B2B",
    es: "Corporativo y B2B",
    de: "Firmenkunden & B2B",
    ru: "Корпоративные сделки",
    zh: "企业 & B2B"
  },

  // Search & Filter
  search_placeholder: {
    ar: "ابحث عن عقار (مدينة، حي، نوع، مواصفات...)",
    en: "Search property (city, district, type, specifications...)",
    tr: "Mülk ara (şehir, mahalle, tip, özellikler...)",
    fr: "Rechercher un bien (ville, quartier, type, spécifications...)",
    es: "Buscar propiedad (ciudad, barrio, tipo, especificaciones...)",
    de: "Immobilie suchen (Stadt, Stadtteil, Typ, Merkmale...)",
    ru: "Поиск недвижимости (город, район, тип, характеристики...)",
    zh: "搜索房产（城市、区域、类型、规格...）"
  },
  filter_all: {
    ar: "الكل",
    en: "All",
    tr: "Hepsi",
    fr: "Tout",
    es: "Todo",
    de: "Alle",
    ru: "Все",
    zh: "全部"
  },
  filter_residential: {
    ar: "سكني",
    en: "Residential",
    tr: "Konut",
    fr: "Résidentiel",
    es: "Residencial",
    de: "Wohnen",
    ru: "Жилая",
    zh: "住宅"
  },
  filter_commercial: {
    ar: "تجاري",
    en: "Commercial",
    tr: "Ticari",
    fr: "Commercial",
    es: "Comercial",
    de: "Gewerbe",
    ru: "Коммерческая",
    zh: "商业"
  },
  filter_agricultural: {
    ar: "زراعي واستثماري",
    en: "Agricultural & Investment",
    tr: "Tarım ve Yatırım",
    fr: "Agricole & Investissement",
    es: "Agrícola e Inversión",
    de: "Landwirtschaft & Investition",
    ru: "Сельхоз и Инвестиции",
    zh: "农业与投资"
  },

  // Property Details Keys
  property_price: {
    ar: "السعر المطلق",
    en: "Price",
    tr: "Fiyat",
    fr: "Prix",
    es: "Precio",
    de: "Preis",
    ru: "Цена",
    zh: "价格"
  },
  property_area: {
    ar: "المساحة الإجمالية",
    en: "Total Area",
    tr: "Toplam Alan",
    fr: "Surface Totale",
    es: "Área Total",
    de: "Gesamtfläche",
    ru: "Общая площадь",
    zh: "总面积"
  },
  property_rooms: {
    ar: "عدد الغرف والصالونات",
    en: "Rooms & Salons",
    tr: "Oda & Salon Sayısı",
    fr: "Pièces & Salons",
    es: "Habitaciones y Salones",
    de: "Zimmer & Salons",
    ru: "Комнат и залов",
    zh: "房间与客厅"
  },
  property_floors: {
    ar: "عدد الطوابق",
    en: "Number of Floors",
    tr: "Kat Sayısı",
    fr: "Nombre d'étages",
    es: "Número de Pisos",
    de: "Anzahl der Etagen",
    ru: "Количество этажей",
    zh: "楼层数"
  },
  property_year_built: {
    ar: "سنة التشييد والبناء",
    en: "Year of Construction",
    tr: "İnşaat Yılı",
    fr: "Année de Construction",
    es: "Año de Construcción",
    de: "Baujahr",
    ru: "Год постройки",
    zh: "建造年份"
  },
  property_heating: {
    ar: "منظومة التدفئة والتبريد",
    en: "Heating & Cooling System",
    tr: "Isıtma ve Soğutma Sistemi",
    fr: "Système de chauffage & clim",
    es: "Sistema de Calefacción y Aire",
    de: "Heiz- & Kühlsystem",
    ru: "Система отопления",
    zh: "供暖与制冷系统"
  },
  property_electricity: {
    ar: "تغذية تيار الكهرباء والإنفرتر",
    en: "Electricity & Inverter Feed",
    tr: "Elektrik ve İnverter Beslemesi",
    fr: "Alimentation électrique & Onduleur",
    es: "Alimentación Eléctrica e Inversor",
    de: "Stromversorgung & Wechselrichter",
    ru: "Электричество и инвертор",
    zh: "电力与逆变器供电"
  },
  property_exclusive: {
    ar: "عقد تسويق حصري ومطلق",
    en: "Exclusive Marketing Contract",
    tr: "Özel Pazarlama Sözleşmesi",
    fr: "Contrat de marketing exclusif",
    es: "Contrato de Marketing Exclusivo",
    de: "Exklusiver Marketingvertrag",
    ru: "Эксклюзивный договор маркетинга",
    zh: "独家营销合同"
  },

  // UI General & Accessibility
  accessibility_title: {
    ar: "بوابة تسهيل الوصول ونشر التطبيق",
    en: "Accessibility & Sharing Hub",
    tr: "Erişilebilirlik ve Paylaşım Merkezi",
    fr: "Centre d'accessibilité et de partage",
    es: "Centro de Accesibilidad y Compartido",
    de: "Barrierefreiheit & Sharing-Hub",
    ru: "Центр специальных возможностей и шаринга",
    zh: "无障碍与共享中心"
  },
  accessibility_desc: {
    ar: "خيارات مخصصة لتحسين قراءة البيانات وتكبير الخط ونشر التطبيق لزيادة الوصول.",
    en: "Custom options to improve text legibility, font size, and application distribution to increase reach.",
    tr: "Metin okunabilirliğini, yazı tipi boyutunu ve erişimi artırmak için uygulama dağıtımını iyileştirme seçenekleri.",
    fr: "Options personnalisées pour améliorer la lisibilité du texte, la taille de police et la diffusion de l'application.",
    es: "Opciones personalizadas para mejorar la legibilidad del texto, el tamaño de fuente y la difusión de la app.",
    de: "Benutzerdefinierte Optionen zur Verbesserung der Textlesbarkeit, Schriftgröße und App-Verbreitung.",
    ru: "Настройки читаемости текста, размера шрифта и распространения приложения для большего охвата.",
    zh: "自定义选项以提高文本易读性、字体大小和应用分发，从而增加覆盖面。"
  },
  font_scaling: {
    ar: "تكبير وتصغير الخط",
    en: "Font Size Scaling",
    tr: "Yazı Tipi Boyutu Ölçeklendirme",
    fr: "Mise à l'échelle de la police",
    es: "Escalado de Tamaño de Fuente",
    de: "Schriftgrößen-Skalierung",
    ru: "Масштабирование размера шрифта",
    zh: "字体大小缩放"
  },
  high_contrast: {
    ar: "تفعيل وضع التباين العالي",
    en: "Enable High Contrast Mode",
    tr: "Yüksek Kontrast Modunu Etkinleştir",
    fr: "Activer le Mode Contraste Élevé",
    es: "Activar el Modo de Alto Contraste",
    de: "Hohen Kontrast aktivieren",
    ru: "Включить режим высокой контрастности",
    zh: "启用高对比度模式"
  },
  speech_assistance: {
    ar: "قارئ النصوص الصوتي التفاعلي",
    en: "Interactive Speech Reader",
    tr: "Etkileşimli Ses Okuyucu",
    fr: "Lecteur audio interactif",
    es: "Lector de voz interactivo",
    de: "Interaktiver Sprachleser",
    ru: "Интерактивный голосовой читатель",
    zh: "交互式语音朗读器"
  },
  share_app_reach: {
    ar: "نشر ومشاركة التطبيق لزيادة الوصول",
    en: "Publish and Share App to Increase Reach",
    tr: "Erişimi Artırmak İçin Uygulamayı Paylaş",
    fr: "Partager l'application pour augmenter la portée",
    es: "Compartir la app para aumentar el alcance",
    de: "App teilen, um Reichweite zu erhöhen",
    ru: "Поделиться приложением для увеличения охвата",
    zh: "发布和分享应用以增加覆盖面"
  },
  download_translations_btn: {
    ar: "تنزيل ملف الترجمة الشامل (JSON)",
    en: "Download Comprehensive Translation File (JSON)",
    tr: "Kapsamlı Çeviri Dosyasını İndir (JSON)",
    fr: "Télécharger le fichier de traduction complet (JSON)",
    es: "Descargar Archivo de Traducción Completo (JSON)",
    de: "Vollständige Übersetzungsdatei herunterladen (JSON)",
    ru: "Скачать полный файл локализации (JSON)",
    zh: "下载完整翻译文件 (JSON)"
  }
};

// Function to get translation by key or fallback
export function tKey(key: string, lang: 'ar' | 'en' = 'ar', fallbackAr?: string, fallbackEn?: string): string {
  if (lang === 'ar') {
    return fallbackAr || APP_TRANSLATIONS[key]?.ar || (enLocale as Record<string, string>)[key] || key;
  }
  return (enLocale as Record<string, string>)[key] || APP_TRANSLATIONS[key]?.en || fallbackEn || fallbackAr || key;
}

// Function to export or trigger download of translation file dynamically
export function downloadTranslationsFile() {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(APP_TRANSLATIONS, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', 'app_translations_all_languages.json');
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function downloadEnglishTranslationsJson() {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(enLocale, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', 'app_translations_en.json');
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
