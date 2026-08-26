import React from "react";

const LINKS = [
  // Internal
  { title: "Improvement Request Form", href: "improvement", desc: "Submit an exterior change request (ARC)." },
  { title: "Kables Mill Facebook Group", href: "https://www.facebook.com/share/g/1BcMDNRdrA/", desc: "Neighborhood FB Page" },
  { title: "Documents Library", href: "/documents", desc: "Bylaws, covenants, architectural standards, and forms." },

  // Collapsible multi-link card
  {
    title: "City Services – Trash & Recycling",
    desc: "Pickup schedule, bulk items, and providers.",
    links: [
      { label: "Rumpke", href: "https://www.rumpke.com" },
      { label: "Waste Management", href: "https://www.wm.com" },
      { label: "Republic Services", href: "https://www.republicservices.com" },
    ],
    defaultOpen: false, // set to true if you want it expanded by default
  },

  // Singles
  { title: "Utility – Electric", href: "https://aes-ohio.com", desc: "Report outages or start/stop service." },
  { title: "Utility – Water / Sewer", href: "https://www.greenecountyohio.gov/317/Sanitary-Engineering", desc: "Billing and service requests." },
  { title: "Bellbrook–Sugarcreek Schools", href: "http://www.sugarcreek.k12.oh.us/", desc: "Calendars, contacts, and resources." },
  { title: "County Auditor / Property Search", href: "https://auditor.greenecountyohio.gov/Search/Name", desc: "Property tax, transfers, and records." },
];

const isExternal = (href) => /^https?:\/\//i.test(href);

function LinkCard({ title, href, desc, links, defaultOpen }) {
  const multi = Array.isArray(links) && links.length > 0;

  // Single-link (unchanged)
  if (!multi) {
    const external = isExternal(href);
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="block rounded-xl bg-white/90 p-4 shadow hover:shadow-lg hover:-translate-y-0.5 transition"
      >
        <div className="text-lg font-semibold">{title}</div>
        {desc ? <p className="text-sm text-gray-600 mt-1">{desc}</p> : null}
      </a>
    );
  }

  // Collapsible multi-link card
  return (
    <details
      className="group rounded-xl bg-white/90 shadow transition [&_summary::-webkit-details-marker]:hidden"
      open={!!defaultOpen}
    >
      <summary className="flex items-center justify-between p-4 cursor-pointer select-none">
        <div>
          <div className="text-lg font-semibold">{title}</div>
          {desc ? <p className="text-sm text-gray-600 mt-1">{desc}</p> : null}
        </div>
        <svg
          className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </summary>

      <div className="px-4 pb-4">
        <ul className="mt-2 space-y-2">
          {links.map((item) => {
            const external = isExternal(item.href);
            return (
              <li key={item.label}>
                <a
                  href={item.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className="w-full inline-flex items-center justify-between rounded-lg bg-white/70 hover:bg-white px-3 py-2 border border-black/5"
                >
                  <span className="text-sm font-medium text-gray-800">{item.label}</span>
                  <span aria-hidden className="text-gray-500 text-xs">↗</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}

export default function Links() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-6">Useful Links</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((l) => (
          <LinkCard key={l.title} {...l} />
        ))}
      </div>

      <div className="mt-8 text-white/80 text-sm">
        Missing something?{" "}
        <a className="underline" href="mailto:JohnMontavon@gmail.com">
          Email the board
        </a>
        .
      </div>
    </div>
  );
}
