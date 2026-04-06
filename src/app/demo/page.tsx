import type { Metadata } from "next";
import DemoShowcase from "./DemoShowcase";

export const metadata: Metadata = {
  title: "Adaptable — Experience the Platform",
  description: "A guided walkthrough of the Adaptable venture studio experience, from Ikigai discovery to graduation.",
};

export default function DemoPage() {
  return <DemoShowcase />;
}
