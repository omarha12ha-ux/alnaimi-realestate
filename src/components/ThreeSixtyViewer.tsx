import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  Pause, 
  Play, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Map, 
  HelpCircle, 
  Sparkles, 
  ArrowUpRight, 
  ChevronRight,
  ChevronLeft,
  X,
  Maximize2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Property } from '../types';

// Ambient Sound URLs (using copyright-free high quality nature or ambient tracks)
const AMBIENT_TRACK = "https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav"; // Soft wind/breeze draft for space immersion
const CLICK_SOUND = "https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav"; // Subtle camera/transition click

interface TourScene {
  id: string;
  name: string;
  imageUrl: string;
  initialYaw: number;
  initialPitch: number;
  description: string;
  hotspots: {
    yaw: number;
    pitch: number;
    targetSceneId: string;
    label: string;
  }[];
}

// Preset immersive panoramic 360-degree equirectangular images
const PREMIUM_SCENES: TourScene[] = [
  {
    id: 'salon',
    name: 'الصالة الملكية الفاخرة',
    imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1920&q=80', // High-end bright interior living room panorama
    initialYaw: 90,
    initialPitch: 0,
    description: 'صالة استقبال رئيسية من الرخام الإيطالي الطبيعي والأسقف المرتفعة المزينة بالثريات الكريستالية.',
    hotspots: [
      { yaw: 240, pitch: -5, targetSceneId: 'pool', label: 'الخروج للمسبح الفاخر' },
      { yaw: 45, pitch: -2, targetSceneId: 'bedroom', label: 'الدخول للجناح الرئيسي' },
      { yaw: 135, pitch: -8, targetSceneId: 'kitchen', label: 'تصفح المطبخ الإيطالي' }
    ]
  },
  {
    id: 'pool',
    name: 'المسبح ولاونج التراس الخارجي',
    imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1920&q=80', // Immersive pool luxury panorama
    initialYaw: 180,
    initialPitch: -5,
    description: 'مسبح في مياه دافئة مجهز بأنظمة تعقيم متطورة وفلاتر مخصصة مع شق ناعم لاسترخاء المساء.',
    hotspots: [
      { yaw: 0, pitch: 0, targetSceneId: 'salon', label: 'العودة للصالة الملكية' },
      { yaw: 110, pitch: -5, targetSceneId: 'kitchen', label: 'دخول المطبخ مباشرة' }
    ]
  },
  {
    id: 'bedroom',
    name: 'جناح النوم الماستر الرئيسي',
    imageUrl: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1920&q=80', // Luxury bedroom panorama
    initialYaw: 0,
    initialPitch: 0,
    description: 'جناح نوم ماستر متكامل يضم حماماً خاصاً مجهزاً بجاكوزي وغرفة لتبديل الملابس مكسوة بالأخشاب الطبيعية.',
    hotspots: [
      { yaw: 180, pitch: -3, targetSceneId: 'salon', label: 'العودة للصالة الملكية' }
    ]
  },
  {
    id: 'kitchen',
    name: 'المطبخ الإيطالي المتكامل',
    imageUrl: 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=1920&q=80', // Wide kitchen panorama
    initialYaw: 270,
    initialPitch: -2,
    description: 'مطبخ بتصميم إيطالي حديث مجهز بجميع الأجهزة الكهربائية المدمجة وأسطح من الغرانيت المقاوم للبقع.',
    hotspots: [
      { yaw: 90, pitch: 0, targetSceneId: 'salon', label: 'العودة للصالة الرئيسية' },
      { yaw: 310, pitch: -8, targetSceneId: 'pool', label: 'الخروج للمسبح الخارجي' }
    ]
  }
];

interface ThreeSixtyViewerProps {
  property: Property;
  onClose?: () => void;
}

