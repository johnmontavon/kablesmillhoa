import React, { useMemo, useState } from "react";

const RECIPIENT = "SusanHedgecoth@TowneProperties.com";
const PDF_PATH = "/docs/ImprovementApplication.pdf"; // put the PDF here in /public/docs

const todayISO = () => new Date().toISOString().slice(0, 10);
const hasAt = (s) => typeof s === "string" && s.includes("@");

// Build a nice multi-line body for the mailto
function buildEmailBody(values) {
  const lines = [
    "Kables Mill – Improvement Application",
    "-------------------------------------",
    `Name: ${values.name || ""}`,
    `Address: ${values.address || ""}`,
    `Lot #: ${values.lot || ""}`,
    `Date: ${values.date || ""}`,
    `Phone: ${values.phone || ""}`,
    `Owner/Renter/Land Contract: ${values.status || ""}`,
    "",
    "TYPE AND NATURE OF REQUESTED IMPROVEMENT:",
    values.nature || "",
    "",
    `Color: ${values.color || ""}`,
    `Dimensions: ${values.dimensions || ""}`,
    `Location: ${values.location || ""}`,
    `Contractor: ${values.contractor || ""}`,
    `Supplies: ${values.supplies || ""}`,
    `Approximate Cost: ${values.cost || ""}`,
    "",
    "NOTE: A scale drawing of the improvements must be attached to this email before sending.",
  ];
  return lines.join("\n");
}

export default function Improvement() {
  const [v, setV] = useState({
    name: "",
    address: "",
    lot: "",
    date: todayISO(),
    phone: "",
    status: "Owner", // Owner | Renter | Land Contract
    nature: "",
    color: "",
    dimensions: "",
    location: "",
    contractor: "",
    supplies: "",
    cost: ""
  });

  const onChange = (key) => (e) => setV((s) => ({ ...s, [key]: e.target.value }));

  const subject = useMemo(() => {
    const who = [v.name, v.address].filter(Boolean).join(" — ");
    return who
      ? `Kables Mill Improvement Application — ${who}`
      : "Kables Mill Improvement Application";
  }, [v.name, v.address]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // ask for sender email to CC (basic validation: must contain "@")
    const cc = window.prompt("Please enter your email address for confirmation (will be CC'd):", "");
    if (!cc || !hasAt(cc)) {
      alert("Error: need a sending email address with an '@' for validation.");
      return;
    }

    const body = buildEmailBody(v);
    const mailto = [
      `mailto:${encodeURIComponent(RECIPIENT)}`,
      `?cc=${encodeURIComponent(cc)}`,
      `&subject=${encodeURIComponent(subject)}`,
      `&body=${encodeURIComponent(body)}`
    ].join("");

    // Open the user's email client with all fields prefilled
    window.location.href = mailto;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 text-white">
      <h1 className="text-3xl font-bold mb-3">Improvement Request</h1>
      <p className="text-white/80">
        Download the official form, complete it, and email it to{" "}
        <a className="underline" href={`mailto:${RECIPIENT}`}>{RECIPIENT}</a>.
      </p>

      {/* Download card */}
      <div className="mt-4">
        <a
          href={PDF_PATH}
          download
          className="block rounded-xl bg-white/90 p-4 shadow hover:shadow-lg hover:-translate-y-0.5 transition text-black"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">Downloadable Form (PDF)</div>
              <div className="text-sm text-gray-700 mt-1">
                Download, complete, and email it to {RECIPIENT}
              </div>
            </div>
            <div className="text-xs bg-black/80 text-white px-2 py-1 rounded-md self-start">
              Download
            </div>
          </div>
        </a>
      </div>
      <div className="my-6 relative">
  <div className="h-px bg-white/40" />
  <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-[#256C63] px-3 text-white/140">
    <span className="font-semibold tracking-wide">OR</span> submit via online form
  </span>
</div>
      {/* Inline form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/70 mb-1">Name</label>
            <input
              className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none"
              value={v.name}
              onChange={onChange("name")}
            />
          </div>
          <div>
            <label className="block text-xs text-white/70 mb-1">Address</label>
            <input
              className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none"
              value={v.address}
              onChange={onChange("address")}
            />
          </div>

          <div>
            <label className="block text-xs text-white/70 mb-1">Lot #</label>
            <input
              className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none"
              value={v.lot}
              onChange={onChange("lot")}
            />
          </div>
          <div>
            <label className="block text-xs text-white/70 mb-1">Date</label>
            <input
              type="date"
              className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none"
              value={v.date}
              onChange={onChange("date")}
            />
          </div>

          <div>
            <label className="block text-xs text-white/70 mb-1">Phone Number</label>
            <input
              className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none"
              value={v.phone}
              onChange={onChange("phone")}
            />
          </div>

          <div>
            <label className="block text-xs text-white/70 mb-1">Owner / Renter / Land Contract</label>
            <select
              className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none"
              value={v.status}
              onChange={onChange("status")}
            >
              <option>Owner</option>
              <option>Renter</option>
              <option>Land Contract</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/70 mb-1">Type & Nature of Requested Improvement</label>
          <textarea
            rows={4}
            className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none"
            value={v.nature}
            onChange={onChange("nature")}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-white/70 mb-1">Color</label>
            <input
              className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none"
              value={v.color}
              onChange={onChange("color")}
            />
          </div>
          <div>
            <label className="block text-xs text-white/70 mb-1">Dimensions</label>
            <input
              className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none"
              value={v.dimensions}
              onChange={onChange("dimensions")}
            />
          </div>
          <div>
            <label className="block text-xs text-white/70 mb-1">Location</label>
            <input
              className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none"
              value={v.location}
              onChange={onChange("location")}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-white/70 mb-1">Contractor (if applicable)</label>
            <input
              className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none"
              value={v.contractor}
              onChange={onChange("contractor")}
            />
          </div>
          <div>
            <label className="block text-xs text-white/70 mb-1">Supplies</label>
            <input
              className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none"
              value={v.supplies}
              onChange={onChange("supplies")}
            />
          </div>
          <div>
            <label className="block text-xs text-white/70 mb-1">Approximate Cost</label>
            <input
              className="w-full rounded-md px-3 py-2 bg-white/10 text-white outline-none"
              value={v.cost}
              onChange={onChange("cost")}
            />
          </div>
        </div>

        <div className="text-white/70 text-sm">
          Please remember to attach a <span className="font-semibold text-white">scale drawing</span> showing exact
          location and dimensions before sending your email.
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="bg-orange-400 text-black font-semibold px-6 py-3 rounded-xl shadow hover:scale-105 hover:drop-shadow-[0_0_10px_#4CA69B] transition"
          >
            Submit via Email
          </button>
        </div>
      </form>
    </div>
  );
}
