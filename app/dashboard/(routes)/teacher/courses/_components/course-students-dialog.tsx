"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

interface Student {
  id: string;
  fullName: string;
  phoneNumber: string;
  grade: string | null;
  cohort: string | null;
}

export function CourseStudentsDialog({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    fetch(`/api/courses/${courseId}/students`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load students");
        return response.json();
      })
      .then((data) => { if (!controller.signal.aborted) setStudents(data.students); })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, courseId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Users className="h-4 w-4 ml-1" />الطلاب المشتركين</Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>الطلاب المشتركين في الكورس</DialogTitle>
          <DialogDescription>الطلاب الذين لديهم اشتراك نشط في هذا الكورس</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60dvh] overflow-y-auto space-y-2 touch-pan-y">
          {loading ? <p>جاري التحميل...</p> : error ? <p role="alert">تعذر تحميل الطلاب. أغلق النافذة وحاول مرة أخرى.</p> : students.length === 0 ? <p>لا يوجد طلاب مشتركين حالياً</p> : (
            <>
              <p className="text-sm text-muted-foreground">عدد الطلاب: {students.length}</p>
              {students.map((student) => (
                <div key={student.id} className="rounded-md border p-3 text-sm break-words">
                  <p className="font-medium">{student.fullName}</p>
                  <p dir="ltr" className="text-right">{student.phoneNumber}</p>
                  <p className="text-muted-foreground">{student.grade || "كلية غير محددة"} — الفرقة: {student.cohort || "غير محدد"}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
