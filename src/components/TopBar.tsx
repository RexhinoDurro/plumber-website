import { site } from "@/content/site";

/** Slim navy utility bar: emergency line + licence, the two things people check first. */
export function TopBar() {
  return (
    <div className="on-dark bg-ink text-[0.875rem] text-on-dark-muted">
      <div className="wrap flex min-h-10 flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2">
        <p>
          <span className="mr-2 inline-block size-2 rounded-full bg-sky align-middle" aria-hidden="true" />
          Emergency line open now:{" "}
          <a href={site.phoneHref} className="font-semibold text-on-dark no-underline hover:underline">{site.phone}</a>
        </p>
        <p className="hidden sm:block">
          {site.licence} · Fully insured · Serving {site.city}
        </p>
      </div>
    </div>
  );
}
