"use client";

import { useEffect, useState } from "react";

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
      <div className="bg-white rounded-xl p-4 w-[90%] max-w-md relative">
        
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-2 right-2 text-black"
        >
          ✕
        </button>

        {/* Banner Image */}
        <img
          src="/promo.jpg"
          alt="Promo"
          className="rounded-lg w-full"
        />

        {/* CTA */}
        <button
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg"
          onClick={() => {
            setOpen(false);
            window.location.href = "/topup";
          }}
        >
          Klaim Promo Sekarang
        </button>
      </div>
    </div>
  );
}