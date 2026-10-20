import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  PenTool, 
  Download, 
  Printer, 
  ShieldAlert,
  Building,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';

interface ClientContractsListProps {
  contracts: any[];
  currentUser: any;
  userProfile: any;
  allProperties: any[];
  onUpdate: () => void;
}

export const ClientContractsList = ({ contracts, currentUser, userProfile, allProperties, onUpdate }: ClientContractsListProps) => {
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [signerName, setSignerName] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const sigCanvas = useRef<any>(null);

  const clientContracts = contracts.filter(c => 
    c.userId === currentUser?.uid || 
    c.clientEmail === currentUser?.email || 
    c.clientPhone === userProfile?.phone
  );

  const handleSignContract = async () => {
    if (!selectedContract) return;
    if (!signerName.trim()) {
      alert("يرجى كتابة اسمك الكامل ثلاثياً للمتابعة والتوقيع رسمياً.");
      return;
    }
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      alert("يرجى رسم توقيعك داخل المربع المخصص للتوقيع.");
      return;
    }

    setIsSigning(true);
    try {
      const dataUrl = sigCanvas.current.toDataURL();
      const signedAtStr = new Date().toISOString();
      await updateDoc(doc(db, 'contracts', selectedContract.id), {
        status: 'signed',
        signedAt: signedAtStr,
        digitalSignature: {
          dataUrl,
          signedAt: signedAtStr,
          signerName: signerName.trim()
        }
      });
      
      alert("🎉 تم توقيع العقد بنجاح وحفظه في سجلاتك الرقمية الآمنة!");
      
      // Update selected contract in state to reflect change immediately
      setSelectedContract({
        ...selectedContract,
        status: 'signed',
        signedAt: signedAtStr,
        digitalSignature: {
          dataUrl,
          signedAt: signedAtStr,
          signerName: signerName.trim()
        }
      });
      
      onUpdate();
    } catch (err) {
      console.error("Error signing contract:", err);
      alert("حدث خطأ أثناء حفظ توقيعك الرقمي. يرجى إعادة المحاولة.");
    } finally {
      setIsSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-brand-navy to-brand-navy/80 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        {/* Decorative ambient gold glow */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="bg-brand-gold/20 text-brand-gold text-[10px] uppercase tracking-widest font-black px-3 py-1.5 rounded-full border border-brand-gold/20">
              التوثيق الرقمي الآمن
            </span>
            <h2 className="text-2xl font-black mt-2 text-brand-gold">عقود البيع والإيجار الرقمية ✍️</h2>
            <p className="text-white/70 text-xs mt-1">تتيح لك هذه المنصة استعراض عقود العقارات الخاصة بك، مراجعتها وتوقيعها رقمياً بكل سهولة وقانونية تامة.</p>
          </div>
          <div className="bg-brand-gold text-brand-navy font-black px-4 py-2 rounded-2xl text-xs flex items-center gap-2">
            <FileText size={16} />
            <span>لديك ({clientContracts.length}) من العقود الرقمية</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left list of contracts */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-brand-navy font-black text-sm pr-1">قائمة عقودك العقارية</h3>
          
          {clientContracts.length === 0 ? (
            <div className="bg-white/60 p-8 rounded-2xl border border-brand-navy/5 text-center flex flex-col items-center justify-center">
              <FileText size={40} className="text-zinc-300 mb-2" />
              <p className="text-zinc-500 text-xs font-bold">لا يوجد أي عقود موثقة وموجهة لك حالياً.</p>
              <p className="text-zinc-400 text-[10px] mt-1">عند قيام موظفينا أو المشرفين بإنشاء عقد إيجار أو بيع خاص بك، سيظهر هنا فوراً.</p>
            </div>
          ) : (
            clientContracts.map((contract) => (
              <button
                key={contract.id}
                onClick={() => {
                  setSelectedContract(contract);
                  setSignerName(contract.digitalSignature?.signerName || '');
                }}
                className={`w-full text-right p-4 rounded-2xl border transition-all cursor-pointer flex flex-col ${
                  selectedContract?.id === contract.id
                    ? 'bg-brand-cream/40 border-brand-gold shadow-md'
                    : 'bg-white hover:bg-zinc-50/50 border-brand-navy/5'
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                    contract.contractType === 'rent'
                      ? 'bg-blue-50 text-blue-600 border border-blue-100'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    {contract.contractType === 'rent' ? 'عقد إيجار رقمي' : 'عقد بيع نهائي'}
                  </span>
                  
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${
                    contract.status === 'signed'
                      ? 'text-emerald-600'
                      : 'text-amber-600 animate-pulse'
                  }`}>
                    {contract.status === 'signed' ? (
                      <>
                        <CheckCircle size={10} />
                        <span>تم التوقيع</span>
                      </>
                    ) : (
                      <>
                        <Clock size={10} />
                        <span>بانتظار توقيعك</span>
                      </>
                    )}
                  </span>
                </div>

                <h4 className="text-brand-navy font-bold text-xs mt-3 line-clamp-1">{contract.propertyTitle}</h4>
                
                <div className="flex justify-between items-center w-full mt-3 pt-2.5 border-t border-dashed border-zinc-100 text-[10px] text-zinc-500">
                  <span className="font-mono">{contract.createdAt ? contract.createdAt.split('T')[0] : ''}</span>
                  <span className="font-black text-brand-navy">{contract.price.toLocaleString()} {contract.currency}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right contract viewer / signer */}
        <div className="lg:col-span-8">
          {selectedContract ? (
            <div className="bg-white rounded-3xl border border-brand-navy/5 shadow-xl overflow-hidden print:shadow-none print:border-none">
              
              {/* Document Header (Hidden in non-print unless we show beautiful paper layout) */}
              <div className="bg-brand-cream/20 p-8 border-b border-zinc-100 relative overflow-hidden print:p-0 print:border-none">
                <div className="flex justify-between items-center relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-brand-navy/60">شركة البراء النعيمي للتطوير العقاري</p>
                    <h3 className="text-lg font-black text-brand-navy">معاينة وثيقة العقد الرسمية</h3>
                    <p className="text-zinc-500 text-[10px] font-mono">ID: {selectedContract.id}</p>
                  </div>
                  <div className="flex gap-2 print:hidden">
                    <button 
                      onClick={handlePrint}
                      className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-all cursor-pointer border-0 flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Printer size={14} />
                      <span>طباعة</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* The Actual Legal Document (Cream Paper style) */}
              <div className="p-8 md:p-12 bg-[#FDFBF7] relative min-h-[500px] border-b border-zinc-100 print:bg-white print:p-0 print:min-h-0">
                {/* Custom Elegant Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
                  <Building size={400} className="text-brand-navy" />
                </div>

                <div className="relative z-10 space-y-8">
                  {/* Formal Arabic Seal/Heading */}
                  <div className="text-center space-y-1 border-b-2 border-brand-gold/30 pb-6">
                    <h2 className="text-xl font-black text-brand-navy">عقد {selectedContract.contractType === 'rent' ? 'إيجار عقاري رسمي' : 'بيع عقاري نهائي ملزم'}</h2>
                    <p className="text-[10px] text-zinc-500 font-bold">موثّق ومحفوظ رقمياً عبر سجلات شركة البراء النعيمي للتطوير والاستثمار العقاري</p>
                    <p className="text-[10px] text-zinc-400 font-mono">تاريخ الإنشاء: {selectedContract.createdAt ? new Date(selectedContract.createdAt).toLocaleDateString('ar-SY') : ''}</p>
                  </div>

                  {/* Contract Parties */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-brand-navy border-r-4 border-brand-gold pr-2.5 py-0.5">البند الأول: أطراف التعاقد</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-100 space-y-1">
                        <p className="font-bold text-brand-navy">الطرف الأول (المُؤجّر / البائع):</p>
                        <p className="text-zinc-700">شركة البراء النعيمي للتطوير العقاري</p>
                        <p className="text-zinc-500 text-[10px]">عنوان المركز الرئيسي: دمشق، سوريا</p>
                      </div>
                      <div className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-100 space-y-1">
                        <p className="font-bold text-brand-navy">الطرف الثاني (المُستأجر / المُشتري):</p>
                        <p className="text-zinc-700">السيد/ة: {selectedContract.clientName}</p>
                        <p className="text-zinc-500 text-[10px]">الهاتف: {selectedContract.clientPhone} | البريد: {selectedContract.clientEmail}</p>
                      </div>
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-brand-navy border-r-4 border-brand-gold pr-2.5 py-0.5">البند الثاني: موصوف العقار المتفق عليه</h4>
                    <div className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-100 space-y-2 text-xs">
                      <div className="flex flex-col md:flex-row md:justify-between gap-1">
                        <span className="font-bold text-brand-navy">العقار المخصص:</span>
                        <span className="text-zinc-700">{selectedContract.propertyTitle}</span>
                      </div>
                      <div className="flex flex-col md:flex-row md:justify-between gap-1 pt-2 border-t border-dashed border-zinc-200">
                        <span className="font-bold text-brand-navy">قيمة الصفقة الإجمالية:</span>
                        <span className="font-mono text-brand-navy font-black text-sm">{selectedContract.price.toLocaleString()} {selectedContract.currency}</span>
                      </div>
                      {selectedContract.contractType === 'rent' && (
                        <div className="flex flex-col md:flex-row md:justify-between gap-1 pt-2 border-t border-dashed border-zinc-200">
                          <span className="font-bold text-brand-navy">مدة الإيجار:</span>
                          <span className="text-zinc-700">من {selectedContract.startDate} إلى {selectedContract.endDate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contract Clauses */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-brand-navy border-r-4 border-brand-gold pr-2.5 py-0.5">البند الثالث: الشروط والأحكام الخاصة بالتعاقد</h4>
                    <div className="bg-zinc-50/50 p-5 rounded-xl border border-zinc-100 text-zinc-700 text-xs leading-relaxed space-y-2 whitespace-pre-line">
                      {selectedContract.terms}
                    </div>
                  </div>

                  {/* Legal Enforcement Declarations */}
                  <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 flex gap-3 text-red-800 text-[10px] leading-relaxed">
                    <ShieldAlert size={20} className="shrink-0 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-bold">إقرار وإقرار قانوني بالمسؤولية:</p>
                      <p className="text-red-700/80 mt-0.5">يعتبر التوقيع الرقمي المرسوم أدناه بمثابة توقيع رسمي، دائم وقانوني، غير قابل للنقض، ومكافئ للتوقيع الخطي الورقي تحت طائلة القوانين الناظمة للتوقيع والتوثيق الإلكتروني في الجمهورية العربية السورية.</p>
                    </div>
                  </div>

                  {/* Signatures Row */}
                  <div className="pt-6 border-t-2 border-zinc-100 grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                    {/* First Party Signature */}
                    <div className="space-y-2 text-center md:text-right">
                      <p className="font-bold text-brand-navy">الطرف الأول (المؤجر / البائع):</p>
                      <div className="py-4 px-6 bg-zinc-50/60 rounded-xl border border-zinc-100 flex flex-col items-center justify-center min-h-[100px]">
                        {/* Company Stamp Graphic representation */}
                        <div className="border-4 border-dashed border-brand-gold/40 text-brand-gold/70 text-[9px] font-black rounded-full w-24 h-24 flex flex-col items-center justify-center transform rotate-6 scale-90">
                          <Building size={16} />
                          <span className="mt-1 leading-none text-center">شركة النعيمي</span>
                          <span className="text-[6px] tracking-tighter">توقيع معتمد</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-bold mt-2">عن شركة البراء النعيمي للتطوير العقاري</p>
                      </div>
                    </div>

                    {/* Second Party Signature */}
                    <div className="space-y-2 text-center md:text-right">
                      <p className="font-bold text-brand-navy">الطرف الثاني (المستأجر / المشتري):</p>
                      <div className="py-4 px-6 bg-zinc-50/60 rounded-xl border border-zinc-100 flex flex-col items-center justify-center min-h-[100px]">
                        {selectedContract.status === 'signed' && selectedContract.digitalSignature ? (
                          <div className="text-center space-y-2">
                            <img 
                              src={selectedContract.digitalSignature.dataUrl} 
                              alt="التوقيع الرقمي" 
                              className="max-h-20 max-w-[180px] object-contain mix-blend-multiply border border-zinc-100 bg-white p-1 rounded-lg"
                              referrerPolicy="no-referrer"
                            />
                            <div className="text-[9px] text-zinc-500">
                              <p className="font-black">الموقع: {selectedContract.digitalSignature.signerName}</p>
                              <p className="font-mono mt-0.5">التوقيت: {new Date(selectedContract.digitalSignature.signedAt).toLocaleString('ar-SY')}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-zinc-400">
                            <Clock size={20} className="mx-auto text-amber-500 animate-pulse mb-1" />
                            <p className="font-bold text-amber-600 text-[10px]">بانتظار توقيعك أدناه للمصادقة</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Signature Pad Interface (Hidden if already signed, shown below the contract document) */}
              {selectedContract.status !== 'signed' && (
                <div className="p-8 bg-brand-cream/10 border-t border-zinc-100 print:hidden">
                  <div className="max-w-xl mx-auto space-y-6">
                    <div className="text-center">
                      <span className="bg-brand-gold/20 text-brand-navy text-[9px] font-black px-2.5 py-1 rounded-full">خطوة المصادقة الأخيرة</span>
                      <h3 className="text-sm font-black text-brand-navy mt-2">رسم توقيعك الرقمي المعتمد ✍️</h3>
                      <p className="text-[10px] text-zinc-500 mt-1">يرجى كتابة اسمك الثلاثي ورسم توقيعك بيدك أو بالقلم الرقمي داخل اللوحة أدناه.</p>
                    </div>

                    <div className="space-y-4">
                      {/* Name input */}
                      <div className="space-y-1 text-right">
                        <label className="text-[10px] font-bold text-brand-navy">الاسم الكامل للموقّع (ثلاثياً):</label>
                        <input 
                          type="text" 
                          value={signerName}
                          onChange={(e) => setSignerName(e.target.value)}
                          placeholder="مثال: البراء النعيمي النعيمي"
                          className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs text-brand-navy focus:outline-none focus:border-brand-gold transition-all"
                        />
                      </div>

                      {/* Canvas box */}
                      <div className="space-y-1 text-right">
                        <label className="text-[10px] font-bold text-brand-navy">لوحة رسم التوقيع:</label>
                        <div className="border border-zinc-200 rounded-2xl bg-white overflow-hidden shadow-inner relative" style={{ height: '180px' }}>
                          <SignatureCanvas 
                            ref={sigCanvas} 
                            penColor='#1D2A44' 
                            canvasProps={{
                              className: 'w-full h-full cursor-crosshair'
                            }} 
                          />
                          <button 
                            type="button"
                            onClick={() => sigCanvas.current?.clear()}
                            className="absolute left-3 bottom-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-[10px] px-3 py-1.5 rounded-lg border-0 cursor-pointer font-bold"
                          >
                            مسح اللوحة وإعادة الرسم
                          </button>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <button
                        onClick={handleSignContract}
                        disabled={isSigning}
                        className="w-full py-4.5 bg-brand-navy hover:bg-brand-navy/95 text-brand-gold disabled:opacity-50 text-xs font-black rounded-2xl transition-all cursor-pointer shadow-lg hover:shadow-xl border-0 flex items-center justify-center gap-2"
                      >
                        <PenTool size={16} />
                        <span>{isSigning ? 'جاري توثيق التوقيع وحفظه في السجلات...' : 'اعتماد التوقيع وتفعيل العقد رسمياً 🔑'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white/40 p-16 rounded-3xl border border-dashed border-zinc-200 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <FileText size={48} className="text-zinc-300 mb-3" />
              <p className="text-brand-navy/60 font-black text-sm">مستند العقد العقاري</p>
              <p className="text-zinc-400 text-xs mt-1 max-w-sm">يرجى تحديد عقد عقاري من القائمة الجانبية لقراءته، مراجعته، والتوقيع عليه رقمياً بصيغة آمنة تماماً.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
