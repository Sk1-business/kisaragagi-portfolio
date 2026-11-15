import Link from "next/link";
import { inquiryHref, type Product } from "@/lib/site";

export function ProductArticle({ product }: { product: Product }) {
  return (
    <article className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="text-[11px] tracking-[0.22em] text-seal">
        {product.index} / {product.nav}
      </p>
      <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-[1.25] font-medium sm:text-6xl">
        {product.headline
          ? product.headline.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))
          : product.name}
      </h1>
      <p className="mt-8 max-w-2xl text-base leading-8 text-muted">{product.summary}</p>

      <div className="mt-16 border-t border-line">
        {product.sections.map((section) => (
          <section
            key={section.title}
            className="grid gap-4 border-b border-line py-8 md:grid-cols-12 md:gap-8"
          >
            <h2 className="font-serif text-xl md:col-span-4">{section.title}</h2>
            <div className="space-y-4 text-sm leading-7 text-muted md:col-span-8">
              {section.items ? (
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span aria-hidden className="text-seal">
                        —
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <a
            href={inquiryHref(`${product.name}についての問い合わせ`)}
            className="inline-flex border border-ink px-5 py-3 text-sm text-ink hover:border-seal hover:text-seal"
          >
            メールで問い合わせる
          </a>
          {product.link ? (
            <p className="mt-4 max-w-md text-sm leading-7 text-muted">
              <a
                href={product.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline decoration-line underline-offset-4 hover:text-seal"
              >
                {product.link.label}
              </a>
              <span>。{product.link.note}</span>
            </p>
          ) : null}
        </div>
        <Link href="/" className="text-sm text-muted hover:text-ink">
          トップへ戻る
        </Link>
      </div>
    </article>
  );
}
