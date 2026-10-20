import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Phone, MessageSquare, Loader, Check, CheckCircle } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, onSnapshot, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { SupportChat, SupportChatMessage } from '../types';

export default function LiveChatWidget({ language = 'ar' }: { language?: 'ar' | 'en' }) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessageAlert, setHasNewMessageAlert] = useState(false);
  const [chat, setChat] = useState<SupportChat | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Registration form for guests
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Active chat session state
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Identify active user session (from Auth or guest session in localStorage)
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
        setUserName(user.displayName || user.email?.split('@')[0] || 'عميل مسجل');
        setUserEmail(user.email || '');
        // We will retrieve userPhone inside the chat generation if saved
      } else {
        // Look for guest session in localStorage
        const storedGuestId = localStorage.getItem('support_guest_id');
        const storedGuestName = localStorage.getItem('support_guest_name');
        const storedGuestPhone = localStorage.getItem('support_guest_phone');
        if (storedGuestId && storedGuestName) {
          setUserId(storedGuestId);
          setUserName(storedGuestName);
          setUserPhone(storedGuestPhone || '');
        } else {
          // No current session
          setUserId('');
          setUserName('');
          setUserPhone('');
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Setup Real-time listening to their custom chat document
  useEffect(() => {
    if (!userId) {
      setChat(null);
      return;
    }

    setLoading(true);
    const chatRef = doc(db, 'support_chats', userId);
    const unsubscribe = onSnapshot(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SupportChat;
        setChat(data);
        
        // Trigger notification sound or bouncing effect if new message from team arrived
        if (isOpen === false && data.messages.length > 0) {
          const lastMsg = data.messages[data.messages.length - 1];
          if (lastMsg.sender === 'team') {
            setHasNewMessageAlert(true);
          }
        }
      } else {
        setChat(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to support chat:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, isOpen]);

  // Scroll to bottom whenever messages list is updated or opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [chat?.messages, isOpen]);

  // 3. Register guest session locally & on Firestore
  const handleRegisterGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    setIsRegistering(true);
    const randomId = 'guest_' + Math.floor(Math.random() * 100000000) + '_' + Date.now();
    localStorage.setItem('support_guest_id', randomId);
    localStorage.setItem('support_guest_name', guestName.trim());
    if (guestPhone.trim()) {
      localStorage.setItem('support_guest_phone', guestPhone.trim());
    }

    setUserId(randomId);
    setUserName(guestName.trim());
    setUserPhone(guestPhone.trim());
    setIsRegistering(false);
  };

  // 4. Send Message function
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !userId) return;

    const textToSend = messageText.trim();
    setMessageText('');

    const chatRef = doc(db, 'support_chats', userId);
    const newMsg: SupportChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      sender: 'user',
      text: textToSend,
      createdAt: new Date().toISOString()
    };

    try {
      // Check if chat document already exists
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
        await updateDoc(chatRef, {
          messages: arrayUnion(newMsg),
          lastMessage: textToSend,
          lastActive: new Date().toISOString(),
          status: 'open'
        });
      } else {
        // Create first support chat session
        const initialChat: SupportChat = {
          id: userId,
          userId,
          userName: userName || 'عميل زائر',
          userPhone: userPhone || undefined,
          userEmail: userEmail || undefined,
          lastMessage: textToSend,
          lastActive: new Date().toISOString(),
          status: 'open',
          messages: [newMsg]
        };
        await setDoc(chatRef, initialChat);
      }
    } catch (err) {
      console.error("Error sending message to support chat in Firestore:", err);
    }
  };

  const formattedWhatsAppUrl = () => {
    const rawNum = '0945430030';
    // Format Syrian local format to internationally compatible wa.me format (+963945430030)
    const internationalNum = '963' + rawNum.replace(/^0/, '');
    const defaultText = `مرحباً فريق شركة النعيمي العقارية، أرغب في الحصول على استشارة فورية. الاسم: ${userName || 'زائر'} ${userPhone ? ` | هاتف: ${userPhone}` : ''}`;
    const customText = messageText.trim() 
      ? `تحية طيبة شركة النعيمي العقارية، لدي استفسار عاجل: ${messageText.trim()}`
      : defaultText;
    return `https://wa.me/${internationalNum}?text=${encodeURIComponent(customText)}`;
  };

  return (
    <div className={`fixed bottom-24 ${language === 'ar' ? 'right-4 md:right-auto md:left-6' : 'left-4 md:left-auto md:right-6'} md:bottom-6 z-[9999] font-sans`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* 1. Expandable Chat Dialog Window with Framer Motion */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="mb-4 w-[calc(100vw-2rem)] sm:w-[360px] md:w-[400px] h-[480px] sm:h-[580px] bg-white rounded-3xl sm:rounded-[2.5rem] border border-brand-navy/15 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Elegant Header with Dark Luxury Motif */}
            <div className={`bg-brand-navy p-5 pb-6 text-white ${language === 'ar' ? 'text-right' : 'text-left'} relative flex items-center justify-between border-b border-brand-gold/15`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full absolute"></span>
                  <h3 className="font-serif font-bold text-lg text-brand-gold">{t('المستشار العقاري الفوري', 'Instant Real Estate Advisor')}</h3>
                </div>
                <p className="text-[10px] text-zinc-300 font-medium mt-1">{t('فريق شركة النعيمي يرحب بكم ويجيب عن استفساراتكم', 'Al-Nuaimi team welcomes you and answers your inquiries')}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Main Interactive/Dynamic body of Chat */}
            <div className="flex-grow flex flex-col bg-brand-cream/15 overflow-hidden p-4">
              {/* WhatsApp direct instant hook banner */}
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl mb-3 flex items-center justify-between gap-2 shadow-xs">
                <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                  <p className="text-[11px] font-black text-emerald-950 flex items-center gap-1">
                    <span>🟢</span> {t('دردشة فورية مباشرة عبر واتساب', 'Instant Chat via WhatsApp')}
                  </p>
                  <p className="text-[9px] text-emerald-800 font-semibold mt-0.5">{t('تواصل مباشرة على الرقم المتوفر 0945430030', 'Contact directly at 0945430030')}</p>
                </div>
                <a
                  href={formattedWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
                >
                  <MessageCircle size={12} className="fill-white" />
                  {t('دردشة واتساب', 'WhatsApp Chat')}
                </a>
              </div>

              {/* Check if Guest session identifier does not exist yet */}
              {!userId ? (
                <div className="flex-grow flex flex-col justify-center items-center py-6 px-4">
                  <div className="w-14 h-14 bg-brand-gold/10 rounded-full flex items-center justify-center text-brand-gold mb-4">
                    <MessageSquare size={28} />
                  </div>
                  <h4 className="font-serif font-black text-brand-navy text-sm text-center">{t('أهلاً بكم في شركة النعيمي العقارية', 'Welcome to Al-Nuaimi Real Estate Company')}</h4>
                  <p className="text-[11px] text-zinc-500 text-center mt-1 max-w-[280px] leading-relaxed">
                    {t(
                      'يرجى تزويدنا بالاسم ورقم الجوال لتخزين استفسارتك وتنسيقها مع مستشارك العقاري مباشرة:',
                      'Please provide your name and mobile number to save your inquiry and coordinate directly with your real estate consultant:'
                    )}
                  </p>

                  <form onSubmit={handleRegisterGuest} className="w-full space-y-3 mt-5">
                    <div>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder={t('الاسم الكامل العميل الكريم *', 'Your full name *')}
                        className={`w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-white placeholder-zinc-400 focus:outline-none focus:border-brand-gold ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-bold`}
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder={t('رقم الهاتف الخلوي (اختياري)', 'Mobile phone number (optional)')}
                        className={`w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-white placeholder-zinc-400 focus:outline-none focus:border-brand-gold ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-bold`}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isRegistering || !guestName.trim()}
                      className="w-full py-3.5 bg-brand-navy text-brand-gold hover:bg-brand-navy/95 transition-all text-xs font-black rounded-xl cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isRegistering ? t('جاري بدء الجلسة...', 'Starting session...') : t('بدء محادثة الاستشارة الآن 💬', 'Start consulting conversation now 💬')}
                    </button>
                  </form>
                </div>
              ) : (
                /* Active Conversations List rendered in real-time */
                <div className="flex-grow flex flex-col overflow-hidden justify-between">
                  <div className="flex-grow overflow-y-auto space-y-3 pr-1 py-1 flex flex-col">
                    {loading && (!chat || chat.messages.length === 0) ? (
                      <div className="flex-grow flex items-center justify-center text-zinc-400 text-xs font-medium">
                        <Loader className="animate-spin mb-1 text-brand-gold" size={18} />
                        <span className="mr-2">جاري تحميل الاستشارة السابقة...</span>
                      </div>
                    ) : !chat || chat.messages.length === 0 ? (
                      <div className="flex-grow flex flex-col items-center justify-center text-zinc-400 text-center p-6">
                        <span className="text-2xl mb-2">👋</span>
                        <p className="text-xs font-bold text-brand-navy">مرحباً {userName}!</p>
                        <p className="text-[10px] text-zinc-500 mt-1 max-w-[250px] leading-relaxed">أهلاً بك في نظام الاستشارات الفورية لشركة النعيمي، سيتم حفظ مذكراتك المحولة هنا وتوجيهها للقسم العقاري المختص فوراً.</p>
                      </div>
                    ) : (
                      chat.messages.map((msg) => {
                        const isUser = msg.sender === 'user';
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col max-w-[82%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}
                          >
                            <div className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed relative ${
                              isUser 
                                ? 'bg-brand-navy text-white rounded-br-none shadow-sm' 
                                : 'bg-white text-zinc-800 border border-brand-navy/5 rounded-bl-none shadow-xs'
                            }`}>
                              <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            <span className="text-[9px] text-zinc-400 font-mono mt-1 px-1">
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input form in the footer of chat */}
                  <form onSubmit={handleSendMessage} className="mt-3 relative flex items-center gap-2 pt-2 border-t border-brand-navy/5 bg-white p-2 rounded-2xl">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="اكتب استفسارك العقاري للشركة هنا..."
                      className="flex-grow px-3.5 py-3 rounded-xl border-none focus:outline-none focus:ring-0 text-right text-xs font-bold text-zinc-800 placeholder-zinc-400 bg-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim()}
                      className="w-10 h-10 rounded-xl bg-brand-navy hover:bg-brand-navy/90 text-brand-gold transition-all flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-40"
                    >
                      <Send size={15} className="transform rotate-180" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Stunning Bouncing floating bubble trigger button */}
      <motion.button
        onClick={() => {
          setIsOpen(!isOpen);
          setHasNewMessageAlert(false);
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-16 h-16 bg-brand-navy text-brand-gold rounded-full flex items-center justify-center shadow-2xl shadow-brand-navy/30 hover:shadow-brand-navy/50 relative border border-brand-gold/15 transition-all cursor-pointer group"
      >
        {/* Glowing surrounding wave animation if there is alert */}
        {hasNewMessageAlert && (
          <span className="absolute -inset-1 bg-emerald-500 rounded-full animate-ping opacity-60"></span>
        )}

        {isOpen ? (
          <X size={26} className="text-brand-gold group-hover:rotate-90 transition-transform duration-300" />
        ) : (
          <div className="relative">
            <MessageCircle size={28} className="text-brand-gold transform group-hover:-scale-x-100 transition-transform duration-500" />
            {hasNewMessageAlert && (
              <span className="absolute -top-1.5 -left-1.5 w-4.5 h-4.5 bg-emerald-500 border-2 border-brand-navy rounded-full text-[9px] font-black text-white flex items-center justify-center animate-bounce">
                1
              </span>
            )}
            {!hasNewMessageAlert && !isOpen && (
              <span className="absolute -top-1 -left-1 w-3 h-3 bg-brand-gold rounded-full border border-brand-navy animate-pulse"></span>
            )}
          </div>
        )}

        {/* Pop message help bubble on hover or load */}
        {!isOpen && (
          <div className="absolute right-[76px] left-auto md:left-[76px] md:right-auto top-1/2 -translate-y-1/2 whitespace-nowrap bg-brand-navy border border-brand-gold/15 text-brand-gold text-[11px] font-black px-4 py-2 rounded-xl shadow-lg pointer-events-none select-none animate-pulse">
             استشارة فورية ومباشرة لدينا 💬
          </div>
        )}
      </motion.button>
    </div>
  );
}
