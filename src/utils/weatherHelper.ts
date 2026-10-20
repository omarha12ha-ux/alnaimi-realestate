export interface WeatherInfo {
  condition: 'sunny' | 'rainy' | 'windy' | 'cloudy';
  conditionText: { ar: string; en: string };
  temp: number;
  icon: string;
  description: { ar: string; en: string };
  tips: {
    ar: string[];
    en: string[];
  };
}

// Fixed or generated weather data based on governorate name or date offset
export const WEATHER_CONDITIONS: Record<'sunny' | 'rainy' | 'windy' | 'cloudy', WeatherInfo> = {
  sunny: {
    condition: 'sunny',
    conditionText: { ar: 'مشمس وصافٍ ☀️', en: 'Sunny & Clear ☀️' },
    temp: 35,
    icon: '☀️',
    description: {
      ar: 'أجواء صيفية مشمسة وحارة. ممتازة جداً لمعاينة الإضاءة الطبيعية واختبار كفاءة العزل الحراري والتكييف.',
      en: 'Sunny and hot summer weather. Perfect for inspecting natural lighting and testing thermal insulation and air conditioning efficiency.'
    },
    tips: {
      ar: [
        '☀️ فحص التكييف والتبريد: تأكد من تشغيل المكيفات واختبار تبريدها وجودة التوزيع في الغرف.',
        '☀️ اتجاه أشعة الشمس: عاين اتجاه النوافذ في أوقات الذروة لمعرفة مدى ملاءمة دخول أشعة الشمس.',
        '☀️ العزل والحرارة: اختبر حرارة الجدران الخارجية المعرضة للشمس لتقييم كفاءة المواد العازلة.',
        '☀️ معاينة المناطق الخارجية: تفقد الشرفات، الأسطح، والحدائق المكشوفة بوضوح تحت ضوء النهار.'
      ],
      en: [
        '☀️ Check A/C & Cooling: Ensure air conditioners run efficiently and distribute cooling well in rooms.',
        '☀️ Solar Orientation: Observe window direction during peak hours to estimate solar heat and light entry.',
        '☀️ Insulation Check: Touch exterior-facing walls to evaluate thermal insulation effectiveness.',
        '☀️ Outdoor Inspections: Inspect balconies, roofs, and open yards under clear daylight.'
      ]
    }
  },
  rainy: {
    condition: 'rainy',
    conditionText: { ar: 'ماطر ورطب 🌧️', en: 'Rainy & Humid 🌧️' },
    temp: 16,
    icon: '🌧️',
    description: {
      ar: 'أجواء ماطرة ورطبة. فرصة ذهبية نادرة لفحص العزل المائي للأسقف والتحقق من عدم وجود رطوبة أو نش.',
      en: 'Rainy and humid weather. A rare golden opportunity to inspect roof waterproofing and check for dampness or water leakage.'
    },
    tips: {
      ar: [
        '🌧️ كشف الرطوبة والنش: ابحث بدقة عن أي بقع رطوبة أو تغير في لون الطلاء حول النوافذ والأسقف الجبسية.',
        '🌧️ تصريف مياه الأمطار: تأكد من سلامة مصارف المياه والبلوعات في الشرفات والأسطح وضمان عدم انسدادها.',
        '🌧️ العزل الحراري والتدفئة: اختبر كفاءة احتفاظ العقار بالدفء ومنع تسريب الهواء البارد في الأيام العاصفة.',
        '🌧️ التمديدات الكهربائية والماء: تفقد العدادات ومفاتيح الكهرباء الخارجية وتأكد من عزلها التام عن مياه الأمطار.'
      ],
      en: [
        '🌧️ Check Dampness & Leakage: Carefully inspect ceilings and window frames for damp patches or peeling paint.',
        '🌧️ Rain Drainage: Ensure floor drains in balconies and roofs function properly and are not clogged.',
        '🌧️ Thermal Retention: Evaluate how well the property holds heat and prevents cold drafts on rainy days.',
        '🌧️ Electrical Safety: Check outdoor electrical meters and switches to ensure they are fully sealed from rain.'
      ]
    }
  },
  windy: {
    condition: 'windy',
    conditionText: { ar: 'رياح عاصفة ومغبرة 💨', en: 'Windy & Dusty 💨' },
    temp: 24,
    icon: '💨',
    description: {
      ar: 'أجواء عاصفة ورياح نشطة. مثالية لفحص عزل الألومنيوم والنوافذ للأتربة والأصوات الخارجية.',
      en: 'Windy and active weather. Ideal for checking the sealing of aluminum windows and doors against dust and external noise.'
    },
    tips: {
      ar: [
        '💨 إحكام النوافذ والأبواب: استمع لأي صفير أو اهتزاز في النوافذ للتأكد من جودة عزل المطاط (الكاوتشوك).',
        '💨 عزل الصوت والضوضاء: الرياح القوية تساعد في اختبار كفاءة عزل الزجاج المزدوج (Double-Glaze) للأصوات.',
        '💨 فحص الشتر والأباجورات: تأكد من ثبات الأباجورات الخارجية وعدم تخلخلها أو إصدارها أصواتاً مزعجة.',
        '💨 التهوية والضغط العكسي: اختبر فاعلية مراوح الشفط ومداخن المطابخ عند تفاوت ضغط الهواء.'
      ],
      en: [
        '💨 Window & Door Sealing: Listen for whistling or vibrations in windows to verify rubber gaskets/seals quality.',
        '💨 Sound Insulation: High winds help test the soundproofing efficiency of double-glazed windows.',
        '💨 Shutters & Blinds: Verify that external roller shutters are sturdy, stable, and don’t rattle loudly.',
        '💨 Ventilation & Pressure: Test the effectiveness of exhaust fans and range hoods under wind pressure.'
      ]
    }
  },
  cloudy: {
    condition: 'cloudy',
    conditionText: { ar: 'غائم جزئياً ومعتدل 🌤️', en: 'Partly Cloudy & Mild 🌤️' },
    temp: 22,
    icon: '🌤️',
    description: {
      ar: 'أجواء غائمة جزئياً ومعتدلة الحرارة. مناسبة جداً لمعاينة مريحة وتفقد المظهر الخارجي وحيوية الحي.',
      en: 'Partly cloudy and mild weather. Highly suitable for a comfortable viewing, checking exterior finishes and neighborhood activity.'
    },
    tips: {
      ar: [
        '🌤️ المظهر الخارجي والكسوة: تفقد حالة الحجر الخارجي والطلاء والخرسانة في ظروف إضاءة ناعمة خالية من وهج الشمس الشديد.',
        '🌤️ حيوية الحي والهدوء: تجول في محيط العقار لمعاينة جيرة المنطقة والهدوء العام وتوافر مواقف السيارات المتاحة.',
        '🌤️ الإنارة الاصطناعية: قيّم جودة وتوزيع الإنارة الليد والإنارة المخفية داخل الغرف في ظل غياب أشعة الشمس الساطعة.',
        '🌤️ معاينة الإطلالة: تفقد مدى اتساع وانفتاح إطلالة الشقة من النوافذ والشرفات في طقس صافٍ ومريح.'
      ],
      en: [
        '🌤️ Exterior Cladding: Inspect stone cladding and paint under soft lighting without intense solar glare.',
        '🌤️ Neighborhood Vibe: Walk around to gauge traffic, community quietness, and general parking availability.',
        '🌤️ Artificial Lighting: Assess the distribution and quality of interior light fixtures and false-ceiling LEDs.',
        '🌤️ View Quality: Check the visual clearance and landscape view from balconies under pleasant weather.'
      ]
    }
  }
};

