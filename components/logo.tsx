
"use client"
import Image from "next/image"
export default function Logo () {

return(
    <div>
         <div className="relative items-center justify-center mx-auto mb-4 w-12 h-12 md:w-14 md:h-14">
                        <Image
                        
                          src="https://nmzg68mby1os258h.public.blob.vercel-storage.com/logo_1-jUsDzBzgtlctx4zsJ4BmfwLg3IAqG0.png"
                          alt="BANGDIM Store Logo"
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 48px, 56px"
                          priority
                        />
                      </div>
    </div>
)
}