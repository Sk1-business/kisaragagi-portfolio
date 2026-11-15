import { ProductPage, productMetadata } from "@/lib/product-page";

export const metadata = productMetadata("subscriptions");

export default function SubscriptionsPage() {
  return <ProductPage slug="subscriptions" />;
}
