import AppBackground from "@/src/components/shell/AppBackground";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppBackground>
      {children}
    </AppBackground>
  );
}
