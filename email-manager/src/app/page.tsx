import AppShell from "@/components/AppShell";
import EmailList from "@/components/EmailList";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <AppShell>
      <Suspense>
        <EmailList />
      </Suspense>
    </AppShell>
  );
}
