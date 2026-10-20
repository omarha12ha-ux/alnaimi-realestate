import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Broker, BrokerTask, TaskCategory } from '../types';

interface BrokerModalsProps {
  showAddBrokerModal: boolean;
  setShowAddBrokerModal: (show: boolean) => void;
  editingBroker: Broker | null;
  setEditingBroker: (broker: Broker | null) => void;
  brokerName: string;
  setBrokerName: (name: string) => void;
  brokerType: 'broker' | 'sales_rep';
  setBrokerType: (type: 'broker' | 'sales_rep') => void;
  brokerPhone: string;
  setBrokerPhone: (phone: string) => void;
  brokerEmail: string;
  setBrokerEmail: (email: string) => void;
  brokerCommission: string;
  setBrokerCommission: (commission: string) => void;
  brokerDeals: string;
  setBrokerDeals: (deals: string) => void;
  brokerRating: string;
  setBrokerRating: (rating: string) => void;
  brokerStars: string;
  setBrokerStars: (stars: string) => void;
  brokerGovernorate: string;
  setBrokerGovernorate: (gov: string) => void;
  brokerRegion: string;
  setBrokerRegion: (reg: string) => void;
  brokerSubDistrict: string;
  setBrokerSubDistrict: (sub: string) => void;
  brokerSpecialties: string;
  setBrokerSpecialties: (spec: string) => void;
  brokerFeatures: string;
  setBrokerFeatures: (feat: string) => void;
  brokerRecentReview: string;
  setBrokerRecentReview: (review: string) => void;
  brokerAvatarUrl: string;
  setBrokerAvatarUrl: (url: string) => void;
  brokerStatus: 'active' | 'inactive';
  setBrokerStatus: (status: 'active' | 'inactive') => void;
  handleAddOrUpdateBroker: (e: React.FormEvent) => void;
  technicalSpecialties?: any[];

  // Tasks props
  showBrokerTasksModal: boolean;
  setShowBrokerTasksModal: (show: boolean) => void;
  selectedBrokerForTasks: Broker | null;
  setSelectedBrokerForTasks: (broker: Broker | null) => void;
  brokers: Broker[];
  completingTaskId: string | null;
  setCompletingTaskId: (id: string | null) => void;
  newBrokerTaskTitle: string;
  setNewBrokerTaskTitle: (title: string) => void;
  newBrokerTaskDueDate: string;
  setNewBrokerTaskDueDate: (date: string) => void;
  newBrokerTaskDueTime: string;
  setNewBrokerTaskDueTime: (time: string) => void;
  taskCategories: TaskCategory[];
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  completionNotes: string;
  setCompletionNotes: (notes: string) => void;
  taskCompletedPhotos: string[];
  setTaskCompletedPhotos: React.Dispatch<React.SetStateAction<string[]>>;
  handleCompleteBrokerTask: (taskId: string, status?: 'completed' | 'disabled', notes?: string) => void;
  handleAssignBrokerTask: (e: React.FormEvent) => void;
  departments?: any[];
  selectedTaskDeptId: string;
  setSelectedTaskDeptId: (id: string) => void;
  selectedTaskSubDeptId: string;
  setSelectedTaskSubDeptId: (id: string) => void;

  // Lightbox props
  activeLightboxPhoto: { url: string; title: string; repName: string; date?: string; notes?: string } | null;
  setActiveLightboxPhoto: (photo: { url: string; title: string; repName: string; date?: string; notes?: string } | null) => void;

  syrianAdministrativeDivisions: Record<string, Record<string, string[]>>;
}

