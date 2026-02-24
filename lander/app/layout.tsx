import "./css/style.css";

import { Inter, Manrope } from "next/font/google";
import localFont from "next/font/local";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const persis = localFont({
  src: "../public/fonts/Persis Bold.otf",
  variable: "--font-persis",
  display: "swap",
});

export const metadata = {
  title: "Fortress - Sovereign AI Infrastructure",
  description: "Secure, on-premise AI deployment for regulated industries.",
};

import { ModalProvider } from "@/components/modal-context";
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${persis.variable} ${manrope.variable} bg-gray-50 font-manrope tracking-tight text-gray-900 antialiased`}
      >
        <ModalProvider>
          <div className="flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
            {children}
          </div>
          <Toaster />
        </ModalProvider>
      </body>
    </html>
  );
}
