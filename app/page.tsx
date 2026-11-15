import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/site-frame";
import { products, withheld } from "@/lib/site";

export const metadata: Metadata = {
  title: "会社とプロダクトの紹介",
};

export default function HomePage() {
  return (
    <SiteFrame current="home">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="text-[11px] tracking-[0.22em] text-seal">COMPANY</p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-[1.25] font-medium sm:text-6xl">
          手を動かしている
          <br />
          プロダクトは、三つです。
        </h1>
        <div className="mt-8 max-w-2xl space-y-4 text-base leading-8 text-muted">
          <p>
            旅行中に近くの場所を知るガイド、推し活の契約と支払いをまとめて見るアプリ、小さなサロンや個人事業者の予約。相手も、解こうとしていることも、別々です。
          </p>
          <p>
            正式な会社名とミッションは、確認できるまで空欄にしています。このページは、その確認が済むまでの紹介です。
          </p>
        </div>

        <section aria-labelledby="products-heading" className="mt-20">
          <h2 id="products-heading" className="font-serif text-2xl">
            プロダクト
          </h2>
          <ol className="mt-6 border-t border-line">
            {products.map((product) => (
              <li key={product.slug} className="border-b border-line">
                <Link
                  href={`/products/${product.slug}`}
                  className="group grid gap-4 py-8 sm:grid-cols-[4.5rem_1fr_auto] sm:items-start sm:gap-8"
                >
                  <span className="font-serif text-3xl text-seal">{product.index}</span>
                  <span>
                    <span className="block font-serif text-2xl text-ink group-hover:text-seal sm:text-3xl">
                      {product.name}
                    </span>
                    <span className="mt-3 block max-w-2xl text-sm leading-7 text-muted">
                      {product.summary}
                    </span>
                  </span>
                  <span className="text-sm text-ink sm:pt-2">詳しく見る</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="withheld-heading" className="mt-20 max-w-2xl">
          <h2 id="withheld-heading" className="font-serif text-2xl">
            まだ書いていないこと
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            確認できるまで、次の項目は空欄です。推測では書いていません。
          </p>
          <ul className="mt-6 space-y-3 border-t border-line pt-6 text-sm leading-7">
            {withheld.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 bg-seal" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SiteFrame>
  );
}
