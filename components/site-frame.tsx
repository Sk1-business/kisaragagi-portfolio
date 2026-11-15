import type { ReactNode } from "react";
import type { ProductSlug } from "@/lib/site";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function SiteFrame({
  current,
  children,
}: {
  current: "home" | ProductSlug | null;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader current={current} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
