"use client";

import { useEffect, useState } from "react";
import PromoBanner from "./PromoBanner";
export default function PromoModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const lastShown = localStorage.getItem("promo_last_shown");
    const now = new Date().getTime();

    // 24 jam = 86400000 ms
    if (!lastShown || now - parseInt(lastShown) > 86400000) {
      const timer = setTimeout(() => {
        setOpen(true);
        localStorage.setItem("promo_last_shown", now.toString());
      }, 2000); // delay 2 detik

      return () => clearTimeout(timer);
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className=" bg-stone-900 rounded-xl p-4 w-[90%] max-w-md relative">
        
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-2 right-2 text-white hover:text-gray-300 transition-colors"
        >
          ✕
        </button>

        {/* Banner Image */}
        <PromoBanner />

        {/* CTA */}
        <button
          className="mt-4 w-full bg-orange-800 text-white py-2 rounded-lg"
          onClick={() => {
            setOpen(false);
            window.location.href = "/dashboard/games";
          }}
        >
          Klaim Promo Sekarang
        </button>
      </div>
    </div>
  );
}