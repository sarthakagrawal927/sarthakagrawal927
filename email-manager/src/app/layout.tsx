import type { Metadata } from "next";
import Providers from "@/components/Providers";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Email Manager",
  description: "Manage your Gmail inbox, unsubscribe from newsletters, and stay organized",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
