import Header from './Header';
import Footer from './Footer';
import {
  motion,
  animate,
  useInView,
  useScroll,
  useSpring,
  useMotionValueEvent,
} from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import LogoMark from "./LogoMark";

function Layout({ children }) {
  const navigate = useNavigate();

  const heroRef = useRef(null);          // scope scroll to hero
  const scrollTargetRef = useRef(null);
  const bgRef = useRef(null);
  const buttonContainerRef = useRef(null);

  const [isFloating, setIsFloating] = useState(true);

  // ---- Smooth programmatic scroll (kept yours) ----
  const handleNavClick = (path) => {
    navigate(path);

    setTimeout(() => {
      if (!scrollTargetRef.current) return;

      const isMobile = window.innerWidth < 768;
      const offset = isMobile ? -80 : -150;
      const targetY =
        scrollTargetRef.current.getBoundingClientRect().top +
        window.scrollY -
        offset;

      if (window.scrollY >= targetY) return;

      setIsFloating(false);

      animate(window.scrollY, targetY, {
        duration: 1,
        ease: [0.25, 0.8, 0.25, 1],
        onUpdate: (value) => {
          window.scrollTo(0, value);
          if (bgRef.current) {
            bgRef.current.style.transform = `translateY(${(window.scrollY - targetY) * 0.1}px)`;
          }
        },
        onComplete: () => setIsFloating(true),
      });
    }, 50);
  };

  const isButtonsInView = useInView(buttonContainerRef, {
    once: true,
    margin: "-100px",
  });

  // ---- Continuous, additive scroll-linked rotation ----
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start end", "end start"], // 0 when hero enters; 1 when it exits
  });

  // Smooth the progress itself to reduce jitter
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 28,
    mass: 0.35,
  });

  // How much the wheel turns for one full hero pass (tweak for slower/faster)
  const SCROLL_TURNS = 0.5; // 0.5 = 180° per hero pass; 1 = 360°

  // Cumulative scroll angle (unbounded) and timestamp to suppress pointer briefly
  const [scrollAngle, setScrollAngle] = useState(0);
  const [lastScrollTs, setLastScrollTs] = useState(0);

  const lastPRef = useRef(null);
  const rafScrollRef = useRef(0);
  const pendingDeltaRef = useRef(0);

  useMotionValueEvent(smoothProgress, "change", (p) => {
    if (lastPRef.current == null) {
      lastPRef.current = p;
      return;
    }
    const dp = p - lastPRef.current;
    if (dp === 0) return;
    lastPRef.current = p;

    // accumulate rotation delta; flush on next rAF to avoid layout thrash
    pendingDeltaRef.current += dp * 360 * SCROLL_TURNS;

    if (!rafScrollRef.current) {
      rafScrollRef.current = requestAnimationFrame(() => {
        setScrollAngle((a) => a + pendingDeltaRef.current);
        pendingDeltaRef.current = 0;
        setLastScrollTs(performance.now());
        rafScrollRef.current = 0;
      });
    }
  });

  useEffect(() => {
    return () => {
      if (rafScrollRef.current) cancelAnimationFrame(rafScrollRef.current);
    };
  }, []);

  // Mobile performance hint
  useEffect(() => {
    if (heroRef.current) heroRef.current.style.contain = "layout paint size style";
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#256C63]">
      <Header onNav={handleNavClick} />

      <section
        ref={heroRef}
        className="
          relative w-full overflow-hidden text-white
          min-h-[80svh] md:min-h-[92vh] xl:min-h-[96vh]
          flex flex-col justify-start items-center
          pt-32 md:pt-0
        "
        aria-label="Hero"
        style={{
          backgroundImage: "url('/assets/hero-bg3.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        {/* Parallax layer */}
        <div ref={bgRef} className="absolute inset-0 z-0" />

        {/* LOGO + WHEEL */}
        <LogoMark
          baseSrc="/assets/hero-sign.png"
          wheelSrc="/assets/spoke_centered_1024.png"
          size="max-w-none"
          wrapperStyle={{ width: "clamp(260px, 36vw, 720px)" }}
          interactive
          debug={false}
          wheelAnchor={{ x: 77, y: 48 }}
          wheelPivotPercent={{ x: 50, y: 50 }}
          wheelOffsetPx={{ x: 0, y: 0 }}
          wheelWidthPercent={38}
          // pass cumulative scroll angle and the timestamp for pointer suppression
          scrollAngle={scrollAngle}
          scrollTs={lastScrollTs}
          autoSpin
          autoSpinDurationSec={22}
        />

        <h1
          ref={scrollTargetRef}
          className="text-4xl md:text-5xl font-bold text-white mt-2 z-20 drop-shadow"
        >
          Welcome to Kable&apos;s Mill
        </h1>

        <motion.div
          ref={buttonContainerRef}
          className="flex flex-wrap justify-center gap-4 mt-4 z-20"
          initial={{ opacity: 0, y: 20 }}
          animate={isButtonsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <button
            onClick={() => handleNavClick('/announcements')}
            className="bg-white text-black font-semibold px-6 py-3 rounded-xl shadow hover:scale-105 hover:drop-shadow-[0_0_10px_#4CA69B] transition"
          >
            Announcements
          </button>

          {/* Removed Events */}

          <button
            onClick={() => handleNavClick('/documents')}
            className="bg-white text-black font-semibold px-6 py-3 rounded-xl shadow hover:scale-105 hover:drop-shadow-[0_0_10px_#4CA69B] transition"
          >
            Documents
          </button>

          <button
            onClick={() => handleNavClick('/improvement')}
            className="bg-orange-400 text-black font-semibold px-6 py-3 rounded-xl shadow hover:scale-105 hover:drop-shadow-[0_0_10px_#4CA69B] transition"
          >
            Improvement Request
          </button>

          <button
            onClick={() => handleNavClick('/links')}
            className="bg-white text-black font-semibold px-6 py-3 rounded-xl shadow hover:scale-105 hover:drop-shadow-[0_0_10px_#4CA69B] transition"
          >
            Links
          </button>

          <button
            onClick={() => handleNavClick('/about')}
            className="bg-white text-black font-semibold px-6 py-3 rounded-xl shadow hover:scale-105 hover:drop-shadow-[0_0_10px_#4CA69B] transition"
          >
            About
          </button>
        </motion.div>

        {/* Optional contrast overlay for legibility */}
        <div className="pointer-events-none absolute inset-0 bg-black/10 md:bg-black/5" />
      </section>

      <main className="flex-grow">
        {children}
      </main>

      <Footer />
    </div>
  );
}

export default Layout;
