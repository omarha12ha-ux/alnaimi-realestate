import { useEffect, useState } from 'react';
import { Download, Share, X, SquarePlus, Smartphone } from 'lucide-react';

// Chrome/Android fire this before the browser shows its own mini-infobar, and it
// can only be consumed once, so it has to be captured at any early point.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ reports as Macintosh, so the touch-point check matters.
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1)
  );
}

export default function InstallAppButton({ className = '' }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Nothing to offer once it is on the home screen, or after the visitor
  // explicitly closed the hint.
  if (installed || dismissed) return null;

  const iosNeedsHelp = isIos();

  // Only surface the button where it can actually do something: Android/desktop
  // with a captured prompt, or iOS where we have to walk them through manually.
  if (!deferred && !iosNeedsHelp) return null;

  const install = async () => {
    if (!deferred) {
      setShowIosHelp(true);
      return;
    }
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferred(null);
  };

  return (
    <div className={`fixed bottom-5 left-5 z-[60] ${className}`}>
      <button
        type="button"
        onClick={install}
        className="flex items-center gap-2 bg-brand-navy text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-black hover:bg-brand-gold hover:text-brand-navy transition-all active:scale-95 cursor-pointer"
        title={iosNeedsHelp ? 'تثبيت التطبيق على الآيفون' : 'تثبيت التطبيق على الجهاز'}
      >
        {iosNeedsHelp ? <Share size={16} className="text-brand-gold" /> : <Download size={16} className="text-brand-gold" />}
        <span>ثبّت التطبيق</span>
      </button>

      {showIosHelp && (
        <div
          dir="rtl"
          className="absolute bottom-full right-0 mb-3 w-[19rem] bg-white dark:bg-[#0A192F] border border-brand-navy/10 dark:border-white/10 rounded-3xl shadow-2xl p-5 text-brand-navy dark:text-white"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Smartphone size={18} className="text-brand-gold" />
              <h3 className="text-sm font-black">تثبيت التطبيق على الآيفون</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowIosHelp(false)}
              aria-label="إغلاق"
              className="text-brand-navy/50 dark:text-white/50 hover:opacity-100 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
          <ol className="space-y-2 text-xs font-bold leading-relaxed">
            <li className="flex gap-2">
              <span className="text-brand-gold font-black">1.</span>
              <span>اضغط زر <strong>المشاركة</strong> (السهم الصاعد) في شريط Safari.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-gold font-black">2.</span>
              <span className="flex items-center gap-1">
                اختر <strong>إضافة إلى الشاشة الرئيسية</strong>
                <SquarePlus size={13} className="text-brand-gold" />
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-gold font-black">3.</span>
              <span>اضغط <strong>إضافة</strong> — وستجد التطبيق بأيقونته على جهازك.</span>
            </li>
          </ol>
          <p className="mt-3 text-[10px] font-bold text-brand-navy/60 dark:text-white/60 leading-relaxed">
            بعدها يفتح التطبيق مباشرة بلا متصفح، ويعمل على اتصال ضعيف.
          </p>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="mt-3 w-full text-[11px] font-black text-brand-navy/60 dark:text-white/60 hover:opacity-100 cursor-pointer"
          >
            لا أريد الآن
          </button>
        </div>
      )}
    </div>
  );
}
