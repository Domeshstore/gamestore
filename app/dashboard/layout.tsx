import AntProvider from '@/components/providers/AntProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PromoModal from "@/components/ui/ModalPromo";
import { Ubuntu } from "next/font/google";

const ubuntu = Ubuntu({subsets:['latin'],variable:'--font-ubuntu',weight:'400'});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AntProvider>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[rgb(10,10,10)] to-[#0d0d0d]" >
        <Header />
        <PromoModal />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </AntProvider>
  );
}
// Already wrapped above
