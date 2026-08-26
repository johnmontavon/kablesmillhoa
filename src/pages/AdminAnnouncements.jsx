import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const tryParse = (t, fb) => { try { return JSON.parse(t); } catch { return fb; } };
const slugify = (s) => s.toLowerCase().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");


const isPinnedNow = (item) => {
  if (item.pinned) return true;
  if (!item.pinned_until) return false;
  const until = new Date(item.pinned_until + "T23:59:59");
  return Date.now() <= until.getTime();
};
const sortAnnouncements = (arr) =>
  [...arr].sort((a, b) => {
    const pinDelta = (isPinnedNow(b) ? 1 : 0) - (isPinnedNow(a) ? 1 : 0);
    if (pinDelta !== 0) return pinDelta;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

// SUPER LIGHT CREDENTIALS (hardcoded for MVP)
// Change these now; later, replace with Supabase/Firebase auth.
const USERS = {
    jb: "3192",
    su: "3099",
    jm: "3241"
};

export default function AdminAnnouncements() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [u, setU] = useState(""); const [p, setP] = useState("");

  const [items, setItems] = useState([]);

  useEffect(() => {
    const url = `/announcements.json?v=${Date.now()}`;
    fetch(url, { cache: "no-store" })
      .then(r => r.ok ? r.text() : "[]")
      .then(t => setItems(tryParse(t, [])))
      .catch(() => setItems([]));
  }, []);

  const login = (e) => {
    if (e) e.preventDefault();
    const userTrim = u.trim();
    const passTrim = p.trim();
  
    // Exact username/password
    if (USERS[userTrim] && USERS[userTrim] === passTrim) {
      setUser(userTrim);
      return;
    }
    // Password-only fallback: infer username from password match
    const found = Object.entries(USERS).find(([, pw]) => pw === passTrim);
    if (found) {
      setUser(userTrim || found[0]); // if no username typed, use the matched one
      return;
    }
    alert("Invalid username or password.");
  };
  

  const addNew = () => {
    const today = new Date().toISOString().slice(0, 10);
    const title = "New Announcement";
    const baseId = `${today}-${slugify(title)}`.slice(0, 60);
    const newItem = {
      id: baseId,
      title,
      date: today,
      pinned: false,
      pinned_until: "",
      author: user,
      body: "",
      attachments: []
    };
    setItems([newItem, ...items]);
  };

  const update = (idx, key, value) => {
    setItems((arr) => {
      const clone = [...arr];
      clone[idx] = { ...clone[idx], [key]: value };
      return clone;
    });
  };
  
  // only regenerate the id when user finishes editing title/date
  const regenIdFrom = (idx) => {
    setItems((arr) => {
      const clone = [...arr];
      const it = { ...clone[idx] };
      // only auto-regenerate if the current id "looks like" our default pattern
      // (starts with its date)
      if (it.id && it.id.startsWith(it.date)) {
        it.id = `${it.date}-${slugify(it.title)}`.slice(0, 60);
        clone[idx] = it;
      }
      return clone;
    });
  };
  

  const remove = (idx) => {
    if (!window.confirm("Delete this announcement?")) return;
    const clone = [...items]; clone.splice(idx, 1); setItems(clone);
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(sortAnnouncements(items), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: "announcements.json" });
    a.click();
    URL.revokeObjectURL(url);
  };
  const fileInputRef = useRef(null);
  const importFile = async (file) => {
    try {
      const text = await file.text();
      const parsed = tryParse(text, null);
      if (Array.isArray(parsed)) {
        setItems(parsed);
        // allow re-selecting the same filename later
        if (fileInputRef.current) fileInputRef.current.value = "";
        alert(`Imported ${parsed.length} announcements`);
      } else {
        alert("Invalid file (expected a JSON array).");
      }
    } catch (e) {
      alert("Could not read file.");
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-white">
        <h1 className="text-2xl font-bold mb-4">Admin — Announcements</h1>
        <form onSubmit={login} className="space-y-3">
  <input
    className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none"
    placeholder="Username"
    value={u}
    onChange={e => setU(e.target.value)}
  />
  <input
    type="password"
    className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none"
    placeholder="Password"
    value={p}
    onChange={e => setP(e.target.value)}
  />
  <div className="flex gap-2">
    <button type="submit" className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-md">
      Log in
    </button>
    <button type="button" onClick={() => nav("/announcements")} className="underline">
      Back
    </button>
  </div>
  <p className="text-xs text-white/60 mt-2">
    Heads up: this is a lightweight gate for a static site. For real security, we’ll switch to Supabase/Firebase later.
  </p>
</form>

      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin — Announcements</h1>
        <div className="flex gap-2">
        <label className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-md cursor-pointer">
  Import JSON
  <input
    ref={fileInputRef}
    type="file"
    accept="application/json"
    className="hidden"
    onChange={(e) => {
      const f = e.target.files?.[0];
      if (f) importFile(f);
    }}
  />
</label>
          <button onClick={downloadJSON} className="bg-orange-400/90 hover:bg-orange-400 text-black px-3 py-2 rounded-md">
            Download JSON
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={addNew} className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-md">+ Add Announcement</button>
        <button onClick={() => nav("/announcements")} className="underline">View site</button>
      </div>

      <div className="mt-6 space-y-4">
      {items.map((it, idx) => {
  const mine = it.author === user || !it.author;
  return (
    <div key={idx} className="rounded-lg bg-white/5 p-3 border border-white/10">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/70 mb-1">Title</label>
                  <input
                    disabled={!mine}
                    className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none disabled:opacity-60"
                    value={it.title}
                    onChange={(e) => update(idx, "title", e.target.value)}
                    onBlur={() => regenIdFrom(idx)}
/>
                </div>
                <div>
                  <label className="block text-xs text-white/70 mb-1">Date (YYYY-MM-DD)</label>
                  <input
                        disabled={!mine}
                        className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none disabled:opacity-60"
                        value={it.date}
                        onChange={(e) => update(idx, "date", e.target.value)}
                        onBlur={() => regenIdFrom(idx)}
/>
                </div>
                <div>
                  <label className="block text-xs text-white/70 mb-1">ID (slug)</label>
                  <input
                    disabled={!mine}
                    className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none disabled:opacity-60"
                    value={it.id}
                    onChange={(e) => update(idx, "id", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="inline-flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      disabled={!mine}
                      checked={!!it.pinned}
                      onChange={(e) => update(idx, "pinned", e.target.checked)}
                    />
                    <span>Pinned</span>
                  </label>
                  <div>
                    <label className="block text-xs text-white/70 mb-1">Pinned Until</label>
                    <input
                      type="date"
                      disabled={!mine}
                      className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none disabled:opacity-60"
                      value={it.pinned_until || ""}
                      onChange={(e) => update(idx, "pinned_until", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs text-white/70 mb-1">Body (plain text)</label>
                <textarea
                  disabled={!mine}
                  rows={4}
                  className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none disabled:opacity-60"
                  value={it.body}
                  onChange={(e) => update(idx, "body", e.target.value)}
                />
              </div>

              <div className="mt-3">
                <label className="block text-xs text-white/70 mb-1">Attachments (label|url per line)</label>
                <textarea
                  disabled={!mine}
                  rows={2}
                  className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none disabled:opacity-60"
                  value={(it.attachments || []).map(a => `${a.label}|${a.url}`).join("\n")}
                  onChange={(e) =>
                    update(
                      idx,
                      "attachments",
                      e.target.value
                        .split("\n")
                        .map(s => s.trim()).filter(Boolean)
                        .map(line => {
                          const [label, url] = line.split("|");
                          return { label: (label || url || "").trim(), url: (url || label || "").trim() };
                        })
                    )
                  }
                />
              </div>

              <div className="mt-3 text-xs text-white/70">
                Author: <span className="opacity-90">{it.author || "—"}</span>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <a href={`/announcements/${it.id}`} className="underline text-sm" target="_blank" rel="noreferrer">Open permalink</a>
                {mine && (
                  <button onClick={() => remove(idx)} className="text-red-300 hover:text-red-200 text-sm">
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
