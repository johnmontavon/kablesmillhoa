import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// Helpers
const tryParse = (t, fb) => { try { return JSON.parse(t); } catch { return fb; } };
const isExternal = (url) => /^https?:\/\//i.test(url);
const fmt = (d) => d ? new Date(d).toLocaleDateString() : "";

function CategoryButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-4 py-2 rounded-xl transition shadow",
        active
          ? "bg-white text-black"
          : "bg-white/15 text-white hover:bg-white/25"
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function DocumentCard({ item }) {
  const ext = (item.url.split(".").pop() || "").toUpperCase();
  return (
    <a
      href={item.url}
      target={isExternal(item.url) ? "_blank" : undefined}
      rel={isExternal(item.url) ? "noopener noreferrer" : undefined}
      className="block rounded-xl bg-white/90 p-4 shadow hover:shadow-lg hover:-translate-y-0.5 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">{item.title}</div>
          <div className="text-sm text-gray-600 mt-1">
            {fmt(item.date)}{ext ? ` • ${ext}` : ""}
          </div>
        </div>
        <div className="text-xs bg-black/80 text-white px-2 py-1 rounded-md self-start">
          Open
        </div>
      </div>
    </a>
  );
}

export default function Documents() {
  const navigate = useNavigate();
  const { category: routeCat } = useParams();
  const [data, setData] = useState(null);
  const [activeKey, setActiveKey] = useState(null);
  const [year, setYear] = useState("all");
  const [loading, setLoading] = useState(true);

  // Load JSON (cache-busted)
  useEffect(() => {
    const url = `/documents.json?v=${Date.now()}`;
    fetch(url, { cache: "no-store" })
      .then((r) => (r.ok ? r.text() : "{}"))
      .then((t) => setData(tryParse(t, null)))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  // Choose active category from route or first available
  useEffect(() => {
    if (!data?.categories) return;
    const keys = Object.keys(data.categories);
    const valid = routeCat && data.categories[routeCat];
    const chosen = valid ? routeCat : keys[0];
    setActiveKey(chosen);
    // If route doesn't match, normalize it
    if (!valid) navigate(`/documents/${chosen}`, { replace: true });
  }, [data, routeCat, navigate]);

  // Build list + years
  const { items, years, label } = useMemo(() => {
    const cat = data?.categories?.[activeKey];
    const itemsRaw = (cat?.items || []).slice().sort(
      (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
    );
    const yset = new Set(itemsRaw.map(x => (x.date || "").slice(0, 4)).filter(Boolean));
    const years = ["all", ...Array.from(yset).sort((a,b) => b.localeCompare(a))];
    const filtered = year === "all" ? itemsRaw : itemsRaw.filter(x => (x.date || "").startsWith(year));
    return { items: filtered, years, label: cat?.label || "" };
  }, [data, activeKey, year]);

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-10 text-white/80">Loading…</div>;
  }
  if (!data?.categories) {
    return <div className="mx-auto max-w-6xl px-4 py-10 text-white/80">No documents configured.</div>;
  }

  const keys = Object.keys(data.categories);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-4">Documents</h1>

      {/* Category buttons */}
      <div className="flex flex-wrap gap-2">
        {keys.map((k) => (
          <CategoryButton
            key={k}
            active={k === activeKey}
            onClick={() => {
              setYear("all");
              setActiveKey(k);
              navigate(`/documents/${k}`);
            }}
          >
            {data.categories[k].label}
          </CategoryButton>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-white/80">
          <span className="font-semibold text-white">{label}</span>
          {items?.length ? (
            <span className="ml-2 text-sm">({items.length} file{items.length === 1 ? "" : "s"})</span>
          ) : null}
        </div>
        {/* Year filter only when we have multiple years */}
        {years.length > 2 && (
          <select
            className="rounded-md bg-white/15 text-white px-3 py-2 outline-none"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y === "all" ? "All years" : y}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Files */}
      {items?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
          {items.map((it, i) => (
            <DocumentCard key={`${it.url}-${i}`} item={it} />
          ))}
        </div>
      ) : (
        <div className="text-white/70 mt-6">No files yet.</div>
      )}
    </div>
  );
}
