import Image from "next/image";
import { SITE_NAME } from "@/lib/site";

export const Logo = () => {
    return (
        <Image
            height={48}
            width={180}
            alt={SITE_NAME}
            src="/logo.png"
            className="h-12 w-auto object-contain"
            unoptimized
        />
    )
}