export const BrokerModals: React.FC<BrokerModalsProps> = ({
  showAddBrokerModal,
  setShowAddBrokerModal,
  editingBroker,
  setEditingBroker,
  brokerName,
  setBrokerName,
  brokerType,
  setBrokerType,
  brokerPhone,
  setBrokerPhone,
  brokerEmail,
  setBrokerEmail,
  brokerCommission,
  setBrokerCommission,
  brokerDeals,
  setBrokerDeals,
  brokerRating,
  setBrokerRating,
  brokerStars,
  setBrokerStars,
  brokerGovernorate,
  setBrokerGovernorate,
  brokerRegion,
  setBrokerRegion,
  brokerSubDistrict,
  setBrokerSubDistrict,
  brokerSpecialties,
  setBrokerSpecialties,
  brokerFeatures,
  setBrokerFeatures,
  brokerRecentReview,
  setBrokerRecentReview,
  brokerAvatarUrl,
  setBrokerAvatarUrl,
  brokerStatus,
  setBrokerStatus,
  handleAddOrUpdateBroker,
  technicalSpecialties = [],

  showBrokerTasksModal,
  setShowBrokerTasksModal,
  selectedBrokerForTasks,
  setSelectedBrokerForTasks,
  brokers,
  completingTaskId,
  setCompletingTaskId,
  newBrokerTaskTitle,
  setNewBrokerTaskTitle,
  newBrokerTaskDueDate,
  setNewBrokerTaskDueDate,
  newBrokerTaskDueTime,
  setNewBrokerTaskDueTime,
  taskCategories,
  selectedCategoryId,
  setSelectedCategoryId,
  completionNotes,
  setCompletionNotes,
  taskCompletedPhotos,
  setTaskCompletedPhotos,
  handleCompleteBrokerTask,
  handleAssignBrokerTask,
  departments = [],
  selectedTaskDeptId,
  setSelectedTaskDeptId,
  selectedTaskSubDeptId,
  setSelectedTaskSubDeptId,

  activeLightboxPhoto,
  setActiveLightboxPhoto,
  syrianAdministrativeDivisions
}) => {
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'timeline'>('list');

  return (
    <>
      {/* Modal overlay to Add or Edit Broker */}
      <AnimatePresence>
        {showAddBrokerModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-xl flex items-center justify-center z-[999] p-4 text-right"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white rounded-[2.5rem] border border-brand-navy/15 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Modal head */}
              <div className="p-6 bg-brand-navy text-white flex justify-between items-center border-b border-brand-gold/15 sticky top-0 z-10">
                <div>
                  <h4 className="font-serif font-bold text-lg text-brand-gold">
                    {editingBroker ? 'تعديل بيانات الوسيط العقاري' : 'إضافة وسيط عقاري جديد'}
                  </h4>
                  <p className="text-[11px] text-zinc-300 mt-1">
                    أدخل معلومات الاتصال ونسبة العمولة المتفق عليها في النظام لمتابعة المبادلات.
                  </p>
                </div>
                <button type="button"
                  onClick={() => {
                    setShowAddBrokerModal(false);
                    setEditingBroker(null);
                  }}
                  className="p-1 px-3 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer text-xs font-black transition-colors"
                >
                  إغلاق ✕
                </button>
              </div>

            {/* Modal body & form */}
            <form onSubmit={handleAddOrUpdateBroker} className="p-8 space-y-6">
              <div className="space-y-4">
                {/* Avatar Option */}
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-150 space-y-3">
                  <label className="block text-xs font-bold text-brand-navy flex items-center gap-1.5">
                    <span>🖼️</span> الصورة الشخصية للوسيط (Avatar):
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Preview */}
                    <div className="relative group shrink-0">
                      {brokerAvatarUrl ? (
                        <img
                          src={brokerAvatarUrl}
                          alt="Avatar Preview"
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-full object-cover border-2 border-brand-gold shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-brand-navy/5 border-2 border-dashed border-brand-navy/15 flex items-center justify-center font-bold text-brand-navy/40 text-xl font-serif">
                          👤
                        </div>
                      )}
                      {brokerAvatarUrl && (
                        <button type="button"
                         
                          onClick={() => setBrokerAvatarUrl('')}
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 text-[8px] leading-none shadow-md cursor-pointer"
                          title="حذف الصورة"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex-1 space-y-2 w-full text-right">
                      <div className="flex flex-wrap gap-2">
                        {/* File Input Label */}
                        <label className="px-3.5 py-1.5 bg-brand-navy text-brand-gold text-[10px] font-black rounded-lg cursor-pointer hover:opacity-90 transition-opacity inline-flex items-center gap-1 border border-brand-navy/10">
                          <span>📤</span> رفع ملف صورة...
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 800000) {
                                  alert("حجم الصورة كبير جداً! يرجى اختيار صورة بحجم أقل من 800 كيلوبايت لضمان سرعة الحفظ والمزامنة.");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === 'string') {
                                    setBrokerAvatarUrl(reader.result);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>

                        {/* Presets dropdown */}
                        <div className="relative inline-block">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                setBrokerAvatarUrl(e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="px-3.5 py-1.5 bg-white text-zinc-750 text-[10px] font-black rounded-lg border border-zinc-250 cursor-pointer hover:bg-zinc-50 transition-colors"
                          >
                            <option value="">👤 اختر صورة جاهزة...</option>
                            <option value="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200">👨‍💼 مستشار عقاري (رجل)</option>
                            <option value="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200">👩‍💼 مستشارة عقارية (سيدة)</option>
                            <option value="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200">👨‍💼 وسيط مبيعات شاب</option>
                            <option value="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200">👩‍💼 مندوبة خدمات تقنية</option>
                            <option value="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200">👨‍💼 مستشار تنفيذي</option>
                            <option value="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200">👩‍💼 وكيلة تسويق ومبيعات</option>
                          </select>
                        </div>
                      </div>
                      <p className="text-[9px] text-zinc-400 font-medium font-sans">يمكنك رفع صورة شخصية من جهازك أو اختيار أحد الصور الاحترافية المتاحة لتعزيز الثقة وعرضها لعملائك.</p>
                    </div>
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-xs font-bold text-brand-navy pb-1">الاسم الكامل للوسيط <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={brokerName}
                    onChange={(e) => setBrokerName(e.target.value)}
                    placeholder="مثال: م. علي أحمد علي"
                    className="w-full px-4 py-3 border border-brand-navy/15 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-gold"
                  />
                </div>

                {/* Broker Type Select */}
                <div>
                  <label className="block text-xs font-bold text-brand-navy pb-1">تصنيف الوكيل / دور الموظف <span className="text-red-500">*</span></label>
                  <select
                    value={brokerType}
                    onChange={(e) => setBrokerType(e.target.value as 'broker' | 'sales_rep')}
                    className="w-full px-4 py-3 border border-brand-navy/15 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-gold bg-white cursor-pointer"
                  >
                    <option value="broker">🏠 وسيط عقاري (مبيعات ومعاينات العقارات)</option>
                    <option value="sales_rep">🛠️ مندوب مبيعات الخدمات (صيانة، تعهدات، ديكور، إلخ)</option>
                  </select>
                </div>

                {/* Phone input */}
                <div>
                  <label className="block text-xs font-bold text-brand-navy pb-1">رقم هاتف الاتصال / واتساب <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={brokerPhone}
                    onChange={(e) => setBrokerPhone(e.target.value)}
                    placeholder="مثال: 0945430030"
                    className="w-full px-4 py-3 border border-brand-navy/15 rounded-xl text-xs font-semibold text-left font-mono focus:outline-none focus:border-brand-gold"
                    dir="ltr"
                  />
                </div>

                {/* Email input */}
                <div>
                  <label className="block text-xs font-bold text-brand-navy pb-1">البريد الإلكتروني للوسيط (اختياري)</label>
                  <input
                    type="email"
                    value={brokerEmail}
                    onChange={(e) => setBrokerEmail(e.target.value)}
                    placeholder="broker@domain.com"
                    className="w-full px-4 py-3 border border-brand-navy/15 rounded-xl text-xs font-semibold text-left font-mono focus:outline-none focus:border-brand-gold"
                    dir="ltr"
                  />
                </div>

                {/* Two columns: commissionRate and dealsCount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy pb-1">نسبة العمولة (%) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="100"
                      required
                      value={brokerCommission}
                      onChange={(e) => setBrokerCommission(e.target.value)}
                      placeholder="2.5"
                      className="w-full px-4 py-3 border border-brand-navy/15 rounded-xl text-xs font-semibold text-center font-mono focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy pb-1">عدد الصفقات المبرمة</label>
                    <input
                      type="number"
                      min="0"
                      value={brokerDeals}
                      onChange={(e) => setBrokerDeals(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 border border-brand-navy/15 rounded-xl text-xs font-semibold text-center font-mono focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                </div>

                {/* Ratings & Stars row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy pb-1">تقييم الوسيط (من 5.0)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="1"
                      max="5"
                      value={brokerRating}
                      onChange={(e) => setBrokerRating(e.target.value)}
                      placeholder="4.9"
                      className="w-full px-4 py-3 border border-brand-navy/15 rounded-xl text-xs font-semibold text-center font-mono focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy pb-1">عدد النجوم الحاصل عليها</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={brokerStars}
                      onChange={(e) => setBrokerStars(e.target.value)}
                      placeholder="5"
                      className="w-full px-4 py-3 border border-brand-navy/15 rounded-xl text-xs font-semibold text-center font-mono focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                </div>

                {/* Syrian Administrative Divisions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy pb-1">المحافظة المخصصة <span className="text-red-500">*</span></label>
                    <select
                      value={brokerGovernorate}
                      onChange={(e) => setBrokerGovernorate(e.target.value)}
                      className="w-full px-4 py-3 border border-brand-navy/15 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-gold bg-white cursor-pointer"
                    >
                      {Object.keys(syrianAdministrativeDivisions).map((gov) => (
                        <option key={gov} value={gov}>
                          {gov}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy pb-1">المنطقة الإدارية <span className="text-red-500">*</span></label>
                    <select
                      value={brokerRegion}
                      onChange={(e) => setBrokerRegion(e.target.value)}
                      className="w-full px-4 py-3 border border-brand-navy/15 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-gold bg-white cursor-pointer"
                    >
                      {Object.keys(syrianAdministrativeDivisions[brokerGovernorate] || {}).map((reg) => (
                        <option key={reg} value={reg}>
                          {reg}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy pb-1">الناحية الإدارية <span className="text-red-500">*</span></label>
                    <select
                      value={brokerSubDistrict}
                      onChange={(e) => setBrokerSubDistrict(e.target.value)}
                      className="w-full px-4 py-3 border border-brand-navy/15 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-gold bg-white cursor-pointer"
                    >
                      {(syrianAdministrativeDivisions[brokerGovernorate]?.[brokerRegion] || []).map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Specialties */}
                <div>
                  <label className="block text-xs font-bold text-brand-navy pb-1">مجالات التخصص (مفصولة بفاصلة أو '،')</label>
                  <input
                    type="text"
                    value={brokerSpecialties}
                    onChange={(e) => setBrokerSpecialties(e.target.value)}
                    placeholder="مثال: شقق سكنية، فلل وقصور، ريف دمشق"
                    className="w-full px-4 py-3 border border-brand-navy/15 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-gold"
                  />
                  {technicalSpecialties && technicalSpecialties.length > 0 && (
                    <div className="mt-2.5 space-y-1.5 text-right">
                      <span className="text-[10px] text-brand-navy/60 font-black block">💡 التخصصات الفنية المعتمدة من مصفوفة التخصصات (اضغط للتحديد):</span>
                      <div className="flex flex-wrap gap-1.5 justify-start">
                        {technicalSpecialties.map((spec: any) => {
                          const currentList = brokerSpecialties.split(/[،,]/).map(s => s.trim()).filter(Boolean);
                          const isSelected = currentList.includes(spec.name);
                          
                          const handleToggle = () => {
                            if (isSelected) {
                              const updated = currentList.filter(s => s !== spec.name);
                              setBrokerSpecialties(updated.join('، '));
                            } else {
                              const updated = [...currentList, spec.name];
                              setBrokerSpecialties(updated.join('، '));
                            }
                          };

                          return (
                            <button
                              type="button"
                              key={spec.id || spec.name}
                              onClick={handleToggle}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-brand-navy text-brand-gold border border-brand-gold/20 shadow-xs' 
                                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200/50'
                              }`}
                            >
                              {spec.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div>
                  <label className="block text-xs font-bold text-brand-navy pb-1">الميزات وقدرات الوسيط (مفصولة بفاصلة أو '،')</label>
                  <input
                    type="text"
                    value={brokerFeatures}
                    onChange={(e) => setBrokerFeatures(e.target.value)}
                    placeholder="مثال: استجابة فورية ⚡، مفاوض ماهر 🤝"
                    className="w-full px-4 py-3 border border-brand-navy/15 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-gold"
                  />
                </div>

                {/* Recent review */}
                <div>
                  <label className="block text-xs font-bold text-brand-navy pb-1">أبرز تقييم أو شهادة عميل سابق</label>
                  <textarea
                    value={brokerRecentReview}
                    onChange={(e) => setBrokerRecentReview(e.target.value)}
                    placeholder="مثال: تعامل راقٍ جداً وكان صبوراً وسريع المتابعة حتى كشف الملكية."
                    rows={2}
                    className="w-full px-4 py-3 border border-brand-navy/15 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-gold resize-none"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-brand-navy pb-1">الحالة في النظام</label>
                  <div className="flex gap-4 p-1">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-black">
                      <input
                        type="radio"
                        name="status"
                        checked={brokerStatus === 'active'}
                        onChange={() => setBrokerStatus('active')}
                        className="accent-brand-navy"
                      />
                      <span>نشط وقائم بالعمل</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-black text-zinc-500">
                      <input
                        type="radio"
                        name="status"
                        checked={brokerStatus === 'inactive'}
                        onChange={() => setBrokerStatus('inactive')}
                        className="accent-brand-navy"
                      />
                      <span>موقف مؤقتاً / غير نشط</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer triggers */}
              <div className="flex gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="submit"
                  className="flex-grow py-3.5 bg-brand-navy hover:opacity-95 text-brand-gold font-serif font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-md"
                >
                  {editingBroker ? 'حفظ وتحديث التغييرات' : 'تسجيل وإضافة الوسيط للشركة'}
                </button>
                <button type="button"
                 
                  onClick={() => {
                    setShowAddBrokerModal(false);
                    setEditingBroker(null);
                  }}
                  className="px-6 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold text-xs rounded-xl transition-all cursor-pointer border"
                >
                  إلغاء الأمر
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Modal overlay to Manage Broker Tasks */}
      <AnimatePresence>
        {showBrokerTasksModal && selectedBrokerForTasks && (() => {
          const activeBrokerForTasks = brokers.find(b => b.id === selectedBrokerForTasks.id) || selectedBrokerForTasks;
          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-xl flex items-center justify-center z-[999] p-4 text-right" 
              dir="rtl" 
              onClick={() => {
                setShowBrokerTasksModal(false);
                setSelectedBrokerForTasks(null);
                setCompletingTaskId(null);
                setNewBrokerTaskTitle('');
                setNewBrokerTaskDueDate('');
              }}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="bg-white rounded-[2.5rem] border border-brand-navy/15 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" 
                onClick={(e) => e.stopPropagation()}
              >
              {/* Modal header */}
              <div className="p-6 bg-brand-navy text-white flex justify-between items-center border-b border-brand-gold/15 sticky top-0 z-10">
                <div>
                  <h4 className="font-serif font-bold text-lg text-brand-gold flex items-center gap-2">
                    <span>📋</span> إدارة مهام الوسيط: {activeBrokerForTasks.name}
                  </h4>
                  <p className="text-[11px] text-zinc-300 mt-1">
                    يمكنك هنا إسناد مهام محددة للوسيط العقاري، تتبع إنجازها، وكتابة ملاحظات تفصيلية لتقييم الأداء.
                  </p>
                </div>
                <button type="button"
                  onClick={() => {
                    setShowBrokerTasksModal(false);
                    setSelectedBrokerForTasks(null);
                    setCompletingTaskId(null);
                    setNewBrokerTaskTitle('');
                    setNewBrokerTaskDueDate('');
                  }}
                  className="p-1 px-3 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer text-xs font-black transition-colors"
                >
                  إغلاق ✕
                </button>
              </div>

              <div className="p-8 space-y-6">
                {/* Section 1: Add/Assign New Task */}
                <form onSubmit={handleAssignBrokerTask} className="bg-brand-cream/15 p-5 rounded-2xl border border-brand-navy/5 space-y-4">
                  <h5 className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                    <span>➕</span> جدولة وإسناد مهمة جديدة للوسيط
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1 text-right">
                      <label className="text-[10px] font-bold text-brand-navy/60 mr-1">تصنيف المهمة</label>
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="w-full px-3 py-2.5 border border-brand-navy/15 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-gold bg-white"
                      >
                        <option value="">اختر التصنيف...</option>
                        {taskCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                      <label className="text-[10px] font-bold text-brand-navy/60 mr-1">عنوان المهمة الميدانية <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={newBrokerTaskTitle}
                        onChange={(e) => setNewBrokerTaskTitle(e.target.value)}
                        placeholder="مثال: تصوير عقار يعفور..."
                        className="w-full px-4 py-2.5 border border-brand-navy/15 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-gold bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1 text-right">
                      <label className="text-[10px] font-bold text-brand-navy/60 mr-1">التاريخ المستهدف للإنجاز</label>
                      <input
                        type="date"
                        value={newBrokerTaskDueDate}
                        onChange={(e) => setNewBrokerTaskDueDate(e.target.value)}
                        className="w-full px-4 py-2.5 border border-brand-navy/15 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-gold bg-white text-right"
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                      <label className="text-[10px] font-bold text-brand-navy/60 mr-1">الوقت المستهدف للإنجاز</label>
                      <input
                        type="time"
                        value={newBrokerTaskDueTime}
                        onChange={(e) => setNewBrokerTaskDueTime(e.target.value)}
                        className="w-full px-4 py-2.5 border border-brand-navy/15 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-gold bg-white text-right"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-brand-navy/5">
                    <div className="flex flex-col gap-1 text-right">
                      <label className="text-[10px] font-bold text-brand-navy/60 mr-1">القسم الإداري الرئيسي 🏢 <span className="text-red-500">*</span></label>
                      <select
                        required
                        value={selectedTaskDeptId}
                        onChange={(e) => {
                          setSelectedTaskDeptId(e.target.value);
                          setSelectedTaskSubDeptId('');
                        }}
                        className="w-full px-3 py-2.5 border border-brand-navy/15 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-gold bg-white"
                      >
                        <option value="">اختر القسم الإداري المسؤول...</option>
                        {(departments || []).map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                      <label className="text-[10px] font-bold text-brand-navy/60 mr-1">القسم الفرعي التابع 📂 <span className="text-red-500">*</span></label>
                      <select
                        required
                        value={selectedTaskSubDeptId}
                        onChange={(e) => setSelectedTaskSubDeptId(e.target.value)}
                        disabled={!selectedTaskDeptId}
                        className="w-full px-3 py-2.5 border border-brand-navy/15 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-gold bg-white disabled:opacity-50"
                      >
                        <option value="">اختر القسم الفرعي التابع...</option>
                        {((departments || []).find(d => d.id === selectedTaskDeptId)?.subDepartments || []).map((sub: any) => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2 border-t border-brand-navy/5">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-brand-navy hover:opacity-95 text-brand-gold font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                    >
                      <span>📌</span> جدولة وإسناد المهمة
                    </button>
                  </div>
                </form>

                {/* Section 2: Tasks List / Timeline Toggle */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2 border-zinc-100">
                    <h5 className="text-xs font-bold text-brand-navy">📋 قائمة المهام والجدول العملي ({activeBrokerForTasks.tasks?.length || 0})</h5>
                    <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
                      <button
                        type="button"
                        onClick={() => setTaskViewMode('list')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${taskViewMode === 'list' ? 'bg-white text-brand-navy shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
                      >
                        قائمة المهام
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskViewMode('timeline')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${taskViewMode === 'timeline' ? 'bg-white text-brand-navy shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
                      >
                        الجدول الزمني 📅
                      </button>
                    </div>
                  </div>

                  {!activeBrokerForTasks.tasks || activeBrokerForTasks.tasks.length === 0 ? (
                    <p className="text-[11px] text-zinc-400 font-medium py-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">لم يتم إسناد أي مهام مخصصة لهذا الوسيط بعد في النظام.</p>
                  ) : taskViewMode === 'timeline' ? (
                    <div className="relative border-r-2 border-brand-navy/15 mr-4 pr-6 space-y-6 animate-fadeIn py-2 text-right">
                      {(() => {
                        const sortedTasks = [...(activeBrokerForTasks.tasks || [])].sort((a, b) => {
                          const dateA = a.dueDate ? new Date(`${a.dueDate}T${a.dueTime || '00:00'}`) : new Date(a.createdAt);
                          const dateB = b.dueDate ? new Date(`${b.dueDate}T${b.dueTime || '00:00'}`) : new Date(b.createdAt);
                          return dateA.getTime() - dateB.getTime();
                        });

                        return sortedTasks.map((task: BrokerTask) => {
                          const isCompleted = task.status === 'completed';
                          const isCompleting = completingTaskId === task.id;
                          return (
                            <div key={task.id} className="relative">
                              {/* Circle Bullet on the line */}
                              <div className={`absolute right-[-31px] top-1.5 w-4.5 h-4.5 rounded-full border-4 border-white flex items-center justify-center ${isCompleted ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                              
                              {/* Card for task details */}
                              <div className={`p-4 rounded-2xl border transition-all ${isCompleted ? 'bg-emerald-50/40 border-emerald-100' : 'bg-white border-zinc-200 shadow-xs'}`}>
                                <div className="space-y-1 text-right">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                      {isCompleted ? 'مكتملة' : 'معلقة / نشطة'}
                                    </span>
                                    {task.categoryId && (
                                      <span className="text-[9px] bg-brand-navy/10 text-brand-navy px-1.5 py-0.5 rounded-md font-bold">
                                        {taskCategories.find(c => c.id === task.categoryId)?.name}
                                      </span>
                                    )}
                                  </div>
                                  <h6 className={`text-xs font-bold mt-2 ${isCompleted ? 'text-emerald-800 line-through' : 'text-brand-navy'}`}>{task.title}</h6>
                                  <div className="flex flex-wrap gap-2 text-[10px] text-zinc-400 font-mono mt-1">
                                    <span>📅 الاستحقاق: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('ar-SY') + ' م' : 'غير محدد'}</span>
                                    {task.dueTime && <span>⏰ الساعة: {task.dueTime}</span>}
                                  </div>
                                  {task.completedAt && (
                                    <p className="text-[10px] text-emerald-650 font-mono font-bold">✅ تاريخ الإنجاز: {new Date(task.completedAt).toLocaleDateString('ar-SY')} م</p>
                                  )}
                                  {task.notes && (
                                    <div className="mt-2 text-[11px] bg-zinc-50 p-2.5 rounded-lg text-zinc-650 border border-zinc-150">
                                      <span className="font-bold text-zinc-500 block text-[9px] mb-0.5">📝 تقرير الإنجاز:</span>
                                      {task.notes}
                                    </div>
                                  )}
                                  {task.workPhotos && task.workPhotos.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {task.workPhotos.map((url, imgIdx) => (
                                        <div key={imgIdx} className="w-8 h-8 rounded-md overflow-hidden border border-zinc-200 cursor-pointer" onClick={() => setActiveLightboxPhoto({ url, title: task.title, repName: activeBrokerForTasks.name, date: task.completedAt ? new Date(task.completedAt).toLocaleDateString('ar-SY') + ' م' : undefined, notes: task.notes })}>
                                          <img src={url} alt="معاينة" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Completion Action inside Timeline too */}
                                  {task.status !== 'completed' && (
                                    <div className="pt-2 mt-2 border-t border-dashed border-zinc-150">
                                      {isCompleting ? (
                                        <div className="space-y-2">
                                          <textarea
                                            required
                                            value={completionNotes}
                                            onChange={(e) => setCompletionNotes(e.target.value)}
                                            placeholder="اكتب تقرير الإنجاز هنا..."
                                            rows={2}
                                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[10px] focus:outline-none bg-white resize-none"
                                          />
                                          <div className="flex gap-1.5 justify-end">
                                            <button type="button" onClick={() => handleCompleteBrokerTask(task.id, "completed")} className="px-3 py-1 bg-emerald-650 text-white font-bold text-[10px] rounded-md cursor-pointer">حفظ وإكمال</button>
                                            <button type="button" onClick={() => setCompletingTaskId(null)} className="px-2 py-1 bg-zinc-100 text-zinc-500 text-[10px] rounded-md cursor-pointer">إلغاء</button>
                                          </div>
                                        </div>
                                      ) : (
                                        <button type="button" onClick={() => { setCompletingTaskId(task.id); setCompletionNotes(''); setTaskCompletedPhotos([]); }} className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer">✓ وضع علامة مكتملة</button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeBrokerForTasks.tasks.map((task: BrokerTask) => {
                        const isCompleting = completingTaskId === task.id;
                        return (
                          <div key={task.id} className={`p-4 rounded-2xl border transition-all ${task.status === 'completed' ? 'bg-emerald-50/40 border-emerald-100' : 'bg-white border-zinc-200 shadow-xs'}`}>
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1 text-right">
                                <div className="flex items-center gap-2">
                                  <h6 className={`text-xs font-bold ${task.status === 'completed' ? 'text-emerald-800 line-through' : 'text-brand-navy'}`}>{task.title}</h6>
                                  {task.categoryId && (
                                    <span className="text-[9px] bg-brand-navy/10 text-brand-navy px-1.5 py-0.5 rounded-md font-bold">
                                      {taskCategories.find(c => c.id === task.categoryId)?.name}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2 text-[10px] text-zinc-400 font-mono mt-1">
                                  <span>📅 تاريخ الإسناد: {new Date(task.createdAt).toLocaleDateString('ar-SY')} م</span>
                                  {task.dueDate && (
                                    <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100/40">
                                      ⏰ الموعد المستهدف: {new Date(task.dueDate).toLocaleDateString('ar-SY')} م {task.dueTime ? `الساعة ${task.dueTime}` : ''}
                                    </span>
                                  )}
                                </div>
                                {task.completedAt && (
                                  <p className="text-[10px] text-emerald-650 font-mono font-bold">✅ تاريخ الإنجاز: {new Date(task.completedAt).toLocaleDateString('ar-SY')} م</p>
                                )}
                                {task.notes && (
                                  <div className="mt-2 text-[11px] bg-zinc-50 p-2.5 rounded-lg text-zinc-650 border border-zinc-150">
                                    <span className="font-bold text-zinc-500 block text-[9px] mb-0.5">📝 تقرير إتمام المهمة والملاحظات:</span>
                                    {task.notes}
                                  </div>
                                )}
                                {task.workPhotos && task.workPhotos.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    <span className="text-[9px] text-zinc-400 font-bold block">📷 الصور المرفقة للتوثيق والإثبات:</span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {task.workPhotos.map((url, imgIdx) => (
                                        <div key={imgIdx} className="relative group w-12 h-12 rounded-lg overflow-hidden border border-zinc-200 cursor-pointer" onClick={() => setActiveLightboxPhoto({ url, title: task.title, repName: activeBrokerForTasks.name, date: task.completedAt ? new Date(task.completedAt).toLocaleDateString('ar-SY') + ' م' : undefined, notes: task.notes })}>
                                          <img src={url} alt="إثبات العمل" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                          <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center font-bold text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">🔍 تكبير</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {task.status !== 'completed' && (
                                <div className="shrink-0 flex flex-col gap-2">
                                  {isCompleting ? (
                                    <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-right space-y-2.5 max-w-xs">
                                      <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 pb-1">كتابة تقرير وملاحظات الإنجاز <span className="text-red-500">*</span></label>
                                        <textarea
                                          required
                                          value={completionNotes}
                                          onChange={(e) => setCompletionNotes(e.target.value)}
                                          placeholder="أدخل تفاصيل ما تم إنجازه، المشاكل والنتائج بالتفصيل لتظهر في التقرير..."
                                          rows={2}
                                          className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[10px] font-medium focus:outline-none bg-white resize-none"
                                        />
                                      </div>

                                      {/* Document file photo attachments */}
                                      <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold text-zinc-500">إرفاق صور المعاينة والتوثيق الميداني</label>
                                        <div className="flex gap-1.5">
                                          <input
                                            type="text"
                                            placeholder="رابط الصورة (URL)"
                                            id={`photo-url-input-${task.id}`}
                                            className="flex-grow px-2 py-1 border border-zinc-200 rounded-lg text-[9px] font-mono focus:outline-none bg-white"
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const input = document.getElementById(`photo-url-input-${task.id}`) as HTMLInputElement;
                                                if (input && input.value.trim()) {
                                                  setTaskCompletedPhotos(prev => [...prev, input.value.trim()]);
                                                  input.value = '';
                                                }
                                              }
                                            }}
                                          />
                                          <button type="button"
                                           
                                            onClick={() => {
                                              const input = document.getElementById(`photo-url-input-${task.id}`) as HTMLInputElement;
                                              if (input && input.value.trim()) {
                                                setTaskCompletedPhotos(prev => [...prev, input.value.trim()]);
                                                input.value = '';
                                              }
                                            }}
                                            className="px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-[10px] font-bold rounded-lg cursor-pointer"
                                          >
                                            إضافة
                                          </button>
                                        </div>

                                        {/* Selection Previews */}
                                        {taskCompletedPhotos.length > 0 && (
                                          <div className="space-y-1 pt-1.5">
                                            <span className="text-[9px] text-zinc-400 block font-bold">الصور المختارة للتوثيق الميداني:</span>
                                            <div className="flex flex-wrap gap-1.5">
                                              {taskCompletedPhotos.map((url, imgIdx) => (
                                                <div key={imgIdx} className="relative group w-12 h-12 rounded-lg overflow-hidden border border-zinc-200">
                                                  <img src={url} alt="معاينة" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                  <button type="button"
                                                   
                                                    onClick={() => setTaskCompletedPhotos(prev => prev.filter((_, idx) => idx !== imgIdx))}
                                                    className="absolute inset-0 bg-black/60 text-white flex items-center justify-center font-bold text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                  >
                                                    إزالة
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex gap-2 pt-1 border-t border-zinc-200">
<button type="button"
                                            onClick={() => handleCompleteBrokerTask(task.id, "disabled", "تم تعطيل المهمة من قبل الإدارة")}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-sm"
                                          >
                                            تعطيل المهمة 🚫
                                          </button>
                                          <button type="button"
                                           
                                          onClick={() => handleCompleteBrokerTask(task.id, "completed")}
                                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-sm"
                                        >
                                          حفظ وإكمال المهمة ✓
                                        </button>
                                        <button type="button"
                                         
                                          onClick={() => {
                                            setCompletingTaskId(null);
                                            setCompletionNotes('');
                                            setTaskCompletedPhotos([]);
                                          }}
                                          className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs rounded-lg cursor-pointer transition-colors"
                                        >
                                          إلغاء
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button type="button"
                                     
                                      onClick={() => {
                                        setCompletingTaskId(task.id);
                                        setCompletionNotes('');
                                        setTaskCompletedPhotos([]);
                                      }}
                                      className="self-start px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-100 cursor-pointer transition-colors"
                                    >
                                      ✓ وضع علامة "مكتملة" وإضافة ملاحظات وصور
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
      })()}
    </AnimatePresence>

      {/* Lightbox modal for field work photo verification */}
      <AnimatePresence>
        {activeLightboxPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-zinc-950/90 p-4 backdrop-blur-xl" 
            dir="rtl"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative bg-white rounded-[2rem] border border-zinc-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col"
            >
            
            {/* Header */}
            <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div className="text-right">
                <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider block">📷 توثيق ومعاينة العمل الميداني</span>
                <h4 className="text-sm font-black text-brand-navy mt-0.5">{activeLightboxPhoto.title}</h4>
              </div>
              <button type="button" 
               
                onClick={() => setActiveLightboxPhoto(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-650 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Image display */}
            <div className="relative aspect-video w-full bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-100">
              <img 
                src={activeLightboxPhoto.url} 
                alt={activeLightboxPhoto.title}
                className="max-h-full max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Footer Details */}
            <div className="p-6 space-y-4 text-right">
              <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 pb-3">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold block">المندوب المسؤول:</span>
                  <span className="text-xs font-black text-zinc-800 flex items-center gap-1.5 mt-0.5">
                    <span className="w-4 h-4 bg-brand-gold/20 text-brand-gold rounded-full flex items-center justify-center text-[9px] font-bold">👤</span>
                    {activeLightboxPhoto.repName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold block">تاريخ الإثبات والتوثيق:</span>
                  <span className="text-xs font-black text-zinc-800 flex items-center gap-1.5 mt-0.5">
                    <span>📅</span> {activeLightboxPhoto.date || 'تاريخ غير محدد'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold block">📝 ملاحظات وتفاصيل الإنجاز الميداني:</span>
                <p className="text-xs font-semibold text-zinc-600 leading-relaxed bg-zinc-50 p-3.5 rounded-xl border border-zinc-150">
                  {activeLightboxPhoto.notes || 'تم تسليم المهمة بنجاح والتأكد من مطابقتها لكافة الشروط والمواصفات المحددة في طلب الخدمة.'}
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <a 
                  href={activeLightboxPhoto.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-4 py-2 bg-brand-navy text-brand-gold font-black text-xs rounded-xl hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  🌐 فتح في علامة تبويب جديدة
                </a>
                <button type="button" 
                 
                  onClick={() => setActiveLightboxPhoto(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-650 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};
