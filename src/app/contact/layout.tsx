import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach SMAT Designs — new projects and partnerships. Tempe, AZ.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
