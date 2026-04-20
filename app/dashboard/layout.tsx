import AntProvider from '@/components/providers/AntProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PromoModal from "@/components/ui/ModalPromo";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AntProvider>
      <div className="min-h-screen flex flex-col" style={{ background: '#0e0d0de1' }}>
        <Header />
        <PromoModal />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </AntProvider>
  );
}
// Already wrapped above