/**
 * Deterministically retrieves a weather state based on governorate and date.
 * This guarantees realism while maintaining stable state for specific dates/places.
 */
export function getWeatherForLocationAndDate(governorate: string = 'دمشق', date: Date = new Date()): WeatherInfo {
  const govClean = governorate.trim();
  const day = date.getDate();
  const month = date.getMonth() + 1; // 1-12
  
  // Coastline (اللاذقية, طرطوس) is more likely to be windy or cloudy/rainy in winter, sunny/humid in summer
  // Desert or hot regions (دير الزور, الحسكة, الرقة) is mostly sunny
  // Capital/Middle (دمشق, حلب, حمص, حماة) is continental
  
  const isCoast = govClean.includes('لاذق') || govClean.includes('طرطوس');
  const isDesert = govClean.includes('زور') || govClean.includes('حسك') || govClean.includes('رقة');
  
  // Hash calculation using date and location
  const hash = (day * 7 + month * 13 + govClean.length) % 100;
  
  let condition: 'sunny' | 'rainy' | 'windy' | 'cloudy' = 'sunny';
  let tempBase = 28;
  
  // Summer season (June, July, August, September)
  if (month >= 5 && month <= 9) {
    if (hash < 10 && !isDesert) {
      condition = 'cloudy';
      tempBase = isCoast ? 29 : 27;
    } else if (hash < 25 && !isDesert) {
      condition = 'windy';
      tempBase = isCoast ? 28 : 31;
    } else {
      condition = 'sunny';
      tempBase = isDesert ? 41 : isCoast ? 33 : 36;
    }
  } 
  // Winter season (December, January, February, March)
  else if (month === 12 || month <= 3) {
    if (hash < 40 || isCoast) {
      condition = 'rainy';
      tempBase = isCoast ? 15 : 10;
    } else if (hash < 70) {
      condition = 'cloudy';
      tempBase = isCoast ? 17 : 13;
    } else {
      condition = 'windy';
      tempBase = 11;
    }
  }
  // Spring/Autumn (April, October, November)
  else {
    if (hash < 25) {
      condition = 'rainy';
      tempBase = 18;
    } else if (hash < 55) {
      condition = 'cloudy';
      tempBase = 22;
    } else if (hash < 75) {
      condition = 'windy';
      tempBase = 21;
    } else {
      condition = 'sunny';
      tempBase = 29;
    }
  }

  // Adjust temperature slightly with deterministic offset
  const tempOffset = (hash % 5) - 2; // -2 to +2
  const finalTemp = tempBase + tempOffset;
  
  const selectedCondition = WEATHER_CONDITIONS[condition];
  return {
    ...selectedCondition,
    temp: finalTemp
  };
}

