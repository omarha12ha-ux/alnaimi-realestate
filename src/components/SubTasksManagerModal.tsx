import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Trash2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { authFetch } from '../lib/api';
import { cn } from '../lib/utils';
import type { Appointment, SubTask } from '../types';

/**
 * Manages the per-appointment sub-task checklist, tracks overall progress and
 * pushes WhatsApp progress updates to the customer.
 */
interface SubTasksManagerModalProps {
  appointment: Appointment;
  onClose: () => void;
  onUpdateAppointments: () => void;
}

export function SubTasksManagerModal({
  appointment,
  onClose,
  onUpdateAppointments
}: SubTasksManagerModalProps) {
  const [subTasks, setSubTasks] = useState<SubTask[]>(appointment.subTasks || []);
  const [newTitle, setNewTitle] = useState('');
  const [newPhotoNotes, setNewPhotoNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [sendWhatsAppNotification, setSendWhatsAppNotification] = useState(true);
  
  // Quick pre-filled WhatsApp message state
  const [customMsg, setCustomMsg] = useState('');
  // Track selected sub-task for custom message generation
  const [highlightedTask, setHighlightedTask] = useState<SubTask | null>(null);

  const overallProgress = subTasks.length > 0 
    ? Math.round(subTasks.reduce((sum, t) => sum + t.progress, 0) / subTasks.length)
    : 0;

  useEffect(() => {
    if (highlightedTask) {
      const msg = `تحديث إنجاز المشروع 🏗️:
عزيزنا الزبون ${appointment.clientName}،
يسرنا إعلامك بآخر مستجدات مشروع الإكساء/البناء الخاص بك "${appointment.serviceTitle || 'تشييد وبناء'}":
- تم إنجاز خطوة مهمة: "${highlightedTask.title}" بنسبة (${highlightedTask.progress}%).
${highlightedTask.photoNotes ? `- ملاحظات تصوير وتوثيق المرحلة: "${highlightedTask.photoNotes}"\n` : ''}- حالة المهمة: ${highlightedTask.status === 'completed' ? 'تمت بنجاح ✅ (Completed)' : (highlightedTask.status === 'in_progress' || highlightedTask.status === 'processing') ? 'قيد العمل والتنفيذ 🛠️ (Processing)' : 'قيد الانتظار 📅 (Pending)'}.
- نسبة الإنجاز الإجمالية الكلية للمشروع: (${overallProgress}%).

شكراً لاختياركم شركة البراء النعيمي للتطوير العقاري 🇸🇾`;
      setCustomMsg(msg);
    } else {
      const msg = `تحديث نسبة الإنجاز الإجمالية 🏗️:
عزيزنا الزبون ${appointment.clientName}،
يسرنا إعلامك بآخر مستجدات مشروع الإكساء/البناء الخاص بك "${appointment.serviceTitle || 'تشييد وبناء'}":
- نسبة الإنجاز الإجمالية الكلية للمشروع وصلت اليوم إلى: (${overallProgress}%).

شكراً لاختياركم شركة البراء النعيمي للتطوير العقاري 🇸🇾`;
      setCustomMsg(msg);
    }
  }, [highlightedTask, overallProgress, appointment.clientName, appointment.serviceTitle]);

  const handleAddTask = () => {
    if (!newTitle.trim()) return;
    const newTask: SubTask = {
      id: 'task_' + Math.random().toString(36).substring(2, 9),
      title: newTitle.trim(),
      progress: 0,
      status: 'pending',
      updatedAt: new Date().toISOString(),
      photoNotes: newPhotoNotes.trim() || undefined
    };
    const updated = [...subTasks, newTask];
    setSubTasks(updated);
    setNewTitle('');
    setNewPhotoNotes('');
    setHighlightedTask(newTask);
  };

  const handleUpdateTaskStatus = (taskId: string, status: 'pending' | 'processing' | 'in_progress' | 'completed') => {
    const updated = subTasks.map(t => {
      if (t.id === taskId) {
        const progress = status === 'completed' ? 100 : (status === 'pending' ? 0 : t.progress);
        const updatedTask: SubTask = { ...t, status, progress, updatedAt: new Date().toISOString() };
        setHighlightedTask(updatedTask);
        return updatedTask;
      }
      return t;
    });
    setSubTasks(updated);
  };

  const handleUpdateTaskProgress = (taskId: string, progress: number) => {
    const updated = subTasks.map(t => {
      if (t.id === taskId) {
        const status: 'pending' | 'processing' | 'in_progress' | 'completed' = progress === 100 ? 'completed' : (progress === 0 ? 'pending' : 'processing');
        const updatedTask: SubTask = { ...t, progress, status, updatedAt: new Date().toISOString() };
        setHighlightedTask(updatedTask);
        return updatedTask;
      }
      return t;
    });
    setSubTasks(updated);
  };

  const handleUpdateTaskPhotoNotes = (taskId: string, photoNotes: string) => {
    const updated = subTasks.map(t => {
      if (t.id === taskId) {
        const updatedTask: SubTask = { ...t, photoNotes: photoNotes.trim() || undefined, updatedAt: new Date().toISOString() };
        if (highlightedTask?.id === taskId) {
          setHighlightedTask(updatedTask);
        }
        return updatedTask;
      }
      return t;
    });
    setSubTasks(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = subTasks.filter(t => t.id !== taskId);
    setSubTasks(updated);
    setHighlightedTask(null);
  };

  const handleSaveAndNotify = async () => {
    setIsSaving(true);
    try {
      // 1. Update appointment document in Firestore
      const appRef = doc(db, 'appointments', appointment.id);
      await updateDoc(appRef, {
        subTasks: subTasks
      });

      // 2. Send Notifications if checked
      if (sendWhatsAppNotification && appointment.clientPhone) {
        const phone = appointment.clientPhone;
        // In-App Notification
        await addDoc(collection(db, 'notifications'), {
          userId: appointment.userId,
          title: "تحديث الإنجاز لمشروعك 🏗️",
          message: `تم تحديث خطة عمل مشروعك. نسبة الإنجاز الكلية للمشروع بلغت الاستحقاق: (${overallProgress}%).`,
          status: 'unread',
          type: 'general',
          appointmentId: appointment.id,
          createdAt: new Date().toISOString()
        });

        // External WhatsApp Trigger
        await authFetch("/api/whatsapp/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            phone, 
            message: customMsg,
            serviceId: appointment.serviceId,
            departmentId: appointment.departmentId
          })
        }).catch(apiErr => console.error("WhatsApp notification dispatch failed:", apiErr));

        // WhatsApp Log Trace
        const logRef = doc(collection(db, 'whatsapp_logs'));
        await setDoc(logRef, {
          id: logRef.id,
          sender: "0945430030",
          receiverName: appointment.clientName,
          receiverPhone: phone,
          receiverEmail: appointment.clientEmail,
          message: customMsg,
          status: 'success',
          createdAt: new Date().toISOString()
        }).catch(logErr => console.error("Firestore whatsapp_logs insert failed:", logErr));
      }

      onUpdateAppointments();
      onClose();
    } catch (err) {
      console.error("Error saving sub-tasks:", err);
      alert("حدث خطأ أثناء حفظ التحديثات، الرجاء التأكد من الصلاحيات.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/75 backdrop-blur-xl z-[9999] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="bg-white border border-brand-navy/5 max-w-2xl w-full rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col font-sans text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-brand-navy text-white p-6 flex justify-between items-center shrink-0 border-b border-brand-gold/15">
          <div className="text-right">
            <h3 className="text-lg font-serif font-black flex items-center gap-2 text-brand-gold">
              <span>📋 قائمة مهام الإكساء والبناء ونسب الإنجاز</span>
              <span className="text-xs bg-brand-gold text-brand-navy px-2.5 py-1 rounded font-mono font-bold">نسبة كلية: {overallProgress}%</span>
            </h3>
            <p className="text-xs text-zinc-300 mt-1">العميل: {appointment.clientName} • الموعد المطلوب: {appointment.serviceTitle || 'تشييد وبناء'}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-brand-gold transition-colors cursor-pointer bg-white/10 p-2 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Add Form */}
          <div className="bg-brand-cream/30 p-5 rounded-2xl border border-brand-navy/5 space-y-3">
            <h4 className="text-xs font-bold text-brand-navy/70 uppercase">➕ إضافة خطوة أو مهمة فرعية جديدة:</h4>
            <div className="space-y-2.5">
              <input 
                type="text"
                placeholder="اسم المهمة الفرعية (مثال: صب الأعمدة، تمديد خطوط السباكة، تركيب السيراميك...)"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                className="w-full p-3 rounded-xl border border-brand-navy/10 focus:border-brand-gold outline-none font-bold bg-white text-xs text-right animate-none"
              />
              <div className="flex gap-3">
                <input 
                  type="text"
                  placeholder="📸 ملاحظات تصوير وتوثيق المعاينة اختيارية لهذه المرحلة..."
                  value={newPhotoNotes}
                  onChange={e => setNewPhotoNotes(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                  className="flex-1 p-3 rounded-xl border border-brand-navy/10 focus:border-brand-gold outline-none font-bold bg-white text-xs text-right"
                />
                <button 
                  onClick={handleAddTask}
                  className="px-6 bg-brand-navy text-brand-gold py-3 rounded-xl text-xs font-bold transition-all hover:opacity-90 cursor-pointer whitespace-nowrap"
                >
                  إضافة المهمة 🚀
                </button>
              </div>
            </div>
          </div>

          {/* Status Distribution Summary Chart */}
          {subTasks.length > 0 && (() => {
            const totalTasks = subTasks.length;
            const completedTasks = subTasks.filter(t => t.status === 'completed').length;
            const inProgressTasks = subTasks.filter(t => t.status === 'processing' || t.status === 'in_progress').length;
            const pendingTasks = subTasks.filter(t => t.status === 'pending').length;

            const completedPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const inProgressPercentage = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
            const pendingPercentage = totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0;

            const statusDistributionData = [
              { name: 'مكتملة', value: completedTasks, color: '#10B981', percentage: completedPercentage },
              { name: 'قيد التنفيذ', value: inProgressTasks, color: '#B48A3C', percentage: inProgressPercentage },
              { name: 'قيد الانتظار', value: pendingTasks, color: '#9CA3AF', percentage: pendingPercentage },
            ].filter(item => item.value > 0);

            return (
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/60 flex flex-col sm:flex-row items-center justify-between gap-6 animate-fadeIn">
                <div className="flex-1 space-y-3 w-full">
                  <h4 className="text-xs font-black text-brand-navy flex items-center gap-1.5">
                    <span>📊</span> توزيع حالات المهام الحالية للمشروع:
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-right">
                    <div className="bg-white p-2.5 rounded-xl border border-zinc-150 shadow-2xs">
                      <span className="text-[10px] font-bold text-emerald-600 block">🟢 مكتملة</span>
                      <span className="text-xs font-black text-zinc-850 mt-0.5 block">{completedTasks} <span className="text-[9px] text-zinc-400 font-bold">({completedPercentage}%)</span></span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-zinc-150 shadow-2xs">
                      <span className="text-[10px] font-bold text-brand-gold block">🟡 قيد التنفيذ</span>
                      <span className="text-xs font-black text-zinc-850 mt-0.5 block">{inProgressTasks} <span className="text-[9px] text-zinc-400 font-bold">({inProgressPercentage}%)</span></span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-zinc-150 shadow-2xs">
                      <span className="text-[10px] font-bold text-zinc-400 block">⚪ قيد الانتظار</span>
                      <span className="text-xs font-black text-zinc-850 mt-0.5 block">{pendingTasks} <span className="text-[9px] text-zinc-400 font-bold">({pendingPercentage}%)</span></span>
                    </div>
                  </div>
                </div>

                {/* Pie Chart display */}
                <div className="w-24 h-24 shrink-0 flex items-center justify-center relative bg-white rounded-full p-1 border border-zinc-150">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={18}
                        outerRadius={32}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: any, name: any) => [`${value} مهمة`, name]}
                        contentStyle={{ 
                          direction: 'rtl', 
                          textAlign: 'right', 
                          fontSize: '9px', 
                          fontWeight: 'bold', 
                          borderRadius: '0.5rem',
                          border: '1px solid #e4e4e7',
                          padding: '4px 8px'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center progress indicator */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                    <span className="text-[8px] font-bold text-zinc-400">إنجاز</span>
                    <span className="text-[11px] font-black text-zinc-850 leading-none">{overallProgress}%</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Sub-tasks list */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-brand-navy/70 uppercase">📋 بنية المهام المخططة الحالية ({subTasks.length}):</h4>
            {subTasks.length === 0 ? (
              <div className="p-10 text-center text-brand-navy/30 bg-brand-cream/10 rounded-2xl border border-dashed border-brand-navy/10">
                <p className="text-xs font-bold">لا يوجد أي مهمة مضافة للمشروع بعد. ابدأ بإضافة مهام في الأعلى لتتبع الإنجاز.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                {subTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={cn(
                      "p-4 rounded-xl border transition-all flex flex-col gap-3.5",
                      highlightedTask?.id === task.id ? "bg-amber-50/50 border-brand-gold" : "bg-white border-brand-navy/5"
                    )}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <span className="font-bold text-xs text-brand-navy block">🔨 {task.title}</span>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <input 
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={task.progress}
                              onChange={e => handleUpdateTaskProgress(task.id, parseInt(e.target.value))}
                              className="w-36 h-2 bg-brand-navy/10 rounded-lg appearance-none cursor-pointer accent-brand-gold"
                            />
                            <span className="text-[10px] font-mono font-bold bg-brand-navy/5 px-2 py-0.5 rounded text-brand-navy">{task.progress}%</span>
                          </div>
                          {/* Interactive live preview of the client progress bar */}
                          <div className="w-full max-w-xs bg-brand-navy/5 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-300 rounded-full",
                                task.status === 'completed' ? "bg-green-500" : (task.status === 'in_progress' || task.status === 'processing') ? "bg-brand-gold animate-pulse" : "bg-zinc-200"
                              )} 
                              style={{ width: `${task.progress}%` }} 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
                        <span className="text-[10px] text-brand-navy/60 font-black">الحالة الحالية:</span>
                        <select
                          value={task.status === 'in_progress' ? 'processing' : (task.status || 'pending')}
                          onChange={e => handleUpdateTaskStatus(task.id, e.target.value as any)}
                          className="bg-white border border-brand-navy/15 text-brand-navy rounded-lg p-1.5 text-xs font-bold focus:outline-none focus:border-brand-gold outline-none"
                        >
                          <option value="pending">⚪ قيد الانتظار (Pending)</option>
                          <option value="processing">🟡 قيد المعالجة (Processing)</option>
                          <option value="completed">🟢 مكتملة (Completed)</option>
                        </select>

                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors cursor-pointer border-0"
                          title="حذف المهمة"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Inline Photo Notes Edit Field for Sub-task */}
                    <div className="border-t border-brand-navy/5 pt-2.5">
                      <div className="flex items-center gap-1 text-[10px] font-black text-brand-navy/60 mb-1.5">
                        <span>📸</span>
                        <span>ملاحظات تصوير وتوثيق المرحلة:</span>
                      </div>
                      <input 
                        type="text"
                        placeholder="مثال: تم التقاط 4 صور لتمديد الأنابيب الأرضية قبل تغطيتها وتصوير زوايا الصب..."
                        value={task.photoNotes || ''}
                        onChange={e => handleUpdateTaskPhotoNotes(task.id, e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-brand-navy/10 focus:border-brand-gold outline-none text-[11px] bg-white text-right font-sans placeholder-brand-navy/35 font-semibold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress Summary and Notification Details */}
          <div className="border-t border-brand-navy/5 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-brand-navy">
                <input 
                  type="checkbox"
                  checked={sendWhatsAppNotification}
                  onChange={e => setSendWhatsAppNotification(e.target.checked)}
                  className="rounded border-brand-navy/20 text-brand-navy focus:ring-brand-gold w-4 h-4 cursor-pointer"
                />
                <span>📢 إرسال إشعار تحديث إنجاز فوري للعميل في النظام وعبر واتساب للرقم {appointment.clientPhone || 'بدون رقم'}</span>
              </label>
            </div>

            {sendWhatsAppNotification && (
              <div className="bg-brand-cream/20 p-5 rounded-2xl border border-brand-gold/15 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-brand-navy">💬 نص الرسالة المبرمجة للواتساب:</span>
                  <button 
                    type="button"
                    onClick={() => setHighlightedTask(null)}
                    className="text-[10px] bg-brand-gold text-brand-navy px-2.5 py-1 rounded font-bold hover:opacity-90 transition-all border-0"
                  >
                    🔄 رسالة الإنجاز الإجمالي
                  </button>
                </div>
                <textarea 
                  value={customMsg}
                  onChange={e => setCustomMsg(e.target.value)}
                  className="w-full text-xs font-bold p-3.5 rounded-xl border border-brand-navy/10 focus:border-brand-gold focus:ring-1 outline-none text-right h-36 bg-white font-sans leading-relaxed"
                />
                <p className="text-[10px] text-brand-navy/40 leading-normal">
                  💡 تلميح: انقر على أي مهمة فوق أو حدد حالة مهمة لتوليد رسالة مخصصة لتحديث تلك المهمة تلقائياً أو انقر على زر إعادة التوليد لرسالة إجمالية.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-brand-cream/40 px-6 py-4 border-t border-brand-navy/5 flex gap-4 shrink-0">
          <button 
            onClick={handleSaveAndNotify}
            disabled={isSaving}
            className="flex-grow py-3.5 bg-brand-navy text-brand-gold hover:opacity-95 rounded-2xl font-bold text-xs shadow-lg transition-all text-center flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer border-0"
          >
            {isSaving ? 'جاري حفظ البيانات...' : 'حفظ ونشر التعديلات للزبون 💾'}
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-3.5 bg-white text-zinc-500 border border-brand-navy/10 rounded-2xl font-bold text-xs hover:bg-brand-cream/35 transition-all text-center cursor-pointer"
          >
            إلغاء
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
