import { ProductPage, productMetadata } from "@/lib/product-page";

export const metadata = productMetadata("booking");

export default function BookingPage() {
  return <ProductPage slug="booking" />;
}
