"use client";

import { motion } from "framer-motion";
import { FACEBOOK_URL, WHATSAPP_URL } from "@/lib/site";

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.02H7.9v-2.91h2.4V9.84c0-2.38 1.42-3.69 3.58-3.69 1.04 0 2.12.18 2.12.18v2.34h-1.2c-1.18 0-1.55.73-1.55 1.48v1.78h2.64l-.42 2.91h-2.22V22c4.78-.75 8.44-4.91 8.44-9.93z" />
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.47 14.38c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.41.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.46h-.52c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29s.98 2.66 1.12 2.84c.14.18 1.93 2.95 4.67 4.14.65.28 1.16.45 1.56.58.65.21 1.25.18 1.72.11.52-.08 1.6-.65 1.83-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32zM12.04 21.8h-.01c-1.7 0-3.37-.46-4.83-1.33l-.35-.21-3.59.94.96-3.5-.23-.36a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.13 1.03 7 2.9a9.82 9.82 0 0 1 2.9 6.99c0 5.46-4.44 9.9-9.9 9.9zm8.41-18.3A11.84 11.84 0 0 0 12.04 0C5.45 0 .1 5.35.1 11.93c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.9 11.9 0 0 0 5.76 1.47h.01c6.59 0 11.94-5.35 11.94-11.93 0-3.19-1.24-6.19-3.5-8.44z" />
  </svg>
);

export function FloatingSocialButtons() {
  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3">
      <motion.a
        href={FACEBOOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="فيسبوك"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-lg shadow-[#1877F2]/30"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      >
        <FacebookIcon className="h-7 w-7" />
      </motion.a>
      <motion.a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="واتساب"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-20" />
        <WhatsAppIcon className="relative h-7 w-7" />
      </motion.a>
    </div>
  );
}
