"use client";

import { usePathname } from "next/navigation";
import { SITE_NAME, SUPPORT_PHONE, WHATSAPP_URL } from "@/lib/site";

export const Footer = () => {
  const pathname = usePathname();
  
  // Check if we're on a page with a sidebar
  const hasSidebar = pathname?.startsWith('/dashboard') || pathname?.startsWith('/courses');
  
  return (
    <footer className="py-6 border-t">
      <div className="container mx-auto px-4">
        <div className={`text-center text-muted-foreground ${
          hasSidebar 
            ? 'md:rtl:pr-56 md:ltr:pl-56 lg:rtl:pr-80 lg:ltr:pl-80' 
            : ''
        }`}>
          <div className="inline-block bg-[#0083d3]/10 border-2 border-[#0083d3]/20 rounded-lg px-6 py-3 mb-4">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-lg text-[#0083d3] hover:underline"
            >
              الدعم الفني: {SUPPORT_PHONE}
            </a>
          </div>
          
          <p>© {new Date().getFullYear()} {SITE_NAME}. جميع الحقوق محفوظة</p>
        </div>
      </div>
    </footer>
  );
}; 