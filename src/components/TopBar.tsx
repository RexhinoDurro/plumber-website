import { site } from "@/content/site";
import { OpenStatus } from "./OpenStatus";

/** Slim navy utility bar: emergency line + licence, the two things people check first. */
export function TopBar() {
  return (
    <div className="on-dark bg-ink text-[0.875rem] text-on-dark-muted">
      <div className="wrap flex min-h-10 flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <OpenStatus />
          <span>
            Emergency line 24/7:{" "}
            <a href={site.phoneHref} className="font-semibold text-on-dark no-underline hover:underline">{site.phone}</a>
            <span className="hidden md:inline">
              {" "}· <a href={site.smsHref} className="text-on-dark underline decoration-on-dark/30 underline-offset-4">Text us</a>
            </span>
          </span>
        </p>
        <p className="hidden items-center gap-x-1.5 sm:flex">
          <a href={site.licenseLookupUrl} className="text-on-dark-muted underline decoration-on-dark/30 underline-offset-4 hover:text-on-dark">
            {site.licence}
          </a>
          <span aria-hidden="true">·</span> Fully insured
          {site.languages.length > 1 && (
            <>
              <span aria-hidden="true">·</span> We speak {site.languages.join(", ")}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
