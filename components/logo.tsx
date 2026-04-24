
"use client"
import Image from "next/image"
export default function Logo () {

return(
    <div>
         <div className="relative items-center justify-center mx-auto mb-4 w-23 h-23 md:w-28 md:h-28">
                        <Image
                        
                          src="https://nmzg68mby1os258h.public.blob.vercel-storage.com/logo_1-jUsDzBzgtlctx4zsJ4BmfwLg3IAqG0.png"
                          alt="BANGDIM Store Logo"
                          fill
                          className="object-contain"
                          sizes="(max-width: 1000px) 108px, 108px"
                          priority
                        />
                      </div>
    </div>
)
}