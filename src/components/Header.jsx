// src/components/Header.jsx
import React from "react";
import { useLocation } from "react-router-dom";

export default function Header({ onNav }) {
  const { pathname } = useLocation();

  const go = (e, path) => {
    if (onNav) {
      e.preventDefault();
      onNav(path);
    }
  };

  const onKey = (e, path) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onNav ? onNav(path) : (window.location.href = path);
    }
  };

  const link = (label, path) => {
    const active = pathname === path || (path === "/" && pathname === "/");
    return (
      <a
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

  return (
    <header className="w-full bg-[#256C63]/95 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
        <div className="text-white font-semibold">Kables Mill HOA</div>
        <nav className="hidden md:flex items-center gap-1">
          {link("Home", "/")}
          {link("Announcements", "/announcements")}
          {/* Removed Events */}
          {link("Documents", "/documents")}
          {link("Improvement Request", "/improvement")}
          {/* New */}
          {link("Links", "/links")}
          {link("About", "/about")}
        </nav>
      </div>
    </header>
  );
}
