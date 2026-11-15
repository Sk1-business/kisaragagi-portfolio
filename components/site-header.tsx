import Link from "next/link";
import { products, type ProductSlug } from "@/lib/site";

type Current = "home" | ProductSlug;

const links: { href: string; label: string; id: Current }[] = [
  { href: "/", label: "トップ", id: "home" },
  ...products.map((product) => ({
    href: `/products/${product.slug}`,
    label: product.nav,
    id: product.slug,
  })),
];

export function SiteHeader({ current }: { current: Current | null }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <Link href="/" className="group block">
          <span className="block text-[11px] tracking-[0.18em] text-muted">
            会社の紹介
          </span>
          <span className="mt-1 block font-serif text-lg text-ink group-hover:text-seal">
            名称は確認中
          </span>
        </Link>
        <nav aria-label="ページ" className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map((link) => {
            const active = link.id === current;
            return (
              <Link
                key={link.id}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`text-sm ${
                  active ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
