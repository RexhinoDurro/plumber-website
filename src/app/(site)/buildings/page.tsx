import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { PageHead } from "@/components/PageHead";
import { CoiForm } from "@/components/CoiForm";
import { EmergencyCta } from "@/components/EmergencyCta";

export const metadata: Metadata = {
  title: "For building managers, supers & landlords",
  description:
    "NYC plumbing for co-ops, condos and rental buildings: COI sent the same day, work within building hours, Local Law 152 gas inspections and no-heat priority in heat season.",
};

const promises = [
  ["Certificate of insurance, same day", "General liability and workers' comp, naming the building, managing agent and owner as additional insured. Request it below."],
  ["We follow your building's rules", "Planned work in your allowed hours (usually weekdays 9 to 5), noisy work after 10 AM, elevators and hallways protected."],
  ["The super sees it before it's closed up", "We leave walls open for the super or the building's engineer to inspect, and we send photos too."],
  ["Permits filed under our LMP", "Work that needs a DOB filing is filed by our NYC Licensed Master Plumber, including sign-offs."],
  ["Local Law 152 gas inspections", "Every four years for most buildings. We inspect, fix what's needed and file the certification."],
  ["Heat season priority", "From October 1 to May 31, no-heat and no-hot-water calls jump the queue, day or night."],
  ["Tenants handled directly", "We arrange access with tenants, confirm by text, and keep you copied without the back-and-forth."],
  ["One invoice, with photos", "A clear invoice per building or unit and a photo report of the finished work."],
];

export default function BuildingsPage() {
  return (
    <>
      <PageHead
        video="waterTowers"
        label="For building managers, supers & landlords"
        title="Plumbing that gets past the front desk."
        lede={`Co-ops, condos and rental buildings across ${site.areas.join(", ")}. Insurance paperwork done before we arrive, and work that follows your building's rules.`}
        aside={<CoiForm />}
      />

      <section className="section" aria-labelledby="bldg-title">
        <div className="wrap grid gap-12">
          <div className="grid gap-4">
            <p className="label">How we work in your building</p>
            <h2 id="bldg-title" className="max-w-[20ch]">Fewer emails for you, no surprises for the board.</h2>
          </div>
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {promises.map(([t, d]) => (
              <li key={t} className="grid content-start gap-2 border-t-2 border-brand pt-5">
                <h3 className="text-lg">{t}</h3>
                <p className="text-[0.95rem] text-muted">{d}</p>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Link href="/services/gas" className="btn btn-secondary">
              Local Law 152 inspections
            </Link>
            <Link href="/services/heating" className="btn btn-secondary">
              Boilers & heat season
            </Link>
            <a href={site.licenseLookupUrl} className="btn btn-secondary">
              Check our license on the DOB site
            </a>
          </div>
        </div>
      </section>
      <EmergencyCta />
    </>
  );
}
