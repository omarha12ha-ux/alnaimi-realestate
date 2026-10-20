import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Appointment, Property, Service, Broker } from '../types';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

// Helper to safely parse dates formatted as YYYY-MM-DD
const parseLocalDate = (dateStr: string | undefined): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day);
    }
  }
  return new Date(dateStr);
};

export const generateInvoicePDF = async (
  app: Appointment,
  allProperties: Property[] = [],
  allServices: Service[] = []
): Promise<void> => {
  // 1. Fetch broker details if preferredBrokerId is supplied
  let brokerDetails: Broker | null = null;
  if (app.preferredBrokerId) {
    try {
      const brokerDoc = await getDoc(doc(db, 'brokers', app.preferredBrokerId));
      if (brokerDoc.exists()) {
        brokerDetails = { id: brokerDoc.id, ...brokerDoc.data() } as Broker;
      }
    } catch (e) {
      console.error("Could not fetch preferred broker details for PDF:", e);
    }
  }

  // 2. Resolve items / booking details
  const prop = allProperties.find(p => p.id === app.propertyId);
  const svc = allServices.find(s => s.id === app.serviceId);
  
  const displayTitle = svc ? svc.title : (prop ? prop.title : (app.serviceTitle || 'استشارة عقارية عامة'));
  const displayLocation = svc ? 'أونلاين / أو المقر الرئيسي للشركة' : (prop ? prop.location : 'المقر الرئيسي - دمشق');
  const displayPrice = svc ? svc.price : (prop ? prop.price : 'معاينة مجانية / استشارة عقارية');
  
  const formattedAppDate = format(parseLocalDate(app.date), 'eeee, d MMMM yyyy', { locale: arSA });
  const formattedIssueDate = format(new Date(), 'yyyy-MM-dd HH:mm');

  // Friendly translation of payment method
  let paymentMethodAr = 'مقر الشركة / معلق';
  if (app.paymentMethod === 'usd') paymentMethodAr = 'كاش دولاري (USD)';
  else if (app.paymentMethod === 'syp') paymentMethodAr = 'كاش ليرة سورية (SYP)';
  else if (app.paymentMethod === 'syriatel_cash') paymentMethodAr = 'سيريتل كاش (Syriatel Cash)';
  else if (app.paymentMethod === 'bank') paymentMethodAr = 'حوالة مصرفية رسمية';
  else if (app.paymentMethod === 'free') paymentMethodAr = 'خدمة مجانية بالكامل';

  // Translating status
  let statusAr = 'معلق بانتظار التأكيد';
  if (app.status === 'confirmed') statusAr = 'مؤكد وتم التثبيت ✔️';
  else if (app.status === 'completed') statusAr = 'تمت المعاينة والخدمة بنجاح';
  else if (app.status === 'cancelled') statusAr = 'ملغى';

  // 3. Construct a beautiful hidden HTML template container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '790px'; // optimal A4 width in px at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = '"Inter", sans-serif';
  container.style.color = '#111827';
  container.style.padding = '40px';
  container.style.direction = 'rtl';
  container.setAttribute('id', 'temp-invoice-pdf-container');

  container.innerHTML = `
    <!-- Top Decorative Gold Border -->
    <div style="height: 12px; background: linear-gradient(90deg, #c5a880 0%, #0e1b30 50%, #c5a880 100%); margin-bottom: 24px; border-radius: 6px;"></div>

    <!-- Header Section -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 24px; margin-bottom: 24px;">
      <!-- Logo & Company Name -->
      <div style="text-align: right;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <!-- Custom Golden Monument Icon -->
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 21H20M6 17H18M7 10V14M11 10V14M13 10V14M17 10V14M12 3L5 8V10H19V8L12 3Z" stroke="#c5a880" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span style="font-size: 20px; font-weight: 900; color: #0e1b30;">شركة البراء النعيمي عقارات</span>
        </div>
        <p style="font-size: 11px; color: #6b7280; font-weight: 700; margin: 0; line-height: 1.4;">البراء النعيمي للتنمية والتطوير والاستثمار العقاري الفاخر 🏛️</p>
        <p style="font-size: 10px; color: #9ca3af; margin: 2px 0 0 0;">دمشق، سوريا - أوتوستراد المزة، برج النعيمي الفاخر</p>
      </div>

      <!-- Invoice Title / General Info -->
      <div style="text-align: left;">
        <span style="background-color: #f59e0b; color: #0e1b30; font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 9999px; display: inline-block; margin-bottom: 8px;">حجز رسمي معتمد</span>
        <h1 style="font-size: 22px; font-weight: 800; color: #0e1b30; margin: 0;">فاتورة تأكيد حجز الموعد</h1>
        <p style="font-size: 11px; color: #4b5563; margin: 4px 0 0 0; font-weight: 700;">رقم الفاتورة: <span style="font-family: monospace; font-size: 12px; font-weight: 800; color: #c5a880;">#INV-${app.id.slice(0, 8).toUpperCase()}</span></p>
      </div>
    </div>

    <!-- Metadata Details Bento Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
      <!-- Customer Info Card -->
      <div style="background-color: #fdfbf7; border: 1px solid #f5ede0; border-radius: 16px; padding: 18px; text-align: right;">
        <h3 style="font-size: 13px; font-weight: 900; color: #0e1b30; border-bottom: 1px dashed #d4af37; padding-bottom: 8px; margin-top: 0; margin-bottom: 12px;">👤 بيانات العميل والحاجز</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <tr>
            <td style="color: #6b7280; padding: 4px 0; width: 40%; font-weight: 700;">الاسم بالكامل:</td>
            <td style="color: #0e1b30; padding: 4px 0; font-weight: 800;">${app.clientName}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 4px 0; font-weight: 700;">رقم الهاتف:</td>
            <td style="color: #0e1b30; padding: 4px 0; font-weight: 800; font-family: monospace;">${app.clientPhone || 'غير متوفر'}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 4px 0; font-weight: 700;">البريد الإلكتروني:</td>
            <td style="color: #0e1b30; padding: 4px 0; font-weight: 800; font-family: monospace;">${app.clientEmail || 'غير متوفر'}</td>
          </tr>
        </table>
      </div>

      <!-- Quick Appointment Info Card -->
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; text-align: right;">
        <h3 style="font-size: 13px; font-weight: 900; color: #0e1b30; border-bottom: 1px dashed #c5a880; padding-bottom: 8px; margin-top: 0; margin-bottom: 12px;">📅 معلومات توقيت الموعد</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <tr>
            <td style="color: #6b7280; padding: 4px 0; width: 40%; font-weight: 700;">اليوم والتاريخ:</td>
            <td style="color: #0e1b30; padding: 4px 0; font-weight: 800;">${formattedAppDate}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 4px 0; font-weight: 700;">توقيت المعاينة:</td>
            <td style="color: #d97706; padding: 4px 0; font-weight: 900;">الساعة ${app.time}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 4px 0; font-weight: 700;">دقة وتعديل:</td>
            <td style="color: #10b981; padding: 4px 0; font-weight: 800;">مجدول بالمنطقة الزمنية المحلية</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Booking Items Table -->
    <h3 style="font-size: 13px; font-weight: 900; color: #0e1b30; margin-bottom: 10px; text-align: right; display: flex; align-items: center; gap: 6px;">
      <span>📌</span> تفاصيل الحجز ومحركات المعاينة العقارية
    </h3>
    <table style="width: 100%; border-collapse: collapse; text-align: right; margin-bottom: 24px; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
      <thead>
        <tr style="background-color: #0e1b30; color: #ffffff; font-size: 11px; font-weight: 800;">
          <th style="padding: 12px 16px; text-align: right;">وصف الخدمة / العقار المطلوبة</th>
          <th style="padding: 12px 16px; text-align: right;">الموقع الميداني / القناة</th>
          <th style="padding: 12px 16px; text-align: left;">طريقة الدفع المعمدة والرسوم</th>
        </tr>
      </thead>
      <tbody>
        <tr style="font-size: 11px; border-bottom: 1px solid #e5e7eb; background-color: #ffffff;">
          <td style="padding: 14px 16px; font-weight: 800; color: #0e1b30; line-height: 1.4;">
            ${displayTitle}
            <div style="font-size: 9px; color: #6b7280; margin-top: 4px; font-weight: 600;">طلب معاينة ميدانية ودراسة تفصيلية مع العميل بالموعد المحدد.</div>
          </td>
          <td style="padding: 14px 16px; font-weight: 700; color: #4b5563;">${displayLocation}</td>
          <td style="padding: 14px 16px; font-weight: 900; color: #b45309; text-align: left;">
            <div>${displayPrice}</div>
            <div style="font-size: 9px; color: #6b7280; font-weight: 700; margin-top: 3px;">طريقة الدفع: ${paymentMethodAr}</div>
          </td>
        </tr>
      </tbody>
    </table>

    <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; margin-bottom: 24px; align-items: start;">
      <!-- Real Estate Advisor Box -->
      <div style="background-color: #f0f4f8; border: 1px solid #d0e0f0; border-radius: 16px; padding: 18px; text-align: right;">
        <h3 style="font-size: 13px; font-weight: 900; color: #0e1b30; border-bottom: 1px solid #bdd0e4; padding-bottom: 8px; margin-top: 0; margin-bottom: 12px;">👔 بيانات المستشار العقاري المسؤول</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <tr>
            <td style="color: #6b7280; padding: 4px 0; width: 40%; font-weight: 700;">اسم كابتن المعاينة:</td>
            <td style="color: #0e1b30; padding: 4px 0; font-weight: 800;">${app.preferredBrokerName || 'مستشار عقاري مخصص من الشركة'}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 4px 0; font-weight: 700;">هاتف التواصل المباشر:</td>
            <td style="color: #0e1b30; padding: 4px 0; font-weight: 800; font-family: monospace;">${brokerDetails?.phone || '+963 945 430 030'}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 4px 0; font-weight: 700;">البريد الفني للمستشار:</td>
            <td style="color: #0e1b30; padding: 4px 0; font-weight: 800; font-family: monospace;">${brokerDetails?.email || 'info@alnaimi-realestate.com'}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 4px 0; font-weight: 700;">الاختصاص العقاري:</td>
            <td style="color: #1e3a8a; padding: 4px 0; font-weight: 800;">
              ${brokerDetails?.specialties?.join(' • ') || 'تطوير وتسويق عقاري ميداني'}
            </td>
          </tr>
        </table>
      </div>

      <!-- Payment / General Status Summary Box -->
      <div style="background-color: #fdfdfd; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; text-align: right;">
        <h3 style="font-size: 13px; font-weight: 900; color: #0e1b30; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-top: 0; margin-bottom: 12px;">📑 خلاصة الحالة والتوثيق</h3>
        <div style="margin-bottom: 8px;">
          <span style="font-size: 10px; color: #6b7280; display: block; font-weight: 700;">تاريخ إصدار المستند:</span>
          <span style="font-size: 11px; font-weight: 700; color: #0e1b30; font-family: monospace;">${formattedIssueDate}</span>
        </div>
        <div>
          <span style="font-size: 10px; color: #6b7280; display: block; font-weight: 700;">حالة الفاتورة والنظام:</span>
          <span style="font-size: 12px; font-weight: 900; color: ${app.status === 'confirmed' ? '#10b981' : app.status === 'completed' ? '#2563eb' : '#d97706'}">${statusAr}</span>
        </div>
      </div>
    </div>

    <!-- Official Stamp, Signatures & QR Code Section -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 24px; border-top: 2px dashed #e5e7eb; margin-bottom: 24px;">
      <!-- Stamp Box -->
      <div style="text-align: right;">
        <p style="font-size: 10px; color: #6b7280; font-weight: 700; margin-bottom: 8px;">التصديق والموافقة الفورية:</p>
        <div style="display: flex; align-items: center; gap: 15px;">
          <!-- Stamp representation -->
          <div style="width: 80px; height: 80px; border-radius: 100%; border: 3px double #d4af37; background-color: #fffaf0; display: flex; flex-direction: column; items-center; justify-content: center; text-align: center; position: relative;">
            <div style="font-size: 7px; color: #d4af37; font-weight: 900; transform: rotate(-5deg); line-height: 1;">شركة النعيمي</div>
            <div style="font-size: 7px; color: #0e1b30; font-weight: 800; border-top: 1px solid #d4af37; border-bottom: 1px solid #d4af37; transform: rotate(-5deg); padding: 2px 0; margin: 2px 0 3px 0; line-height: 1;">مؤكد ومصادق</div>
            <div style="font-size: 6px; color: #d4af37; font-weight: 900; transform: rotate(-5deg); line-height: 1;">دمشق - سوريا</div>
          </div>
          <!-- Signature representation -->
          <div>
            <div style="font-family: 'Georgia', serif; font-style: italic; font-size: 14px; font-weight: 800; color: #0c1a30; transform: rotate(-3deg); margin-bottom: 4px;">Al-Naimi Realestate</div>
            <p style="font-size: 9px; color: #9ca3af; margin: 0; font-weight: 700;">المدير العام: م. البراء النعيمي</p>
          </div>
        </div>
      </div>

      <!-- Legal Footers -->
      <div style="text-align: left; max-width: 320px;">
        <p style="font-size: 8px; color: #9ca3af; line-height: 1.5; margin: 0; text-align: left;">
          هذا المستند هو مستند رسمي لإثبات الموعد صادر تلقائياً عن شركة البراء النعيمي للتطوير العقاري. تسري صلاحية الموعد وتفاصيله وفق الشروط والأحكام المعتمدة بالاتفاقية الأساسية. يرجى إبراز هذه الفاتورة الرقمية لمندوبنا عند مباشرة المعاينة الميدانية بدمشق.
        </p>
      </div>
    </div>

    <!-- Corporate Footer banner -->
    <div style="background-color: #0e1b30; border-radius: 12px; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; color: #ffffff;">
      <span style="font-size: 9px; color: #c5a880; font-weight: 700;">النعيمي الفاخرة لتطوير وبناء مجتمعات الغد العقارية 🏛️</span>
      <span style="font-size: 9px; color: #9ca3af; font-family: monospace; font-weight: 700;">موقع مالي آمن موثق بالكامل • 2026</span>
    </div>
  `;

  // 4. Append to body to render in DOM
  document.body.appendChild(container);

  // Allow web fonts/DOM state to prepare
  await new Promise(resolve => setTimeout(resolve, 80));

  try {
    // 5. Run html2canvas on the invoice container
    const canvas = await html2canvas(container, {
      scale: 2, // Retain sharp details and crisp text rendering
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');

    // 6. Generate the standard A4 PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // 7. Save file locally
    const filename = `invoice_appointment_${app.id.slice(0, 8).toUpperCase()}.pdf`;
    pdf.save(filename);
  } catch (err) {
    console.error("PDF generation or rendering collapsed:", err);
  } finally {
    // 8. Clean up DOM safely
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};

export const generateBrokersReportPDF = async (
  brokers: Broker[],
  getBrokerConfidence: (brokerId: string, brokerName: string) => { completed: number; cancelled: number; total: number; score: number; allAppsCount: number },
  getBrokerAverageTimePerDeal: (brokerId: string, brokerName: string) => string
): Promise<void> => {
  const formattedIssueDate = format(new Date(), 'yyyy-MM-dd HH:mm');
  const totalBrokers = brokers.length;
  const activeBrokers = brokers.filter(b => b.status === 'active').length;
  const totalDeals = brokers.reduce((acc, b) => acc + (b.dealsCount || 0), 0);
  const avgCommission = totalBrokers > 0
    ? (brokers.reduce((acc, b) => acc + (b.commissionRate || 0), 0) / totalBrokers).toFixed(2)
    : '0';

  // Create container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '1120px'; // wider container for multi-column report
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = '"Inter", sans-serif';
  container.style.color = '#111827';
  container.style.padding = '40px';
  container.style.direction = 'rtl';
  container.setAttribute('id', 'temp-brokers-pdf-container');

  // Let's build the HTML template
  const brokerRows = brokers.map((b, index) => {
    const stats = getBrokerConfidence(b.id, b.name);
    const avgTime = getBrokerAverageTimePerDeal(b.id, b.name);
    const ratingVal = b.rating || 5.0;
    const dealsVal = b.dealsCount || 0;
    let rankAr = '🥉 وسيط برونزي';
    let rankColor = '#6b7280';
    if (dealsVal >= 10 && ratingVal >= 4.5) {
      rankAr = '🏅 وسيط ذهبي';
      rankColor = '#d97706';
    } else if (dealsVal >= 5 && ratingVal >= 4.0) {
      rankAr = '🥈 وسيط فضي';
      rankColor = '#4b5563';
    }

    const completionRate = stats.score;
    const isOnlineActive = b.status === 'active';

    return `
      <tr style="font-size: 11px; border-bottom: 1px solid #e5e7eb; background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
        <td style="padding: 12px 14px; font-weight: 800; color: #0e1b30;">${b.name}</td>
        <td style="padding: 12px 14px; font-weight: 700; color: #4b5563;">${b.governorate || 'دمشق'}</td>
        <td style="padding: 12px 14px; font-weight: 800; font-family: monospace; color: #111827;">${b.phone}</td>
        <td style="padding: 12px 14px; font-weight: 900; color: #0e1b30; text-align: center;">${dealsVal} صفقة</td>
        <td style="padding: 12px 14px; text-align: center;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <span style="font-weight: 900; color: ${completionRate >= 80 ? '#10b981' : completionRate >= 50 ? '#f59e0b' : '#ef4444'};">${completionRate}%</span>
            <div style="width: 60px; background-color: #e5e7eb; border-radius: 9999px; height: 4px; overflow: hidden; margin: 0 auto;">
              <div style="background-color: ${completionRate >= 80 ? '#10b981' : completionRate >= 50 ? '#f59e0b' : '#ef4444'}; width: ${completionRate}%; height: 100%;"></div>
            </div>
          </div>
        </td>
        <td style="padding: 12px 14px; font-weight: 800; color: #4b5563; text-align: center;">${avgTime}</td>
        <td style="padding: 12px 14px; font-weight: 900; color: #0e1b30; text-align: center; font-family: monospace;">${b.commissionRate}%</td>
        <td style="padding: 12px 14px; font-weight: 800; color: ${rankColor}; text-align: center;">${rankAr}</td>
        <td style="padding: 12px 14px; text-align: center;">
          <span style="background-color: ${isOnlineActive ? '#ecfdf5' : '#f3f4f6'}; color: ${isOnlineActive ? '#047857' : '#4b5563'}; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; border: 1px solid ${isOnlineActive ? '#a7f3d0' : '#e5e7eb'};">
            ${isOnlineActive ? 'نشط وقائم' : 'موقف'}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <!-- Top Decorative Gold Border -->
    <div style="height: 12px; background: linear-gradient(90deg, #c5a880 0%, #0e1b30 50%, #c5a880 100%); margin-bottom: 24px; border-radius: 6px;"></div>

    <!-- Header Section -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 24px; margin-bottom: 24px;">
      <!-- Logo & Company Name -->
      <div style="text-align: right;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <!-- Custom Golden Monument Icon -->
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 21H20M6 17H18M7 10V14M11 10V14M13 10V14M17 10V14M12 3L5 8V10H19V8L12 3Z" stroke="#c5a880" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span style="font-size: 22px; font-weight: 900; color: #0e1b30;">شركة البراء النعيمي للاستثمار العقاري</span>
        </div>
        <p style="font-size: 11px; color: #6b7280; font-weight: 700; margin: 0; line-height: 1.4;">إدارة الموارد البشرية والشركاء العقاريين المعتمدين 🏛️</p>
        <p style="font-size: 10px; color: #9ca3af; margin: 2px 0 0 0;">دمشق، سوريا - أوتوستراد المزة، برج النعيمي الفاخر</p>
      </div>

      <!-- Report Title / General Info -->
      <div style="text-align: left;">
        <span style="background-color: #0e1b30; color: #c5a880; font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 9999px; display: inline-block; margin-bottom: 8px;">الإدارة العامة للشركة</span>
        <h1 style="font-size: 24px; font-weight: 900; color: #0e1b30; margin: 0;">تقرير أداء الوسطاء العقاريين</h1>
        <p style="font-size: 11px; color: #4b5563; margin: 4px 0 0 0; font-weight: 700;">تاريخ إصدار التقرير: <span style="font-family: monospace; font-size: 12px; font-weight: 800; color: #c5a880;">${formattedIssueDate}</span></p>
      </div>
    </div>

    <!-- Summary Statistics Grid -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px;">
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; text-align: center;">
        <span style="font-size: 10px; color: #6b7280; font-weight: 700; display: block; margin-bottom: 4px;">إجمالي الوسطاء</span>
        <span style="font-size: 22px; font-weight: 900; color: #0e1b30;">${totalBrokers}</span>
      </div>
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 16px; padding: 16px; text-align: center;">
        <span style="font-size: 10px; color: #047857; font-weight: 700; display: block; margin-bottom: 4px;">الوسطاء النشطون</span>
        <span style="font-size: 22px; font-weight: 900; color: #047857;">${activeBrokers}</span>
      </div>
      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 16px; padding: 16px; text-align: center;">
        <span style="font-size: 10px; color: #b45309; font-weight: 700; display: block; margin-bottom: 4px;">إجمالي الصفقات المبرمة</span>
        <span style="font-size: 22px; font-weight: 900; color: #b45309;">${totalDeals}</span>
      </div>
      <div style="background-color: #fdfbf7; border: 1px solid #f5ede0; border-radius: 16px; padding: 16px; text-align: center;">
        <span style="font-size: 10px; color: #78350f; font-weight: 700; display: block; margin-bottom: 4px;">متوسط العمولات</span>
        <span style="font-size: 22px; font-weight: 900; color: #78350f; font-family: monospace;">${avgCommission}%</span>
      </div>
    </div>

    <!-- Table Section -->
    <h3 style="font-size: 14px; font-weight: 900; color: #0e1b30; margin-bottom: 12px; text-align: right; display: flex; align-items: center; gap: 6px;">
      <span>📊</span> جدول البيانات التحليلية التفصيلية لأداء الوسطاء
    </h3>
    <table style="width: 100%; border-collapse: collapse; text-align: right; margin-bottom: 30px; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
      <thead>
        <tr style="background-color: #0e1b30; color: #ffffff; font-size: 11px; font-weight: 800;">
          <th style="padding: 12px 14px; text-align: right;">الاسم الكامل للوسيط</th>
          <th style="padding: 12px 14px; text-align: right;">المحافظة / المنطقة</th>
          <th style="padding: 12px 14px; text-align: right;">رقم الهاتف</th>
          <th style="padding: 12px 14px; text-align: center;">عدد الصفقات</th>
          <th style="padding: 12px 14px; text-align: center;">معدل إنجاز المعاينات</th>
          <th style="padding: 12px 14px; text-align: center;">متوسط الوقت للصفقة</th>
          <th style="padding: 12px 14px; text-align: center;">نسبة العمولة المتفق عليها</th>
          <th style="padding: 12px 14px; text-align: center;">تصنيف فئة الوسيط</th>
          <th style="padding: 12px 14px; text-align: center;">الحالة التشغيلية</th>
        </tr>
      </thead>
      <tbody>
        ${brokerRows}
      </tbody>
    </table>

    <!-- Official Stamp, Signatures & Certification Box -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 30px; border-top: 2px dashed #e5e7eb; margin-bottom: 30px;">
      <!-- Stamp Box -->
      <div style="text-align: right;">
        <p style="font-size: 10px; color: #6b7280; font-weight: 700; margin-bottom: 10px;">مصادقة واعتماد الإدارة العامة لشركة البراء النعيمي:</p>
        <div style="display: flex; align-items: center; gap: 20px;">
          <!-- Stamp representation -->
          <div style="width: 90px; height: 90px; border-radius: 100%; border: 3px double #d4af37; background-color: #fffaf0; display: flex; flex-direction: column; items-center; justify-content: center; text-align: center; position: relative;">
            <div style="font-size: 8px; color: #d4af37; font-weight: 900; transform: rotate(-5deg); line-height: 1;">شركة النعيمي</div>
            <div style="font-size: 7px; color: #0e1b30; font-weight: 800; border-top: 1px solid #d4af37; border-bottom: 1px solid #d4af37; transform: rotate(-5deg); padding: 2px 0; margin: 3px 0; line-height: 1;">مؤكد ومعتمد</div>
            <div style="font-size: 7px; color: #d4af37; font-weight: 900; transform: rotate(-5deg); line-height: 1;">دمشق - سوريا</div>
          </div>
          <!-- Signature representation -->
          <div>
            <div style="font-family: 'Georgia', serif; font-style: italic; font-size: 16px; font-weight: 800; color: #0c1a30; transform: rotate(-3deg); margin-bottom: 4px;">Al-Naimi Executive</div>
            <p style="font-size: 10px; color: #9ca3af; margin: 0; font-weight: 700;">المدير العام للمجموعة: م. البراء النعيمي</p>
          </div>
        </div>
      </div>

      <!-- Legal Footers -->
      <div style="text-align: left; max-width: 450px;">
        <p style="font-size: 9px; color: #9ca3af; line-height: 1.6; margin: 0; text-align: left;">
          يعد هذا التقرير مستنداً داخلياً رسمياً لتقييم أداء الشركاء العقاريين والوسطاء العاملين تحت رخصة وعلامة شركة البراء النعيمي للاستثمار والتطوير العقاري. يتم استخدام هذه البيانات والمؤشرات لتوزيع حصص العمولات السنوية، وتحديث قوائم التكريم وتفضيل الوسطاء لتلقي طلبات المعاينة المباشرة للعملاء المميزين ونادي الـ VIP العقاري المعتمد.
        </p>
      </div>
    </div>

    <!-- Corporate Footer banner -->
    <div style="background-color: #0e1b30; border-radius: 12px; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; color: #ffffff;">
      <span style="font-size: 10px; color: #c5a880; font-weight: 700;">النعيمي لتطوير وبناء المستقبل العقاري السوري الرائد 🏛️</span>
      <span style="font-size: 10px; color: #9ca3af; font-family: monospace; font-weight: 700;">نظام إداري مالي موثق ومشفر سحابياً • 2026</span>
    </div>
  `;

  // Append to body to render in DOM
  document.body.appendChild(container);

  // Allow web fonts/DOM state to prepare
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // High resolution
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Save report
    const filename = `brokers_performance_report_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(filename);
  } catch (err) {
    console.error("Brokers PDF generation or rendering collapsed:", err);
  } finally {
    // Clean up DOM safely
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};

export const generateMonthlyReportPDF = async (
  monthLabel: string,
  selectedGov: string,
  appointmentsCount: number,
  avgPriceStr: string,
  discountedCount: number,
  completionRate: number,
  traditionalRate: number,
  statusCounts: {
    completed: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    archived: number;
  },
  activityGovData: any[],
  topPropertiesData: any[],
  priceChangesData: any[]
): Promise<void> => {
  const formattedIssueDate = format(new Date(), 'yyyy-MM-dd HH:mm');

  // Create temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '1120px'; // A4 landscape width representation
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = '"Inter", sans-serif';
  container.style.color = '#111827';
  container.style.padding = '40px';
  container.style.direction = 'rtl';
  container.setAttribute('id', 'temp-monthly-report-pdf-container');

  // Build HTML Content
  const activityRows = activityGovData.map((d, index) => {
    const totalViews = d["إجمالي المشاهدات"] || 0;
    const totalBookings = d["الحجوزات والطلبات"] || 0;
    return `
      <tr style="font-size: 11px; border-bottom: 1px solid #e5e7eb; background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
        <td style="padding: 10px 14px; font-weight: 800; color: #0e1b30; text-align: right;">${d.name}</td>
        <td style="padding: 10px 14px; font-weight: 700; color: #4b5563; text-align: center;">${totalViews} زيارة</td>
        <td style="padding: 10px 14px; font-weight: 800; color: #9c7c45; text-align: center;">${totalBookings} حجز</td>
        <td style="padding: 10px 14px; text-align: right;">
          <div style="display: flex; align-items: center; gap: 8px; justify-content: flex-end;">
            <div style="width: 120px; background-color: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden; display: flex; direction: ltr;">
              <div style="background-color: #0e1b30; width: ${Math.min(100, (totalViews / (totalViews + totalBookings || 1)) * 100)}%; height: 100%;"></div>
              <div style="background-color: #c4a674; width: ${Math.min(100, (totalBookings / (totalViews + totalBookings || 1)) * 100)}%; height: 100%;"></div>
            </div>
            <span style="font-size: 9px; color: #6b7280; font-family: monospace;">(${totalViews + totalBookings})</span>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const topPropertiesRows = topPropertiesData.map((d, index) => {
    const directBookings = d["الحجوزات المباشرة"] || 0;
    const interestViews = d["مؤشر الزيارات"] || 0;
    return `
      <tr style="font-size: 11px; border-bottom: 1px solid #e5e7eb; background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
        <td style="padding: 10px 14px; font-weight: 800; color: #0e1b30; text-align: right; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${d.fullName}">
          ${d.fullName}
        </td>
        <td style="padding: 10px 14px; font-weight: 800; color: #10b981; text-align: center;">${directBookings} حجوزات</td>
        <td style="padding: 10px 14px; font-weight: 700; color: #4b5563; text-align: center;">${interestViews} مشاهدة</td>
        <td style="padding: 10px 14px; text-align: center;">
          <div style="display: flex; gap: 2px; justify-content: center;">
            ${Array.from({ length: Math.min(5, directBookings + 1) }).map(() => `<span style="color: #c5a880;">★</span>`).join('')}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const priceChangesRows = priceChangesData.map((d, index) => {
    const avgPrice = d["متوسط السعر المعروض (مليون ل.س)"] || 0;
    const avgDiscount = d["متوسط التغير والتخفيض (مليون ل.س)"] || 0;
    return `
      <tr style="font-size: 11px; border-bottom: 1px solid #e5e7eb; background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
        <td style="padding: 10px 14px; font-weight: 800; color: #0e1b30; text-align: right;">${d.name}</td>
        <td style="padding: 10px 14px; font-weight: 800; color: #0e1b30; text-align: center; font-family: monospace;">${avgPrice.toLocaleString()} مليون ل.س</td>
        <td style="padding: 10px 14px; font-weight: 900; color: #ef4444; text-align: center; font-family: monospace;">
          ${avgDiscount > 0 ? `${avgDiscount.toLocaleString()} مليون ل.س` : 'لا يوجد خصم'}
        </td>
        <td style="padding: 10px 14px; font-weight: 700; color: #6b7280; text-align: center;">${d.propertiesCount} عقارات / ${d.offersCount} عروض</td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <!-- Top Decorative Gold Border -->
    <div style="height: 12px; background: linear-gradient(90deg, #c5a880 0%, #0e1b30 50%, #c5a880 100%); margin-bottom: 24px; border-radius: 6px;"></div>

    <!-- Header Section -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 24px; margin-bottom: 24px;">
      <!-- Logo & Company Name -->
      <div style="text-align: right;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <!-- Custom Golden Monument Icon -->
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 21H20M6 17H18M7 10V14M11 10V14M13 10V14M17 10V14M12 3L5 8V10H19V8L12 3Z" stroke="#c5a880" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span style="font-size: 22px; font-weight: 900; color: #0e1b30;">شركة البراء النعيمي للتسويق والخدمات العقارية</span>
        </div>
        <p style="font-size: 11px; color: #6b7280; font-weight: 700; margin: 0; line-height: 1.4;">منصة التحليلات العقارية والتقارير الإدارية المعتمدة 🏛️</p>
        <p style="font-size: 10px; color: #9ca3af; margin: 2px 0 0 0;">دمشق، سوريا - أوتوستراد المزة، برج النعيمي الفاخر</p>
      </div>

      <!-- Report Title / General Info -->
      <div style="text-align: left;">
        <span style="background-color: #0e1b30; color: #c5a880; font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 9999px; display: inline-block; margin-bottom: 8px;">إدارة التخطيط والمتابعة</span>
        <h1 style="font-size: 22px; font-weight: 900; color: #0e1b30; margin: 0;">التقرير الشهري ومؤشرات حركة العقارات</h1>
        <p style="font-size: 11px; color: #4b5563; margin: 4px 0 0 0; font-weight: 700;">تاريخ إصدار التقرير: <span style="font-family: monospace; font-size: 12px; font-weight: 800; color: #c5a880;">${formattedIssueDate}</span></p>
      </div>
    </div>

    <!-- KPI Statistics Grid -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; text-align: center;">
        <span style="font-size: 10px; color: #6b7280; font-weight: 700; display: block; margin-bottom: 4px;">نطاق الدراسة والتحليل</span>
        <span style="font-size: 18px; font-weight: 900; color: #0e1b30;">${selectedGov === 'جميع المحافظات' ? 'القطاع السوري الشامل' : `محافظة ${selectedGov}`}</span>
      </div>
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 16px; padding: 16px; text-align: center;">
        <span style="font-size: 10px; color: #047857; font-weight: 700; display: block; margin-bottom: 4px;">الحجوزات والمعاينات لشهر ${monthLabel}</span>
        <span style="font-size: 22px; font-weight: 900; color: #047857;">${appointmentsCount} حجز</span>
      </div>
      <div style="background-color: #fdfbf7; border: 1px solid #f5ede0; border-radius: 16px; padding: 16px; text-align: center;">
        <span style="font-size: 10px; color: #78350f; font-weight: 700; display: block; margin-bottom: 4px;">متوسط القيمة المعروضة للعقود</span>
        <span style="font-size: 18px; font-weight: 900; color: #78350f; font-family: sans-serif;">${avgPriceStr}</span>
      </div>
      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 16px; padding: 16px; text-align: center;">
        <span style="font-size: 10px; color: #b45309; font-weight: 700; display: block; margin-bottom: 4px;">عقارات بتخفيضات نشطة</span>
        <span style="font-size: 22px; font-weight: 900; color: #b45309;">${discountedCount} عرض خصم</span>
      </div>
    </div>

    <!-- Appointment Efficiency Section -->
    <div style="background-color: #fdfbf7; border: 1px solid #f5ede0; border-radius: 20px; padding: 20px; margin-bottom: 24px; text-align: right;">
      <h3 style="font-size: 13px; font-weight: 900; color: #0e1b30; border-bottom: 1px dashed #d4af37; padding-bottom: 10px; margin-top: 0; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
        <span>🎯</span> مؤشرات كفاءة المواعيد ونسب الإنجاز الذكية لشهر ${monthLabel}
      </h3>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: start;">
        <!-- Left: Summary explanation and smart efficiency rate -->
        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; padding: 16px; border-radius: 14px; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h4 style="font-size: 12px; font-weight: 800; color: #0e1b30; margin: 0 0 6px 0;">معدل كفاءة الأداء الفعلي (مستثنى المواعيد المؤرشفة)</h4>
            <p style="font-size: 10px; color: #6b7280; line-height: 1.5; margin: 0;">
              تحسب نسبة الإنجاز الذكية على أساس المعاينات الفعالة النشطة فقط مع استثناء المواعيد المؤرشفة أو المغلقة مسبقاً، وذلك لقياس الدقة والالتزام الميداني وتجنب تشتيت الإحصائيات.
            </p>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px 14px; border-radius: 10px;">
            <span style="font-size: 11px; font-weight: 800; color: #166534;">معدل الإنجاز الذكي المعتمد:</span>
            <span style="font-size: 20px; font-weight: 900; color: #166534; font-family: monospace;">${completionRate}%</span>
          </div>
        </div>

        <!-- Right: Status breakdown metrics -->
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <!-- Completed -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 800; margin-bottom: 4px;">
              <span style="color: #111827;">✔️ معاينات مكتملة بنجاح</span>
              <span style="color: #10b981;">${statusCounts.completed} مواعيد (${appointmentsCount > 0 ? Math.round((statusCounts.completed / appointmentsCount) * 100) : 0}%)</span>
            </div>
            <div style="width: 100%; background-color: #e5e7eb; height: 6px; border-radius: 3px; overflow: hidden;">
              <div style="background-color: #10b981; width: ${appointmentsCount > 0 ? Math.round((statusCounts.completed / appointmentsCount) * 100) : 0}%; height: 100%;"></div>
            </div>
          </div>
          <!-- Confirmed -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 800; margin-bottom: 4px;">
              <span style="color: #111827;">📅 معاينات مؤكدة نشطة</span>
              <span style="color: #0e1b30;">${statusCounts.confirmed} مواعيد (${appointmentsCount > 0 ? Math.round((statusCounts.confirmed / appointmentsCount) * 100) : 0}%)</span>
            </div>
            <div style="width: 100%; background-color: #e5e7eb; height: 6px; border-radius: 3px; overflow: hidden;">
              <div style="background-color: #0e1b30; width: ${appointmentsCount > 0 ? Math.round((statusCounts.confirmed / appointmentsCount) * 100) : 0}%; height: 100%;"></div>
            </div>
          </div>
          <!-- Pending -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 800; margin-bottom: 4px;">
              <span style="color: #111827;">⏳ طلبات جديدة قيد الانتظار</span>
              <span style="color: #f59e0b;">${statusCounts.pending} طلبات (${appointmentsCount > 0 ? Math.round((statusCounts.pending / appointmentsCount) * 100) : 0}%)</span>
            </div>
            <div style="width: 100%; background-color: #e5e7eb; height: 6px; border-radius: 3px; overflow: hidden;">
              <div style="background-color: #f59e0b; width: ${appointmentsCount > 0 ? Math.round((statusCounts.pending / appointmentsCount) * 100) : 0}%; height: 100%;"></div>
            </div>
          </div>
          <!-- Cancelled -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 800; margin-bottom: 4px;">
              <span style="color: #111827;">🚫 معاينات معتذر عنها وملغاة</span>
              <span style="color: #ef4444;">${statusCounts.cancelled} معاينات (${appointmentsCount > 0 ? Math.round((statusCounts.cancelled / appointmentsCount) * 100) : 0}%)</span>
            </div>
            <div style="width: 100%; background-color: #e5e7eb; height: 6px; border-radius: 3px; overflow: hidden;">
              <div style="background-color: #ef4444; width: ${appointmentsCount > 0 ? Math.round((statusCounts.cancelled / appointmentsCount) * 100) : 0}%; height: 100%;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Row with Two Analytics Tables (representing charts) -->
    <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 20px; margin-bottom: 24px; align-items: start;">
      
      <!-- Table 1: Activity across governorates -->
      <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px;">
        <h3 style="font-size: 12px; font-weight: 900; color: #0e1b30; margin-top: 0; margin-bottom: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
          🇸🇾 نشاط وتفاعل المحافظات السورية الأكثر حيوية
        </h3>
        <table style="width: 100%; border-collapse: collapse; text-align: right;">
          <thead>
            <tr style="background-color: #0e1b30; color: #ffffff; font-size: 10px; font-weight: 800;">
              <th style="padding: 8px 14px; text-align: right;">المحافظة</th>
              <th style="padding: 8px 14px; text-align: center;">إجمالي المشاهدات والزيارات</th>
              <th style="padding: 8px 14px; text-align: center;">الحجوزات المباشرة</th>
              <th style="padding: 8px 14px; text-align: right;">توزيع النسب الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${activityRows.length > 0 ? activityRows : `<tr><td colspan="4" style="text-align: center; color: #9ca3af; padding: 12px; font-size: 11px;">لا تتوفر حركة تفصيلية كافية هذا الشهر.</td></tr>`}
          </tbody>
        </table>
      </div>

      <!-- Table 2: Top properties -->
      <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px;">
        <h3 style="font-size: 12px; font-weight: 900; color: #0e1b30; margin-top: 0; margin-bottom: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
          🔥 العقارات الأكثر طلباً واهتماماً بالفترة (الأفضل أداءً)
        </h3>
        <table style="width: 100%; border-collapse: collapse; text-align: right;">
          <thead>
            <tr style="background-color: #0e1b30; color: #ffffff; font-size: 10px; font-weight: 800;">
              <th style="padding: 8px 14px; text-align: right;">اسم العرض العقاري</th>
              <th style="padding: 8px 14px; text-align: center;">الحجوزات</th>
              <th style="padding: 8px 14px; text-align: center;">الزيارات</th>
              <th style="padding: 8px 14px; text-align: center;">تصنيف التفاعل</th>
            </tr>
          </thead>
          <tbody>
            ${topPropertiesRows.length > 0 ? topPropertiesRows : `<tr><td colspan="4" style="text-align: center; color: #9ca3af; padding: 12px; font-size: 11px;">لا توجد حركة تفاعل عقاري مصنفة بعد.</td></tr>`}
          </tbody>
        </table>
      </div>

    </div>

    <!-- Full Width Table: Prices Tracking and discounts -->
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; margin-bottom: 24px;">
      <h3 style="font-size: 12px; font-weight: 900; color: #0e1b30; margin-top: 0; margin-bottom: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
        💵 مؤشرات الأسعار العقارية ومتوسط الخصومات الممنوحة بالمحافظات
      </h3>
      <table style="width: 100%; border-collapse: collapse; text-align: right;">
        <thead>
          <tr style="background-color: #0e1b30; color: #ffffff; font-size: 10px; font-weight: 800;">
            <th style="padding: 8px 14px; text-align: right;">المحافظة السورية</th>
            <th style="padding: 8px 14px; text-align: center;">متوسط السعر المعروض للوحدة</th>
            <th style="padding: 8px 14px; text-align: center;">متوسط قيمة التخفيضات والخصم الحالي</th>
            <th style="padding: 8px 14px; text-align: center;">عدد الوحدات الفعالة والعروض الممنوحة</th>
          </tr>
        </thead>
        <tbody>
          ${priceChangesRows.length > 0 ? priceChangesRows : `<tr><td colspan="4" style="text-align: center; color: #9ca3af; padding: 12px; font-size: 11px;">لا تتوفر عقارات ذات مقاصة سعرية مسجلة بعد.</td></tr>`}
        </tbody>
      </table>
    </div>

    <!-- Official Stamp, Signatures & Certification Box -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 24px; border-top: 2px dashed #e5e7eb; margin-bottom: 24px;">
      <!-- Stamp Box -->
      <div style="text-align: right;">
        <p style="font-size: 10px; color: #6b7280; font-weight: 700; margin-bottom: 10px;">مصادقة الإدارة والتخطيط العام:</p>
        <div style="display: flex; align-items: center; gap: 20px;">
          <!-- Stamp representation -->
          <div style="width: 80px; height: 80px; border-radius: 100%; border: 3px double #d4af37; background-color: #fffaf0; display: flex; flex-direction: column; items-center; justify-content: center; text-align: center; position: relative;">
            <div style="font-size: 7px; color: #d4af37; font-weight: 900; transform: rotate(-5deg); line-height: 1;">شركة النعيمي</div>
            <div style="font-size: 6px; color: #0e1b30; font-weight: 800; border-top: 1px solid #d4af37; border-bottom: 1px solid #d4af37; transform: rotate(-5deg); padding: 2px 0; margin: 3px 0; line-height: 1;">تقرير معتمد</div>
            <div style="font-size: 6px; color: #d4af37; font-weight: 900; transform: rotate(-5deg); line-height: 1;">دمشق - سوريا</div>
          </div>
          <!-- Signature representation -->
          <div>
            <div style="font-family: 'Georgia', serif; font-style: italic; font-size: 14px; font-weight: 800; color: #0c1a30; transform: rotate(-3deg); margin-bottom: 4px;">Al-Naimi Analytics</div>
            <p style="font-size: 9px; color: #9ca3af; margin: 0; font-weight: 700;">المشرف العام: م. البراء النعيمي</p>
          </div>
        </div>
      </div>

      <!-- Legal Footers -->
      <div style="text-align: left; max-width: 480px;">
        <p style="font-size: 8.5px; color: #9ca3af; line-height: 1.6; margin: 0; text-align: left;">
          يُنشأ هذا التقرير الإحصائي بصفة شهرية وتلقائية بالكامل بواسطة نظم ذكاء الأعمال المدمجة بمنصة شركة البراء النعيمي للاستثمار العقاري. تم تصميم واختبار هذا التقرير ليوثق تحركات السوق السوري وتفضيلات العملاء بما يسهل اتخاذ القرارات التوسعية وتطوير الخطط التسويقية بكفاءة وثبات.
        </p>
      </div>
    </div>

    <!-- Corporate Footer banner -->
    <div style="background-color: #0e1b30; border-radius: 12px; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; color: #ffffff;">
      <span style="font-size: 9px; color: #c5a880; font-weight: 700;">النعيمي لتطوير وبناء المستقبل العقاري السوري الرائد 🏛️</span>
      <span style="font-size: 9px; color: #9ca3af; font-family: monospace; font-weight: 700;">إصدار ذكي رقمي آمن 100% • 2026</span>
    </div>
  `;

  // Append to body to render in DOM
  document.body.appendChild(container);

  // Allow web fonts/DOM state to prepare
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // High resolution
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Save report
    const filename = `Monthly_RealEstate_Report_${monthLabel.replace(/\s+/g, '_')}_${selectedGov.replace(/\s+/g, '_')}.pdf`;
    pdf.save(filename);
  } catch (err) {
    console.error("Monthly Report PDF generation or rendering collapsed:", err);
  } finally {
    // Clean up DOM safely
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};

export interface BrokerMonthlyReportData {
  monthName: string;
  totalSalesVolume: number;
  totalSalesVolumeFormatted: string;
  soldCount: number;
  appointmentsCount: number;
  conversionRate: number;
  commissionRate: number;
  commissionEarned: number;
  commissionEarnedFormatted: string;
  rating?: number;
  governorate?: string;
  rankTitle?: string;
  notes?: string;
}

export const generateSingleBrokerMonthlyPDFReport = async (
  broker: Broker,
  reportData: BrokerMonthlyReportData
): Promise<string> => {
  const formattedIssueDate = format(new Date(), 'yyyy-MM-dd HH:mm');
  const filename = `Broker_Monthly_Report_${(broker.name || 'broker').replace(/\s+/g, '_')}_${reportData.monthName.replace(/\s+/g, '_')}.pdf`;

  // Create temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '850px'; // Portrait A4 width
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = '"Inter", sans-serif';
  container.style.color = '#111827';
  container.style.padding = '40px';
  container.style.direction = 'rtl';
  container.setAttribute('id', 'temp-single-broker-pdf-container');

  const ratingStars = '★'.repeat(Math.round(reportData.rating || broker.rating || 5)) + '☆'.repeat(5 - Math.round(reportData.rating || broker.rating || 5));

  container.innerHTML = `
    <!-- Top Decorative Gold Border -->
    <div style="height: 12px; background: linear-gradient(90deg, #c5a880 0%, #0e1b30 50%, #c5a880 100%); margin-bottom: 24px; border-radius: 6px;"></div>

    <!-- Header Section -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; margin-bottom: 20px;">
      <!-- Logo & Company Name -->
      <div style="text-align: right;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 21H20M6 17H18M7 10V14M11 10V14M13 10V14M17 10V14M12 3L5 8V10H19V8L12 3Z" stroke="#c5a880" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span style="font-size: 20px; font-weight: 900; color: #0e1b30;">شركة البراء النعيمي للاستثمار العقاري</span>
        </div>
        <p style="font-size: 11px; color: #6b7280; font-weight: 700; margin: 0;">إدارة علاقات الوسطاء والشركاء المعتمدين 🏛️</p>
        <p style="font-size: 10px; color: #9ca3af; margin: 2px 0 0 0;">دمشق، سوريا - أوتوستراد المزة، برج النعيمي الفاخر</p>
      </div>

      <!-- Report Title -->
      <div style="text-align: left;">
        <span style="background-color: #0e1b30; color: #c5a880; font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 9999px; display: inline-block; margin-bottom: 6px;">تقرير أداء مالي فردي</span>
        <h1 style="font-size: 20px; font-weight: 900; color: #0e1b30; margin: 0;">تقرير الأداء والعمولات الشهري</h1>
        <p style="font-size: 11px; color: #d97706; margin: 4px 0 0 0; font-weight: 800;">دورة شهر: ${reportData.monthName}</p>
      </div>
    </div>

    <!-- Broker Details Card -->
    <div style="background-color: #fdfbf7; border: 1px solid #f5ede0; border-radius: 16px; padding: 18px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 10px; color: #b45309; font-weight: 800; text-transform: uppercase;">بطاقة الشريك العقاري</span>
          <h2 style="font-size: 22px; font-weight: 900; color: #0e1b30; margin: 2px 0 6px 0;">${broker.name} 👑</h2>
          <div style="display: flex; gap: 16px; font-size: 11px; color: #4b5563; font-weight: 700;">
            <span>📞 هاتف: <strong style="color: #0e1b30; font-family: monospace;">${broker.phone || 'غير متوفر'}</strong></span>
            <span>📍 المحافظة: <strong style="color: #0e1b30;">${reportData.governorate || broker.governorate || 'دمشق'}</strong></span>
            <span>⭐ التقييم: <strong style="color: #d97706;">${ratingStars} (${reportData.rating || broker.rating || 5.0}/5)</strong></span>
          </div>
        </div>
        <div style="text-align: left; background-color: #0e1b30; color: #c5a880; padding: 10px 16px; border-radius: 12px;">
          <div style="font-size: 9px; font-weight: 700; opacity: 0.8;">فئة التكريم والمستوى</div>
          <div style="font-size: 14px; font-weight: 900;">${reportData.rankTitle || (reportData.soldCount >= 3 ? '🏅 وسيط ذهبي VIP' : '✨ وسيط نشط معتمد')}</div>
        </div>
      </div>
    </div>

    <!-- Primary KPIs Grid -->
    <h3 style="font-size: 13px; font-weight: 900; color: #0e1b30; margin-bottom: 12px; text-align: right;">
      📊 المؤشرات المالية والتنفيذية الرئيسية (KPIs)
    </h3>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
      <!-- Total Sales -->
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 18px; text-align: center;">
        <span style="font-size: 10px; color: #166534; font-weight: 800; display: block; margin-bottom: 4px;">إجمالي المبيعات المحققة (Sales Volume)</span>
        <span style="font-size: 20px; font-weight: 900; color: #15803d; font-family: monospace;">${reportData.totalSalesVolumeFormatted}</span>
        <span style="font-size: 10px; color: #166534; font-weight: 700; display: block; margin-top: 4px;">عدد الصفقات المغلقة: ${reportData.soldCount} عقارات</span>
      </div>

      <!-- Conversion Rate -->
      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 16px; padding: 18px; text-align: center;">
        <span style="font-size: 10px; color: #b45309; font-weight: 800; display: block; margin-bottom: 4px;">معدل تحويل المعاينات (Conversion Rate)</span>
        <span style="font-size: 24px; font-weight: 900; color: #b45309; font-family: monospace;">${reportData.conversionRate}%</span>
        <span style="font-size: 10px; color: #92400e; font-weight: 700; display: block; margin-top: 4px;">${reportData.soldCount} صفقات ناجحة من أصل ${reportData.appointmentsCount} معاينة</span>
      </div>

      <!-- Commission Earned -->
      <div style="background-color: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 16px; padding: 18px; text-align: center;">
        <span style="font-size: 10px; color: #9d174d; font-weight: 800; display: block; margin-bottom: 4px;">صافي العمولة المكتسبة (Commission Earned)</span>
        <span style="font-size: 20px; font-weight: 900; color: #be185d; font-family: monospace;">${reportData.commissionEarnedFormatted}</span>
        <span style="font-size: 10px; color: #9d174d; font-weight: 700; display: block; margin-top: 4px;">بنسبة عمولة متفق عليها: ${reportData.commissionRate}%</span>
      </div>
    </div>

    <!-- Conversion Analysis & Visual Gauge -->
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; margin-bottom: 24px;">
      <h4 style="font-size: 12px; font-weight: 800; color: #0e1b30; margin: 0 0 10px 0; text-align: right;">
        🎯 تحليل مسار التحويل وكفاءة متابعة العملاء (Funnel Analytics)
      </h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: center;">
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; margin-bottom: 6px;">
            <span>نسبة إغلاق المعاينات:</span>
            <span style="color: #b45309;">${reportData.conversionRate}%</span>
          </div>
          <div style="width: 100%; background-color: #e5e7eb; height: 12px; border-radius: 6px; overflow: hidden; display: flex;">
            <div style="background-color: #10b981; width: ${reportData.conversionRate}%; height: 100%;"></div>
            <div style="background-color: #f59e0b; width: ${Math.max(0, 100 - reportData.conversionRate)}%; height: 100%;"></div>
          </div>
          <p style="font-size: 9.5px; color: #6b7280; margin: 8px 0 0 0; line-height: 1.5;">
            * تم احتساب نسبة التحويل بناءً على عدد العملاء والمعاينات الميدانية المسجلة باسم الوسيط مقارنة بعقود البيع والإيجار المبرمة رسمياً.
          </p>
        </div>
        <div style="background-color: #ffffff; border: 1px dashed #d1d5db; border-radius: 12px; padding: 12px; text-align: right; font-size: 11px; color: #374151;">
          <p style="margin: 0 0 4px 0; font-weight: 800; color: #0e1b30;">ملاحظة وتوصية الإدارة:</p>
          <p style="margin: 0; font-size: 10px; color: #4b5563; line-height: 1.5;">
            ${reportData.notes || 'أداء متميز وتفاعل استثنائي مع العملاء الموجهين عبر منصتنا. تحث إدارة النعيمي على الاستمرار بذات السرعة والدقة في المتابعة.'}
          </p>
        </div>
      </div>
    </div>

    <!-- Official Stamp & Authorization -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 20px; border-top: 2px dashed #e5e7eb; margin-bottom: 20px;">
      <!-- Stamp Box -->
      <div style="text-align: right;">
        <p style="font-size: 10px; color: #6b7280; font-weight: 700; margin-bottom: 8px;">اعتماد قسم الحسابات وتطوير الأعمال:</p>
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 75px; height: 75px; border-radius: 100%; border: 3px double #d4af37; background-color: #fffaf0; display: flex; flex-direction: column; items-center; justify-content: center; text-align: center;">
            <div style="font-size: 7px; color: #d4af37; font-weight: 900; transform: rotate(-5deg); line-height: 1;">شركة النعيمي</div>
            <div style="font-size: 6px; color: #0e1b30; font-weight: 800; border-top: 1px solid #d4af37; border-bottom: 1px solid #d4af37; transform: rotate(-5deg); padding: 2px 0; margin: 2px 0; line-height: 1;">مستند مالي معتمد</div>
            <div style="font-size: 6px; color: #d4af37; font-weight: 900; transform: rotate(-5deg); line-height: 1;">دمشق - سوريا</div>
          </div>
          <div>
            <div style="font-family: 'Georgia', serif; font-style: italic; font-size: 14px; font-weight: 800; color: #0c1a30; transform: rotate(-3deg); margin-bottom: 2px;">Al-Naimi Official</div>
            <p style="font-size: 9px; color: #9ca3af; margin: 0; font-weight: 700;">المدير التنفيذي: م. البراء النعيمي</p>
            <p style="font-size: 8.5px; color: #6b7280; margin: 2px 0 0 0; font-family: monospace;">تاريخ الإصدار: ${formattedIssueDate}</p>
          </div>
        </div>
      </div>

      <div style="text-align: left; max-width: 320px;">
        <p style="font-size: 8.5px; color: #9ca3af; line-height: 1.5; margin: 0;">
          تعد هذه الوثيقة تقريراً مالياً وإدارياً خاصاً بالشريك العقاري المسجل. يحظر تداول هذا المستند خارج نطاق العمل الرسمي المعتمد لدى شركة البراء النعيمي للتسويق والاستثمار العقاري.
        </p>
      </div>
    </div>

    <!-- Corporate Footer -->
    <div style="background-color: #0e1b30; border-radius: 10px; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; color: #ffffff;">
      <span style="font-size: 9px; color: #c5a880; font-weight: 700;">شركة البراء النعيمي للاستثمار العقاري • دمشق 🏛️</span>
      <span style="font-size: 8.5px; color: #9ca3af; font-family: monospace; font-weight: 700;">تقرير آمن وموثق رقمياً</span>
    </div>
  `;

  document.body.appendChild(container);
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
    return filename;
  } catch (err) {
    console.error("Single Broker Monthly Report PDF generation error:", err);
    throw err;
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};


