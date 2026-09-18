import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";

// ---------- helpers ----------


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

const linkifyParts = (text) => {
  if (!text) return [];
  const urlRe = /(https?:\/\/[^\s]+)/g;
  const parts = [];
  let last = 0;
  let m;
  while ((m = urlRe.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: "text", value: text.slice(last, m.index) });
    let url = m[1];
    // Trim common trailing punctuation from URLs
    let trailing = "";
    while (url && /[.,);:\]]$/.test(url)) {
      trailing = url.slice(-1) + trailing;
      url = url.slice(0, -1);
    }
    parts.push({ type: "link", value: url });
    if (trailing) parts.push({ type: "text", value: trailing });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
};

const BodyText = ({ text }) => (
  <div className="text-white/90 whitespace-pre-wrap leading-relaxed">
    {linkifyParts(text).map((part, i) =>
      part.type === "link" ? (
        <a
          key={i}
          href={part.value}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-white hover:text-white/90 break-words"
        >
          {part.value}
        </a>
      ) : (
        <span key={i}>{part.value}</span>
      )
    )}
  </div>
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

const EMPTY_RX = { likes: 0, loves: 0, likedByMe: false, lovedByMe: false };

function ReactionBar({ announcementId, reaction, onToggle, busy }) {
  const rx = reaction || EMPTY_RX;
  return (
    <div className="mt-3 flex items-center gap-2" role="group" aria-label="Reactions">
      <button
        type="button"
        disabled={busy}
        aria-pressed={!!rx.likedByMe}
        aria-label={rx.likedByMe ? "Remove like" : "Like this announcement"}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(announcementId, "like");
        }}
        className={[
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fd4c8]",
          rx.likedByMe
            ? "bg-[#256C63] border-[#3d9a8d] text-white shadow-sm"
            : "bg-white/10 border-white/20 text-white/90 hover:bg-white/15 hover:border-white/30",
          busy ? "opacity-60 cursor-wait" : "cursor-pointer",
        ].join(" ")}
      >
        <span aria-hidden="true">👍</span>
        <span className="font-medium tabular-nums">{rx.likes}</span>
        <span className="sr-only">likes</span>
      </button>
      <button
        type="button"
        disabled={busy}
        aria-pressed={!!rx.lovedByMe}
        aria-label={rx.lovedByMe ? "Remove love" : "Love this announcement"}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(announcementId, "love");
        }}
        className={[
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fd4c8]",
          rx.lovedByMe
            ? "bg-[#c45c6a] border-[#e07a88] text-white shadow-sm"
            : "bg-white/10 border-white/20 text-white/90 hover:bg-white/15 hover:border-white/30",
          busy ? "opacity-60 cursor-wait" : "cursor-pointer",
        ].join(" ")}
      >
        <span aria-hidden="true">❤️</span>
        <span className="font-medium tabular-nums">{rx.loves}</span>
        <span className="sr-only">loves</span>
      </button>
    </div>
  );
}

function AnnouncementItem({ item, expanded, onToggle, reaction, onReactionToggle, reactionBusy }) {
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
            <p className="text-sm text-white/80 mt-1">{item.summary || makePreview(item.body)}</p>
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

      <ReactionBar
        announcementId={item.id}
        reaction={reaction}
        onToggle={onReactionToggle}
        busy={reactionBusy}
      />

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
  const [reactions, setReactions] = useState({});
  const [busyId, setBusyId] = useState(null);
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

  useEffect(() => {
    fetch("/.netlify/functions/reactions", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.announcements) setReactions(data.announcements);
      })
      .catch(() => {
        /* function may be unavailable in plain CRA start */
      });
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
      (x.summary || "").toLowerCase().includes(q) ||
      (x.body || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  const onToggle = (id, expandedNext) => {
    setOpenId(expandedNext ? id : null);
    navigate(expandedNext ? `/announcements/${id}` : `/announcements`);
  };

  const onReactionToggle = useCallback(async (announcementId, reaction) => {
    const current = reactions[announcementId] || EMPTY_RX;
    const mine = reaction === "like" ? current.likedByMe : current.lovedByMe;
    const op = mine ? "remove" : "add";
    const countKey = reaction === "like" ? "likes" : "loves";
    const meKey = reaction === "like" ? "likedByMe" : "lovedByMe";

    const previous = { ...reactions };
    const optimistic = {
      ...current,
      [meKey]: !mine,
      [countKey]: Math.max(0, (current[countKey] || 0) + (mine ? -1 : 1)),
    };
    setReactions((prev) => ({ ...prev, [announcementId]: optimistic }));
    setBusyId(announcementId);

    try {
      const res = await fetch("/.netlify/functions/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId, reaction, op }),
      });
      if (!res.ok) throw new Error("reaction failed");
      const data = await res.json();
      if (data && data.announcements) {
        setReactions((prev) => ({ ...prev, ...data.announcements }));
      }
    } catch {
      setReactions(previous);
    } finally {
      setBusyId(null);
    }
  }, [reactions]);

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
              reaction={reactions[item.id]}
              onReactionToggle={onReactionToggle}
              reactionBusy={busyId === item.id}
            />
          ))}
        </div>
      )}

      {/* keep the tiny floating JSON admin for quick edits if needed */}
      <InlineAdmin data={items} onChange={setItems} />
    </div>
  );
}
