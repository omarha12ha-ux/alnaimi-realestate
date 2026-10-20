import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Search, 
  Building, 
  User, 
  Calendar, 
  DollarSign,
  Printer,
  ChevronDown,
  AlertCircle
} from 'lucide-react';

interface AdminContractsManagementProps {
  contracts: any[];
  allProperties: any[];
  users: any[];
  onUpdate: () => void;
}

export const AdminContractsManagement = ({ contracts, allProperties, users, onUpdate }: AdminContractsManagementProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [contractType, setContractType] = useState<'rent' | 'sale'>('rent');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('ل.س');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Custom manual typing fallback if user isn't in dropdown
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  
  const [terms, setTerms] = useState('');

  // Search/Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'signed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'rent' | 'sale'>('all');

  // Predefined Syrian Rent Boilerplate
  const rentBoilerplate = `البند الرابع: التزامات المستأجر وشروط المنفعة:
1. يقر الطرف الثاني (المستأجر) بأنه عاين المأجور المعاينة التامة النافية للجهالة المانعة لها، وأنه تسلم المأجور بحالة فنية ممتازة وصالحة للسكن الفوري.
2. يتعهد المستأجر بدفع الأجور المذكورة في البند الثالث لشركة البراء النعيمي في المواعيد المقررة دون أي تأخير، وبموجب وصولات رسمية معتمدة.
3. يلتزم المستأجر بدفع فواتير استهلاك الكهرباء، المياه، الهاتف، والإنترنت والخدمات المشتركة للبناء طيلة مدة الإيجار.
4. يمتنع على المستأجر إحداث أي تغيير جوهري أو إنشائي في المأجور أو القيام بأي أعمال ديكور دون الحصول على موافقة خطية مسبقة من شركة البراء النعيمي.
5. لا يحق للمستأجر تأجير المأجور للغير كلياً أو جزئياً، أو التنازل عن الإيجار للغير بأي شكل من الأشكال دون إذن خطي من الطرف الأول.
6. يلتزم المستأجر بتسليم المأجور عند نهاية مدة العقد خالياً من الشواغل وبنفس الحالة الممتازة التي تسلمه بها، وتعتبر يده على العقار يد أمانة يضمن بها كافة الأضرار.`;

  // Predefined Syrian Sale Boilerplate
  const saleBoilerplate = `البند الرابع: التزامات المشتري وشروط الملكية والرهن:
1. يقر الطرف الثاني (المشتري) بأنه قد عاين العقار محل العقد المعاينة التامة الشرعية والنافية للجهالة، وقبل شراءه بحالته الراهنة.
2. يلتزم المشتري بسداد كامل الثمن المتفق عليه بموجب الدفعات المقررة والمدرجة في البند الثالث، ويعتبر تخلفه عن سداد أي دفعة بمثابة إخلال جوهري بالعقد يحق معه للبائع الفسخ والمطالبة بالتعويض.
3. تؤول ملكية العقار المبيع للطرف الثاني رسمياً وبصورة نهائية فقط بعد استكمال سداد كامل الثمن المتفق عليه وتسجيله في السجل العقاري المختص (المصالح العقارية).
4. تقع على عاتق الطرف الثاني كافة الضرائب، والرسوم المالية، ورسوم انتقال الملكية والبلدية المترتبة على العقار اعتباراً من تاريخ التوقيع الفعلي على هذا العقد واستلام المفاتيح.
5. يتعهد الطرف الأول (شركة البراء النعيمي) بنقل الملكية العقارية وإجراء فراغ العقار للمشتري خافياً من أي إشارات رهن أو حجز مالي أو عيني بمجرد سداد الثمن كاملاً.`;

  // Update terms based on type selection if terms is empty or matches previous default
  const handleTypeChange = (type: 'rent' | 'sale') => {
    setContractType(type);
    if (!terms || terms === rentBoilerplate || terms === saleBoilerplate) {
      setTerms(type === 'rent' ? rentBoilerplate : saleBoilerplate);
    }
  };

  // Pre-fill terms on form open
  const openForm = () => {
    setShowAddForm(true);
    if (!terms) {
      setTerms(contractType === 'rent' ? rentBoilerplate : saleBoilerplate);
    }
  };

  const handleSelectUser = (uid: string) => {
    setSelectedUserId(uid);
    if (uid === 'custom') {
      setClientName('');
      setClientEmail('');
      setClientPhone('');
    } else {
      const matchedUser = users.find(u => u.uid === uid);
      if (matchedUser) {
        setClientName(matchedUser.name || '');
        setClientEmail(matchedUser.email || '');
        setClientPhone(matchedUser.phone || '');
      }
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPropertyId) {
      alert("يرجى اختيار العقار المشمول بالتعاقد.");
      return;
    }
    if (!selectedUserId) {
      alert("يرجى اختيار العميل أو إدخال بيانات عميل خارجي.");
      return;
    }
    if (!clientName.trim() || !clientEmail.trim() || !clientPhone.trim()) {
      alert("يرجى ملء الاسم الكامل للعميل، البريد الإلكتروني والهاتف للتواصل.");
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      alert("يرجى إدخال قيمة مالية صحيحة تزيد عن الصفر.");
      return;
    }
    if (contractType === 'rent' && (!startDate || !endDate)) {
      alert("عقود الإيجار تتطلب تحديد تاريخ البداية والنهاية للعقد.");
      return;
    }

    const matchedProperty = allProperties.find(p => p.id === selectedPropertyId);
    if (!matchedProperty) {
      alert("العقار المحدد غير موجود في النظام.");
      return;
    }

    setIsSubmitting(true);
    try {
      const contractPayload = {
        propertyId: selectedPropertyId,
        propertyTitle: matchedProperty.title || matchedProperty.name || 'عقار غير مسمى',
        contractType,
        price: Number(price),
        currency,
        startDate: contractType === 'rent' ? startDate : '',
        endDate: contractType === 'rent' ? endDate : '',
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim(),
        userId: selectedUserId === 'custom' ? 'external_client' : selectedUserId,
        status: 'pending_signature',
        terms: terms.trim(),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'contracts'), contractPayload);
      alert("🎉 تم إنشاء عقد البيع/الإيجار الرقمي بنجاح، وهو معروض الآن للعميل للتوقيع!");
      
      // Reset Form
      setSelectedPropertyId('');
      setSelectedUserId('');
      setPrice('');
      setStartDate('');
      setEndDate('');
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setTerms('');
      setShowAddForm(false);
      
      onUpdate();
    } catch (err) {
      console.error("Error creating contract:", err);
      alert("حدث خطأ أثناء حفظ عقد العقار الرقمي. يرجى المحاولة لاحقاً.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContract = async (id: string) => {
    if (!window.confirm("⚠️ تحذير: هل أنت متأكد من رغبتك في حذف هذا العقد الرقمي نهائياً من النظام وقاعدة البيانات؟")) return;
    try {
      await deleteDoc(doc(db, 'contracts', id));
      alert("تم حذف العقد بنجاح. 🗑️");
      onUpdate();
    } catch (err) {
      console.error("Error deleting contract:", err);
      alert("فشل في حذف العقد.");
    }
  };

  // Filtered lists
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = 
      c.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'pending' && c.status === 'pending_signature') ||
      (statusFilter === 'signed' && c.status === 'signed');
      
    const matchesType = 
      typeFilter === 'all' || 
      c.contractType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Statistics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-brand-navy/5 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-brand-navy">إدارة العقود والتوثيق الرقمي ✍️</h2>
          <p className="text-zinc-500 text-xs mt-1">إنشاء، أرشفة ومتابعة عقود البيع والإيجار لشركة البراء النعيمي مع عملائنا عبر التواقيع الإلكترونية المحمية.</p>
        </div>
        
        {!showAddForm && (
          <button
            onClick={openForm}
            className="px-5 py-3 bg-brand-navy hover:bg-brand-navy/95 text-brand-gold font-black rounded-2xl text-xs border-0 cursor-pointer flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={16} />
            <span>إنشاء عقد رقمي جديد</span>
          </button>
        )}
      </div>

      {/* Contract Creation Form */}
      {showAddForm && (
        <form onSubmit={handleCreateContract} className="bg-white p-6 md:p-8 rounded-3xl border border-brand-gold/30 shadow-md space-y-6">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
            <h3 className="text-sm font-black text-brand-navy flex items-center gap-2">
              <FileText className="text-brand-gold" size={18} />
              <span>تجهيز وصياغة عقد رقمي جديد ملزم</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-zinc-400 hover:text-zinc-600 border-0 bg-transparent text-xs font-bold cursor-pointer"
            >
              إلغاء التجهيز
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Property Selection */}
            <div className="space-y-1 text-right">
              <label className="text-[10px] font-black text-brand-navy">اختر العقار المعني بالتعاقد:</label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-brand-navy focus:outline-none focus:border-brand-gold"
              >
                <option value="">-- اختر من العقارات المدرجة --</option>
                {allProperties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title || p.name} [{p.category === 'rent' ? 'إيجار' : 'بيع'}]
                  </option>
                ))}
              </select>
            </div>

            {/* Contract Type Selection */}
            <div className="space-y-1 text-right">
              <label className="text-[10px] font-black text-brand-navy">نوع العقد العقاري:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange('rent')}
                  className={`p-3 rounded-xl text-xs font-bold border cursor-pointer ${
                    contractType === 'rent'
                      ? 'bg-brand-navy text-brand-gold border-brand-navy'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                  }`}
                >
                  عقد إيجار سنوي/شهري
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('sale')}
                  className={`p-3 rounded-xl text-xs font-bold border cursor-pointer ${
                    contractType === 'sale'
                      ? 'bg-brand-navy text-brand-gold border-brand-navy'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                  }`}
                >
                  عقد بيع وتمليك نهائي
                </button>
              </div>
            </div>

            {/* User Selection */}
            <div className="space-y-1 text-right">
              <label className="text-[10px] font-black text-brand-navy">اختر العميل المستفيد:</label>
              <select
                value={selectedUserId}
                onChange={(e) => handleSelectUser(e.target.value)}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-brand-navy focus:outline-none focus:border-brand-gold"
              >
                <option value="">-- اختر عميل مسجل بالنظام --</option>
                {users.map(u => (
                  <option key={u.uid} value={u.uid}>
                    {u.name} ({u.email || u.phone || 'بدون إيميل'})
                  </option>
                ))}
                <option value="custom">-- إدخال عميل خارجي يدوياً --</option>
              </select>
            </div>
          </div>

          {/* Client Info Inputs (Manual Fallback / Editable) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-brand-cream/10 p-5 rounded-2xl border border-brand-navy/5">
            <div className="space-y-1 text-right">
              <label className="text-[10px] font-bold text-brand-navy">اسم العميل بالكامل ثلاثياً (الطرف الثاني):</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="اسم العميل الكامل ثلاثياً"
                className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs text-brand-navy focus:outline-none"
              />
            </div>
            <div className="space-y-1 text-right">
              <label className="text-[10px] font-bold text-brand-navy">البريد الإلكتروني للعميل (للتوثيق):</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@domain.com"
                className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs text-brand-navy focus:outline-none"
              />
            </div>
            <div className="space-y-1 text-right">
              <label className="text-[10px] font-bold text-brand-navy">رقم هاتف العميل للتواصل والواتساب:</label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="09XXXXXXXX"
                className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs text-brand-navy focus:outline-none"
              />
            </div>
          </div>

          {/* Financial details and Start/End Dates */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1 text-right">
              <label className="text-[10px] font-black text-brand-navy">قيمة الصفقة الإجمالية / الأجور المحددة:</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="مثال: 5000000"
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-brand-navy focus:outline-none"
              />
            </div>
            
            <div className="space-y-1 text-right">
              <label className="text-[10px] font-black text-brand-navy">عملة التعاقد:</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-brand-navy focus:outline-none"
              >
                <option value="ل.س">ليرة سورية (ل.س)</option>
                <option value="USD">دولار أمريكي ($)</option>
              </select>
            </div>

            {contractType === 'rent' ? (
              <>
                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-black text-brand-navy">تاريخ بدء سريان العقد:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-brand-navy focus:outline-none"
                  />
                </div>
                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-black text-brand-navy">تاريخ انتهاء العقد:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-brand-navy focus:outline-none"
                  />
                </div>
              </>
            ) : (
              <div className="md:col-span-2 flex items-center bg-zinc-50 p-4 rounded-xl border border-zinc-100 mt-5">
                <AlertCircle className="text-zinc-400 shrink-0 ml-2" size={16} />
                <span className="text-[10px] text-zinc-500">ملاحظة: عقود البيع العقاري تعتبر سارية المفعول فور التوقيع والمصادقة الرقمية عليها من الطرفين.</span>
              </div>
            )}
          </div>

          {/* Terms text editor */}
          <div className="space-y-1 text-right">
            <label className="text-[10px] font-black text-brand-navy">الشروط والأحكام الخاصة بالعقد (معدّة ومعتمدة قانونياً):</label>
            <textarea
              rows={8}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-brand-navy leading-relaxed focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs border-0 cursor-pointer"
            >
              إلغاء التجهيز
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-brand-navy hover:bg-brand-navy/95 text-brand-gold font-black rounded-xl text-xs border-0 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'جاري حفظ وإرسال العقد...' : 'إرسال العقد للعميل للتوثيق والتوقيع ✍️'}
            </button>
          </div>
        </form>
      )}

      {/* Contracts Filters & Search List */}
      <div className="bg-white rounded-3xl border border-brand-navy/5 shadow-sm overflow-hidden">
        
        {/* Table/List Filter Area */}
        <div className="p-5 border-b border-zinc-100 bg-zinc-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute right-3.5 top-3 text-zinc-400" size={14} />
            <input
              type="text"
              placeholder="البحث باسم العميل أو العقار..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs text-brand-navy focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="p-2.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-600 focus:outline-none"
            >
              <option value="all">كل حالات التوقيع</option>
              <option value="pending">بانتظار توقيع العميل</option>
              <option value="signed">تم التوقيع والمصادقة</option>
            </select>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e: any) => setTypeFilter(e.target.value)}
              className="p-2.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-600 focus:outline-none"
            >
              <option value="all">كل أنواع العقود</option>
              <option value="rent">عقود الإيجار فقط</option>
              <option value="sale">عقود البيع فقط</option>
            </select>
          </div>
        </div>

        {/* Table list representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-100/50 text-zinc-600 font-bold border-b border-zinc-100">
                <th className="p-4">رقم العقد</th>
                <th className="p-4">العميل (الطرف الثاني)</th>
                <th className="p-4">العقار المتفق عليه</th>
                <th className="p-4">النوع</th>
                <th className="p-4 text-left">قيمة العقد</th>
                <th className="p-4">حالة التوقيع الرقمي</th>
                <th className="p-4">تاريخ الإنشاء</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-zinc-400 font-bold">
                    لا يوجد أي عقود رقمية مطابقة لمعايير البحث الحالية.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-zinc-50/40 transition-colors">
                    <td className="p-4 font-mono text-zinc-400 font-bold">#{contract.id?.slice(0, 8)}...</td>
                    <td className="p-4">
                      <div className="font-bold text-brand-navy">{contract.clientName}</div>
                      <div className="text-[10px] text-zinc-500">{contract.clientPhone}</div>
                    </td>
                    <td className="p-4 font-bold text-zinc-700">{contract.propertyTitle}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                        contract.contractType === 'rent' 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {contract.contractType === 'rent' ? 'إيجار' : 'بيع'}
                      </span>
                    </td>
                    <td className="p-4 text-left font-black font-mono text-brand-navy">
                      {contract.price.toLocaleString()} {contract.currency}
                    </td>
                    <td className="p-4">
                      {contract.status === 'signed' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          <CheckCircle size={10} />
                          <span>تم التوقيع بنجاح</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          <Clock size={10} />
                          <span>بانتظار العميل</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-zinc-500">
                      {contract.createdAt ? contract.createdAt.split('T')[0] : ''}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {contract.status === 'signed' && contract.digitalSignature && (
                          <div className="relative group">
                            <span className="px-2 py-1 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 rounded-md text-[10px] font-bold cursor-pointer">
                              رؤية التوقيع ✍️
                            </span>
                            {/* Hover signature tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-white border border-zinc-200 rounded-xl p-3 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-300 z-50 text-right">
                              <p className="font-bold text-[10px] border-b border-zinc-100 pb-1 mb-2">التوقيع الرقمي للعميل:</p>
                              <img 
                                src={contract.digitalSignature.dataUrl} 
                                alt="توقيع" 
                                className="max-h-16 mx-auto object-contain bg-zinc-50 rounded p-1 mb-1" 
                                referrerPolicy="no-referrer"
                              />
                              <p className="text-[8px] text-zinc-500 leading-none">الاسم: {contract.digitalSignature.signerName}</p>
                              <p className="text-[8px] text-zinc-400 leading-none mt-1 font-mono">{new Date(contract.digitalSignature.signedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => handleDeleteContract(contract.id)}
                          className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-all border-0 cursor-pointer"
                          title="حذف العقد"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
