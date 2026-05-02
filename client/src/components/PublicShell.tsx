import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";

interface Props {
  children: React.ReactNode;
  noFooter?: boolean;
}

export function PublicShell({ children, noFooter }: Props) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PublicHeader />
      <main>{children}</main>
      {!noFooter && <Footer />}
    </div>
  );
}
