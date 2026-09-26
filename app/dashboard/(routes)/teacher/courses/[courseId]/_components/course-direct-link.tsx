"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SITE_URL } from "@/lib/site";

interface CourseDirectLinkProps {
  courseId: string;
}

export const CourseDirectLink = ({ courseId }: CourseDirectLinkProps) => {
  const link = `${SITE_URL}/go/${courseId}`;
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("تم نسخ الرابط");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("تعذر نسخ الرابط");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium mb-1">رابط الكورس</div>
      <p className="text-xs text-muted-foreground mb-3">
        يفتح الكورس ويسجّل الطالب فيه. إذا لم يكن مسجلاً للدخول، يسجّل الدخول ثم يُفتح الكورس مباشرة.
      </p>
      <div className="flex items-center gap-2">
        <Input readOnly value={link} dir="ltr" className="bg-white text-left" />
        <Button type="button" variant="outline" onClick={copyLink}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          نسخ
        </Button>
      </div>
    </div>
  );
};
