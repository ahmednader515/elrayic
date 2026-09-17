"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { Course } from "@prisma/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface HomepageFormProps {
  initialData: Course & { showOnHomepage?: boolean };
  courseId: string;
}

export const HomepageForm = ({ initialData, courseId }: HomepageFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showOnHomepage, setShowOnHomepage] = useState(
    initialData.showOnHomepage ?? true
  );

  const onToggle = async (checked: boolean) => {
    try {
      setIsLoading(true);
      setShowOnHomepage(checked);
      await axios.patch(`/api/courses/${courseId}`, {
        showOnHomepage: checked,
      });
      toast.success(
        checked
          ? "سيظهر الكورس في الصفحة الرئيسية"
          : "تم إخفاء الكورس من الصفحة الرئيسية"
      );
      router.refresh();
    } catch {
      setShowOnHomepage(!checked);
      toast.error("حدث خطأ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium mb-3">الظهور في الصفحة الرئيسية</div>
      <div className="flex items-start gap-3 space-x-reverse">
        <Checkbox
          id={`show-on-homepage-${courseId}`}
          checked={showOnHomepage}
          disabled={isLoading}
          onCheckedChange={(checked) => onToggle(Boolean(checked))}
        />
        <div className="space-y-1">
          <Label
            htmlFor={`show-on-homepage-${courseId}`}
            className="text-sm font-normal cursor-pointer"
          >
            عرض هذا الكورس في الصفحة الرئيسية
          </Label>
          <p className="text-xs text-muted-foreground">
            {showOnHomepage
              ? "الكورس ظاهر للزوار في الصفحة الرئيسية (بعد النشر)"
              : "الكورس مخفي من الصفحة الرئيسية، ويبقى متاحاً في قائمة الكورسات"}
          </p>
        </div>
      </div>
    </div>
  );
};
