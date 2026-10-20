import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { UserPermissions } from '../types';
import { Save, Loader, Shield } from 'lucide-react';

export const PermissionsManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const fetchedUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(fetchedUsers);
      } catch (e) {
        console.error("Error fetching users:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const updatePermissions = async (userId: string, permissions: UserPermissions) => {
    setSaving(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { permissions });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions } : u));
    } catch (e) {
      console.error("Error updating permissions:", e);
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="p-4 text-center">جاري تحميل المستخدمين...</div>;

  return (
    <div className="p-6 bg-white rounded-3xl shadow-sm border border-zinc-100">
      <h2 className="text-2xl font-bold mb-6 text-brand-navy flex items-center gap-2">
        <Shield className="text-brand-gold" />
        إدارة صلاحيات المستخدمين
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr>
              <th className="p-3 text-brand-navy font-bold">اسم المستخدم</th>
              <th className="p-3 text-brand-navy font-bold">العقارات</th>
              <th className="p-3 text-brand-navy font-bold">الخدمات</th>
              <th className="p-3 text-brand-navy font-bold">المواعيد</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t border-zinc-100">
                <td className="p-3">{user.name || 'مستخدم'}</td>
                {['properties', 'services', 'appointments'].map(section => (
                  <td key={section} className="p-3">
                    <div className="flex gap-2">
                      {['create', 'read', 'update', 'delete'].map(action => (
                        <label key={action} className="flex items-center gap-1 text-[10px]">
                          <input 
                            type="checkbox" 
                            checked={!!user.permissions?.[section as keyof UserPermissions]?.[action as keyof UserPermissions['properties']]}
                            onChange={(e) => {
                                const newPermissions = {
                                    ...(user.permissions || {
                                        properties: {create: false, read: false, update: false, delete: false},
                                        services: {create: false, read: false, update: false, delete: false},
                                        appointments: {create: false, read: false, update: false, delete: false}
                                    }),
                                    [section]: {
                                        ...(user.permissions?.[section as keyof UserPermissions] || {create: false, read: false, update: false, delete: false}),
                                        [action]: e.target.checked
                                    }
                                };
                                updatePermissions(user.id, newPermissions);
                            }}
                          />
                          {action}
                        </label>
                      ))}
                    </div>
                  </td>
                ))}
                <td className="p-3">
                    {saving === user.id && <Loader className="animate-spin" size={16} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
