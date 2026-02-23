import AppShell from "@/components/AppShell";
import EmailDetail from "@/components/EmailDetail";

export default async function EmailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <EmailDetail id={id} />
    </AppShell>
  );
}
