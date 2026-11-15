import type { Metadata } from "next";
import { ProductArticle } from "@/components/product-article";
import { SiteFrame } from "@/components/site-frame";
import { getProduct, type ProductSlug } from "@/lib/site";

export function productMetadata(slug: ProductSlug): Metadata {
  const product = getProduct(slug);
  if (!product) {
    return { title: "ページがありません" };
  }
  return {
    title: product.name,
    description: product.summary,
  };
}

export function ProductPage({ slug }: { slug: ProductSlug }) {
  const product = getProduct(slug);
  if (!product) {
    return null;
  }

  return (
    <SiteFrame current={product.slug}>
      <ProductArticle product={product} />
    </SiteFrame>
  );
}