export default function ThreeSixtyViewer({ property, onClose }: ThreeSixtyViewerProps) {
  const [currentSceneId, setCurrentSceneId] = useState<string>('salon');
  const currentScene = PREMIUM_SCENES.find(s => s.id === currentSceneId) || PREMIUM_SCENES[0];

  // Viewer rotation metrics
  const [yaw, setYaw] = useState<number>(currentScene.initialYaw);
  const [pitch, setPitch] = useState<number>(currentScene.initialPitch);
  const [fov, setFov] = useState<number>(85); // Field of View (Zoom level) - degrees visible horizontally

  // Automation & preferences states
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showMinimap, setShowMinimap] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [transitioning, setTransitioning] = useState<boolean>(false);

  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCacheRef = useRef<{ [key: string]: HTMLImageElement }>({});
  
  // Dragging mechanics
  const isDraggingRef = useRef<boolean>(false);
  const startMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startAnglesRef = useRef<{ yaw: number; pitch: number }>({ yaw: 0, pitch: 0 });
  const speedRef = useRef<{ yaw: number; pitch: number }>({ yaw: 0, pitch: 0 }); // for inertia speed tracking
  const lastMouseTimeRef = useRef<number>(0);

  // Load and cache images dynamically
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  // Play click sound effect
  const playSoundEffect = (url: string) => {
    if (isMuted) return;
    try {
      const audio = new Audio(url);
      audio.volume = 0.35;
      audio.play().catch(err => console.log('Audio play ignored:', err));
    } catch (e) {
      console.log('Audio init failed:', e);
    }
  };

  // Change scene handler with smooth transition
  const handleSceneChange = (targetId: string) => {
    if (transitioning) return;
    playSoundEffect(CLICK_SOUND);
    setTransitioning(true);
    setTimeout(() => {
      setCurrentSceneId(targetId);
      const targetScene = PREMIUM_SCENES.find(s => s.id === targetId) || PREMIUM_SCENES[0];
      setYaw(targetScene.initialYaw);
      setPitch(targetScene.initialPitch);
      setTransitioning(false);
    }, 500); // fading duration
  };

  // Pre-load all scene images to cache for smooth, zero-latency transitions
  useEffect(() => {
    PREMIUM_SCENES.forEach(scene => {
      if (!imageCacheRef.current[scene.id]) {
        const img = new Image();
        img.src = scene.imageUrl;
        img.onload = () => {
          imageCacheRef.current[scene.id] = img;
          if (scene.id === currentSceneId) {
            setImageLoaded(true);
          }
        };
      }
    });
  }, []);

  // Handle source image change or waiting for current scene image to load
  useEffect(() => {
    setImageLoaded(false);
    setLoadingProgress(15);
    
    const existingImg = imageCacheRef.current[currentSceneId];
    if (existingImg && existingImg.complete) {
      setImageLoaded(true);
      setLoadingProgress(100);
      return;
    }

    setLoadingProgress(45);
    const img = new Image();
    img.src = currentScene.imageUrl;
    img.onload = () => {
      imageCacheRef.current[currentSceneId] = img;
      setImageLoaded(true);
      setLoadingProgress(100);
    };
    img.onerror = () => {
      setImageLoaded(true); // fallback so we don't block
    };
  }, [currentSceneId]);

  // Compass text calculator
  const getCompassHeading = (): string => {
    const adjustedYaw = (yaw % 360 + 360) % 360; // normalize to 0-360
    if (adjustedYaw >= 337.5 || adjustedYaw < 22.5) return 'N (الشمال)';
    if (adjustedYaw >= 22.5 && adjustedYaw < 67.5) return 'NE (شمال شرق)';
    if (adjustedYaw >= 67.5 && adjustedYaw < 112.5) return 'E (الشرق)';
    if (adjustedYaw >= 112.5 && adjustedYaw < 157.5) return 'SE (جنوب شرق)';
    if (adjustedYaw >= 157.5 && adjustedYaw < 202.5) return 'S (الجنوب)';
    if (adjustedYaw >= 202.5 && adjustedYaw < 247.5) return 'SW (جنوب غرب)';
    if (adjustedYaw >= 247.5 && adjustedYaw < 292.5) return 'W (الغرب)';
    return 'NW (شمال غرب)';
  };

  // Auto-rotation & Inertia calculations
  useEffect(() => {
    let frameId: number;

    const updateLoop = () => {
      // 1. Auto Rotation
      if (autoRotate && !isDraggingRef.current) {
        setYaw(prev => (prev + 0.06) % 360);
      }

      // 2. Inertia Deceleration (when released)
      if (!isDraggingRef.current && (Math.abs(speedRef.current.yaw) > 0.01 || Math.abs(speedRef.current.pitch) > 0.01)) {
        setYaw(prev => (prev + speedRef.current.yaw) % 360);
        setPitch(prev => {
          const next = prev + speedRef.current.pitch;
          return Math.max(-42, Math.min(42, next)); // constrain pitch
        });

        // Apply friction
        speedRef.current.yaw *= 0.94;
        speedRef.current.pitch *= 0.94;
      }

      // Render the panorama onto canvas
      renderPanorama();

      frameId = requestAnimationFrame(updateLoop);
    };

    const renderPanorama = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const img = imageCacheRef.current[currentSceneId];
      if (!ctx || !img || !img.complete) return;

      // Handle resize responsively
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      const canvasW = width;
      const canvasH = height;

      ctx.clearRect(0, 0, canvasW, canvasH);

      // Equirectangular mapping math:
      // The image width covers 360 degrees, and the height covers 180 degrees.
      // FOV (field of view) shows a portion of the panorama horizontally.
      const fovHorizontal = fov; // degrees visible horizontal
      const fovVertical = fovHorizontal * (canvasH / canvasW);

      // Map yaw to pixels
      // Center of screen represents current yaw. Map to source image X offset.
      // normalize yaw to [0, 360]
      const nYaw = (yaw % 360 + 360) % 360;
      const nPitch = pitch; // [-45, 45]

      // Source scale factor
      const srcPixelsPerDegreeX = img.width / 360;
      const srcPixelsPerDegreeY = img.height / 180;

      // Source dimensions to extract from panoramic image
      const srcW = fovHorizontal * srcPixelsPerDegreeX;
      const srcH = fovVertical * srcPixelsPerDegreeY;

      // Center source X
      const srcCenterX = nYaw * srcPixelsPerDegreeX;
      // Center source Y (adjusted for tilt / pitch)
      const srcCenterY = (90 - nPitch) * srcPixelsPerDegreeY;

      // Calculate bounding box source coordinate (upper left corner)
      const srcX = srcCenterX - srcW / 2;
      const srcY = srcCenterY - srcH / 2;

      // Let's draw standard equirectangular panoramic slices (splitting if wraps around left or right boundaries)
      const drawSlice = (sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) => {
        // Constrain source Y within bounds
        let finalSy = Math.max(0, Math.min(img.height - sh, sy));
        ctx.drawImage(img, sx, finalSy, sw, sh, dx, dy, dw, dh);
      };

      // Handle wrapping horizontally
      if (srcX < 0) {
        // Part of view overflows the left edge of panorama, wrap around to the far right
        const rightWidthDeg = -srcX / srcPixelsPerDegreeX; // degrees on the right
        const rightWidthPx = rightWidthDeg * srcPixelsPerDegreeX;
        const rightDestWidthPx = (rightWidthDeg / fovHorizontal) * canvasW;

        // Draw wrapped right part
        drawSlice(
          img.width + srcX, 
          srcY, 
          rightWidthPx, 
          srcH, 
          0, 
          0, 
          rightDestWidthPx, 
          canvasH
        );

        // Draw left part remaining
        drawSlice(
          0, 
          srcY, 
          srcW - rightWidthPx, 
          srcH, 
          rightDestWidthPx, 
          0, 
          canvasW - rightDestWidthPx, 
          canvasH
        );
      } else if (srcX + srcW > img.width) {
        // Part of view overflows the right edge of panorama, wrap around to the far left
        const overflowPx = (srcX + srcW) - img.width;
        const overflowDeg = overflowPx / srcPixelsPerDegreeX;
        const leftDestWidthPx = (overflowDeg / fovHorizontal) * canvasW;

        // Draw main left portion
        drawSlice(
          srcX, 
          srcY, 
          img.width - srcX, 
          srcH, 
          0, 
          0, 
          canvasW - leftDestWidthPx, 
          canvasH
        );

        // Draw wrapped overflow onto the right side of the canvas
        drawSlice(
          0, 
          srcY, 
          overflowPx, 
          srcH, 
          canvasW - leftDestWidthPx, 
          0, 
          leftDestWidthPx, 
          canvasH
        );
      } else {
        // Standard non-wrapping draw
        drawSlice(srcX, srcY, srcW, srcH, 0, 0, canvasW, canvasH);
      }
    };

    frameId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(frameId);
  }, [currentSceneId, yaw, pitch, fov, autoRotate]);

  // Handle Drag / Pointer Event listeners
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    setAutoRotate(false); // pause auto-rotate as soon as user takes control
    startMouseRef.current = { x: e.clientX, y: e.clientY };
    startAnglesRef.current = { yaw, pitch };
    speedRef.current = { yaw: 0, pitch: 0 };
    lastMouseTimeRef.current = performance.now();
    
    // Set pointer capture to lock mouse outside window boundary
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    
    const deltaX = e.clientX - startMouseRef.current.x;
    const deltaY = e.clientY - startMouseRef.current.y;
    const now = performance.now();
    const dt = now - lastMouseTimeRef.current;
    
    // Sensitivity scale according to FOV (smaller FOV = higher zoom = slower drag movement represents less degrees)
    const sensitivity = (fov / 360) * 0.45;
    
    const newYaw = startAnglesRef.current.yaw + (deltaX * sensitivity);
    const newPitch = startAnglesRef.current.pitch - (deltaY * sensitivity); // subtract to feel natural
    
    // Smooth speed tracking for inertia
    if (dt > 0) {
      const instantaneousSpeedYaw = (newYaw - yaw) * 0.75;
      const instantaneousSpeedPitch = (newPitch - pitch) * 0.75;
      speedRef.current = {
        yaw: Math.max(-5, Math.min(5, instantaneousSpeedYaw)),
        pitch: Math.max(-3, Math.min(3, instantaneousSpeedPitch))
      };
    }

    setYaw((newYaw % 360 + 360) % 360);
    setPitch(Math.max(-42, Math.min(42, newPitch)));
    
    lastMouseTimeRef.current = now;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  // Zoom helpers
  const handleZoomIn = () => {
    playSoundEffect(CLICK_SOUND);
    setFov(prev => Math.max(45, prev - 8));
  };

  const handleZoomOut = () => {
    playSoundEffect(CLICK_SOUND);
    setFov(prev => Math.min(105, prev + 8));
  };

  // Switch sound mute option
  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (!nextMute) {
      // user unmuted, play cue
      playSoundEffect(AMBIENT_TRACK);
    }
  };

  // Screen layout Fullscreen toggle
  const toggleFullscreen = () => {
    playSoundEffect(CLICK_SOUND);
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Handle full screen change events from ESC key
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative rounded-3xl overflow-hidden shadow-xl border border-brand-navy/15 bg-brand-navy flex flex-col justify-between transition-all duration-300 select-none",
        isFullscreen ? "fixed inset-0 z-[99999] rounded-none border-none h-screen w-screen" : "w-full h-[600px]"
      )}
      dir="rtl"
      id="three-sixty-viewport-root"
    >
      
      {/* 360 Canvas */}
      <div className="absolute inset-0 z-0 bg-brand-navy flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full cursor-grab active:cursor-grabbing block touch-action-none"
        />

        {/* Transition fade cover */}
        <AnimatePresence>
          {transitioning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-brand-navy z-40 flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-3">
                <Compass className="text-brand-gold w-10 h-10 animate-spin" />
                <span className="text-white text-xs font-serif font-black tracking-widest text-[#E6C687]">تحميل المشهد الحصري التالي...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Overlay */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-brand-navy/90 flex flex-col items-center justify-center z-50 p-6">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: "linear", duration: 2 }}
              className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full mb-4"
            />
            <h4 className="text-brand-gold font-serif text-sm font-bold animate-pulse">جاري فحص وتفقد الغرفة الافتراضية الذكية...</h4>
            <div className="w-48 bg-white/10 h-1 rounded-full overflow-hidden mt-3 max-w-full">
              <div className="bg-brand-gold h-full transition-all duration-300" style={{ width: `${loadingProgress}%` }} />
            </div>
            <span className="text-[10px] text-white/50 font-mono mt-1">{loadingProgress}% loaded</span>
          </div>
        )}
      </div>

      {/* Embedded interactive floating Hotspots layered beautifully on top of the canvas coordinates */}
      {imageLoaded && !transitioning && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {currentScene.hotspots.map((hs, idx) => {
            // Hotspot circular drag coordinates formula
            // Center horizontal of scene is represents current 'yaw' variable state.
            // Map the hotspot yaw degrees relative to current yaw to verify visibility
            let relativeYaw = (hs.yaw - yaw + 540) % 360 - 180;
            let relativePitch = hs.pitch - pitch;

            // Only render if the hotspot is within the field of view (horizontal fov)
            const marginX = fov / 2;
            const marginY = (fov * 0.6) / 2;

            if (Math.abs(relativeYaw) < marginX && Math.abs(relativePitch) < marginY) {
              const canvas = canvasRef.current;
              if (canvas) {
                const cw = canvas.clientWidth;
                const ch = canvas.clientHeight;
                
                // Calculate display offsets
                // Map [-fov/2, fov/2] horizontally to [0, cw]
                // and [-fov_y/2, fov_y/2] vertically to [0, ch]
                const xPct = 50 + (relativeYaw / (fov)) * 100;
                const yPct = 50 - (relativePitch / (fov * (ch / cw))) * 100;

                // Adjust positioning
                return (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute pointer-events-auto"
                    style={{ left: `${xPct}%`, top: `${yPct}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <button
                      onClick={() => handleSceneChange(hs.targetSceneId)}
                      className="group flex items-center justify-center gap-2 bg-brand-navy/90 hover:bg-brand-gold text-brand-gold hover:text-brand-navy border border-brand-gold/40 px-3 py-1.5 rounded-full shadow-lg transition-all active:scale-90 font-bold cursor-pointer whitespace-nowrap animate-bounce"
                      style={{ animationDuration: '3s' }}
                    >
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold group-hover:bg-brand-navy opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-gold group-hover:bg-brand-navy"></span>
                      </span>
                      <span className="text-xxs tracking-wide">{hs.label}</span>
                      <ArrowUpRight size={12} className="text-brand-gold group-hover:text-brand-navy transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </motion.div>
                );
              }
            }
            return null;
          })}
        </div>
      )}

      {/* Top Overlay controls bar */}
      <div className="relative z-20 flex items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/60 to-transparent pointer-events-none select-none">
        
        {/* Right title info */}
        <div className="text-right pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-brand-gold text-brand-navy rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse">
              <Sparkles size={10} className="fill-current" />
              <span>Premium VIP VR 360°</span>
            </span>
            <h4 className="text-white font-serif font-black text-sm md:text-base leading-tight drop-shadow-md">
              {currentScene.name}
            </h4>
          </div>
          <p className="text-white/70 text-[10px] md:text-xs mt-1 drop-shadow font-semibold">
            {currentScene.description}
          </p>
        </div>

        {/* Left top helpers */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Help Info Dialog toggle */}
          <button 
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 text-white/90 border border-white/10 flex items-center justify-center backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            title="كيفية الاستخدام؟"
          >
            <HelpCircle size={18} />
          </button>
          
          {onClose && (
            <button 
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 text-red-400 border border-red-500/10 flex items-center justify-center backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              title="إغلاق"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Interactive HUD Overlays (Compass, Help popup, Minimap) */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-end p-4 md:p-6">
        
        {/* Help Overlay Drawer popup */}
        <AnimatePresence>
          {showHelp && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute top-20 right-6 z-30 bg-brand-navy/95 border border-brand-gold/30 p-5 rounded-2xl max-w-sm w-[90%] text-right text-white space-y-3 shadow-2xl backdrop-blur-md pointer-events-auto"
            >
              <div className="flex items-center justify-between border-b border-brand-gold/10 pb-2">
                <span className="text-brand-gold font-serif font-bold text-xs">تعرّف على دليل المعاينة الافتراضية</span>
                <HelpCircle size={16} className="text-brand-gold" />
              </div>
              <ul className="text-white/80 text-[11px] leading-6 space-y-1 font-semibold">
                <li>🎯 <strong className="text-white">التلفت والمشاهدة</strong>: انقر بالماوس أو اصبعك واسحب المخطط في أي اتجاه لمعاينة تفاصيل الغرفة بزاوبة كاملة.</li>
                <li>🔗 <strong className="text-white">نقاط الانتقال (Hotspots)</strong>: انقر فوق الأزرار الطائرة للانتقال للمطبخ أو المسبح أو الغرفة الأخرى.</li>
                <li>🧭 <strong className="text-white">البوصلة الذكية</strong>: تراقب اتجاه نظرك مباشرة وتدور لتعلم موقعك.</li>
                <li>🗺️ <strong className="text-white">الخريطة المصغرة</strong>: تظهر موقع الغرفة الحالية ورادار حركة النظر التفاعلي.</li>
                <li>🔍 <strong className="text-white">مستوى التقريب (Zoom)</strong>: استخدم أزرار + و - أو بكرة الماوس لتقريب المواد والتشطيبات.</li>
              </ul>
              <button 
                type="button"
                onClick={() => setShowHelp(false)}
                className="w-full py-1.5 bg-brand-gold hover:bg-white text-brand-navy rounded-lg text-xxs font-black transition-all cursor-pointer"
              >
                حسناً، فهمت ذلك!
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard bottom area (Minimap layout on bottom-right, Controls on bottom-left) */}
        <div className="flex flex-col sm:flex-row items-end justify-between gap-4 w-full">
          
          {/* Bottom Right: Digital Compass and Matterport schematic floorplan radar */}
          <div className="flex flex-col gap-3 pointer-events-auto">
            {showMinimap && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/50 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-white w-48 text-right space-y-2 select-none"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-1">
                  <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest font-mono">Floorplan Tour</span>
                  <span className="text-[10px] font-bold text-brand-gold flex items-center gap-1">
                    <Map size={11} />
                    خريطة المعاينة
                  </span>
                </div>

                {/* Simulated Real Estate Floorplan Grid with radar beam pointing based on yaw */}
                <div className="relative h-24 bg-brand-cream/10 border border-white/5 rounded-xl overflow-hidden flex items-center justify-center">
                  
                  {/* Grid lines simulating apartment layout */}
                  <div className="absolute inset-0 opacity-15 border border-dashed border-white grid grid-cols-3 grid-rows-3 text-[5px]" />
                  
                  {/* Simple Room partitions overlay */}
                  <div className="absolute inset-2 border border-white/20 rounded-lg flex flex-wrap text-xxs font-bold text-white/30 p-1">
                    <div className="w-1/2 h-1/2 border-b border-l border-white/15 flex items-center justify-center p-0.5">الصالة</div>
                    <div className="w-1/2 h-1/2 border-b border-white/15 flex items-center justify-center p-0.5">المسبح</div>
                    <div className="w-1/2 h-1/2 border-l border-white/15 flex items-center justify-center p-0.5">مطبخ</div>
                    <div className="w-1/2 h-1/2 flex items-center justify-center p-0.5">النوم</div>
                  </div>

                  {/* Active room beacon pin (updates as currentSceneId is changed) */}
                  {(() => {
                    let pinCoords = { left: '30%', top: '35%' }; // living room
                    if (currentSceneId === 'pool') pinCoords = { left: '70%', top: '35%' };
                    if (currentSceneId === 'bedroom') pinCoords = { left: '70%', top: '70%' };
                    if (currentSceneId === 'kitchen') pinCoords = { left: '30%', top: '70%' };

                    return (
                      <div 
                        className="absolute transition-all duration-500 ease-in-out" 
                        style={{ left: pinCoords.left, top: pinCoords.top, transform: 'translate(-50%, -50%)' }}
                      >
                        {/* Radar beam rotation representation */}
                        {/* Map horizontal degree view 'yaw' parameter directly onto a radar cone. */}
                        {/* Since compass N represents 0 deg, let's rot the radar by the current yaw angle! */}
                        <div 
                          className="absolute w-12 h-12 -left-5 -top-5 rounded-full pointer-events-none opacity-40 bg-gradient-to-tr from-brand-gold/40 to-transparent"
                          style={{ 
                            transform: `rotate(${yaw}deg)`, 
                            clipPath: 'polygon(50% 50%, 100% 0, 100% 100%)',
                            transition: 'transform 0.05s linear'
                          }} 
                        />
                        
                        {/* Core active pulse dot */}
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-90"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-gold border border-brand-navy"></span>
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Quick click navigation directly from Floorplan list shortcuts */}
                <div className="grid grid-cols-2 gap-1 pt-1 text-[9px] text-center font-bold">
                  <button 
                    onClick={() => handleSceneChange('salon')}
                    className={cn(
                      "py-1 rounded-md transition-all border",
                      currentSceneId === 'salon' ? "bg-brand-gold text-brand-navy border-brand-gold" : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    الصالة
                  </button>
                  <button 
                    onClick={() => handleSceneChange('pool')}
                    className={cn(
                      "py-1 rounded-md transition-all border",
                      currentSceneId === 'pool' ? "bg-brand-gold text-brand-navy border-brand-gold" : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    المسبح
                  </button>
                  <button 
                    onClick={() => handleSceneChange('kitchen')}
                    className={cn(
                      "py-1 rounded-md transition-all border",
                      currentSceneId === 'kitchen' ? "bg-brand-gold text-brand-navy border-brand-gold" : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    المطبخ
                  </button>
                  <button 
                    onClick={() => handleSceneChange('bedroom')}
                    className={cn(
                      "py-1 rounded-md transition-all border",
                      currentSceneId === 'bedroom' ? "bg-brand-gold text-brand-navy border-brand-gold" : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    النوم
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom Left: Floating Hud Camera control buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto pointer-events-auto">
            
            {/* Live Compass HUD indicator tool */}
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 text-white backdrop-blur-md px-3.5 py-2 rounded-2xl w-full sm:w-auto justify-between text-right">
              <span className="text-[10px] sm:text-xs font-bold leading-none select-none font-mono tracking-wide text-brand-gold">
                {getCompassHeading()}
              </span>
              <Compass 
                size={14} 
                className="text-brand-gold/80 transition-transform duration-75"
                style={{ transform: `rotate(${yaw}deg)` }} 
              />
            </div>

            {/* Complete control panel group */}
            <div className="flex flex-wrap items-center gap-1.5 bg-black/40 border border-white/10 backdrop-blur-md p-1.5 rounded-2xl">
              
              {/* Play/Pause auto rotate */}
              <button 
                type="button"
                onClick={() => {
                  playSoundEffect(CLICK_SOUND);
                  setAutoRotate(!autoRotate);
                }}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 cursor-pointer",
                  autoRotate ? "bg-brand-gold text-brand-navy font-bold" : "text-white/80 hover:bg-white/10"
                )}
                title={autoRotate ? "إيقاف الدوران الذاتي" : "تشغيل الدوران الذاتي"}
              >
                {autoRotate ? <Pause size={15} /> : <Play size={15} />}
              </button>

              {/* Zoom In */}
              <button 
                type="button"
                onClick={handleZoomIn}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white/80 hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
                title="تقريب (Zoom In)"
              >
                <ZoomIn size={15} />
              </button>

              {/* Zoom Out */}
              <button 
                type="button"
                onClick={handleZoomOut}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white/80 hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
                title="أبعاد كاملة (Zoom Out)"
              >
                <ZoomOut size={15} />
              </button>

              {/* Reset to center view */}
              <button 
                type="button"
                onClick={() => {
                  playSoundEffect(CLICK_SOUND);
                  setYaw(currentScene.initialYaw);
                  setPitch(currentScene.initialPitch);
                  setFov(85);
                }}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-90 cursor-pointer"
                title="إعادة ضبط زاوية المعاينة"
              >
                <RotateCcw size={15} />
              </button>

              {/* Toggle Audio ambiance */}
              <button 
                type="button"
                onClick={toggleMute}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 cursor-pointer",
                  !isMuted ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/25" : "text-white/40 hover:text-white"
                )}
                title={isMuted ? "تشغيل الصوت المحيطي للحجرة" : "كتم صوت المعاينة"}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              {/* Toggle Floorplan minimap display */}
              <button 
                type="button"
                onClick={() => {
                  playSoundEffect(CLICK_SOUND);
                  setShowMinimap(!showMinimap);
                }}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 cursor-pointer",
                  showMinimap ? "text-brand-gold" : "text-white/40 hover:text-white"
                )}
                title={showMinimap ? "إخفاء خريطة الغرف" : "عرض خريطة المساحة"}
              >
                <Map size={15} />
              </button>

              {/* Toggle Fullscreen */}
              <button 
                type="button"
                onClick={toggleFullscreen}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white/80 hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
                title={isFullscreen ? "تصغير الشاشة" : "عرض ملء الشاشة ملء كامل"}
              >
                <Maximize2 size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
