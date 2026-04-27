import AntProvider from '@/components/providers/AntProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PromoModal from "@/components/ui/ModalPromo";
import { Ubuntu } from "next/font/google";

const ubuntu = Ubuntu({subsets:['latin'],variable:'--font-ubuntu',weight:'400'});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AntProvider>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#050706] via-[#011712] to-[#010807] relative overflow-hidden">
        
        {/* Animated Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large floating orbs */}
          
          {/* Central glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-yellow-500/10 via-rose-500/10 to-purple-500/10 rounded-full blur-3xl animate-spin-slow" />
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full bg-grid-pattern opacity-10" />
        </div>

        {/* Color Bubbles - Enhanced */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-float-bubble blur-sm" />
        <div className="absolute top-40 right-20 w-6 h-6 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-float-bubble delay-300 blur-sm" />
        <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-ping-slow" />
        <div className="absolute top-1/3 right-1/3 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-float-bubble delay-700 blur-sm" />
        <div className="absolute bottom-20 right-10 w-8 h-8 bg-gradient-to-r from-red-400 to-pink-400 rounded-full animate-pulse-glow blur-md" />
        <div className="absolute top-1/2 left-10 w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full animate-float-bubble delay-500" />
        <div className="absolute bottom-1/3 right-20 w-4 h-4 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full animate-ping-slow delay-700" />
        <div className="absolute top-10 right-1/4 w-3 h-3 bg-gradient-to-r from-rose-400 to-red-400 rounded-full animate-float-bubble" />
        
        {/* Additional decorative bubbles */}
        <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-gradient-to-r from-fuchsia-400 to-purple-400 rounded-full animate-float-bubble delay-1000" />
        <div className="absolute bottom-40 left-20 w-5 h-5 bg-gradient-to-r from-sky-400 to-blue-400 rounded-full animate-pulse-glow delay-500 blur-sm" />
        <div className="absolute top-60 left-1/2 w-3 h-3 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full animate-float-bubble delay-1200" />
        <div className="absolute bottom-10 left-10 w-2 h-2 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full animate-ping-slow delay-300" />
        
        {/* Twinkling stars effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 2 + 1 + 'px',
                height: Math.random() * 2 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                opacity: Math.random() * 0.5 + 0.2,
                animation: `twinkle ${Math.random() * 4 + 2}s infinite`,
                animationDelay: Math.random() * 5 + 's',
              }}
            />
          ))}
        </div>

        <Header />
        <PromoModal />
        <main className="flex-1 relative z-10">{children}</main>
        <Footer />
      </div>
    </AntProvider>
  );
}