export interface SmartAdvice {
  bestTimeSlot: string;
  adviceText: string;
  reason: string;
}

export function getSmartRealEstateAdvice(governorate: string = 'دمشق', dateStr: string): SmartAdvice {
  const date = dateStr ? new Date(dateStr) : new Date();
  const weather = getWeatherForLocationAndDate(governorate, date);
  
  if (weather.condition === 'sunny') {
    return {
      bestTimeSlot: '9:00 صباحاً - 11:00 صباحاً أو 4:00 مساءً - 6:00 مساءً',
      adviceText: 'تجنب ساعات الظهيرة الحارة. ننصح بالمعاينة في الصباح الباكر أو بعد العصر لتكون جولة المعاينة مريحة جداً وخالية من الإجهاد الحراري.',
      reason: 'في الأجواء المشمسة والحارة، تفادي ساعات الذروة (12:00 م - 3:00 م) يمنع التعب الشديد عند تفقد الأماكن المكشوفة كالشرفات والحدائق والأسطح. كما تتيح هذه الساعات الهادئة اختبار كفاءة التكييف والعزل الحراري للجدران والأسقف بدقة عالية.'
    };
  } else if (weather.condition === 'rainy') {
    return {
      bestTimeSlot: '11:00 صباحاً - 2:00 بعد الظهر',
      adviceText: 'استغل فترة منتصف النهار لتوفر الإضاءة الطبيعية الكافية واختبار العزل المائي للأسقف والجدران تحت المطر مباشرة.',
      reason: 'الغيوم الداكنة والأمطار تضعف الضوء الطبيعي في العقار. المعاينة في منتصف النهار تضمن لك أفضل كشف بصري للتشطيبات والدهانات، وتعتبر فرصة ذهبية لا مثيل لها للتأكد التام من عدم وجود أي نش أو رطوبة أو تسريب مياه حول النوافذ والأسقف.'
    };
  } else if (weather.condition === 'windy') {
    return {
      bestTimeSlot: '10:00 صباحاً - 1:00 بعد الظهر',
      adviceText: 'توقيت ذهبي لاختبار جودة عزل الزجاج المزدوج للأصوات والأتربة والتحقق من متانة الأباجورات والنوافذ.',
      reason: 'الرياح القوية تساعدك على سماع أي صفير أو تسريب للهواء من أطراف النوافذ وتكشف عن كفاءة العازل المطاطي. اختيار فترة الظهر يتيح لك فحص النوافذ والشتر الخارجي بأمان وبوضوح بصري ممتاز.'
    };
  } else {
    // cloudy or default
    return {
      bestTimeSlot: '11:00 صباحاً - 3:00 بعد الظهر',
      adviceText: 'الأجواء ربيعية ومعتدلة جداً وملائمة للمعاينة طوال اليوم. ننصح بمنتصف النهار لرؤية الإطلالة بكامل رونقها.',
      reason: 'الغيوم الخفيفة تشتت الضوء وتمنح الشقة إضاءة داخلية ناعمة ومنتظمة خالية من الظلال الحادة، وهو ما يساعدك على تقدير مساحات الغرف وجمال الإكساء بدقة، فضلاً عن سهولة الحركة واستعراض المرافق الخارجية بارتياح تام.'
    };
  }
}

