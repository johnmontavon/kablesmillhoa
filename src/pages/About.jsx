import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-white">
      <h1 className="text-3xl font-bold mb-4">About Kable's Mill HOA</h1>

      <p className="text-white/90 mb-6">
        This site provides neighborhood announcements, architectural
        improvement requests, and access to governing documents. It’s meant to
        be simple, fast, and useful for current and prospective homeowners.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="bg-white/5 rounded-xl p-5">
          <h2 className="font-semibold text-xl mb-2">Our Mission</h2>
          <p className="text-white/80 text-sm leading-relaxed">
            Maintain neighborhood standards, protect property values, and make
            it easy for residents to stay informed and get things done.
          </p>
        </section>

        <section className="bg-white/5 rounded-xl p-5">
          <h2 className="font-semibold text-xl mb-2">Board & Contacts</h2>
          <ul className="text-white/80 text-sm space-y-1">
            <li>President — <span className="opacity-70">John Banford</span></li>
            <li>Treasurer — <span className="opacity-70">Scott Umina </span></li>
            <li>Member at Large — <span className="opacity-70">John Montavon</span></li>
          </ul>
          <div className="mt-3 text-sm">
            Email:{" "}
            <a className="underline" href="mailto:johnmontavon@gmail.com">
              board@kablesmill.com
            </a>
          </div>
        </section>
      </div>

      <section className="bg-white/5 rounded-xl p-5 mt-4">
        <h2 className="font-semibold text-xl mb-2">Frequently Used</h2>
        <ul className="list-disc list-inside text-white/80 text-sm space-y-1">
          <li>
            <Link className="underline" to="/improvement">
              Submit an Improvement Request (ARC)
            </Link>
          </li>
          <li>
            <Link className="underline" to="/documents">
              Bylaws, Covenants, and Forms
            </Link>
          </li>
          <li>
            <Link className="underline" to="/announcements">
              Latest Announcements
            </Link>
          </li>
          <li>
            <Link className="underline" to="/links">
              City/Utility/School Links
            </Link>
          </li>
        </ul>
      </section>
   </div>
  );
}
