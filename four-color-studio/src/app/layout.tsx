import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import CartDrawer from "@/components/CartDrawer";
import { CartProvider } from "@/context/CartContext";
import { prisma } from "@/lib/prisma";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-white">
        <CartProvider>
          <NavBar saleCollections={saleCollections} />
          <CartDrawer />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
