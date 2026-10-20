import React, { useState } from 'react';
import { Broker, Property } from '../types';
import { Calculator, DollarSign, Download, FileText, CheckCircle, Percent, Building2, User, Copy, Sparkles, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { generateSingleBrokerMonthlyPDFReport, BrokerMonthlyReportData } from '../utils/pdfGenerator';

interface AdminCommissionCalculatorProps {
  brokers: Broker[];
  allProperties: Property[];
}

export default function AdminCommissionCalculator({ brokers, allProperties }: AdminCommissionCalculatorProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [propertyPrice, setPropertyPrice] = useState<number>(250000000);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>('');
  const [commissionRate, setCommissionRate] = useState<number>(2.5);
  const [companySplitPercent, setCompanySplitPercent] = useState<number>(50); // Company share %
  const [additionalBonus, setAdditionalBonus] = useState<number>(0);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // When a property is selected from dropdown, auto-fill its price if available
  const handlePropertyChange = (propId: string) => {
    setSelectedPropertyId(propId);
    if (!propId) return;
    const prop = allProperties.find(p => p.id === propId);
    if (prop) {
      const parsed = parseFloat(prop.price.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        setPropertyPrice(parsed);
      }
    }
  };

  // When a broker is selected, auto-fill their default commission rate if available
  const handleBrokerChange = (bId: string) => {
    setSelectedBrokerId(bId);
    if (!bId) return;
    const broker = brokers.find(b => b.id === bId);
    if (broker && broker.commissionRate) {
      const rateNum = parseFloat(String(broker.commissionRate).replace(/[^0-9.]/g, ''));
      if (!isNaN(rateNum) && rateNum > 0) {
        setCommissionRate(rateNum);
      }
    }
  };

  // Calculations
  const totalCommission = (propertyPrice * (commissionRate / 100)) + additionalBonus;
  const companyShare = totalCommission * (companySplitPercent / 100);
  const brokerShare = totalCommission - companyShare;

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' ل.س';
  };

  const generatedReportText = `=====================================
    📊 تقرير حساب العمولات المالية - منصة البراء العقارية
=====================================
📅 تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SY')}
🏢 العقار المحدد: ${allProperties.find(p => p.id === selectedPropertyId)?.title || 'عقار مخصص'}
💰 قيمة العقار: ${formatCurrency(propertyPrice)}
🤝 الوسيط العقاري: ${brokers.find(b => b.id === selectedBrokerId)?.name || 'غير محدد (مباشر)'}
📈 نسبة العمولة الأساسية: ${commissionRate}%
-------------------------------------
💵 إجمالي العمولة المحسوبة: ${formatCurrency(totalCommission)}
🏛️ حصة الشركة (الإدارة ${companySplitPercent}%): ${formatCurrency(companyShare)}
👤 حصة الوسيط (${100 - companySplitPercent}%): ${formatCurrency(brokerShare)}
${additionalBonus > 0 ? `🎁 مكافأة إضافية: ${formatCurrency(additionalBonus)}` : ''}
=====================================
معتمد من قسم الشؤون المالية والإدارية - شركة البراء النعيمي للاستثمار العقاري`;

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generatedReportText).then(() => {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 3000);
    });
  };

  const handleDownloadTextFile = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedReportText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Commission_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSendWhatsAppPDFReport = async () => {
    const selectedBroker = brokers.find(b => b.id === selectedBrokerId);
    if (!selectedBroker) {
      alert("يرجى اختيار الوسيط العقاري أولاً لتوليد وإرسال التقرير عبر الواتساب.");
      return;
    }

    const monthName = new Date().toLocaleDateString('ar-SY', { month: 'long', year: 'numeric' });
    const reportData: BrokerMonthlyReportData = {
      monthName,
      totalSalesVolume: propertyPrice,
      totalSalesVolumeFormatted: formatCurrency(propertyPrice),
      soldCount: selectedBroker.dealsCount || 1,
      appointmentsCount: (selectedBroker.dealsCount || 1) * 2,
      conversionRate: 85,
      commissionRate: commissionRate,
      commissionEarned: brokerShare,
      commissionEarnedFormatted: formatCurrency(brokerShare),
      rating: selectedBroker.rating || 5.0,
      governorate: selectedBroker.governorate || 'دمشق',
      rankTitle: '✨ وسيط عقاري معتمد',
      notes: `تم احتساب العمولة للصفقة (${allProperties.find(p => p.id === selectedPropertyId)?.title || 'عقار مخصص'}). إجمالي العمولة: ${formatCurrency(totalCommission)} (حصة الوسيط: ${formatCurrency(brokerShare)}).`
    };

    const filename = await generateSingleBrokerMonthlyPDFReport(selectedBroker, reportData);

    let rawPhone = (selectedBroker.phone || '').trim().replace(/[^0-9]/g, '');
    if (rawPhone.startsWith('09') && rawPhone.length === 10) {
      rawPhone = '963' + rawPhone.slice(1);
    } else if (rawPhone.startsWith('9') && rawPhone.length === 9) {
      rawPhone = '963' + rawPhone;
    }

    const waText = `مرحباً بك ${selectedBroker.name} 👑\nإليك التقرير المالي الرسمي للعمولة وحساب الأرباح الخاص بك لشهر (${monthName}).\n\n📌 البيانات المالية الجارية:\n• 💰 قيمة العقار/الصفقة: ${formatCurrency(propertyPrice)}\n• 📈 نسبة العمولة: ${commissionRate}%\n• 💵 حصة الوسيط الصافية: ${formatCurrency(brokerShare)}\n• 🏛️ حصة الشركة: ${formatCurrency(companyShare)}\n\n📄 تم توليد وتحميل التقرير الرسمي PDF (${filename}) الموثق رسمياً بالختم والتوقيع.\n\nشركة البراء النعيمي للاستثمار العقاري 🚀`;

    if (rawPhone) {
      window.open(`https://wa.me/${rawPhone}?text=${encodeURIComponent(waText)}`, '_blank');
    } else {
      alert(`تم توليد وتحميل تقرير PDF (${filename}) بنجاح!\n\nنص واتساب المجهز:\n\n${waText}`);
    }
  };

  return (
    <div className="bg-white border border-brand-navy/10 rounded-[2.5rem] p-6 md:p-8 shadow-xl space-y-8 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-navy/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-cream text-brand-navy rounded-full text-xs font-black mb-2">
            <Calculator size={14} className="text-brand-gold" />
            <span>الأداة المالية الذكية</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-black text-brand-navy">
            حاسبة العمولات الدّيناميكية المتطورة
          </h3>
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            حساب العمولات المتوقعة وتوزيع الأرباح بين الشركة والوسطاء بدقة لحظية مع إمكانية التصدير.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSendWhatsAppPDFReport}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md border border-emerald-500"
            title="توليد تقرير أداء شهري بصيغة PDF للوسيط المحدّد وإرساله عبر الواتساب"
          >
            <Send size={15} />
            <span>إرسال تقرير PDF بالواتساب 📱</span>
          </button>
          <button
            type="button"
            onClick={handleCopyReport}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border",
              copiedReport ? "bg-emerald-600 text-white border-emerald-700" : "bg-brand-navy/5 text-brand-navy hover:bg-brand-navy/10 border-brand-navy/10"
            )}
          >
            <Copy size={15} />
            <span>{copiedReport ? "✓ تم نسخ التقرير!" : "نسخ التقرير المالي"}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadTextFile}
            className="px-4 py-2.5 bg-brand-navy hover:bg-brand-navy/90 text-brand-gold rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Download size={15} />
            <span>تصدير ملف تقرير (TXT)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs & Live Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left/Inputs Column */}
        <div className="lg:col-span-7 space-y-5">
          <h4 className="text-sm font-serif font-black text-brand-navy flex items-center gap-2">
            <Percent size={16} className="text-brand-gold" />
            <span>مدخلات الصفقة وبيانات العقار</span>
          </h4>

          {/* Property Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
              <Building2 size={14} className="text-brand-gold" />
              <span>اختر عقاراً من القائمة المسجلة (اختياري للربط السريع)</span>
            </label>
            <select
              value={selectedPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="w-full bg-brand-cream/20 border border-brand-navy/15 rounded-2xl px-4 py-3 text-xs font-bold text-brand-navy focus:outline-none focus:border-brand-gold"
            >
              <option value="">-- اختر عقاراً أو أدخل السعر يدوياً --</option>
              {allProperties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.location}) - {p.price}
                </option>
              ))}
            </select>
          </div>

          {/* Property Price Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
              <DollarSign size={14} className="text-brand-gold" />
              <span>سعر بيع / إيجار العقار (ليرة سورية)</span>
            </label>
            <input
              type="number"
              value={propertyPrice}
              onChange={(e) => setPropertyPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-brand-cream/20 border border-brand-navy/15 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-brand-navy focus:outline-none focus:border-brand-gold"
              placeholder="250000000"
            />
          </div>

          {/* Broker Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
              <User size={14} className="text-brand-gold" />
              <span>الوسيط العقاري المسؤول</span>
            </label>
            <select
              value={selectedBrokerId}
              onChange={(e) => handleBrokerChange(e.target.value)}
              className="w-full bg-brand-cream/20 border border-brand-navy/15 rounded-2xl px-4 py-3 text-xs font-bold text-brand-navy focus:outline-none focus:border-brand-gold"
            >
              <option value="">-- بدون وسيط محدد (عمولة مباشرة) --</option>
              {brokers.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} (عمولة مقترحة: {b.commissionRate || '2.5'}%)
                </option>
              ))}
            </select>
          </div>

          {/* Commission Rate & Company Split Sliders / Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-navy">
                نسبة العمولة الإجمالية (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="10"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-brand-cream/20 border border-brand-navy/15 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-brand-navy focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-navy">
                حصة الشركة من العمولة (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={companySplitPercent}
                onChange={(e) => setCompanySplitPercent(parseFloat(e.target.value) || 0)}
                className="w-full bg-brand-cream/20 border border-brand-navy/15 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-brand-navy focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          {/* Additional Bonus */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-navy">
              مكافأة إضافية أو مصاريف إدارية مقدرة (ل.س)
            </label>
            <input
              type="number"
              value={additionalBonus}
              onChange={(e) => setAdditionalBonus(parseFloat(e.target.value) || 0)}
              className="w-full bg-brand-cream/20 border border-brand-navy/15 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-brand-navy focus:outline-none focus:border-brand-gold"
            />
          </div>
        </div>

        {/* Right/Results Summary Card */}
        <div className="lg:col-span-5 bg-gradient-to-tr from-brand-navy to-[#1A365D] text-white p-6 md:p-8 rounded-[2rem] shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-xs font-bold text-brand-gold flex items-center gap-1.5">
                <Sparkles size={16} />
                <span>ملخص الحساب المالي</span>
              </span>
              <span className="text-[10px] font-mono bg-white/10 px-2.5 py-1 rounded-full text-brand-gold">
                معتمد
              </span>
            </div>

            {/* Total Commission Display */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
              <span className="text-[11px] text-zinc-300 font-medium">إجمالي العمولة المستحقة للوساطة:</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-brand-gold">
                {formatCurrency(totalCommission)}
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">
                (نسبة {commissionRate}% من السعر الإجمالي)
              </span>
            </div>

            {/* Split Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-brand-gold/10 border border-brand-gold/20 rounded-2xl space-y-1">
                <span className="text-[10px] text-brand-gold font-bold">حصة الشركة ({companySplitPercent}%):</span>
                <div className="text-sm font-black font-mono text-white">
                  {formatCurrency(companyShare)}
                </div>
              </div>

              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-1">
                <span className="text-[10px] text-emerald-300 font-bold">حصة الوسيط ({100 - companySplitPercent}%):</span>
                <div className="text-sm font-black font-mono text-white">
                  {formatCurrency(brokerShare)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-white/10 rounded-xl text-[11px] text-zinc-200 font-medium leading-relaxed">
            💡 يتم تطبيق هذه النسب تلقائياً عند اعتماد الصفقات وإصدار العقود رسمياً عبر قسم الإدارة المالية.
          </div>
        </div>
      </div>
    </div>
  );
}
