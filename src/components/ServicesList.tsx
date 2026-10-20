import React from 'react';
import { Briefcase } from 'lucide-react';

export default function ServicesList() {
  return (
    <div className="p-6 text-right" dir="rtl">
      <h2 className="text-2xl font-black mb-6 text-brand-navy flex items-center gap-2">
        <Briefcase />
        خدماتنا العقارية والاستشارية
      </h2>
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-xl border border-brand-navy/10 shadow-sm">
          <h3 className="font-bold mb-2">استشارات عقارية</h3>
          <p className="text-sm text-gray-700">تقديم استشارات متخصصة لمساعدتك في اتخاذ أفضل القرارات الاستثمارية.</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-brand-navy/10 shadow-sm">
          <h3 className="font-bold mb-2">إدارة أملاك</h3>
          <p className="text-sm text-gray-700">خدمات احترافية لإدارة عقاراتكم ومتابعة كافة شؤونها.</p>
        </div>
      </div>
    </div>
  );
}
