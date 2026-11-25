"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@/content/site";
import { PhoneIcon } from "./Icons";
import { Logo } from "./Logo";

const links = [
  { href: "/services", label: "Services" },
  { href: "/emergency", label: "Emergency" },
  { href: "/gallery", label: "Our work" },
  { href: "/areas", label: "Areas" },
  { href: "/buildings", label: "For buildings" },
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
        className={`wrap flex min-h-[72px] items-center gap-3 py-1 transition-[min-height] duration-300 ease-out-soft md:gap-6 ${
          scrolled ? "md:min-h-[72px]" : "md:min-h-[92px]"
        }`}
      >
        {/* The round badge carries its own background, so it sits straight on the header. */}
        <Link href="/" aria-label={`${site.name}, home`} className="flex shrink-0 items-center rounded-full no-underline">
          <Logo priority className={`h-16 transition-[height] duration-300 ease-out-soft ${scrolled ? "md:h-16" : "md:h-20"}`} />
        </Link>

        <nav
          id="site-nav"
          aria-label="Main"
          className={`${open ? "block" : "hidden"} absolute inset-x-0 top-full max-h-[calc(100svh-120px)] overflow-y-auto overscroll-contain border-b border-line bg-bg px-[clamp(20px,4vw,40px)] pb-[max(32px,env(safe-area-inset-bottom))] pt-4 shadow-lift
            lg:static lg:ml-auto lg:block lg:max-h-none lg:overflow-visible lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
        >
          <ul className="flex flex-col lg:flex-row lg:gap-1">
            {links.map((l) => {
              const current = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href + "/"));
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={current ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`block py-3 font-display text-[1.75rem] font-bold no-underline text-ink [font-stretch:125%]
                      nav-link lg:rounded-sm lg:px-3 lg:py-2 lg:font-body lg:text-base lg:font-medium lg:[font-stretch:100%]
                      ${current ? "text-brand-deep lg:text-ink" : ""}`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Link href="/contact" className="btn btn-secondary hidden min-h-11 px-4 text-[0.95rem] xl:inline-flex">
          Get a quote
        </Link>
        <a href={site.phoneHref} className="btn ml-auto lg:ml-0 min-h-12 md:min-h-11 w-12 px-0 md:w-auto md:px-4 text-[0.95rem]">
          <PhoneIcon />
          <span className="hidden md:inline">{site.phone}</span>
          <span className="sr-only md:hidden">Call {site.phone}</span>
        </a>

        <button
          type="button"
          className="inline-flex size-12 items-center justify-center rounded-full border-[1.5px] border-ink lg:hidden"
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
