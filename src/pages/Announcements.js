import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";

// ---------- helpers ----------

// VERY LIGHT auth for static site MVP — 
// (We'll replace with Supabase/Firebase later.)
const USERS = {
  jb: "3192",
  su: "3099",
  jm: "3241"
};

// Parse 'YYYY-MM-DD' as a LOCAL date (no timezone shift)
const parseYMD = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1); // local midnight
};
const formatLocal = (s) => {
  const dt = parseYMD(s);
  return dt ? dt.toLocaleDateString() : "";
};
const tryParse = (t, fb) => { try { return JSON.parse(t); } catch { return fb; } };

const isPinnedNow = (item) => {
  if (item.pinned_until) {
    const until = parseYMD(item.pinned_until);
    if (!until) return !!item.pinned;
    until.setHours(23, 59, 59, 999); // inclusive through end-of-day local time
    return Date.now() <= until.getTime();
  }
  return !!item.pinned; // hard pin only if no pinned_until
};


const sortAnnouncements = (arr) =>
  [...arr].sort((a, b) => {
    const pinDelta = (isPinnedNow(b) ? 1 : 0) - (isPinnedNow(a) ? 1 : 0);
    if (pinDelta !== 0) return pinDelta;
    return parseYMD(b.date).getTime() - parseYMD(a.date).getTime();
  });


const makePreview = (body) => {
  if (!body) return "";
  const firstLine = body.split("\n").find(Boolean) || body;
  return firstLine.length > 160 ? firstLine.slice(0, 160) + "…" : firstLine;
};

const BodyText = ({ text }) => (
  <div className="text-white/90 whitespace-pre-wrap leading-relaxed">{text}</div>
);

// >>> REPLACED: AttachmentList now renders a bulleted list <<<
const AttachmentList = ({ items }) => {
  if (!items || !items.length) return null;
  return (
    <ul className="mt-3 space-y-1 list-disc list-inside">
      {items.map((a, i) => {
        const external = /^https?:\/\//i.test(a.url);
        return (
          <li key={i}>
            <a
              href={a.url}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="underline text-white/90 hover:text-white break-words text-sm"
            >
              {a.label || a.url}
            </a>
          </li>
        );
      })}
    </ul>
  );
};

function PinnedBadge({ item }) {
  if (isPinnedNow(item)) {
    return (
      <span className="inline-block text-xs font-semibold bg-orange-400/90 text-black px-2 py-0.5 rounded">
        {item.pinned_until ? `Pinned until ${formatLocal(item.pinned_until)}` : "Pinned"}
      </span>
    );
  }
  return null;
}


function AnnouncementItem({ item, expanded, onToggle, onPermalink }) {
  return (
    <div className="rounded-xl bg-white/10 border border-white/10 shadow p-4">
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full text-left flex items-start justify-between gap-3"
      >
        <div>
          <div className="flex items-center gap-2">
            <PinnedBadge item={item} />
            <span className="text-xs text-white/70 tabular-nums">
                {formatLocal(item.date)}
            </span>

          </div>
          <h3 className="text-lg md:text-xl font-semibold text-white">{item.title}</h3>
          {!expanded && (
            <p className="text-sm text-white/80 mt-1">{makePreview(item.body)}</p>
          )}
        </div>
        <span
          className={[
            "shrink-0 mt-1 rounded-md px-2 py-1 text-xs border",
            expanded ? "bg-white/20 border-white/30" : "bg-white/5 border-white/20",
          ].join(" ")}
        >
          {expanded ? "Hide" : "View"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              <BodyText text={item.body} />
              <AttachmentList items={item.attachments} />
              <div className="mt-4 flex items-center gap-3">
                <a
                  href={`/announcements/${item.id}`}
                  className="text-xs underline text-white/80 hover:text-white"
                >
                  Permalink
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ------------------- Tiny floating admin kept for convenience -------------------
function InlineAdmin() {
  const navigate = useNavigate();
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        onClick={() => navigate("/admin/announcements")}
        className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-md"
      >
        Admin
      </button>
    </div>
  );
}

// ------------------- Page -------------------
export default function Announcements() {
  const [items, setItems] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const url = `/announcements.json?v=${Date.now()}`;
    fetch(url, { cache: "no-store" })
      .then(r => r.ok ? r.text() : "[]")
      .then(t => setItems(tryParse(t, [])))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  // open the permalinked item if present
  useEffect(() => {
    if (routeId) setOpenId(routeId);
  }, [routeId]);

  const filtered = useMemo(() => {
    const base = sortAnnouncements(items);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(x =>
      (x.title || "").toLowerCase().includes(q) ||
      (x.body || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  const onToggle = (id, expandedNext) => {
    setOpenId(expandedNext ? id : null);
    navigate(expandedNext ? `/announcements/${id}` : `/announcements`);
  };

  const openedItem = routeId && !loading
    ? items.find(x => x.id === routeId)
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-white">Announcements</h1>
        <input
          placeholder="Search…"
          className="rounded-md px-3 py-2 bg-white/10 text-white outline-none w-56"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {routeId && !openedItem && !loading && (
        <div className="mt-6 text-white/80">
          Not found. <button className="underline" onClick={() => navigate("/announcements")}>Back to list</button>
        </div>
      )}

      {loading ? (
        <p className="text-white/80 mt-6">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-white/80 mt-6">No announcements yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((item) => (
            <AnnouncementItem
              key={item.id}
              item={item}
              expanded={openId === item.id}
              onToggle={() => onToggle(item.id, openId !== item.id)}
              onPermalink={() => navigate(`/announcements/${item.id}`)}
            />
          ))}
        </div>
      )}

      {/* keep the tiny floating JSON admin for quick edits if needed */}
      <InlineAdmin data={items} onChange={setItems} />
    </div>
  );
}
