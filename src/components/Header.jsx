// src/components/Header.jsx
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const NAV_ITEMS = [
  ["Home", "/"],
  ["Announcements", "/announcements"],
  // Removed Events
  ["Documents", "/documents"],
  ["Improvement Request", "/improvement"],
  ["Links", "/links"],
  ["About", "/about"],
];

export default function Header({ onNav }) {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  const go = (e, path) => {
    setMenuOpen(false);
    if (onNav) {
      e.preventDefault();
      onNav(path);
    }
  };

  const onKey = (e, path) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setMenuOpen(false);
      onNav ? onNav(path) : (window.location.href = path);
    }
  };

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // While open: close on Escape, close if resized to desktop, lock background scroll
  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        if (menuButtonRef.current) menuButtonRef.current.focus();
      }
    };
    const mq = window.matchMedia("(min-width: 768px)");
    const onMq = (e) => {
      if (e.matches) setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    if (mq.addEventListener) mq.addEventListener("change", onMq);
    else if (mq.addListener) mq.addListener(onMq);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (mq.removeEventListener) mq.removeEventListener("change", onMq);
      else if (mq.removeListener) mq.removeListener(onMq);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  const isActive = (path) => pathname === path;

  const link = (label, path) => {
    const active = isActive(path);
    return (
      <a
        key={path}
        href={path}
        onClick={(e) => go(e, path)}
        onKeyDown={(e) => onKey(e, path)}
        className={[
          "px-3 py-1 rounded-md transition outline-none",
          active ? "text-white bg-white/10" : "text-white/90 hover:text-white",
          "focus-visible:ring-2 focus-visible:ring-white/60"
        ].join(" ")}
        aria-current={active ? "page" : undefined}
      >
        {label}
      </a>
    );
  };

  const mobileLink = (label, path) => {
    const active = isActive(path);
    return (
      <li key={path}>
        <a
          href={path}
          onClick={(e) => go(e, path)}
          onKeyDown={(e) => onKey(e, path)}
          className={[
            "block w-full px-4 py-3 rounded-md text-base font-medium transition outline-none min-h-[44px]",
            active ? "text-white bg-white/15" : "text-white/90 hover:text-white hover:bg-white/10",
            "focus-visible:ring-2 focus-visible:ring-white/60"
          ].join(" ")}
          aria-current={active ? "page" : undefined}
        >
          {label}
        </a>
      </li>
    );
  };

  return (
    <>
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black/40"
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <header className="w-full bg-[#256C63]/95 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
          <div className="text-white font-semibold">Kables Mill HOA</div>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(([label, path]) => link(label, path))}
          </nav>
          <button
            ref={menuButtonRef}
            type="button"
            className="md:hidden -mr-2 inline-flex items-center justify-center w-11 h-11 rounded-md text-white hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
        <nav
          id="mobile-nav"
          aria-label="Main menu"
          className={`md:hidden absolute left-0 right-0 top-full bg-[#256C63] border-t border-white/10 shadow-lg ${menuOpen ? "block" : "hidden"}`}
        >
          <ul className="mx-auto max-w-6xl px-4 py-3 space-y-1">
            {NAV_ITEMS.map(([label, path]) => mobileLink(label, path))}
          </ul>
        </nav>
      </header>
    </>
  );
}
