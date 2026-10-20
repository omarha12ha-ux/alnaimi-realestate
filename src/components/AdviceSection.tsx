import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function AdviceSection() {
  return (
    <div className="p-6 text-right bg-brand-cream/30 rounded-2xl" dir="rtl">
      <h2 className="text-2xl font-black mb-6 text-brand-navy flex items-center gap-2">
        <HelpCircle />
        نصائح المعاينة والاستشارة
      </h2>
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-xl border border-brand-navy/10">
          <h3 className="font-bold mb-2">أثناء المعاينة:</h3>
          <p className="text-sm text-gray-700">تأكد من فحص حالة الجدران، تمديدات الكهرباء، وتوفر الخدمات الأساسية.</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-brand-navy/10">
          <h3 className="font-bold mb-2">أثناء الاستشارة:</h3>
          <p className="text-sm text-gray-700">جهز كافة استفساراتك القانونية والمالية لمناقشتها مع المستشار العقاري.</p>
        </div>
      </div>
    </div>
  );
}
