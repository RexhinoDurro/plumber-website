"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@/content/site";
import { ElbowMark, PhoneIcon } from "./Icons";

const links = [
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Our work" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on Escape (links close it on click).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-bg/92 backdrop-blur-md border-b transition-colors ${
        scrolled ? "border-line shadow-[0_8px_24px_-16px_rgb(10_26_51/0.35)]" : "border-transparent"
      }`}
    >
      <div
        className={`wrap flex min-h-16 items-center gap-3 transition-[min-height] duration-300 ease-out-soft md:gap-6 ${
          scrolled ? "md:min-h-16" : "md:min-h-[76px]"
        }`}
      >
        <Link href="/" aria-label={`${site.name}, home`} className="flex items-center gap-3 no-underline text-ink">
          <ElbowMark className="size-[34px] shrink-0" />
          <span className="font-display text-xl font-extrabold tracking-[-0.02em] [font-stretch:125%]">
            {site.shortName}
          </span>
        </Link>

        <nav
          id="site-nav"
          aria-label="Main"
          className={`${open ? "block" : "hidden"} fixed inset-x-0 top-16 border-b border-line bg-bg px-[clamp(20px,4vw,40px)] pb-8 pt-4
            md:static md:ml-auto md:block md:border-0 md:bg-transparent md:p-0`}
        >
          <ul className="flex flex-col md:flex-row md:gap-1">
            {links.map((l) => {
              const current = pathname === l.href;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={current ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`block py-3 font-display text-[1.75rem] font-bold no-underline text-ink [font-stretch:125%]
                      nav-link md:rounded-sm md:px-3 md:py-2 md:font-body md:text-base md:font-medium md:[font-stretch:100%]
                      ${current ? "text-brand-deep md:text-ink" : ""}`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Link href="/contact" className="btn btn-secondary hidden min-h-11 px-4 text-[0.95rem] lg:inline-flex">
          Get a quote
        </Link>
        <a href={site.phoneHref} className="btn ml-auto md:ml-0 min-h-12 md:min-h-11 w-12 px-0 md:w-auto md:px-4 text-[0.95rem]">
          <PhoneIcon />
          <span className="hidden md:inline">{site.phone}</span>
          <span className="sr-only md:hidden">Call {site.phone}</span>
        </a>

        <button
          type="button"
          className="inline-flex size-12 items-center justify-center rounded-full border-[1.5px] border-ink md:hidden"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
          </svg>
        </button>
      </div>
    </header>
  );
}
