import { Property, Service } from './types';

export const DEFAULT_SERVICES: Service[] = [
  {
    id: 's-legal',
    title: 'الاستشارات والتوثيق القانوني العقاري',
    price: '250,000 ل.س',
    description: 'مراجعة وتدقيق سندات الملكية (الطابو)، صياغة عقود البيع والشراء والإيجار بشكل قانوني يضمن حقوق الطرفين، حل النزاعات العقارية، ومساعدة الوسطاء والزبائن في تسيير المعاملات العقارية الرسمية بالمحاكم والدوائر الحكومية السورية.',
    category: 'legal',
    images: [
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1521791136368-1a46827d3ad4?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: '2026-05-10T12:00:00Z'
  },
  {
    id: 's-internet-1',
    title: 'شبكات الإنترنت الفايبر وحلول الاتصالات الذكية',
    price: '450,000 ل.س / تأسيس أولي',
    description: 'تأسيس وتجهيز البنية التحتية لشبكات الإنترنت الفايبر السريع (Fiber Optic)، توزيع مقويات الإشارة والـ Wi-Fi في الفلل والمجمعات السكنية والتجارية، وتصميم أنظمة المنزل الذكي (Smart Home) للتحكم الصوتي وعن بعد بالإضاءة والتكييف والأمن.',
    category: 'internet',
    images: [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1557063673-0493e05d49ef?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: '2026-05-10T12:00:00Z'
  },
  {
    id: 's-const-1',
    title: 'تشييد هيكلي وإكساء داخلي وخارجي (سوپر ديلوكس)',
    price: 'بحسب المتر المربع / تقييم مجاني',
    description: 'بدءاً من أعمال البناء الهيكلي الأولية وحساب الأحمال بالبيتون المسلح، صب الجدران والأساسات الفنية، ووصولاً لأدق تفاصيل التشطيبات والإكساء العصري (الجبس بورد، التمديدات الكهربائية والصحية، ورق الجدران المتطور ورقائق الحجر الحديثة للأبنية والقصور).',
    category: 'construction',
    images: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: '2026-05-10T12:00:00Z'
  }
];

export const PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'فيلا فاخرة في حي يعفور',
    price: '4,200,000,000 ل.س',
    location: 'دمشق، الجمهورية العربية السورية',
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'فيلا مودرن بتصميم عصري في أرقى أحياء دمشق، تتضمن مسبح خاص وإطلالة خلابة.',
    type: 'Residential',
    coordinates: [33.51, 36.12],
    rooms: 6,
    yearBuilt: 2024,
    heatingSystem: "تدفئة أرضية مركزية (شوفاج) على المازوت + منظومة طاقة شمسية ذكية",
    area: 850,
    floors: 3,
    electricityType: "ثلاثي الأطوار (3 فاز) مع محولة خاصة ومنظومة إنفرتر",
    isExclusive: true,
    exclusiveStart: "2026-01-01",
    exclusiveEnd: "2027-01-01",
    exclusiveMarketingDetails: "عقد تسويق حصري ومطلق مع شركة البراء النعيمي للتطوير العقاري. يشمل العقد خدمات التصوير السينمائي الجوي بالطائرات المسيرة (Drone)، جولات افتراضية ثلاثية الأبعاد 3D للمشتري المرتقب، وحملات ترويجية ممولة مكثفة تستهدف رجال الأعمال المغتربين والمهتمين بالاستثمار العقاري الفاخر لضمان أسرع بيع بأعلى عائد مالي قانوني.",
    governorate: 'ريف دمشق',
    hasOffer: true,
    offerExpiresAt: '2026-06-12T18:00:00Z',
    offerPriceOriginal: '4,500,000,000 ل.س',
    classification: 'ready_to_move'
  },
  {
    id: '2',
    title: 'مجمع تجاري - حي الشهباء',
    price: '12,000,000,000 ل.س',
    location: 'حلب، الجمهورية العربية السورية',
    images: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'موقع استراتيجي مثالي للأعمال التجارية الكبرى في قلب مدينة حلب.',
    type: 'Commercial',
    coordinates: [36.21, 37.13],
    rooms: 12,
    yearBuilt: 2021,
    heatingSystem: "تكييف وتدفئة مركزي متطور (Chiller System)",
    area: 2400,
    floors: 5,
    electricityType: "خط ذهبي صناعي معفي من التقنين + مولدة ديزل كاتمة للطوارئ",
    governorate: 'حلب',
    classification: 'investment_offer',
    isPremium: true
  },
  {
    id: '3',
    title: 'أرض زراعية واستثمارية - ريف اللاذقية',
    price: '1,200,000,000 ل.س',
    location: 'اللاذقية، الجمهورية العربية السورية',
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fee74a62?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'أرض واسعة بإطلالة بحرية ساحرة، مثالية لبناء منتجع سياحي أو مزرعة خاصة.',
    type: 'Land',
    coordinates: [35.53, 35.78],
    yearBuilt: 2023,
    heatingSystem: "لا يوجد (أرض مفتوحة صالحة للاستثمار)",
    area: 15000,
    floors: 0,
    electricityType: "منظومة ضخ مياه بالطاقة الشمسية 20 حصان + خط زراعي",
    governorate: 'اللاذقية',
    classification: 'under_construction'
  },
  {
    id: '4',
    title: 'شقة فاخرة - حي المالكي',
    price: '2,500,000,000 ل.س',
    location: 'دمشق، الجمهورية العربية السورية',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'شقة واسعة بتشطيبات سوبر لوكس وإطلالة مميزة على حديقة تشرين.',
    type: 'Residential',
    coordinates: [33.513, 36.275],
    rooms: 4,
    yearBuilt: 2022,
    heatingSystem: "شوفاجات جدارية غاز طبيعي + راديترات إيطالية في كافة الغرف",
    area: 280,
    floors: 1,
    electricityType: "منظومة إنفرتر وبطاريات ليثيوم متكاملة للتشغيل المستمر",
    isExclusive: true,
    exclusiveStart: "2026-03-15",
    exclusiveEnd: "2026-09-15",
    exclusiveMarketingDetails: "تفويض حصري للتسويق المباشر لمدة 6 أشهر. تتميز هذه الشقة بخطة تسويق نوعية تشمل ترويجاً مدفوعاً على منصات التواصل الاجتماعي، واستشارات قانونية مجانية واكتمال السند الطابو الأخضر 1100 سهم جاهز للتسليم الفوري.",
    governorate: 'دمشق',
    hasOffer: true,
    offerExpiresAt: '2026-06-15T21:30:00Z',
    offerPriceOriginal: '2,800,000,000 ل.س',
    classification: 'ready_to_move'
  },
  {
    id: '5',
    title: 'بينتهاوس ملكي فاخر - تنظيم كفرسوسة',
    price: '9,500,000,000 ل.س',
    location: 'دمشق، الجمهورية العربية السورية',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'بينتهاوس طابق كامل حصري وخيالي يقع في أرقى أبراج تنظيم كفرسوسة الجديد، مع تراس بانورامي 360 درجة مطل على جبل قاسيون ومعالم دمشق، مجهز بمصعد خاص مبرمج ببصمة الإصبع وأحدث تفاصيل المنازل الذكية الفاخرة.',
    type: 'Residential',
    coordinates: [33.502, 36.268],
    rooms: 8,
    yearBuilt: 2025,
    heatingSystem: "تدفئة تحت البلاط ذكية على الغاز الطبيعي + تكييف مركزي مخفي VRF بالكامل",
    area: 550,
    floors: 1,
    electricityType: "تغذية كهربائية مجانية مستمرة عبر ألواح شمسية بقدرة 25 كيلو واط مع بطاريات تخزين فوسفاتية",
    isExclusive: true,
    exclusiveStart: "2026-05-01",
    exclusiveEnd: "2027-05-01",
    exclusiveMarketingDetails: "عقد تسويق حصري مطلق ومسجل رسمياً للمستثمرين النخبة. يشمل فرصة حصرية للمعاينة الفورية وتسهيلات قانونية في عملية نقل الملكية المباشرة بالسجل المؤقت.",
    governorate: 'دمشق',
    classification: 'investment_offer',
    isPremium: true
  }
];
