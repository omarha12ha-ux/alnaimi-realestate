import React from 'react';
import { Broker, BrokerTask } from '../types';
import { AlertTriangle, Bell, Calendar, Clock, User } from 'lucide-react';

interface OverdueBrokerTasksDashboardTableProps {
  brokers: Broker[];
  appointments: any[];
  onAlertBrokerForOverdueTask: (broker: Broker, task: BrokerTask, daysOverdue: number) => void;
}

export function OverdueBrokerTasksDashboardTable({
  brokers,
  appointments,
  onAlertBrokerForOverdueTask
}: OverdueBrokerTasksDashboardTableProps) {
  const overdueTasks = React.useMemo(() => {
    const list: { broker: Broker; task: BrokerTask; daysOverdue: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    brokers.forEach(broker => {
      (broker.tasks || []).forEach(task => {
        if (task.status === 'in_progress' && task.dueDate) {
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          if (dueDate < today) {
            const diffTime = today.getTime() - dueDate.getTime();
            const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            list.push({
              broker,
              task,
              daysOverdue: diffDays
            });
          }
        }
      });
    });

    // Sort by most overdue first
    return list.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [brokers]);

  if (overdueTasks.length === 0) {
    return (
      <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-[2rem] p-8 text-center" dir="rtl">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600 text-xl">
          ✓
        </div>
        <h4 className="text-base font-bold text-brand-navy mb-1">لا توجد مهام متأخرة للوسطاء!</h4>
        <p className="text-xs text-brand-navy/60">كل مناديب ووسطاء النظام يلتزمون بمواعيد مهامهم الحالية.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-brand-navy/5 rounded-[2.5rem] shadow-xl overflow-hidden p-6 md:p-8" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-brand-navy/5">
        <div>
          <h3 className="text-xl font-serif font-black text-brand-navy flex items-center gap-2">
            <span>مهام الوسطاء المتأخرة</span>
            <AlertTriangle className="text-amber-500 animate-pulse" size={20} />
          </h3>
          <p className="text-xs text-brand-navy/60 mt-1">قائمة بالمهام النشطة للوسطاء التي تجاوزت تاريخ الاستحقاق المحدد لها.</p>
        </div>
        <div className="bg-red-50 text-red-700 px-4 py-1.5 rounded-full text-xs font-black border border-red-100">
          ⚠️ {overdueTasks.length} مهمة متأخرة بحاجة لمتابعة
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b border-brand-navy/10 text-brand-navy/60 text-xs font-black uppercase tracking-wider">
              <th className="pb-3 text-right">الوسيط / المندوب</th>
              <th className="pb-3 text-right">عنوان المهمة</th>
              <th className="pb-3 text-right">تاريخ الاستحقاق</th>
              <th className="pb-3 text-right">المرتبط بالموعد</th>
              <th className="pb-3 text-right">مدة التأخير</th>
              <th className="pb-3 text-center">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-navy/5">
            {overdueTasks.map(({ broker, task, daysOverdue }) => (
              <tr key={task.id} className="text-xs font-bold text-brand-navy hover:bg-brand-cream/5 transition-all">
                <td className="py-4">
                  <div className="flex items-center gap-2.5">
                    {broker.avatarUrl ? (
                      <img src={broker.avatarUrl} alt={broker.name} className="w-8 h-8 rounded-full object-cover border border-brand-navy/10" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center border border-brand-navy/5 text-brand-navy/60 text-sm">
                        <User size={14} />
                      </div>
                    )}
                    <div>
                      <span className="block font-black text-[12px]">{broker.name}</span>
                      <span className="text-[10px] text-brand-navy/40 font-mono tracking-wider">{broker.phone}</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-[12px]">
                  {task.title}
                </td>
                <td className="py-4 font-mono text-brand-navy/70 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-brand-navy/40" />
                    <span>{task.dueDate}</span>
                  </div>
                </td>
                <td className="py-4 text-[11px] text-brand-navy/60">
                  {task.appointmentTitle ? (
                    <div>
                      <span className="block text-brand-navy/80">{task.appointmentTitle}</span>
                      {task.appointmentDate && (
                        <span className="text-[9px] font-mono block text-brand-navy/40">{task.appointmentDate}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-brand-navy/30">غير محدد</span>
                  )}
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-1.5 text-red-600 font-black">
                    <Clock size={13} />
                    <span>متأخرة بـ {daysOverdue} يوم</span>
                  </div>
                </td>
                <td className="py-4 text-center">
                  <button
                    onClick={() => onAlertBrokerForOverdueTask(broker, task, daysOverdue)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                  >
                    <Bell size={11} />
                    <span>تنبيه الوسيط 📱</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
