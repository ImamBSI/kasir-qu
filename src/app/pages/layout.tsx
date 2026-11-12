import { requireAuthenticatedUser } from "@/lib/session";

export default async function ProtectedPagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAuthenticatedUser();

  return children;
}
