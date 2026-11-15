import { ProductPage, productMetadata } from "@/lib/product-page";

export const metadata = productMetadata("travel");

export default function TravelPage() {
  return <ProductPage slug="travel" />;
}
