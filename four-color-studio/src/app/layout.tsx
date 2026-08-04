import type { Metadata } from "next";
import { Big_Shoulders_Stencil, Public_Sans, Roboto_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { CartProvider } from "@/context/CartContext";
import { prisma } from "@/lib/prisma";

const displayFont = Big_Shoulders_Stencil({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "variable",
  adjustFontFallback: false,
});

const bodyFont = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const monoFont = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "3DPressUSA Modular Hitch Cover",
  description: "Swap the placard, not the whole unit. Modular 3D-printed hitch covers built for outdoor use.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Sale collections = any active collection whose pricing scheme has a discountTitle set
  const saleCollections = await prisma.collection.findMany({
    where: {
      active: true,
      pricingScheme: { discountTitle: { not: null } },
    },
    select: { slug: true, name: true },
    orderBy: { sortOrder: "asc" },
  });

  const allCollections = await prisma.collection.findMany({
    where: { active: true },
    select: { slug: true, name: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gunmetal text-white font-body">
        <CartProvider>
          <NavBar saleCollections={saleCollections} allCollections={allCollections} />
          <CartDrawer />
          {children}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
