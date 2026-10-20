import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, collection, query, where, getDocs, getDoc, updateDoc } from 'firebase/firestore';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import InstallAppButton from './InstallAppButton';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.warn("Firebase Anonymous Auth failed, falling back to mock guest session:", err);
      if (typeof window !== "undefined") {
        localStorage.setItem("demo-user-role", "user");
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        try {
          const userDocRef = doc(db, 'users', userCred.user.uid);
          // The role is not derived from the address. It is read back from the
          // server-side profile, which only an administrator can write, and
          // mirrored here purely for rendering. Writing a client-computed role
          // was an escalation path: anyone who knew an admin address could set
          // it on their own document.
          const existing = await getDoc(userDocRef);
          const storedRole = existing.exists() ? (existing.data()?.role ?? 'client') : 'client';
          await setDoc(userDocRef, {
            uid: userCred.user.uid,
            email: email.toLowerCase(),
            name: userCred.user.displayName || email.split('@')[0],
            role: storedRole,
            lastLogin: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.error("Error updating user login doc:", e);
        }
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        try {
          const userDocRef = doc(db, 'users', userCred.user.uid);
          // New accounts always start as 'client'. `firestore.rules` enforces
          // the same thing, so a tampered request cannot promote itself.
          await setDoc(userDocRef, {
            uid: userCred.user.uid,
            email: email.toLowerCase(),
            name: name.trim() || email.split('@')[0],
            role: 'client',
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.error("Error creating user doc:", e);
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء المصادقة.');
      // Log failed attempt
      if (isLogin) {
        try {
          const { collection, query, where, getDocs, doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../lib/firebase');
          const q = query(collection(db, 'users'), where('email', '==', email));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            const userDoc = qSnap.docs[0];
            const userData = userDoc.data();
            const newFailedAttempts = (userData.failedAttempts || 0) + 1;
            await updateDoc(userDoc.ref, { 
              failedAttempts: newFailedAttempts, 
              lastFailedAttempt: new Date().toISOString() 
            });
            if (newFailedAttempts >= 3) {
              await updateDoc(userDoc.ref, { blocked: true });
              // Trigger WhatsApp alert (placeholder)
              console.log(`WhatsApp alert: User ${email} blocked due to 3 failed login attempts.`);
            }
          }
        } catch (e) {
          console.error("Failed to log failed attempt", e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
      <InstallAppButton />
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-3xl font-black text-brand-navy mb-2 text-center">
          {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
        </h2>
        <p className="text-gray-500 text-center mb-8 font-medium">
          {isLogin ? 'أهلاً بك في شركة البراء النعيمي العقارية' : 'انضم إلينا اليوم'}
        </p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-bold text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">الاسم الكامل</label>
              <div className="relative">
                <User className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-navy outline-none"
                  placeholder="الاسم الكامل"
                  required
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-3 pr-10 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-navy outline-none"
                placeholder="example@email.com"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-navy outline-none"
                placeholder="********"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-navy text-brand-gold py-3 rounded-xl font-black hover:bg-brand-navy/90 transition-all disabled:opacity-50"
          >
            {loading ? 'جاري المعالجة...' : isLogin ? 'دخول' : 'تسجيل'}
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-gray-100"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold">أو</span>
          <div className="flex-grow border-t border-gray-100"></div>
        </div>

        {/*
          A one-click "instant supervisor login" button used to sit here. It set
          `demo-user-role=admin` in localStorage, which paints the staff
          interface but grants nothing: no Firebase ID token, no API access, no
          Firestore data. The label promised an authenticated admin session and
          delivered an empty mock, so it was removed rather than left to mislead
          staff or clients into believing they were signed in.

          Development still has the same shortcut, but it is a build-time-guarded
          URL parameter that is stripped from production bundles:
          http://localhost:3000/?demo=admin
        */}

        <button 
          type="button" 
          onClick={handleGuestLogin}
          disabled={loading}
          className="w-full mt-3 border-2 border-brand-navy/10 text-brand-navy hover:bg-gray-50 py-3 rounded-xl font-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <span className="text-base">👤</span>
          <span>الدخول كزائر (تصفح بدون حساب)</span>
        </button>

        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="w-full text-center text-xs font-bold text-gray-500 mt-6 hover:text-brand-navy"
        >
          {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب بالفعل؟ سجل الدخول'}
        </button>
      </div>
    </div>
  );
}
