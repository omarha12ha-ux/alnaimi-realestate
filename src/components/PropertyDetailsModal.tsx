import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Calendar, 
  Star, 
  Trash2, 
  User as UserIcon,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Info,
  Eye,
  Shield,
  TrendingUp,
  Percent,
  Calculator,
  Coins,
  Plus,
  Layers,
  QrCode,
  Copy,
  Check,
  Share2,
  Printer,
  Clock,
  Wrench,
  FileText,
  Mail,
  Download,
  Smartphone,
  ExternalLink,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import QRCode from 'qrcode';

// Custom Social Icons
const WhatsappIcon = ({ size = 18, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 2a10 10 0 0 0-8.544 15.2l-1.385 5.059 5.183-1.358A10 10 0 1 0 12 2zm0 18a7.96 7.96 0 0 1-4.066-1.112l-.292-.173-3.023.792.806-2.946-.19-.303A7.963 7.963 0 1 1 12 20z"/>
  </svg>
);

const FacebookIcon = ({ size = 18, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
  </svg>
);

const XIcon = ({ size = 18, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TelegramIcon = ({ size = 18, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
  </svg>
);

const LinkedinIcon = ({ size = 18, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>
);
import { Property, Review, Broker } from '../types';
import { auth, db, handleFirestoreError } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { cn } from '../lib/utils';
import ThreeSixtyViewer from './ThreeSixtyViewer';
import { 
  CloudSun, 
  CloudRain, 
  Wind, 
  Sun, 
  Thermometer, 
  ShieldAlert 
} from 'lucide-react';
import { getWeatherForLocationAndDate, WEATHER_CONDITIONS, WeatherInfo } from '../utils/weatherHelper';

const ROOM_PRESETS = [
  'الصالة الرئيسيّة',
  'غرفة المعيشة',
  'غرفة نوم رئيسية (ماستر)',
  'غرفة نوم ثانية',
  'المطبخ',
  'الحمام',
  'الشرفة / البلكون',
  'الموزع / الكوريدور',
  'آخر'
];

const getDeterministicTimeline = (propertyId: string) => {
  let hash = 0;
  for (let i = 0; i < propertyId.length; i++) {
    hash += propertyId.charCodeAt(i);
  }
  
  // Offset in months: between -2 and +2 months
  const offsetMonths = (hash % 5) - 2; 
  // Base completion rate: say between 40% and 85%
  const overallProgress = 40 + (hash % 41); // 40% to 80%
  
  const formatDate = (year: number, month: number) => {
    let m = month + offsetMonths;
    let y = year;
    while (m > 12) {
      m -= 12;
      y += 1;
    }
    while (m < 1) {
      m += 12;
      y -= 1;
    }
    const monthsAr = [
      'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
      'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
    ];
    return `${monthsAr[m - 1]} ${y}`;
  };

  const getPhaseStatus = (phaseIndex: number, progress: number) => {
    const thresholds = [15, 35, 55, 70, 85, 100];
    const prevThreshold = phaseIndex === 0 ? 0 : thresholds[phaseIndex - 1];
    const currentThreshold = thresholds[phaseIndex];
    
    if (progress >= currentThreshold) {
      return { status: 'completed', pct: 100 };
    } else if (progress <= prevThreshold) {
      return { status: 'planned', pct: 0 };
    } else {
      const factor = (progress - prevThreshold) / (currentThreshold - prevThreshold);
      return { status: 'in_progress', pct: Math.round(factor * 100) };
    }
  };

  const phasesBase = [
    {
      title: 'أعمال المسح والحفر وتجهيز الموقع والأساسات والردم',
      desc: 'تشمل دراسات التربة الهندسية وتخطيط الأساسات العميقة وعمليات الحفر والردم وتجهيز البنية التحتية الأساسية للموقع.',
      start: { y: 2025, m: 9 },
      end: { y: 2025, m: 11 },
      icon: '🏗️'
    },
    {
      title: 'بناء الهيكل الخرساني والأعمدة والجدران الاستنادية لجميع الطوابق',
      desc: 'صب القواعد والفرشات الأساسية، وبناء الأعمدة والجدران الاستنادية للأقبية والأسقف لجميع الطوابق بمطابقة الكود الزلزالي السوري.',
      start: { y: 2025, m: 11 },
      end: { y: 2026, m: 2 },
      icon: '🧱'
    },
    {
      title: 'أعمال التقطيع والتلبيس الحجري للجدران والواجهات الخارجية',
      desc: 'بناء جدران الطوب والتقطيعات الداخلية مع تلبيس الواجهات الخارجية بالحجر الطبيعي المميز المقاوم للعوامل الجوية الصعبة.',
      start: { y: 2026, m: 2 },
      end: { y: 2026, m: 5 },
      icon: '📐'
    },
    {
      title: 'التمديدات الكهربائية والصحية وتأسيس شبكات الخدمات الأساسية والإنترنت',
      desc: 'تمديد ممرات الصرف وتوصيلات المياه النظيفة، شبكات الكهرباء والإنترنت والاتصالات، وخطوط التدفئة المركزية المسبقة.',
      start: { y: 2026, m: 5 },
      end: { y: 2026, m: 8 },
      icon: '⚡'
    },
    {
      title: 'أعمال اللّياسة (التوريق) والدهانات والتشطيبات الفاخرة للغرف',
      desc: 'إكساء الجدران والأسقف باللياسة والدهانات الإيبوكسية، مع تركيب السيراميك والرخام، النوافذ والأبواب الخشبية الفاخرة.',
      start: { y: 2026, m: 8 },
      end: { y: 2026, m: 11 },
      icon: '🎨'
    },
    {
      title: 'المطابقة والترخيص الفني وتسليم المفاتيح الفعلي للمشتركين',
      desc: 'الفحص والتدقيق الفني النهائي من المهندس المشرف المعتمد، مطابقة تراخيص نقابة المهندسين السوريين، وتسليم الشقق جاهزة تماماً للسكن.',
      start: { y: 2026, m: 11 },
      end: { y: 2027, m: 1 },
      icon: '🔑'
    }
  ];

  const phases = phasesBase.map((p, idx) => {
    const { status, pct } = getPhaseStatus(idx, overallProgress);
    return {
      title: p.title,
      desc: p.desc,
      startDate: formatDate(p.start.y, p.start.m),
      endDate: formatDate(p.end.y, p.end.m),
      icon: p.icon,
      status: status as 'completed' | 'in_progress' | 'planned',
      progress: pct
    };
  });

  let finalYear = 2027;
  let finalMonth = 1 + offsetMonths;
  while (finalMonth > 12) {
    finalMonth -= 12;
    finalYear += 1;
  }
  while (finalMonth < 1) {
    finalMonth += 12;
    finalYear -= 1;
  }
  
  const completionDate = new Date(finalYear, finalMonth - 1, 1);
  const now = new Date(2026, 6, 1); // Mock 2026-07-01
  const diffTime = completionDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    phases,
    overallProgress,
    daysLeft: diffDays > 0 ? diffDays : 0,
    completionDateStr: formatDate(finalYear, finalMonth)
  };
};

interface PropertyDetailsModalProps {
  property: Property;
  onClose: () => void;
  onBook: () => void;
  currentUser: any;
  userProfile: any;
  displayCurrency?: 'SYP' | 'USD';
  exchangeRate?: number;
  onReviewSubmitted?: () => void; // Optional callback to update state in main app if needed
  language?: 'ar' | 'en';
}

export default function PropertyDetailsModal({
  property,
  onClose,
  onBook,
  currentUser,
  userProfile,
  displayCurrency = 'SYP',
  exchangeRate = 15000,
  onReviewSubmitted,
  language = 'ar'
}: PropertyDetailsModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // Weather & viewing advice state derived deterministically
  const today = new Date();
  const defaultWeather = getWeatherForLocationAndDate(property.governorate || 'دمشق', today);
  const [activeWeatherCondition, setActiveWeatherCondition] = useState<'sunny' | 'rainy' | 'windy' | 'cloudy'>(defaultWeather.condition);

  // Sync state if property changes
  useEffect(() => {
    setActiveWeatherCondition(defaultWeather.condition);
  }, [property]);

  const currentWeatherInfo = WEATHER_CONDITIONS[activeWeatherCondition];
  const currentTemp = activeWeatherCondition === defaultWeather.condition ? defaultWeather.temp : WEATHER_CONDITIONS[activeWeatherCondition].temp;
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'tour'>('details');
  const [tourViewType, setTourViewType] = useState<'gallery' | '360'>('360');

  // Construction Timeline States
  const [isTimelineSimulatorActive, setIsTimelineSimulatorActive] = useState(false);
  const [simulatedPhasesCount, setSimulatedPhasesCount] = useState<number>(3); // 0 to 6 completed phases
  const [expandedPhaseIndex, setExpandedPhaseIndex] = useState<number | null>(null);
  const [faqOpenStates, setFaqOpenStates] = useState<{ [key: string]: boolean }>({});

  const toggleFaq = (key: string) => {
    setFaqOpenStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // QR Code and Share States
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedFacebookPost, setCopiedFacebookPost] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    setCurrentImageIndex(0);
    setActiveTab('details');
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}${window.location.pathname}?propertyId=${property.id}`;
      setShareLink(shareUrl);
      QRCode.toDataURL(shareUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#0A192F', // Deep brand navy
          light: '#FFFFFF'
        }
      })
      .then(url => {
        setQrCodeDataUrl(url);
      })
      .catch(err => {
        console.error("Error generating QR code:", err);
      });
    }
  }, [property.id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  const [copiedPlatformPost, setCopiedPlatformPost] = useState<string | null>(null);
  const [isPreparingNativeShare, setIsPreparingNativeShare] = useState(false);
  const [downloadedImageSuccess, setDownloadedImageSuccess] = useState(false);

  const handleCopyProfessionalPost = (platformName: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPlatformPost(platformName);
      setTimeout(() => setCopiedPlatformPost(null), 3500);
    });
  };

  // Helper to convert image URL / Data URI to a File object for Native Sharing
  const urlOrDataUriToFile = async (dataOrUrl: string, filename: string): Promise<File | null> => {
    try {
      if (dataOrUrl.startsWith('data:')) {
        const arr = dataOrUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
      } else {
        const response = await fetch(dataOrUrl);
        const blob = await response.blob();
        const mime = blob.type || 'image/jpeg';
        return new File([blob], filename, { type: mime });
      }
    } catch (err) {
      console.error('Error converting image to File:', err);
      return null;
    }
  };

  const handleDownloadPropertyImage = async () => {
    const primaryImg = property.images && property.images.length > 0 ? property.images[0] : null;
    if (!primaryImg) return;
    try {
      const file = await urlOrDataUriToFile(primaryImg, `property-${property.id || 'image'}.jpg`);
      if (file) {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = `صورة_عقار_${(property.title || 'منشور').replace(/[\s/]/g, '_')}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloadedImageSuccess(true);
        setTimeout(() => setDownloadedImageSuccess(false), 3000);
      } else {
        window.open(primaryImg, '_blank');
      }
    } catch (e) {
      console.error('Failed to download image:', e);
      window.open(primaryImg, '_blank');
    }
  };

  const handleCopyPostAndDownloadImage = async (platformName: string, text: string) => {
    handleCopyProfessionalPost(platformName, text);
    await handleDownloadPropertyImage();
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      setIsPreparingNativeShare(true);
      try {
        const primaryImg = property.images && property.images.length > 0 ? property.images[0] : null;
        const shareText = `🏡 *${property.title}*\n📍 الموقع: ${property.location}\n💵 السعر: ${property.price}\n\nتصفح كامل تفاصيل وصور هذا العقار المميز عبر منصة البراء العقارية:\n${shareLink}`;
        let shareData: ShareData = {
          title: property.title,
          text: shareText,
          url: shareLink,
        };

        if (primaryImg) {
          const imageFile = await urlOrDataUriToFile(primaryImg, `property-${property.id || 'main'}.jpg`);
          if (imageFile) {
            if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
              shareData.files = [imageFile];
            }
          }
        }

        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') {
          console.log('User cancelled or failed native share', err);
        }
      } finally {
        setIsPreparingNativeShare(false);
      }
    } else {
      handleCopyLink();
    }
  };

  const formatPrice = (priceStr: string, currency: 'SYP' | 'USD', rate: number): string => {
    if (!priceStr) return '';
    const cleanStr = priceStr.replace(/[^\d]/g, '');
    const parsed = parseInt(cleanStr, 10);
    if (isNaN(parsed) || parsed === 0) return priceStr;
    if (currency === 'SYP') {
      return parsed.toLocaleString('en-US') + ' ل.س';
    } else {
      const usdValue = Math.round(parsed / rate);
      return '$' + usdValue.toLocaleString('en-US');
    }
  };

  // ROI Calculator States (only utilized when property is commercial)
  const isCommercial = property.type === 'Commercial';
  const numericPrice = (() => {
    if (!property.price) return 0;
    // Remove all non-digit characters
    const clean = property.price.replace(/[^\d]/g, '');
    return clean ? parseInt(clean, 10) : 0;
  })();

  const [investmentInput, setInvestmentInput] = useState<string>('');
  const [expectedYieldRate, setExpectedYieldRate] = useState<number>(8.5); // Default expected ROI is 8.5%
  
  // State for Area Calculator (حاسبة المساحة الصافية المتوفرة)
  const [roomsList, setRoomsList] = useState<{ id: string; name: string; width: string; length: string }[]>([
    { id: 'r1', name: 'الصالة الرئيسيّة', width: '4.5', length: '5' },
    { id: 'r2', name: 'غرفة النوم الأولى', width: '4', length: '4' },
    { id: 'r3', name: 'المطبخ', width: '3', length: '3' }
  ]);
  const [wallDeductionPercent, setWallDeductionPercent] = useState<number>(10);

  const addRoom = () => {
    const newId = 'r-' + Date.now();
    setRoomsList(prev => [...prev, { id: newId, name: 'غرفة إضافية', width: '3.5', length: '4' }]);
  };

  const removeRoom = (id: string) => {
    setRoomsList(prev => prev.filter(r => r.id !== id));
  };

  const updateRoom = (id: string, field: 'name' | 'width' | 'length', value: string) => {
    setRoomsList(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  useEffect(() => {
    if (isCommercial && numericPrice > 0) {
      setInvestmentInput(numericPrice.toString());
    }
  }, [property.id, isCommercial, numericPrice]);

  // States for Assigned Broker in Property details
  const [assignedBroker, setAssignedBroker] = useState<Broker | null>(null);
  const [loadingBroker, setLoadingBroker] = useState(true);

  useEffect(() => {
    const fetchBroker = async () => {
      setLoadingBroker(true);
      try {
        if (property.brokerId) {
          const bDoc = await getDoc(doc(db, 'brokers', property.brokerId));
          if (bDoc.exists()) {
            setAssignedBroker({ id: bDoc.id, ...bDoc.data() } as Broker);
            setLoadingBroker(false);
            return;
          }
        }
        
        // Fallback: pick a broker from the Firestore active brokers collection consistently
        const brokersSnap = await getDocs(collection(db, 'brokers'));
        const activeBrokers: Broker[] = [];
        brokersSnap.forEach(d => {
          const brokerData = d.data() as Broker;
          if (brokerData.status === 'active' || !brokerData.status) {
            activeBrokers.push({ id: d.id, ...brokerData });
          }
        });

        if (activeBrokers.length > 0) {
          let charSum = 0;
          for (let i = 0; i < (property.id || '').length; i++) {
            charSum += (property.id || '').charCodeAt(i);
          }
          const chosenIndex = charSum % activeBrokers.length;
          setAssignedBroker(activeBrokers[chosenIndex]);
        }
      } catch (err) {
        console.error("Error fetching broker for property modal:", err);
      } finally {
        setLoadingBroker(false);
      }
    };

    fetchBroker();
  }, [property.id, property.brokerId]);
  
  // New review form states
  const [rating, setRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch reviews for this specific property
  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const reviewsRef = collection(db, 'properties', property.id, 'reviews');
      const q = query(reviewsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const loadedReviews: Review[] = [];
      querySnapshot.forEach((docSnap) => {
        loadedReviews.push({
          id: docSnap.id,
          ...(docSnap.data() as any)
        } as Review);
      });
      setReviews(loadedReviews);
    } catch (e) {
      console.error("Error fetching reviews:", e);
      // Fallback or handle error gracefully without crashing the details view
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [property.id]);

  const handleNextImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const handlePrevImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  // Double check if the user has already reviewed
  const hasUserAlreadyReviewed = reviews.some(r => r.userId === currentUser?.uid);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!currentUser) {
      setFormError('يرجى تسجيل الدخول أولاً لتتمكن من إضافة تقييمك.');
      return;
    }

    if (hasUserAlreadyReviewed) {
      setFormError('لقد قمت بالفعل بإضافة تقييم لهذا العقار سابقاً. يمكنك حذف تقييمك القديم وإعادة الكتابة.');
      return;
    }

    if (!feedback.trim()) {
      setFormError('يرجى كتابة تعليق أو ملاحظة تشرح تقييمك للعقار.');
      return;
    }

    setSubmittingReview(true);

    try {
      const reviewPayload = {
        userId: currentUser.uid,
        userName: userProfile?.name || 'مستشار البراء العقاري',
        rating: rating,
        feedback: feedback.trim(),
        createdAt: new Date().toISOString()
      };

      const reviewsRef = collection(db, 'properties', property.id, 'reviews');
      await addDoc(reviewsRef, reviewPayload);

      setFormSuccess('تمت إضافة تقييمك بنجاح! شكراً لمشاركتك.');
      setFeedback('');
      setRating(5);
      
      // Re-fetch reviews to update the list immediately
      await fetchReviews();
      
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error: any) {
      console.error("Error submitting review:", error);
      setFormError('فشلت عملية حفظ التقييم. الرجاء التحقق من اتصال شبكتك والمحاولة لاحقاً.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف تقييمك ورأيك عن هذا العقار؟')) {
      return;
    }

    try {
      const reviewDocRef = doc(db, 'properties', property.id, 'reviews', reviewId);
      await deleteDoc(reviewDocRef);
      
      // Update local state directly for responsive feedback
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      setFormSuccess('تم حذف تقييمك بنجاح.');
      
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert('حدث خطأ أثناء محاولة حذف التقييم.');
    }
  };

  // Compute calculated rating averages
  const reviewsCount = reviews.length;
  const averageRating = reviewsCount > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(1)
    : '0.0';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 transition-all" dir="rtl">
      {/* Dark Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-navy/80 backdrop-blur-md"
        id="modal-overlay"
      />

      {/* Main Content Modal Container */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        className="relative property-details-view bg-brand-cream w-full max-w-5xl rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] shadow-2xl overflow-y-auto max-h-[95vh] sm:max-h-[90vh] flex flex-col scrollbar-thin text-right"
        id="property-details-container"
      >
        {/* Banner with Close Button */}
        <div className="sticky top-0 z-10 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center bg-white/90 backdrop-blur-md px-3 py-3 sm:px-8 sm:py-5 border-b border-brand-navy/10">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 order-2 sm:order-1">
            <span className="text-brand-gold font-bold bg-brand-navy/5 px-3.5 py-1 rounded-xl text-xs sm:text-sm border border-brand-gold/10">
              {formatPrice(property.price, displayCurrency, exchangeRate)}
            </span>
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1.5 border border-emerald-100 shadow-sm">
              <Eye size={12} className="text-emerald-500 animate-pulse" />
              <span>{property.views || 0} مشاهدة</span>
            </span>
            <span className="bg-brand-navy/80 text-brand-gold px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold font-serif shadow-sm">
              {property.type === 'Residential' ? 'سكني' : property.type === 'Commercial' ? 'تجاري' : 'أراضي'}
            </span>
            <span className={cn(
              "px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-sm border transition-all duration-300",
              (property.status || 'available') === 'sold'
                ? "bg-red-100 text-red-600 border-red-200"
                : (property.status || 'available') === 'reserved'
                ? "bg-amber-100 text-amber-700 border-amber-200"
                : "bg-emerald-100 text-emerald-700 border-emerald-200"
            )}>
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                (property.status || 'available') === 'sold' ? "bg-red-500 animate-pulse" : (property.status || 'available') === 'reserved' ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-ping"
              )} />
              {(property.status || 'available') === 'sold' ? 'مباع' : (property.status || 'available') === 'reserved' ? 'محجوز' : 'متاح'}
            </span>
          </div>
          
          <div className="flex justify-between items-center w-full sm:w-auto order-1 sm:order-2 gap-3">
            <div className="flex items-center gap-2 truncate">
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="group relative inline-flex items-center gap-2 px-3.5 sm:px-4.5 py-2 bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold text-brand-navy hover:text-brand-navy font-serif font-black text-xs sm:text-sm rounded-xl shadow-md hover:shadow-xl hover:shadow-brand-gold/30 border border-brand-gold/50 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 cursor-pointer shrink-0 overflow-hidden"
                id="header-share-button"
                title="مشاركة العقار"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                <Share2 size={15} className="text-brand-navy group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 shrink-0" />
                <span className="hidden sm:inline font-serif font-black tracking-wide">مشاركة</span>
              </button>
              <h3 className="font-serif text-lg sm:text-2xl font-black text-brand-navy truncate">
                {property.title}
              </h3>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 sm:p-2 text-brand-navy/60 hover:text-brand-navy hover:bg-brand-navy/5 rounded-full transition-colors cursor-pointer shrink-0"
              id="modal-close-button"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 flex-grow">
          {/* Tabs header for premium/VIP properties */}
          {property.isPremium && (
            <div className="flex border-b border-brand-navy/10 pb-1 mb-6 gap-2" id="property-modal-tabs">
              <button
                onClick={() => setActiveTab('details')}
                className={cn(
                  "px-6 py-3 font-serif font-bold text-sm sm:text-base border-b-2 transition-all cursor-pointer flex items-center gap-2 outline-none",
                  activeTab === 'details'
                    ? "border-brand-gold text-brand-navy scale-102 font-black"
                    : "border-transparent text-brand-navy/50 hover:text-brand-navy hover:scale-101"
                )}
                id="tab-details"
              >
                <span>📝</span>
                <span>تفاصيل ومواصفات العقار</span>
              </button>
              <button
                onClick={() => setActiveTab('tour')}
                className={cn(
                  "px-6 py-3 font-serif font-bold text-sm sm:text-base border-b-2 transition-all cursor-pointer flex items-center gap-2 outline-none",
                  activeTab === 'tour'
                    ? "border-brand-gold text-brand-navy scale-102 font-black"
                    : "border-transparent text-brand-navy/50 hover:text-brand-navy hover:scale-101"
                )}
                id="tab-tour"
              >
                <span>🌌</span>
                <span>جولة معاينة افتراضية 360°</span>
                <span className="bg-brand-gold text-brand-navy text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse uppercase leading-none">VIP</span>
              </button>
            </div>
          )}

          {activeTab === 'details' ? (
            <>
              {/* Top Section: Carousel & Core Info */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Image Carousel (12 cols on mobile, 7 cols on desktop) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative h-64 sm:h-96 w-full rounded-3xl overflow-hidden shadow-lg border border-brand-navy/10 bg-brand-navy/5">
                {property.images && property.images.length > 0 ? (
                  <>
                    <img 
                      src={property.images[currentImageIndex]} 
                      alt={`${property.title} - ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Carousel Controls */}
                    {property.images.length > 1 && (
                      <>
                        <button 
                          onClick={handlePrevImage} 
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
                        >
                          <ChevronRight size={20} />
                        </button>
                        <button 
                          onClick={handleNextImage} 
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
                        >
                          <ChevronLeft size={20} />
                        </button>

                        {/* Image Indicator Dots */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                          {property.images.map((_, idx) => (
                            <span 
                              key={idx} 
                              className={cn(
                                "w-2 h-2 rounded-full transition-all",
                                currentImageIndex === idx ? "bg-brand-gold w-4" : "bg-white/60"
                              )} 
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex bg-brand-navy/5 w-full h-full justify-center items-center">لا توجد صور متوفرة</div>
                )}
              </div>

              {/* Thumbnails */}
              {property.images && property.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1 max-w-full justify-start scrollbar-thin">
                  {property.images.map((imgUrl, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={cn(
                        "relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer",
                        currentImageIndex === idx ? "border-brand-gold scale-105" : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <img src={imgUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Core Quick Facts (5 cols on desktop) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6 bg-white p-6 rounded-3xl border border-brand-navy/5 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-brand-navy/5 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={cn(
                        "group flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 border shadow-sm cursor-pointer active:scale-95 hover:-translate-y-0.5",
                        copiedLink
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-emerald-500/10"
                          : "bg-white hover:bg-brand-gold/10 text-brand-navy border-gray-200 hover:border-brand-gold/40 hover:text-brand-gold"
                      )}
                      title="نسخ رابط العقار"
                    >
                      {copiedLink ? <Check size={16} className="text-emerald-600 shrink-0 animate-bounce" /> : <Copy size={16} className="shrink-0 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowShareModal(true)}
                      className="group relative inline-flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-brand-navy via-[#1F374C] to-brand-navy text-brand-gold hover:text-white font-serif font-bold text-xs rounded-xl shadow-md hover:shadow-lg hover:shadow-brand-gold/20 border border-brand-gold/30 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 cursor-pointer overflow-hidden"
                      id="quick-share-button"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-brand-gold/0 via-brand-gold/20 to-brand-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                      <Share2 size={15} className="text-brand-gold group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 shrink-0" />
                      <span className="font-bold">مشاركة</span>
                    </button>
                  </div>
                  <span className="text-brand-gold font-bold tracking-widest text-xs font-serif uppercase">بطاقة معلومات العقار</span>
                </div>
                <h4 className="font-serif text-2xl font-bold text-brand-navy leading-snug">{property.title}</h4>
                
                {/* Location Fact */}
                <div className="flex items-center gap-3 text-brand-navy/80 text-sm font-semibold justify-end border-b border-brand-navy/5 pb-3">
                  <span>{property.location}</span>
                  <MapPin size={18} className="text-brand-gold" />
                </div>

                {/* Classification Fact */}
                {property.classification && (
                  <div className="flex items-center gap-3 text-brand-navy/80 text-sm font-semibold justify-end border-b border-brand-navy/5 pb-3">
                    <span className={cn(
                      "font-bold px-2.5 py-0.5 rounded-lg text-xs border",
                      property.classification === 'under_construction'
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : property.classification === 'ready_to_move'
                        ? "bg-blue-50 text-blue-800 border-blue-200"
                        : "bg-red-50 text-red-800 border-red-200"
                    )}>
                      {property.classification === 'under_construction' ? 'تحت الإنشاء 👷'
                       : property.classification === 'ready_to_move' ? 'جاهز للسكن 🔑'
                       : 'عروض استثمارية مميزة 💎'}
                    </span>
                    <span className="text-brand-navy/60 text-xs text-right">تصنيف العقار</span>
                    <span className="text-lg">🏷️</span>
                  </div>
                )}

                {/* Rooms/Beds count */}
                {property.rooms !== undefined && property.rooms > 0 && (
                  <div className="flex items-center gap-3 text-brand-navy/80 text-sm font-semibold justify-end border-b border-brand-navy/5 pb-3">
                    <span>{property.rooms} {property.rooms === 1 ? 'غرفة' : property.rooms === 2 ? 'غرفتين' : `${property.rooms} غرف`}</span>
                    <span className="text-lg">🛏️</span>
                  </div>
                )}

                {/* Star rating summaries */}
                <div className="flex items-center gap-3 text-brand-navy/80 text-sm font-semibold justify-end border-b border-brand-navy/5 pb-3">
                  {reviewsCount > 0 ? (
                    <div className="flex items-center gap-1.5" dir="ltr">
                      <span className="text-brand-navy/40 text-xs font-bold">({reviewsCount} تقييم)</span>
                      <span className="text-brand-navy font-bold">{averageRating}</span>
                      <div className="flex text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            size={16} 
                            className={cn(
                              "fill-current", 
                              i < Math.floor(parseFloat(averageRating)) ? "text-amber-500" : "text-gray-200"
                            )} 
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-brand-navy/50 text-xs font-bold">لا يوجد تقييمات بعد</span>
                  )}
                  <span className="text-sm font-semibold">المعدل العام للتقييم:</span>
                </div>

                {/* Real Estate Broker Responsible section with Gold/Silver badges */}
                <div className="border-t border-brand-navy/5 pt-4 mt-2 space-y-3">
                  <div className="text-right flex flex-col gap-1">
                    <span className="text-brand-gold font-bold tracking-widest text-[10px] font-serif uppercase">المستشار العقاري المتابع لحجزك</span>
                  </div>
                  {loadingBroker ? (
                    <div className="flex items-center justify-center py-2">
                      <div className="w-5 h-5 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : assignedBroker ? (
                    (() => {
                      const ratingVal = assignedBroker.rating || 5.0;
                      const dealsVal = assignedBroker.dealsCount || 0;
                      let rankStyle = {
                        badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                        badgeText: 'وسيط عادي',
                        emoji: '👤'
                      };
                      if (dealsVal >= 10 && ratingVal >= 4.5) {
                        rankStyle = {
                          badge: 'bg-amber-50 text-[#b58a2e] border-brand-gold/30 font-black animate-pulse shadow-sm shadow-brand-gold/5',
                          badgeText: 'وسيط ذهبي 🏅',
                          emoji: '🏆'
                        };
                      } else if (dealsVal >= 5 && ratingVal >= 4.0) {
                        rankStyle = {
                          badge: 'bg-zinc-50 text-zinc-600 border-zinc-200 font-extrabold',
                          badgeText: 'وسيط فضي 🥈',
                          emoji: '⭐️'
                        };
                      } else {
                        rankStyle = {
                          badge: 'bg-blue-50/30 text-brand-navy/60 border-brand-navy/10 font-bold',
                          badgeText: 'وسيط برونزي 🥉',
                          emoji: '👤'
                        };
                      }

                      return (
                        <div className="bg-brand-cream/10 p-4 rounded-2xl border border-brand-navy/5 flex items-center justify-between gap-4 transition-all hover:bg-brand-cream/20">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-navy/10 flex items-center justify-center text-lg shadow-inner">
                              {rankStyle.emoji}
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1.5 flex-row-reverse justify-end">
                                <h5 className="font-bold text-brand-navy text-sm">{assignedBroker.name}</h5>
                                <span className={cn(
                                  "px-2 py-0.5 rounded-lg text-[9px] border inline-flex items-center",
                                  rankStyle.badge
                                )}>
                                  {rankStyle.badgeText}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-400 mt-0.5" dir="rtl">
                                📞 {assignedBroker.phone} • ⭐ {ratingVal.toFixed(1)} ({dealsVal} صفقات ناجحة)
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-xs text-zinc-400 text-center py-2">لا يوجد مستشار محدد لهذا العقار حالياً.</p>
                  )}
                </div>
              </div>

              {/* Weather & Viewing Tips Widget */}
              <div className="bg-white p-5 rounded-3xl border border-brand-navy/10 space-y-4 text-right">
                <div className="flex items-center justify-between flex-row-reverse">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{currentWeatherInfo.icon}</span>
                    <div className="text-right">
                      <h4 className="text-xs font-black text-brand-navy">
                        {language === 'ar' ? 'مستشار المعاينة الجوية الذكي' : 'Smart Weather View Advisor'}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-bold">
                        {language === 'ar' ? `طقس ${property.governorate || 'دمشق'} اليوم` : `Today's Weather in ${property.governorate || 'Damascus'}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-sm bg-brand-navy/5 text-brand-navy px-2.5 py-1 rounded-xl border border-brand-navy/10">
                    <span className="font-extrabold">{currentTemp}°C</span>
                  </div>
                </div>

                <div className="bg-brand-cream/20 p-3.5 rounded-2xl text-[11px] font-semibold text-brand-navy/80 leading-relaxed">
                  <p>{language === 'ar' ? currentWeatherInfo.description.ar : currentWeatherInfo.description.en}</p>
                </div>

                {/* Weather Mode Selector Tabs */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-extrabold text-zinc-400 block mb-1">
                    {language === 'ar' ? '💡 محاكاة الحالة الجوية لاستكشاف نصائح المعاينة التخصصية:' : '💡 Simulate weather conditions for specific advice:'}
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['sunny', 'rainy', 'windy', 'cloudy'] as const).map((cond) => {
                      const isActive = activeWeatherCondition === cond;
                      const condData = WEATHER_CONDITIONS[cond];
                      return (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => setActiveWeatherCondition(cond)}
                          className={cn(
                            "py-1.5 rounded-xl border text-[11px] flex flex-col items-center justify-center transition-all cursor-pointer",
                            isActive 
                              ? "bg-brand-navy border-brand-navy text-brand-gold shadow-sm font-bold" 
                              : "bg-zinc-50 border-zinc-100 text-zinc-500 hover:bg-zinc-100 hover:border-zinc-200"
                          )}
                        >
                          <span className="text-sm">{condData.icon}</span>
                          <span className="text-[8px] mt-0.5">{language === 'ar' ? condData.conditionText.ar.split(' ')[0] : condData.conditionText.en.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tips Bullet Points */}
                <div className="space-y-2 border-t border-brand-navy/5 pt-3.5">
                  <h5 className="text-[10px] font-extrabold text-brand-gold uppercase tracking-wider">
                    {language === 'ar' ? '⚠️ أهم نصائح المعاينة الميدانية لهذه الحالة:' : '⚠️ Key Viewing Tips for this Condition:'}
                  </h5>
                  <ul className="space-y-2">
                    {(language === 'ar' ? currentWeatherInfo.tips.ar : currentWeatherInfo.tips.en).map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[10px] font-bold text-brand-navy/90 leading-relaxed">
                        <span className="text-amber-500 shrink-0 text-[11px]">✦</span>
                        <span className="text-right">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Direct Booking Link Button */}
              <button 
                onClick={onBook}
                className="w-full py-4 bg-brand-navy text-brand-gold rounded-2xl font-bold hover:bg-brand-gold hover:text-brand-navy transition-all shadow-md shadow-brand-navy/10 flex items-center justify-center gap-3 mt-4"
                id="modal-book-now-button"
              >
                <Calendar size={20} />
                حجز موعد معاينات الميدانية
              </button>
            </div>
          </div>

          {/* ROI Calculator Section (Only for Commercial Properties) */}
          {isCommercial && numericPrice > 0 && (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-brand-navy/5 shadow-sm text-right space-y-6" id="roi-calculator-section">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-navy/5 pb-4">
                <span className="text-xs bg-brand-gold/10 text-brand-navy font-bold px-3 py-1.5 rounded-xl border border-brand-gold/20 flex items-center gap-1.5">
                  <Calculator size={14} className="text-brand-gold" />
                  <span>مستشار العائد العقاري</span>
                </span>
                <h4 className="font-serif text-xl font-bold text-brand-navy flex items-center gap-2">
                  <span>حاسبة العائد الاستثماري لمشروعك</span>
                  <TrendingUp size={20} className="text-brand-gold" />
                </h4>
              </div>

              <p className="text-brand-navy/70 text-xs sm:text-sm leading-relaxed font-semibold">
                هذا العقار تجاري وممتاز للاستثمار طويل المدى. استخدم هذه الحاسبة التفاعلية لتقدير العائد المالي السنوي والشهري المتوقع بناءً على ميزانية استثمارك ونسب العوائد التأجيرية السائدة.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
                {/* Inputs Box */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Capital Input */}
                  <div className="space-y-2.5 text-right">
                    <label className="block text-brand-navy font-bold text-xs">قيمة الاستثمار المتوقعة (ل.س):</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-brand-navy/40 font-bold text-xs select-none">
                        ل.س
                      </div>
                      <input
                        type="text"
                        value={investmentInput ? parseInt(investmentInput.replace(/[^\d]/g, ''), 10).toLocaleString('en-US') : ''}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[^\d]/g, '');
                          setInvestmentInput(digits);
                        }}
                        placeholder="أدخل ميزانية استثمارك بالليرة السورية..."
                        className="w-full pl-4 pr-14 py-3 bg-brand-cream/10 border border-brand-navy/10 rounded-2xl focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all text-sm font-bold text-brand-navy placeholder-brand-navy/30 text-left font-mono"
                        dir="ltr"
                        id="roi-investment-input"
                      />
                    </div>
                    {/* Quick setting buttons */}
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInvestmentInput(numericPrice.toString())}
                        className="text-[10px] sm:text-xxs font-bold px-2.5 py-1 rounded-xl border border-brand-navy/10 hover:border-brand-navy hover:bg-brand-navy text-brand-navy hover:text-white transition-all cursor-pointer"
                      >
                        100% (كامل القيمة)
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvestmentInput(Math.round(numericPrice * 0.50).toString())}
                        className="text-[10px] sm:text-xxs font-bold px-2.5 py-1 rounded-xl border border-brand-navy/10 hover:border-brand-navy hover:bg-brand-navy text-brand-navy hover:text-white transition-all cursor-pointer"
                      >
                        50% من القيمة
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvestmentInput(Math.round(numericPrice * 0.25).toString())}
                        className="text-[10px] sm:text-xxs font-bold px-2.5 py-1 rounded-xl border border-brand-navy/10 hover:border-brand-navy hover:bg-brand-navy text-brand-navy hover:text-white transition-all cursor-pointer"
                      >
                        25% من القيمة
                      </button>
                    </div>
                  </div>

                  {/* Slider ROI % */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-brand-navy mb-1">
                      <span className="bg-brand-gold/15 text-brand-navy px-2.5 py-0.5 rounded-lg font-mono text-xs border border-brand-gold/20 leading-none">
                        {expectedYieldRate.toFixed(1)}%
                      </span>
                      <span>نسبة العائد السنوي المتوقعة (Yield Ratio):</span>
                    </div>
                    <input
                      type="range"
                      min="4.0"
                      max="15.0"
                      step="0.5"
                      value={expectedYieldRate}
                      onChange={(e) => setExpectedYieldRate(parseFloat(e.target.value))}
                      className="w-full accent-brand-gold cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-brand-navy/40 font-mono font-bold">
                      <span>4.0%</span>
                      <span>متوسط العائد السوري (8.5%)</span>
                      <span>15.0%</span>
                    </div>
                  </div>
                </div>

                {/* Outputs/Metrics Grid */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
                  {(() => {
                    const currentInvest = investmentInput ? parseInt(investmentInput, 10) : 0;
                    const annualReturn = currentInvest * (expectedYieldRate / 100);
                    const monthlyReturn = annualReturn / 12;
                    const paybackPeriod = expectedYieldRate > 0 ? (100 / expectedYieldRate).toFixed(1) : '0';

                    return (
                      <>
                        {/* Metric 1 */}
                        <div className="bg-brand-gold/5 border border-brand-gold/20 p-5 rounded-2xl flex flex-col justify-between text-right space-y-3 relative overflow-hidden shadow-sm">
                          <div className="absolute left-2.5 bottom-1.5 text-brand-gold/8 select-none pointer-events-none">
                            <TrendingUp size={44} />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-brand-navy/50 block">العائد السنوي المتوقع</span>
                            <span className="text-base sm:text-lg font-bold text-brand-navy mt-1.5 block leading-none font-mono">
                              {currentInvest > 0 ? (Math.round(annualReturn).toLocaleString('en-US')) : '0'}
                            </span>
                            <span className="text-[10px] font-bold text-brand-navy/50 block mt-0.5">ليرة سورية / سنوياً</span>
                          </div>
                          <span className="text-[10px] text-emerald-700 font-bold bg-green-50 self-start px-2 py-0.5 rounded-lg border border-green-200">
                            +{expectedYieldRate}% سنوياً
                          </span>
                        </div>

                        {/* Metric 2 */}
                        <div className="bg-brand-cream/45 border border-brand-navy/5 p-5 rounded-2xl flex flex-col justify-between text-right space-y-3 relative overflow-hidden shadow-sm">
                          <div className="absolute left-2.5 bottom-1.5 text-brand-navy/8 select-none pointer-events-none">
                            <Coins size={44} />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-brand-navy/50 block">العائد الشهري المتوقع</span>
                            <span className="text-base sm:text-lg font-bold text-brand-navy mt-1.5 block leading-none font-mono">
                              {currentInvest > 0 ? (Math.round(monthlyReturn).toLocaleString('en-US')) : '0'}
                            </span>
                            <span className="text-[10px] font-bold text-brand-navy/50 block mt-0.5">ليرة سورية / شهرياً</span>
                          </div>
                          <span className="text-[10px] text-brand-navy/70 font-bold bg-brand-navy/5 self-start px-2 py-0.5 rounded-lg border border-brand-navy/10">تقديري تقريبي</span>
                        </div>

                        {/* Metric 3 */}
                        <div className="bg-brand-cream/45 border border-brand-navy/5 p-5 rounded-2xl flex flex-col justify-between text-right space-y-3 relative overflow-hidden shadow-sm">
                          <div className="absolute left-2.5 bottom-1.5 text-brand-navy/8 select-none pointer-events-none">
                            <Percent size={44} />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-brand-navy/50 block">استرداد رأس المال</span>
                            <span className="text-base sm:text-lg font-bold text-brand-navy mt-1.5 block leading-none font-semibold">
                              {currentInvest > 0 ? `${paybackPeriod} سنة` : '0 سنة'}
                            </span>
                            <span className="text-[10px] font-bold text-brand-navy/50 block mt-0.5">لتغطية ميزانيتك</span>
                          </div>
                          <span className="text-[10px] text-brand-gold-dark font-bold bg-brand-gold/10 self-start px-2 py-0.5 rounded-lg border border-brand-gold/15">عقد تشغيلي</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Informative insight message */}
              {investmentInput && parseInt(investmentInput, 10) > 0 && (
                <div className="p-4 bg-brand-navy/[0.02] rounded-2xl border border-brand-navy/5 text-xs text-brand-navy/60 font-semibold leading-relaxed flex items-start gap-2.5">
                  <span className="text-base leading-none">💡</span>
                  <span>
                    تُقدر قيم الاستثمار المالي التجاري في مناطق دمشق ومحيطها بمعدل عائد سنوي يتراوح بين <strong>7% إلى 11%</strong> في الحالات الوسطية. تختلف نسبة العائد باختلاف مجالات التأجير للأطباء أو المكاتب الإدارية والشركات التقنية الفعالة.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Added Services Section */}
          {property.addedServices && property.addedServices.length > 0 && (
            <div className="bg-white p-8 rounded-3xl border border-brand-navy/5 shadow-sm text-right space-y-4">
              <h4 className="font-serif text-xl font-bold text-brand-navy flex items-center justify-end gap-2 border-b border-brand-navy/5 pb-3">
                الخدمات والميزات المضافة الرائعة لهذا العقار
                <span className="text-lg">⭐</span>
              </h4>
              <div className="flex flex-wrap justify-end gap-3 pt-2">
                {property.addedServices.map((service, index) => {
                  let badgeIcon = '✨';
                  if (service === 'مسبح') badgeIcon = '🏊‍♂️';
                  else if (service === 'حديقة') badgeIcon = '🌳';
                  else if (service === 'مرأب') badgeIcon = '🚗';
                  else if (service === 'تدفئة مركزية') badgeIcon = '🔥';
                  return (
                    <span 
                      key={index}
                      className="px-4.5 py-3 rounded-2xl bg-brand-gold/10 text-brand-navy border border-brand-gold/25 font-bold text-sm flex items-center gap-2 flex-row-reverse shadow-xs"
                    >
                      <span className="text-base">{badgeIcon}</span>
                      <span>{service}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description Section */}
          <div className="bg-white p-8 rounded-3xl border border-brand-navy/5 shadow-sm text-right space-y-4">
            <h4 className="font-serif text-xl font-bold text-brand-navy flex items-center justify-end gap-2 border-b border-brand-navy/5 pb-3">
              تفاصيل ومواصفات العقار
              <Info size={18} className="text-brand-gold" />
            </h4>
            <p className="text-brand-navy/80 text-sm leading-loose whitespace-pre-line font-medium md:text-base">
              {property.description}
            </p>
          </div>

          {/* Project Timeline Section (for properties under construction) */}
          {property.classification === 'under_construction' && (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-brand-navy/5 shadow-sm text-right space-y-6 animate-fade-in" id="project-timeline-section">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-navy/5 pb-4">
                <span className="text-xs bg-brand-gold/10 text-brand-navy font-bold px-3 py-1.5 rounded-xl border border-brand-gold/20 flex items-center gap-1.5">
                  <Wrench size={14} className="text-brand-gold" />
                  <span>المتابعة الهندسية الفنية</span>
                </span>
                <h4 className="font-serif text-xl font-bold text-brand-navy flex items-center gap-2">
                  <span>المخطط الزمني للمشروع الإنشائي</span>
                  <Calendar size={20} className="text-brand-gold" />
                </h4>
              </div>

              {/* Informative Header */}
              <p className="text-brand-navy/70 text-xs sm:text-sm leading-relaxed font-semibold">
                عقار قيد الإنشاء والتشييد وفق المواصفات الهندسية القياسية. نتيح لك هنا متابعة المراحل الإنشائية والمواعيد المقدرة لإنجاز كل مرحلة بدقة لتبقى على اطلاع تام بتقدم أعمال البناء والتشطيب.
              </p>

              {(() => {
                // Fetch real data
                const actualTimeline = getDeterministicTimeline(property.id);
                
                // If simulator is active, calculate simulated data
                let progress = actualTimeline.overallProgress;
                let daysLeft = actualTimeline.daysLeft;
                let completionDateStr = actualTimeline.completionDateStr;
                let phases = [...actualTimeline.phases];

                if (isTimelineSimulatorActive) {
                  // progressMap corresponding to phase counts [0, 1, 2, 3, 4, 5, 6]
                  const progressMap = [0, 15, 35, 55, 70, 85, 100];
                  progress = progressMap[simulatedPhasesCount];
                  
                  // Days left: overall 360 days total timeline
                  daysLeft = Math.max(0, Math.round(360 * (1 - progress / 100)));
                  
                  // Completion Date based on today (2026-07-01) + daysLeft
                  const simulatedCompDate = new Date(2026, 6, 1 + daysLeft);
                  const monthsAr = [
                    'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
                    'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
                  ];
                  completionDateStr = `${monthsAr[simulatedCompDate.getMonth()]} ${simulatedCompDate.getFullYear()}`;

                  // Map phases based on simulated count
                  phases = actualTimeline.phases.map((p, idx) => {
                    let status: 'completed' | 'in_progress' | 'planned' = 'planned';
                    let phaseProgress = 0;
                    if (idx < simulatedPhasesCount) {
                      status = 'completed';
                      phaseProgress = 100;
                    } else if (idx === simulatedPhasesCount) {
                      status = 'in_progress';
                      phaseProgress = 50; // default middle in-progress for simulated phase
                    }
                    return {
                      ...p,
                      status,
                      progress: phaseProgress
                    };
                  });
                }

                return (
                  <div className="space-y-6">
                    {/* Progress Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Overall Progress Circle/Card */}
                      <div className="bg-brand-navy/[0.02] p-5 rounded-2xl border border-brand-navy/5 flex flex-col justify-between items-center text-center space-y-2">
                        <span className="text-[10px] font-bold text-brand-navy/50">نسبة إنجاز المشروع الإجمالية</span>
                        <div className="relative flex items-center justify-center">
                          <div className="text-3xl font-bold font-mono text-brand-navy">
                            {progress}%
                          </div>
                        </div>
                        {/* Elegant mini progress bar */}
                        <div className="w-full bg-brand-navy/10 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-brand-gold h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      {/* Days remaining Card */}
                      <div className="bg-brand-navy/[0.02] p-5 rounded-2xl border border-brand-navy/5 flex flex-col justify-between items-center text-center space-y-2">
                        <span className="text-[10px] font-bold text-brand-navy/50">الوقت المتبقي المقدر للتسليم</span>
                        <div className="text-3xl font-bold font-mono text-brand-gold-dark flex items-baseline gap-1">
                          <span>{daysLeft}</span>
                          <span className="text-xs font-serif font-bold">يوم</span>
                        </div>
                        <span className="text-[10px] text-brand-navy/40 font-semibold">تحت المتابعة الفنية المستمرة</span>
                      </div>

                      {/* Completion Date Card */}
                      <div className="bg-brand-navy/[0.02] p-5 rounded-2xl border border-brand-navy/5 flex flex-col justify-between items-center text-center space-y-2">
                        <span className="text-[10px] font-bold text-brand-navy/50">الموعد المتوقع للتسليم الجاهز</span>
                        <div className="text-xl font-bold text-brand-navy font-serif">
                          {completionDateStr}
                        </div>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-bold">بموجب العقد والترخيص</span>
                      </div>
                    </div>

                    {/* Interactive Simulator Controller */}
                    <div className="bg-brand-gold/5 p-4 rounded-2xl border border-brand-gold/20 space-y-3">
                      <div className="flex items-center justify-between flex-row-reverse">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-brand-navy select-none">
                          <input 
                            type="checkbox" 
                            checked={isTimelineSimulatorActive} 
                            onChange={(e) => {
                              setIsTimelineSimulatorActive(e.target.checked);
                              if (e.target.checked) {
                                const realCompletedCount = actualTimeline.phases.filter(p => p.status === 'completed').length;
                                setSimulatedPhasesCount(realCompletedCount);
                              }
                            }}
                            className="rounded text-brand-gold focus:ring-brand-gold w-4 h-4 cursor-pointer"
                          />
                          <span>تفعيل محاكي تقدم الأعمال التفاعلي ⚡</span>
                        </label>
                        <span className="text-[10px] font-bold text-brand-gold-dark bg-brand-gold/10 px-2 py-0.5 rounded">خاص بالعميل</span>
                      </div>

                      {isTimelineSimulatorActive ? (
                        <div className="space-y-3 pt-1">
                          <p className="text-[11px] text-brand-navy/60 leading-relaxed font-semibold">
                            جرّب تعديل شريط التمرير أدناه لـ <strong>تحديث المراحل المنجزة</strong> ومحاكاة تغير جدول الإنجاز والعد التنازلي للأيام حتى تسليم المفاتيح:
                          </p>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-brand-navy/50 font-mono w-14">0 مراحل</span>
                            <input 
                              type="range" 
                              min="0" 
                              max="6" 
                              value={simulatedPhasesCount} 
                              onChange={(e) => setSimulatedPhasesCount(parseInt(e.target.value, 10))}
                              className="w-full accent-brand-gold cursor-pointer"
                            />
                            <span className="text-xs font-bold text-brand-navy/80 font-mono w-14">{simulatedPhasesCount} منجزة</span>
                          </div>
                          
                          {/* Reset Indicator */}
                          <div className="flex justify-between items-center text-[10px] pt-1">
                            <button 
                              onClick={() => {
                                setIsTimelineSimulatorActive(false);
                              }}
                              className="text-brand-navy hover:text-brand-gold font-bold underline cursor-pointer"
                            >
                              إعادة تعيين إلى المخطط الفعلي والواقعي للمهندس المشرف ↩️
                            </button>
                            <span className="text-brand-gold-dark font-bold font-mono">الوضع الحالي: محاكاة تقديرية</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-brand-navy/50 leading-relaxed font-semibold">
                          انقر على خانة الاختيار لتفعيل وضع المحاكاة التفاعلي ومحاكاة مواعيد الإنجاز وتسريع الخطوات افتراضياً.
                        </p>
                      )}
                    </div>

                    {/* Timeline Steps View */}
                    <div className="relative border-r-2 border-brand-navy/10 mr-4 space-y-6 py-2">
                      {phases.map((phase, index) => {
                        const isCompleted = phase.status === 'completed';
                        const isInProgress = phase.status === 'in_progress';
                        const isExpanded = expandedPhaseIndex === index;

                        return (
                          <div key={index} className="relative pr-8 text-right">
                            {/* Dot indicator on vertical line */}
                            <div className="absolute right-0 top-1.5 -translate-x-[-50%] transform">
                              {isCompleted ? (
                                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-md border-2 border-white font-bold">
                                  ✓
                                </div>
                              ) : isInProgress ? (
                                <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs shadow-md border-2 border-white animate-pulse">
                                  ⚙️
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs border-2 border-white">
                                  •
                                </div>
                              )}
                            </div>

                            {/* Phase Card */}
                            <div 
                              onClick={() => setExpandedPhaseIndex(isExpanded ? null : index)}
                              className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none text-right ${
                                isCompleted 
                                  ? 'bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04] border-emerald-500/20' 
                                  : isInProgress 
                                  ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.06] border-amber-500/30 ring-1 ring-amber-500/10' 
                                  : 'bg-gray-50/50 hover:bg-gray-50 border-gray-100 opacity-80'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                {/* Toggle Arrow indicator */}
                                <span className="text-brand-navy/30 text-xs mt-1">
                                  {isExpanded ? '▲ تفاصيل أقل' : '▼ المزيد من التفاصيل'}
                                </span>

                                {/* Phase Title & Dates */}
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="text-sm font-bold text-brand-navy leading-snug">{phase.title}</span>
                                    <span className="text-base">{phase.icon}</span>
                                  </div>

                                  <div className="flex items-center justify-end gap-3 text-[10px] text-brand-navy/60 font-semibold font-mono">
                                    <span>تاريخ الإنجاز المقدر: <strong>{phase.endDate}</strong></span>
                                    <span className="text-brand-navy/20">|</span>
                                    <span>البداية: {phase.startDate}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Progress status pill & miniature bar */}
                              <div className="mt-2.5 flex items-center justify-between flex-row-reverse text-[10px] font-bold">
                                <span className={
                                  isCompleted ? 'text-emerald-600' : isInProgress ? 'text-amber-600 animate-pulse' : 'text-gray-400'
                                } id={`phase-status-pill-${index}`}>
                                  {isCompleted ? 'مكتملة بنجاح 100%' : isInProgress ? `قيد العمل حالياً ${phase.progress}%` : 'مخطط لها'}
                                </span>
                                <div className="w-1/3 bg-brand-navy/5 rounded-full h-1 overflow-hidden">
                                  <div className={`h-full rounded-full ${
                                    isCompleted ? 'bg-emerald-500' : isInProgress ? 'bg-amber-500' : 'bg-gray-200'
                                  }`} style={{ width: `${phase.progress}%` }} />
                                </div>
                              </div>

                              {/* Expanded details container */}
                              {isExpanded && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="mt-3 pt-3 border-t border-brand-navy/5 text-xs text-brand-navy/70 leading-relaxed font-semibold space-y-2 text-right"
                                >
                                  <p>{phase.desc}</p>
                                  <div className="p-2 bg-brand-navy/[0.01] rounded-xl border border-brand-navy/5 flex flex-wrap justify-between items-center text-[10px] font-bold">
                                    <span className="text-brand-navy/40">المشرف الهندسي: مهندس نقابي مرخص</span>
                                    <span className="text-brand-gold-dark bg-brand-gold/5 px-1.5 py-0.5 rounded">معايير كودة البناء والمقاومة</span>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Print Timeline and Generate PDF Button */}
                    <div className="flex justify-end pt-2">
                      <button 
                        onClick={() => {
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            printWindow.document.write(`
                              <html dir="rtl" lang="ar">
                              <head>
                                <title>تقرير الجدول الزمني الإنشائي - ${property.title}</title>
                                <style>
                                  body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #0c1c30; line-height: 1.6; }
                                  .header { text-align: center; border-bottom: 2px solid #bba358; padding-bottom: 20px; margin-bottom: 30px; }
                                  .header h1 { font-size: 24px; margin: 0 0 10px 0; }
                                  .header p { color: #555; margin: 0; font-size: 14px; }
                                  .property-info { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #ddd; }
                                  .timeline { margin-top: 20px; }
                                  .phase { border-bottom: 1px solid #eee; padding: 15px 0; }
                                  .phase-title { font-weight: bold; font-size: 16px; color: #0c1c30; }
                                  .phase-date { font-size: 12px; color: #777; margin: 5px 0; }
                                  .phase-desc { font-size: 13px; color: #444; }
                                  .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #aaa; border-top: 1px solid #eee; padding-top: 20px; }
                                </style>
                              </head>
                              <body>
                                <div class="header">
                                  <h1>منصة البراء النعيمي العقارية</h1>
                                  <p>تقرير الجدول الزمني للمراحل الإنشائية المقدرة</p>
                                </div>
                                <div class="property-info">
                                  <h3>معلومات العقار:</h3>
                                  <p><strong>العقار:</strong> ${property.title}</p>
                                  <p><strong>الموقع:</strong> ${property.location} - محافظة ${property.governorate || 'دمشق'}</p>
                                  <p><strong>حالة المشروع:</strong> قيد التشييد والإنشاء 👷</p>
                                  <p><strong>نسبة الإنجاز الفعلية:</strong> ${actualTimeline.overallProgress}%</p>
                                  <p><strong>الموعد المتوقع للتسليم الجاهز:</strong> ${actualTimeline.completionDateStr}</p>
                                </div>
                                <div class="timeline">
                                  <h3>مراحل وخطوات التشييد المجدولة:</h3>
                                  ${actualTimeline.phases.map((p, idx) => `
                                    <div class="phase">
                                      <div class="phase-title">${idx + 1}. ${p.title} [${p.status === 'completed' ? 'تم الانتهاء بنجاح' : p.status === 'in_progress' ? 'قيد العمل حالياً' : 'مخطط لها مستقبلية'}]</div>
                                      <div class="phase-date">الفترة المقدرة: من ${p.startDate} إلى ${p.endDate}</div>
                                      <div class="phase-desc">${p.desc}</div>
                                    </div>
                                  `).join('')}
                                </div>
                                <div class="footer">
                                  <p>تم توليد هذا التقرير رسمياً من منصة البراء النعيمي للوساطة العقارية والخدمات الفنية بدمشق.</p>
                                  <p>جميع المواعيد والتقديرات تخضع للظروف الفنية والتشغيلية الموقعية.</p>
                                </div>
                                <script>window.print();</script>
                              </body>
                              </html>
                            `);
                            printWindow.document.close();
                          }
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-white text-xs font-bold rounded-xl hover:bg-brand-navy/90 transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        <Printer size={14} />
                        <span>طباعة وتصدير الجدول الزمني والمواصفات الفنية 📑</span>
                      </button>
                    </div>

                    {/* FAQ Quality Insurance Section */}
                    <div className="pt-4 border-t border-brand-navy/5 space-y-4 text-right">
                      <h5 className="font-serif text-base font-bold text-brand-navy flex items-center justify-end gap-2">
                        <span>الضمانات الفنية وجودة البناء ومواصفات الكود</span>
                        <Shield size={16} className="text-brand-gold" />
                      </h5>
                      <div className="space-y-2">
                        {/* FAQ 1 */}
                        <div className="border border-brand-navy/5 rounded-2xl overflow-hidden">
                          <button 
                            onClick={() => toggleFaq('earthquake')}
                            className="w-full p-4 bg-brand-navy/[0.01] hover:bg-brand-navy/[0.02] flex items-center justify-between flex-row-reverse text-right transition-all font-semibold text-xs text-brand-navy cursor-pointer"
                          >
                            <span>هل البناء مقاوم للهزات الأرضية والزلازل؟</span>
                            <span className="text-xs text-brand-gold">{faqOpenStates['earthquake'] ? '▲' : '▼'}</span>
                          </button>
                          {faqOpenStates['earthquake'] && (
                            <div className="p-4 bg-white border-t border-brand-navy/5 text-xs text-brand-navy/70 leading-relaxed font-semibold">
                              نعم، تم تصميم الهيكل الخرساني والأساسات الحصيرية بإشراف نقابة المهندسين السوريين لتتحمل الهزات الأرضية والزلازل وفق الكود الهندسي القياسي ومقاومة عينات الخرسانة (C25/30) واختبار جودة حديد التسليح دورياً.
                            </div>
                          )}
                        </div>

                        {/* FAQ 2 */}
                        <div className="border border-brand-navy/5 rounded-2xl overflow-hidden">
                          <button 
                            onClick={() => toggleFaq('finishing')}
                            className="w-full p-4 bg-brand-navy/[0.01] hover:bg-brand-navy/[0.02] flex items-center justify-between flex-row-reverse text-right transition-all font-semibold text-xs text-brand-navy cursor-pointer"
                          >
                            <span>ما هي جودة مواد الإكساء والتشطيبات الفاخرة المعتمدة؟</span>
                            <span className="text-xs text-brand-gold">{faqOpenStates['finishing'] ? '▲' : '▼'}</span>
                          </button>
                          {faqOpenStates['finishing'] && (
                            <div className="p-4 bg-white border-t border-brand-navy/5 text-xs text-brand-navy/70 leading-relaxed font-semibold">
                              الإكساء المعتمد هو سوبر ديلوكس، ويشمل أرضيات رخام أورينتال الإيطالي، نوار سيراميك نخب أول، دهانات جوتن الفاخرة، وتمديدات صحية وكهربائية بماركات إيطالية وألمانية ذات كفاءة ممتازة ومثبتة هندسياً.
                            </div>
                          )}
                        </div>

                        {/* FAQ 3 */}
                        <div className="border border-brand-navy/5 rounded-2xl overflow-hidden">
                          <button 
                            onClick={() => toggleFaq('warranty')}
                            className="w-full p-4 bg-brand-navy/[0.01] hover:bg-brand-navy/[0.02] flex items-center justify-between flex-row-reverse text-right transition-all font-semibold text-xs text-brand-navy cursor-pointer"
                          >
                            <span>هل تتوفر ضمانات للصيانة ومشاكل التسريب بعد التسليم؟</span>
                            <span className="text-xs text-brand-gold">{faqOpenStates['warranty'] ? '▲' : '▼'}</span>
                          </button>
                          {faqOpenStates['warranty'] && (
                            <div className="p-4 bg-white border-t border-brand-navy/5 text-xs text-brand-navy/70 leading-relaxed font-semibold">
                              نعم، نوفر عقداً لضمان الصيانة والتشغيل الشامل لكافة التمديدات والتسريبات والتشطبيات لمدة سنتين كاملتين تبدأ من تاريخ التسليم الفعلي للمفاتيح، وتتم المتابعة عبر مهندسي الدعم الفني بالشركة مجاناً.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* QR Code & Share Section (تفاصيل المشاركة الذكية عبر الهاتف والجوال) */}
          <div className="bg-gradient-to-tr from-[#0F223D] to-[#0A192F] p-6 md:p-8 rounded-3xl border border-brand-gold/15 shadow-xl text-right flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8" id="property-qr-share-section">
            
            {/* Left/Right Column: Informative text controls */}
            <div className="flex-1 space-y-4 order-2 md:order-1 text-right w-full">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] text-brand-gold bg-brand-gold/10 font-bold px-3 py-1 rounded-full border border-brand-gold/20">
                  <QrCode size={12} className="text-brand-gold" />
                  <span>الرمز الشريطي التفاعلي QR</span>
                </span>
                <h4 className="font-serif text-xl font-bold text-white flex items-center gap-2 justify-start">
                  <span>مشاركة وتصفح الجوال المباشر</span>
                </h4>
              </div>

              <p className="text-white/70 text-xs sm:text-sm leading-relaxed font-normal">
                امسح رمز الاستجابة السريعة (QR Code) باستخدام كاميرا الهاتف المحمول للانتقال الفوري وتصفح تفاصيل هذا العقار مباشرةً على هاتفك، أو شاركه بسرعة مع الأصدقاء والعائلة.
              </p>

              {/* Share link controls */}
              <div className="space-y-3 pt-2">
                <label className="block text-white/60 font-bold text-xs">رابط المشاركة المباشر للعقار:</label>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-2 rounded-2xl w-full">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={cn(
                      "group relative flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 shadow-md cursor-pointer whitespace-nowrap active:scale-95 overflow-hidden hover:-translate-y-0.5",
                      copiedLink
                        ? "bg-emerald-600 text-white border border-emerald-500"
                        : "bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold text-brand-navy hover:shadow-lg hover:shadow-brand-gold/20"
                    )}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                    {copiedLink ? (
                      <>
                        <Check size={15} className="shrink-0 animate-bounce" />
                        <span>تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={15} className="shrink-0 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300" />
                        <span>نسخ الرابط</span>
                      </>
                    )}
                  </button>
                  <input
                    type="text"
                    readOnly
                    value={shareLink}
                    className="w-full bg-transparent border-none outline-none text-xs text-white/90 font-mono font-medium px-2 py-1 text-left select-all"
                    dir="ltr"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                </div>

                {/* Social fast triggers */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`تصفح تفاصيل هذا العقار المميز "${property.title}" في ${property.location} عبر منصة البراء العقارية:\n${shareLink}${property.images?.[0] ? `\n\n🖼️ صورة العقار:\n${property.images[0]}` : ''}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative inline-flex items-center gap-2.5 px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-[#25D366]/20 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 cursor-pointer select-none overflow-hidden"
                    title="مشاركة على واتساب مع الصورة"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                    <WhatsappIcon size={16} className="shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                    <span>واتساب / WhatsApp</span>
                  </a>

                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(`تصفح تفاصيل هذا العقار المميّز: ${property.title}${property.images?.[0] ? `\n🖼️ صورة العقار: ${property.images[0]}` : ''}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative inline-flex items-center gap-2.5 px-4 py-2.5 bg-[#0088cc] hover:bg-[#0077b3] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-[#0088cc]/20 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 cursor-pointer select-none overflow-hidden"
                    title="مشاركة على تليغرام مع الصورة"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                    <TelegramIcon size={16} className="shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                    <span>تليغرام</span>
                  </a>

                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(`تصفح هذا العقار الفاخر: ${property.title} في ${property.location}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative inline-flex items-center gap-2.5 px-4 py-2.5 bg-[#000000] hover:bg-gray-900 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg border border-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 cursor-pointer select-none overflow-hidden"
                    title="مشاركة على إكس"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                    <XIcon size={15} className="shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                    <span>إكس (تويتر)</span>
                  </a>

                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative inline-flex items-center gap-2.5 px-4 py-2.5 bg-[#0A66C2] hover:bg-[#09519A] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-[#0A66C2]/20 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 cursor-pointer select-none overflow-hidden"
                    title="مشاركة على لينكد إن"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                    <LinkedinIcon size={16} className="shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                    <span>لينكد إن</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      const primaryImg = property.images && property.images.length > 0 ? property.images[0] : '';
                      const postText = `🏡 *فرصة عقارية مميزة من شركة البراء النعيمي للتسويق والاستشارات العقارية* 🏡

📍 *الموقع:* ${property.location} (${property.governorate || 'دمشق'})
🏢 *نوع العقار:* ${property.type === 'Residential' ? 'سكني' : property.type === 'Commercial' ? 'تجاري' : 'أرض'} (${property.classification === 'under_construction' ? 'تحت الإنشاء' : property.classification === 'ready_to_move' ? 'جاهز للسكن' : property.classification === 'commercial_investment' ? 'تجاري واستثماري' : 'عرض استثماري'})
💵 *السعر:* ${property.price}
📐 *المساحة:* ${property.area ? `${property.area} م²` : 'غير محددة'}
🛏️ *الغرف والصالونات:* ${property.rooms || 'غير محدد'}
🏢 *عدد الطوابق:* ${property.floors || 'غير محدد'}

✨ *التفاصيل:*
${property.description || 'تواصل معنا لمعرفة التفاصيل الكاملة.'}
${primaryImg ? `\n🖼️ *صورة العقار الرئيسية:*\n${primaryImg}` : ''}

🔗 للمعاينة الفورية وتفاصيل العقار الحصرية اضغط على الرابط التالي:
${shareLink}

#عقارات_سوريا #عقارات_دمشق #شقق_للبيع #شركة_البراء_النعيمي #استثمار_عقاري #تسويق_عقاري #فلل_فاخرة #مكاتب_تجارية #سوريا #Damascus_Real_Estate #Syria_Properties`;

                      handleCopyPostAndDownloadImage('facebook', postText);
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank');
                    }}
                    className={cn(
                      "group relative inline-flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 cursor-pointer select-none overflow-hidden",
                      copiedFacebookPost
                        ? "bg-emerald-600 text-white"
                        : "bg-[#1877F2] hover:bg-[#1565CD] text-white hover:shadow-[#1877F2]/20"
                    )}
                    title="توليد ومشاركة منشور فيسبوك احترافي مع تنزيل الصورة"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                    <FacebookIcon size={16} className="shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                    <span>{copiedFacebookPost ? "تم نسخ المنشور وتنزيل الصورة! سيفتح فيسبوك" : "منشور فيسبوك احترافي مع الصورة"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* QR Presenter Image Column */}
            <div className="flex flex-col items-center justify-center gap-3 order-1 md:order-2 self-center bg-white/5 p-4 rounded-3xl border border-white/10 min-w-[200px]">
              <div className="bg-white p-3 rounded-2xl shadow-lg border-2 border-brand-gold/30 hover:border-brand-gold transition-all duration-300 transform hover:scale-[1.03] select-none">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Property Share QR Code"
                    className="w-36 h-36 md:w-40 md:h-40 object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-36 h-36 md:w-40 md:h-40 flex items-center justify-center text-xs text-brand-navy font-bold">
                    جاري توليد الرمز...
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-[10px] font-bold text-brand-gold tracking-widest uppercase animate-pulse">Scan Mobile QR</span>
                <span className="text-[9px] font-medium text-white/50">امسح الضوئي بالجوال للمعاينة</span>
              </div>
            </div>

          </div>

          {/* Area Calculator Section */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-brand-navy/5 shadow-sm text-right space-y-6" id="area-calculator-section">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-navy/5 pb-4">
              <span className="text-xs bg-brand-gold/10 text-brand-navy font-bold px-3 py-1.5 rounded-xl border border-brand-gold/20 flex items-center gap-1.5">
                <Calculator size={14} className="text-brand-gold" />
                <span>حاسبة تفاعلية للمساحة</span>
              </span>
              <h4 className="font-serif text-xl font-bold text-brand-navy flex items-center gap-2">
                <span>حاسبة المساحة الصافية المتوفرة</span>
                <Layers size={20} className="text-brand-gold" />
              </h4>
            </div>

            <p className="text-brand-navy/70 text-xs sm:text-sm leading-relaxed font-semibold">
              خطط وقس مساحتك بدقة! أدخل أبعاد الغرف والأقسام المختلفة بالأمتار، لتسجيل المساحة التفصيلية والصافية المتوفرة للاستخدام بعد استقطاع سماكة الجدران ومسارات الحركة.
            </p>

            <div className="space-y-4">
              {/* Rooms Header Row for wide screen */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-brand-navy/5 rounded-xl text-xs font-bold text-brand-navy">
                <div className="col-span-4 text-right">اسم الغرفة / القسم</div>
                <div className="col-span-3 text-center">العرض (متر)</div>
                <div className="col-span-3 text-center">الطول (متر)</div>
                <div className="col-span-2 text-left pl-4">المساحة (م²)</div>
              </div>

              {/* Rooms Inputs Rows */}
              <div className="space-y-3">
                {roomsList.map((room) => {
                  const w = parseFloat(room.width) || 0;
                  const l = parseFloat(room.length) || 0;
                  const area = w * l;

                  return (
                    <div 
                      key={room.id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 md:p-2 bg-brand-cream/10 border border-brand-navy/5 rounded-2xl items-center"
                    >
                      {/* Name */}
                      <div className="col-span-1 md:col-span-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => removeRoom(room.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg hover:text-red-600 transition-colors cursor-pointer"
                          title="حذف هذه الغرفة"
                        >
                          <Trash2 size={16} />
                        </button>
                        <select
                          value={ROOM_PRESETS.includes(room.name) ? room.name : 'أخرى'}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateRoom(room.id, 'name', val === 'أخرى' ? 'مرفق إضافي' : val);
                          }}
                          className="bg-white border border-brand-navy/10 rounded-xl px-2.5 py-1.5 text-xs text-brand-navy font-bold focus:border-brand-gold outline-none"
                        >
                          {ROOM_PRESETS.map((preset) => (
                            <option key={preset} value={preset}>{preset}</option>
                          ))}
                          <option value="أخرى">اسم مخصص...</option>
                        </select>
                        {!ROOM_PRESETS.filter(p => p !== 'آخر').includes(room.name) && (
                          <input
                            type="text"
                            value={room.name}
                            onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                            placeholder="حدد الاسم..."
                            className="w-full bg-white border border-brand-navy/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-brand-navy text-right focus:border-brand-gold outline-none"
                          />
                        )}
                      </div>

                      {/* Width */}
                      <div className="col-span-1 md:col-span-3">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={room.width}
                            onChange={(e) => updateRoom(room.id, 'width', e.target.value)}
                            className="w-full pl-3 pr-8 py-1.5 bg-white border border-brand-navy/10 rounded-xl focus:border-brand-gold outline-none text-xs font-mono font-bold text-center"
                            placeholder="العرض"
                          />
                          <span className="absolute right-3.5 top-1.5 text-[10px] text-brand-navy/40 font-bold">م</span>
                        </div>
                      </div>

                      {/* Length */}
                      <div className="col-span-1 md:col-span-3">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={room.length}
                            onChange={(e) => updateRoom(room.id, 'length', e.target.value)}
                            className="w-full pl-3 pr-8 py-1.5 bg-white border border-brand-navy/10 rounded-xl focus:border-brand-gold outline-none text-xs font-mono font-bold text-center"
                            placeholder="الطول"
                          />
                          <span className="absolute right-3.5 top-1.5 text-[10px] text-brand-navy/40 font-bold">م</span>
                        </div>
                      </div>

                      {/* Room Area Result */}
                      <div className="col-span-1 md:col-span-2 text-center md:text-left pl-4">
                        <span className="text-xs font-bold text-brand-navy font-mono">
                          {area.toFixed(1)} م²
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Room Button */}
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={addRoom}
                  className="px-4 py-2 bg-brand-navy hover:bg-brand-navy/90 text-brand-gold hover:scale-[1.02] active:scale-95 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border border-brand-gold/10"
                >
                  <Plus size={14} />
                  إضافة غرفة / قسم جديد
                </button>
              </div>
            </div>

            {/* Deduction Settings & Metrics Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-brand-navy/5 items-center">
              {/* Deduction Setting Column */}
              <div className="lg:col-span-5 space-y-3 bg-brand-cream/5 p-4 rounded-xl border border-brand-navy/5">
                <div className="flex items-center justify-between text-xs font-bold text-brand-navy">
                  <span className="bg-brand-gold/15 text-brand-navy px-2.5 py-0.5 rounded-lg font-mono text-xs border border-brand-gold/20 leading-none">
                    {wallDeductionPercent}%
                  </span>
                  <span>نسبة استقطاع الجدران والممرات المقدرة:</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={wallDeductionPercent}
                  onChange={(e) => setWallDeductionPercent(parseInt(e.target.value))}
                  className="w-full accent-brand-gold cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-brand-navy/40 font-mono font-bold">
                  <span>0% (صافي مطلق)</span>
                  <span>10% (متوسط قياسي)</span>
                  <span>25% (ممرات جدران عريضة)</span>
                </div>
              </div>

              {/* Calculations Result Column */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(() => {
                  const grossArea = roomsList.reduce((sum, r) => {
                    const w = parseFloat(r.width) || 0;
                    const l = parseFloat(r.length) || 0;
                    return sum + (w * l);
                  }, 0);
                  const deducted = grossArea * (wallDeductionPercent / 100);
                  const netArea = grossArea - deducted;

                  return (
                    <>
                      {/* Metric 1: Gross Rooms */}
                      <div className="bg-brand-cream/45 border border-brand-navy/5 p-4 rounded-xl flex flex-col justify-between text-right relative overflow-hidden">
                        <span className="text-[10px] font-bold text-brand-navy/50 block">مجموع الغرف الكلي (الخام)</span>
                        <span className="text-base font-bold text-brand-navy mt-1.5 block font-mono">
                          {grossArea.toFixed(1)} م²
                        </span>
                        <span className="text-[9px] text-brand-navy/30 font-bold block mt-0.5">قبل اقتطاع الجدران</span>
                      </div>

                      {/* Metric 2: Wall Deduction */}
                      <div className="bg-brand-cream/45 border border-brand-navy/5 p-4 rounded-xl flex flex-col justify-between text-right relative overflow-hidden">
                        <span className="text-[10px] font-bold text-brand-navy/50 block">اقتطاع للجدران والممرات ({wallDeductionPercent}%)</span>
                        <span className="text-base font-bold text-red-600 mt-1.5 block font-mono">
                          -{deducted.toFixed(1)} م²
                        </span>
                        <span className="text-[9px] text-brand-navy/30 font-bold block mt-0.5 font-sans">المساحة الهيكلية</span>
                      </div>

                      {/* Metric 3: Net Available Area */}
                      <div className="bg-brand-gold/10 border border-brand-gold/20 p-4 rounded-xl flex flex-col justify-between text-right relative overflow-hidden">
                        <span className="text-[10px] font-bold text-brand-navy block shadow-sm bg-brand-gold/15 px-1.5 py-0.5 rounded self-start leading-none text-xs">المساحة الصافية المتوفرة</span>
                        <span className="text-lg font-black text-brand-navy mt-2 block font-mono">
                          {netArea.toFixed(1)} م²
                        </span>
                        <span className="text-[9px] text-brand-navy/50 font-bold block mt-0.5">مساحة الاستخدام الفعلي</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Comparison banner if property.area is listed */}
            {property.area && property.area > 0 && (
              <div className="p-4 bg-brand-navy/5 rounded-2xl border border-brand-navy/10 text-xs text-brand-navy/80 font-semibold leading-relaxed flex items-start gap-2.5">
                <span className="text-base leading-none">📊</span>
                <div>
                  مساحة العقار الكلية الإجمالية المعلنة في العقد هي <strong className="text-brand-navy font-mono">{property.area} م²</strong>. 
                  {(() => {
                    const grossArea = roomsList.reduce((sum, r) => {
                      const w = parseFloat(r.width) || 0;
                      const l = parseFloat(r.length) || 0;
                      return sum + (w * l);
                    }, 0);
                    const netArea = grossArea * ((100 - wallDeductionPercent) / 100);
                    const ratio = (netArea / property.area) * 100;
                    if (ratio > 0) {
                      return (
                        <span>
                          {" "}تشكّل المساحة الصافية المحسوبة للغرف (<span className="font-mono">{netArea.toFixed(1)} م²</span>) حوالي <strong className="text-brand-navy font-mono text-xs">{ratio.toFixed(1)}%</strong> من المساحة الإجمالية لقيمة العقار المعلنة.
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Exclusive Marketing Contract Details */}
          {property.isExclusive && (
            <div className="bg-gradient-to-r from-brand-navy to-brand-navy/95 border-2 border-brand-gold/30 p-8 rounded-[2rem] text-white space-y-5 shadow-xl relative overflow-hidden">
              <div className="absolute left-6 bottom-4 text-white/[0.03] select-none pointer-events-none">
                <Shield size={140} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5 bg-brand-gold/15 text-brand-gold border border-brand-gold/30 px-4 py-1.5 rounded-full text-xs font-bold leading-none select-none">
                  <Star size={12} className="fill-brand-gold text-brand-gold animate-spin" />
                  <span>عقد تسويق حصري (Exclusive Agreement)</span>
                </div>
                <h4 className="font-serif text-lg sm:text-xl font-bold text-brand-gold flex items-center gap-2">
                  <span>العقد الحصري للتسويق مع شركة البراء النعيمي</span>
                  <Shield size={20} className="text-brand-gold" />
                </h4>
              </div>

              <p className="text-white/95 text-xs sm:text-sm leading-loose font-semibold relative z-10">
                {property.exclusiveMarketingDetails || "هذا العقار مسوق حصرياً عبر الوكالة والاتفاق القانوني المطلق مع شركة البراء النعيمي للتطوير العقاري ضمن أفضل معايير الوساطة والتحقق العقاري."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-right relative z-10">
                {property.exclusiveStart && (
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] text-white/40 font-bold">تاريخ بدء سريان العقد الحصري</p>
                    <span className="font-mono text-xs font-bold text-white/95 mt-1 block">
                      {new Date(property.exclusiveStart).toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' })} م
                    </span>
                  </div>
                )}
                {property.exclusiveEnd && (
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] text-white/40 font-bold">تاريخ انتهاء فترة العقد الحصري (أو التجديد)</p>
                    <span className="font-mono text-xs font-bold text-brand-gold mt-1 block">
                      {new Date(property.exclusiveEnd).toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' })} م
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reviews and Ratings Center Section (Crucial!) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Review Creator Form (5 cols on desktop) */}
            <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-brand-navy/5 shadow-sm space-y-6">
              <h4 className="font-serif text-xl font-bold text-brand-navy flex items-center justify-end gap-2 border-b border-brand-navy/5 pb-3">
                أضف تقييمك ورأيك بالعقار
                <MessageSquare size={18} className="text-brand-gold" />
              </h4>

              {currentUser ? (
                hasUserAlreadyReviewed ? (
                  <div className="p-5 bg-amber-50 border border-brand-gold/20 rounded-2xl text-center text-brand-navy space-y-3">
                    <span className="text-2xl">✅</span>
                    <p className="text-sm font-bold leading-relaxed">
                      شكرًا لك! لقد قمت بتقييم هذا العقار بالفعل.
                    </p>
                    <p className="text-xs text-brand-navy/50 leading-relaxed font-semibold">
                      تسمح سياستنا بتقييم واحد فقط لكل مستشار أو عميل لمنع تكرار التقييمات. إذا أردت تعديل تعليقك، يرجى حذف تعليقك الحالي الموجود في قائمة التقييمات أولاً، ثم كتابة تقييم جديد.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-5">
                    {formError && (
                      <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl text-center font-bold border border-red-100">
                        {formError}
                      </div>
                    )}
                    {formSuccess && (
                      <div className="p-3 bg-green-50 text-green-600 text-xs rounded-xl text-center font-bold border border-green-100">
                        {formSuccess}
                      </div>
                    )}

                    {/* Interactive 5-Star Selection */}
                    <div className="space-y-2">
                      <label className="block text-brand-navy/60 font-bold text-xs">قيم العقار (من 1 إلى 5 نجوم):</label>
                      <div className="flex justify-center gap-2 py-3" dir="ltr">
                        {[1, 2, 3, 4, 5].map((starIdx) => {
                          const isLit = hoveredRating !== null 
                            ? starIdx <= hoveredRating 
                            : starIdx <= rating;
                          return (
                            <button
                              type="button"
                              key={starIdx}
                              onClick={() => setRating(starIdx)}
                              onMouseEnter={() => setHoveredRating(starIdx)}
                              onMouseLeave={() => setHoveredRating(null)}
                              className="p-1 text-2xl transition-all hover:scale-125 focus:outline-none cursor-pointer"
                              title={`${starIdx} نجوم`}
                            >
                              <Star 
                                size={32} 
                                className={cn(
                                  "transition-colors duration-200", 
                                  isLit ? "text-amber-500 fill-amber-500" : "text-gray-200"
                                )} 
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Feedback Comment Textarea */}
                    <div className="space-y-2">
                      <label className="block text-brand-navy/60 font-bold text-xs">ملاحظاتك وتعليقك:</label>
                      <textarea
                        required
                        rows={4}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="اكتب انطباعك العقاري بكل أمانة ومصداقية لمساعدة المستثمرين والعملاء الآخرين..."
                        className="w-full p-4 rounded-xl border border-brand-navy/10 focus:border-brand-gold outline-none transition-all placeholder:text-brand-navy/30 text-sm font-semibold bg-brand-cream/10"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full py-3.5 bg-brand-navy text-brand-gold rounded-xl font-bold text-sm hover:bg-brand-navy/90 transition-all flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {submittingReview ? (
                        <div className="w-5 h-5 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'حفظ وإرسال التقييم'
                      )}
                    </button>
                  </form>
                )
              ) : (
                <div className="p-6 bg-brand-cream/30 border border-brand-navy/5 rounded-2xl text-center space-y-4">
                  <span className="text-3xl block">🔒</span>
                  <p className="text-sm font-bold text-brand-navy">
                    يرجى تسجيل الدخول للتمكن من تقييم العقار وترك رأيك.
                  </p>
                  <p className="text-[11px] text-brand-navy/50 leading-relaxed font-semibold">
                    نحن نسمح للأعضاء والعملاء المؤهلين فقط بترك تقييمات لضمان جودة ومصداقية الآراء للمشترين.
                  </p>
                </div>
              )}
            </div>

            {/* Right: Existing Reviews list (7 cols on desktop) */}
            <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-brand-navy/5 shadow-sm space-y-6">
              <h4 className="font-serif text-xl font-bold text-brand-navy flex items-center justify-between border-b border-brand-navy/5 pb-3">
                <span className="text-xs bg-brand-gold/10 text-brand-navy font-bold px-2.5 py-1 rounded-lg border border-brand-gold/20">
                  {reviewsCount} تعليق
                </span>
                <span className="flex items-center gap-2">
                  آراء وتقييمات العملاء
                  <Star size={18} className="text-brand-gold fill-brand-gold" />
                </span>
              </h4>

              {loadingReviews ? (
                <div className="flex flex-col items-center justify-center py-12 text-brand-navy/40">
                  <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-xs font-bold">جاري تحميل الآراء العقارية...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-16 bg-brand-cream/15 rounded-2xl border border-dashed border-brand-navy/5 flex flex-col items-center justify-center space-y-3">
                  <span className="text-3xl">⭐</span>
                  <p className="text-sm font-bold text-brand-navy/50">لا يوجد أي تقييمات لهذا العقار حتى الآن.</p>
                  <p className="text-xs text-brand-navy/30 max-w-sm leading-relaxed">كن أول مستشار يشارك انطباعه الإيجابي والتقييم العادل لهذا العرض العقاري المميز!</p>
                </div>
              ) : (
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1 select-none scrollbar-thin">
                  {reviews.map((review) => {
                    const isMyOwnReview = currentUser && review.userId === currentUser.uid;
                    const dateFormatted = review.createdAt 
                      ? new Date(review.createdAt).toLocaleDateString('ar-SY', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'سابقاً';

                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={review.id}
                        className="p-5 rounded-2xl border border-brand-navy/5 bg-brand-cream/10 flex gap-4 text-right items-start group"
                      >
                        {/* Avatar block */}
                        <div className="w-12 h-12 rounded-xl bg-brand-navy text-brand-gold flex items-center justify-center flex-shrink-0 border border-brand-gold/20 shadow-md">
                          <UserIcon size={18} />
                        </div>

                        {/* Content block */}
                        <div className="flex-grow space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            {/* Star rating display */}
                            <div className="flex text-amber-500" dir="ltr">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={13} 
                                  className={cn(
                                    "fill-current", 
                                    i < review.rating ? "text-amber-500" : "text-gray-200"
                                  )} 
                                />
                              ))}
                            </div>

                            {/* Reviewer Name and Date */}
                            <div className="text-right flex items-center gap-2">
                              {isMyOwnReview && (
                                <span className="bg-brand-gold/15 text-brand-navy border border-brand-gold/30 text-[10px] px-2 py-0.5 rounded-lg font-bold">
                                  تقييمك الشخصي
                                </span>
                              )}
                              <span className="font-serif font-bold text-brand-navy text-sm">{review.userName}</span>
                            </div>
                          </div>

                          <p className="text-brand-navy/80 text-xs sm:text-sm leading-relaxed font-semibold">
                            {review.feedback}
                          </p>

                          <div className="flex justify-between items-center pt-2 border-t border-brand-navy/5">
                            {/* Action to delete if owner */}
                            {isMyOwnReview ? (
                              <button 
                                onClick={() => handleDeleteReview(review.id)}
                                className="text-red-500 hover:text-red-600 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="حذف تقييمك ورأيك"
                              >
                                <Trash2 size={13} />
                                <span>حذف التقييم</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-brand-navy/30 font-bold">موثق من شركة البراء النعيمي</span>
                            )}

                            <span className="text-[10px] text-brand-navy/40 font-bold font-mono">
                              {dateFormatted}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          </>
          ) : (
            <div className="space-y-6 animate-fade-in duration-500" id="virtual-tour-tab-view">
              {/* Introduction & VIP View Selector Toggle */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-navy/5 p-5 md:p-6 rounded-3xl border border-brand-navy/10">
                <div className="text-right">
                  <h4 className="font-serif text-base sm:text-lg font-black text-brand-navy flex items-center gap-2">
                    <span className="text-brand-gold animate-pulse">🌌</span>
                    <span>بوابة المعاينة والزيارة الافتراضية الذكية</span>
                  </h4>
                  <p className="text-[11px] sm:text-xs text-brand-navy/60 font-semibold mt-1">
                    تنقّل بين معرض الصور التقليدي عالي الدقة ووضع المحاكاة الافتراضية الشاملة لرؤية الغرف.
                  </p>
                </div>
                
                {/* Segemented Modern Slider Toggle */}
                <div className="flex bg-brand-navy/10 p-1.5 rounded-2xl w-full sm:w-auto" id="tour-view-selector-segmented">
                  <button
                    onClick={() => setTourViewType('gallery')}
                    className={cn(
                      "flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs sm:text-sm font-serif font-bold transition-all cursor-pointer flex items-center justify-center gap-2",
                      tourViewType === 'gallery'
                        ? "bg-white text-brand-navy shadow-md font-black scale-102"
                        : "text-brand-navy/70 hover:text-brand-navy"
                    )}
                    id="sub-tab-gallery"
                  >
                    <span>📷</span>
                    <span>معرض الصور العادي</span>
                  </button>
                  <button
                    onClick={() => setTourViewType('360')}
                    className={cn(
                      "flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs sm:text-sm font-serif font-bold transition-all cursor-pointer flex items-center justify-center gap-2",
                      tourViewType === '360'
                        ? "bg-brand-navy text-white shadow-md font-black scale-102"
                        : "text-brand-navy/50 hover:text-brand-navy"
                    )}
                    id="sub-tab-360"
                  >
                    <span>🧭</span>
                    <span>رادار ومحاكاة 360° VR</span>
                  </button>
                </div>
              </div>

              {/* View Rendering Container */}
              {tourViewType === 'gallery' ? (
                <div className="bg-white p-6 rounded-3xl border border-brand-navy/10 space-y-4 shadow-sm">
                  <div className="relative h-64 sm:h-[480px] w-full rounded-2xl overflow-hidden shadow-md bg-brand-navy/5">
                    {property.images && property.images.length > 0 ? (
                      <>
                        <img 
                          src={property.images[currentImageIndex]} 
                          alt={`${property.title} - ${currentImageIndex + 1}`}
                          className="w-full h-full object-cover transition-all duration-300"
                          referrerPolicy="no-referrer"
                        />
                        
                        {property.images.length > 1 && (
                          <>
                            {/* Slide Button Right */}
                            <button 
                              onClick={handlePrevImage} 
                              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
                              title="الصورة السابقة"
                            >
                              <ChevronRight size={24} />
                            </button>
                            
                            {/* Slide Button Left */}
                            <button 
                              onClick={handleNextImage} 
                              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
                              title="الصورة التالية"
                            >
                              <ChevronLeft size={24} />
                            </button>

                            {/* Bullet indicators */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/30 px-3.5 py-2 rounded-full backdrop-blur-sm">
                              {property.images.map((_, idx) => (
                                <span 
                                  key={idx} 
                                  className={cn(
                                    "w-2.5 h-2.5 rounded-full transition-all",
                                    currentImageIndex === idx ? "bg-brand-gold w-5" : "bg-white/60"
                                  )} 
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex bg-brand-navy/5 w-full h-full justify-center items-center font-serif font-bold text-brand-navy/40">
                        لا توجد صور متوفرة للمعرض
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Selector Strip */}
                  {property.images && property.images.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 max-w-full justify-center scrollbar-thin">
                      {property.images.map((imgUrl, idx) => (
                        <button 
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={cn(
                            "relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer",
                            currentImageIndex === idx ? "border-brand-gold scale-105 shadow" : "border-transparent opacity-65 hover:opacity-100"
                          )}
                        >
                          <img src={imgUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-3xl overflow-hidden shadow-lg border border-brand-navy/5">
                  <ThreeSixtyViewer property={property} />
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Interactive Social Share Modal Overlay */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-brand-navy/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-brand-gold/20 z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-brand-navy via-[#0F223D] to-brand-navy p-5 text-white flex items-center justify-between border-b border-brand-gold/20">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-brand-gold/10 rounded-xl border border-brand-gold/30 text-brand-gold">
                    <Share2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold">مشاركة العقار</h3>
                    <p className="text-[11px] text-white/70">انشر رابط العقار عبر كافة منصات التواصل الاجتماعي</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-5 overflow-y-auto scrollbar-thin text-right">
                {/* Property Card Summary */}
                <div className="flex items-center gap-3 p-3 bg-brand-cream/40 rounded-2xl border border-brand-navy/5">
                  {property.images && property.images[0] ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-16 h-16 rounded-xl object-cover border border-brand-navy/10 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-brand-navy/10 flex items-center justify-center text-xs shrink-0">🏠</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif font-bold text-brand-navy text-sm truncate">{property.title}</h4>
                    <p className="text-xs text-brand-navy/60 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} className="text-brand-gold shrink-0" />
                      <span className="truncate">{property.location}</span>
                    </p>
                    <p className="text-xs font-bold text-brand-gold mt-1 font-mono">
                      {formatPrice(property.price, displayCurrency, exchangeRate)}
                    </p>
                  </div>
                </div>

                {/* Direct Link Copy Control */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-brand-navy/70">رابط العقار المباشر:</label>
                  <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-200 focus-within:border-brand-gold transition-colors">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 shadow-sm cursor-pointer whitespace-nowrap active:scale-95 shrink-0",
                        copiedLink
                          ? "bg-emerald-600 text-white"
                          : "bg-brand-gold text-brand-navy hover:bg-brand-navy hover:text-brand-gold"
                      )}
                    >
                      {copiedLink ? (
                        <>
                          <Check size={14} />
                          <span>تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>نسخ الرابط</span>
                        </>
                      )}
                    </button>
                    <input
                      type="text"
                      readOnly
                      value={shareLink}
                      className="w-full bg-transparent border-none outline-none text-xs text-brand-navy font-mono font-medium px-2 py-1 text-left"
                      dir="ltr"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                  </div>
                </div>

                {/* Image Share & Download Section */}
                <div className="p-3 bg-brand-cream/60 border border-brand-gold/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-14 h-14 object-cover rounded-xl border border-brand-navy/10 shrink-0 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-brand-navy/10 rounded-xl flex items-center justify-center shrink-0">
                        <ImageIcon size={24} className="text-brand-navy/40" />
                      </div>
                    )}
                    <div className="text-right">
                      <span className="block text-xs font-bold text-brand-navy">صورة العقار الرئيسية</span>
                      <span className="block text-[11px] text-brand-navy/70">تُرفق تلقائياً عند المشاركة أو يمكن تحميلها مسبقاً</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadPropertyImage}
                    className={cn(
                      "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer",
                      downloadedImageSuccess
                        ? "bg-emerald-600 text-white"
                        : "bg-brand-gold hover:bg-brand-gold/90 text-brand-navy shadow-brand-gold/20"
                    )}
                  >
                    <Download size={15} />
                    <span>{downloadedImageSuccess ? 'تم تحميل الصورة! ✓' : 'تحميل صورة العقار'}</span>
                  </button>
                </div>

                {/* Mobile Native Share Sheet trigger */}
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    type="button"
                    disabled={isPreparingNativeShare}
                    onClick={handleNativeShare}
                    className="group relative w-full flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-brand-navy via-[#0F223D] to-brand-navy hover:from-[#0F223D] hover:to-brand-navy text-white rounded-2xl font-bold text-xs shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:scale-98 cursor-pointer border border-brand-gold/30 overflow-hidden disabled:opacity-70"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-brand-gold/0 via-brand-gold/20 to-brand-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                    <Smartphone size={17} className="text-brand-gold shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="font-bold">
                      {isPreparingNativeShare ? 'جاري تجهيز المنشور والصورة...' : 'مشاركة المنشور والصورة عبر قائمة مشاركة الجوال المباشرة 📲'}
                    </span>
                  </button>
                )}

                {/* Social Networks Platforms Grid */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-brand-navy/80">مشاركة مباشرة عبر المنصات الاجتماعيّة:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* WhatsApp */}
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`تصفح تفاصيل هذا العقار المميز "${property.title}" في ${property.location} عبر منصة البراء العقارية:\n${shareLink}${property.images?.[0] ? `\n\n🖼️ صورة العقار الرئيسية:\n${property.images[0]}` : ''}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative flex items-center justify-center gap-2.5 p-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-2xl font-bold text-xs shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-[#25D366]/20 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 select-none overflow-hidden"
                      title="مشاركة على واتساب"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                      <WhatsappIcon size={18} className="shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                      <span>واتساب</span>
                    </a>

                    {/* Facebook */}
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative flex items-center justify-center gap-2.5 p-3.5 bg-[#1877F2] hover:bg-[#1565CD] text-white rounded-2xl font-bold text-xs shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-[#1877F2]/20 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 select-none overflow-hidden"
                      title="مشاركة على فيسبوك"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                      <FacebookIcon size={18} className="shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                      <span>فيسبوك</span>
                    </a>

                    {/* X / Twitter */}
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(`تصفح هذا العقار الفاخر: ${property.title} في ${property.location}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative flex items-center justify-center gap-2.5 p-3.5 bg-[#000000] hover:bg-gray-900 text-white rounded-2xl font-bold text-xs shadow-md transition-all duration-300 hover:shadow-lg border border-white/10 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 select-none overflow-hidden"
                      title="مشاركة على منصة X"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                      <XIcon size={16} className="shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                      <span>إكس (تويتر)</span>
                    </a>

                    {/* Telegram */}
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(`تصفح تفاصيل هذا العقار المميّز: ${property.title}${property.images?.[0] ? `\n🖼️ صورة العقار: ${property.images[0]}` : ''}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative flex items-center justify-center gap-2.5 p-3.5 bg-[#0088CC] hover:bg-[#0077B3] text-white rounded-2xl font-bold text-xs shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-[#0088CC]/20 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 select-none overflow-hidden"
                      title="مشاركة على تليغرام"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                      <TelegramIcon size={18} className="shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                      <span>تليغرام</span>
                    </a>

                    {/* LinkedIn */}
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative flex items-center justify-center gap-2.5 p-3.5 bg-[#0A66C2] hover:bg-[#09519A] text-white rounded-2xl font-bold text-xs shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-[#0A66C2]/20 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 select-none overflow-hidden"
                      title="مشاركة على لينكد إن"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                      <LinkedinIcon size={18} className="shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                      <span>لينكد إن</span>
                    </a>

                    {/* Email */}
                    <a
                      href={`mailto:?subject=${encodeURIComponent(`عقار مميز: ${property.title}`)}&body=${encodeURIComponent(`مرحباً،\n\nأود مشاركة هذا العقار المميز معك:\nالعنوان: ${property.title}\nالموقع: ${property.location}\nالسعر: ${property.price}\n\nرابط المعاينة:\n${shareLink}${property.images?.[0] ? `\n\nصورة العقار:\n${property.images[0]}` : ''}`)}`}
                      className="group relative flex items-center justify-center gap-2.5 p-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-2xl font-bold text-xs shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-[#7C3AED]/20 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 select-none overflow-hidden"
                      title="مشاركة عبر البريد الإلكتروني"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                      <Mail size={18} className="shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                      <span>إيميل</span>
                    </a>
                  </div>
                </div>

                {/* Professional Ready-to-Share Posts Generator Section */}
                <div className="space-y-3 pt-3 border-t border-brand-navy/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-navy flex items-center gap-1.5 font-serif">
                      <Sparkles size={14} className="text-brand-gold animate-pulse" />
                      <span>منشورات احترافية مع رابط وصورة العقار ✨</span>
                    </span>
                    <span className="text-[10px] bg-brand-cream text-brand-navy px-2.5 py-0.5 rounded-full font-bold">
                      نسخ النص + تحميل تلقائي للصورة
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* WhatsApp Post */}
                    <button
                      type="button"
                      onClick={() => handleCopyPostAndDownloadImage('whatsapp', `🌟 *فرصة عقارية حصرية ومتميزة* 🌟
🏠 ${property.title}
📍 الموقع: ${property.location}
💵 السعر: ${property.price}
📐 المساحة: ${property.area ? `${property.area} م²` : 'مساحة واسعة'}
🛏️ التوزيع: ${property.rooms || 'غرف فسيحة'}

✨ ${property.description || 'عقار مميز بتشطيبات راقية وجاهز للمعاينة الفورية.'}
${property.images?.[0] ? `\n🖼️ *صورة العقار الرئيسية:*\n${property.images[0]}` : ''}

🔗 *للمعاينة والتفاصيل الكاملة:*
${shareLink}

#عقارات_سوريا #شركة_البراء_النعيمي #شقق_للبيع`)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer",
                        copiedPlatformPost === 'whatsapp'
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-md"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <WhatsappIcon size={16} />
                        <span>منشور واتساب (نسخ + تنزيل الصورة)</span>
                      </span>
                      <span className="text-[10px] font-mono opacity-85 px-2 py-0.5 bg-white/40 rounded-lg">
                        {copiedPlatformPost === 'whatsapp' ? '✓ تم النسخ!' : 'نسخ + صورة 🖼️'}
                      </span>
                    </button>

                    {/* Facebook Post */}
                    <button
                      type="button"
                      onClick={() => handleCopyPostAndDownloadImage('facebook', `🏡 *إعلان عقاري مميز من شركة البراء النعيمي للاستثمار العقاري* 🏡

يسرنا عرض هذا العقار الفاخر لعملائنا الكرام:
📍 الموقع: ${property.location} (${property.governorate || 'دمشق'})
🏢 النوع: ${property.type === 'Residential' ? 'سكني' : 'تجاري'} (${property.classification === 'under_construction' ? 'تحت الإنشاء' : 'جاهز للسكن'})
💵 السعر: ${property.price}
📐 المساحة: ${property.area ? `${property.area} م²` : 'غير محددة'}

📌 *التفاصيل:*
${property.description || 'عقار يجمع بين الفخامة والموقع الاستراتيجي.'}
${property.images?.[0] ? `\n🖼️ *صورة العقار الرئيسية:*\n${property.images[0]}` : ''}

🔗 للمزيد من التفاصيل ومعاينة الصور والخرائط عبر موقعنا الرسمي:
${shareLink}

#عقارات_دمشق #شركة_البراء_النعيمي #استثمار_عقاري #فلل_للبيع #شقق_دمشق`)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer",
                        copiedPlatformPost === 'facebook'
                          ? "bg-blue-600 text-white border-blue-700 shadow-md"
                          : "bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <FacebookIcon size={16} />
                        <span>منشور فيسبوك (نسخ + تنزيل الصورة)</span>
                      </span>
                      <span className="text-[10px] font-mono opacity-85 px-2 py-0.5 bg-white/40 rounded-lg">
                        {copiedPlatformPost === 'facebook' ? '✓ تم النسخ!' : 'نسخ + صورة 🖼️'}
                      </span>
                    </button>

                    {/* Telegram Post */}
                    <button
                      type="button"
                      onClick={() => handleCopyPostAndDownloadImage('telegram', `📢 *قناة عروض النخبة العقارية - شركة البراء النعيمي*

🏷️ *العقار:* ${property.title}
📍 *الموقع:* ${property.location}
💰 *السعر:* ${property.price}
📏 *المساحة:* ${property.area ? `${property.area} م²` : 'واسعة'}

✨ *نبذة:* ${property.description || 'فرصة استثمارية مميزة ومضمونة.'}
${property.images?.[0] ? `\n🖼️ *صورة العقار:*\n${property.images[0]}` : ''}

🔗 *رابط المعاينة المباشر:*
${shareLink}

📞 للحجز والاستفسار الفوري تواصل معنا عبر المنصة.
#عقارات #سوريا #دمشق #البراء_النعيمي`)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer",
                        copiedPlatformPost === 'telegram'
                          ? "bg-sky-600 text-white border-sky-700 shadow-md"
                          : "bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <TelegramIcon size={16} />
                        <span>منشور تليغرام (نسخ + تنزيل الصورة)</span>
                      </span>
                      <span className="text-[10px] font-mono opacity-85 px-2 py-0.5 bg-white/40 rounded-lg">
                        {copiedPlatformPost === 'telegram' ? '✓ تم النسخ!' : 'نسخ + صورة 🖼️'}
                      </span>
                    </button>

                    {/* X (Twitter) Post */}
                    <button
                      type="button"
                      onClick={() => handleCopyPostAndDownloadImage('twitter', `فرصة عقارية مميزة من شركة البراء النعيمي 👑
${property.title} في ${property.location}
السعر: ${property.price}
المساحة: ${property.area ? `${property.area} م²` : 'متميزة'}
${property.images?.[0] ? `صورة العقار: ${property.images[0]}\n` : ''}تصفح التفاصيل والمعاينة الفورية:
${shareLink}
#عقارات_سوريا #عقارات_دمشق #البراء_النعيمي`)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer",
                        copiedPlatformPost === 'twitter'
                          ? "bg-black text-white border-gray-800 shadow-md"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <XIcon size={15} />
                        <span>منشور إكس (نسخ + تنزيل الصورة)</span>
                      </span>
                      <span className="text-[10px] font-mono opacity-85 px-2 py-0.5 bg-white/40 rounded-lg">
                        {copiedPlatformPost === 'twitter' ? '✓ تم النسخ!' : 'نسخ + صورة 🖼️'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* QR Code Section & Download */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                      <QrCode size={14} className="text-brand-gold" />
                      <span>مسح رمز الاستجابة السريعة QR</span>
                    </span>
                    <p className="text-[11px] text-gray-500 max-w-[220px]">
                      امسح الرمز بكاميرا الجوال للانتقال المباشر لصفحة العقار
                    </p>
                    {qrCodeDataUrl && (
                      <a
                        href={qrCodeDataUrl}
                        download={`property-qr-${property.id}.png`}
                        className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-brand-navy hover:text-brand-gold transition-colors"
                      >
                        <Download size={12} />
                        <span>تحميل رمز QR الصورة</span>
                      </a>
                    )}
                  </div>
                  {qrCodeDataUrl && (
                    <div className="p-1.5 bg-white rounded-xl border border-gray-200 shadow-sm shrink-0">
                      <img src={qrCodeDataUrl} alt="QR Code" className="w-20 h-20 rounded-lg object-contain" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
