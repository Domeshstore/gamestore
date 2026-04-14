
"use client"
import Image from "next/image"
export default function Logo () {

return(
    <div>
         <div className="relative items-center justify-center mx-auto mb-4 w-12 h-12 md:w-14 md:h-14">
                        <Image
                        
                          src="https://nmzg68mby1os258h.public.blob.vercel-storage.com/logo_web-deCCmxPsDLRIzi8JDbtrB3uecKPD9q.png"
                          alt="DoMesh Store Logo"
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 48px, 56px"
                          priority
                        />
                      </div>
    </div>
)
}