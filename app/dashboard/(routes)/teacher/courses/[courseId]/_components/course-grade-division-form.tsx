"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Course } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { COURSE_GRADE_ALL, collegeOptions, getCollegeTypeOptions } from "@/lib/academic";

const formSchema = z.object({
    grade: z.string().optional(),
    divisions: z.array(z.string()).optional(),
});

interface CourseGradeDivisionFormProps {
    initialData: Course & { divisions?: string[] };
    courseId: string;
}

const getDivisionOptions = (grade: string | null | undefined) => getCollegeTypeOptions(grade);

export const CourseGradeDivisionForm = ({
    initialData,
    courseId
}: CourseGradeDivisionFormProps) => {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedGrade, setSelectedGrade] = useState<string | null>(initialData.grade || null);

    // Handle legacy division field (string) and new divisions field (array)
    const initialDivisions = initialData.divisions && initialData.divisions.length > 0 
        ? initialData.divisions 
        : (initialData as any).division 
            ? [(initialData as any).division]
            : [];

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            grade: initialData.grade || "",
            divisions: initialDivisions,
        },
    });

    // Reset divisions when grade changes
    const gradeValue = form.watch("grade");
    useEffect(() => {
        if (gradeValue !== selectedGrade) {
            setSelectedGrade(gradeValue || null);
            if (gradeValue === COURSE_GRADE_ALL) {
                form.setValue("divisions", []);
            } else if (gradeValue) {
                form.setValue("divisions", []);
            }
        }
    }, [gradeValue, selectedGrade, form]);

    const toggleEdit = () => {
        if (isEditing) {
            // Reset form when canceling
            const divisions = initialData.divisions && initialData.divisions.length > 0 
                ? initialData.divisions 
                : (initialData as any).division 
                    ? [(initialData as any).division]
                    : [];
            form.reset({
                grade: initialData.grade || "",
                divisions: divisions,
            });
            setSelectedGrade(initialData.grade || null);
        }
        setIsEditing((current) => !current);
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setIsLoading(true);
            
            // Prepare data
            const updateData: { grade?: string | null; divisions?: string[] } = {};
            
            if (values.grade && values.grade.trim() !== "" && values.grade !== COURSE_GRADE_ALL) {
                updateData.grade = values.grade.trim();
                updateData.divisions = values.divisions || [];
            } else if (values.grade === COURSE_GRADE_ALL) {
                updateData.grade = COURSE_GRADE_ALL;
                updateData.divisions = [];
            } else {
                updateData.grade = null;
                updateData.divisions = [];
            }
            
            const response = await axios.patch(`/api/courses/${courseId}`, updateData);
            
            if (response.status === 200) {
                toast.success("تم تحديث الكلية ونوعها");
                toggleEdit();
                router.refresh();
            }
        } catch (error: any) {
            console.error("Error updating course grade/division:", error);
            const errorMessage = error?.response?.data?.error || error?.message || "حدث خطأ ما";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const divisionOptions = getDivisionOptions(selectedGrade);
    const selectedDivisions = form.watch("divisions") || [];

    const handleDivisionToggle = (divisionValue: string, checked: boolean) => {
        const currentDivisions = form.getValues("divisions") || [];
        if (checked) {
            form.setValue("divisions", [...currentDivisions, divisionValue]);
        } else {
            form.setValue("divisions", currentDivisions.filter((d) => d !== divisionValue));
        }
    };

    // Display divisions for viewing
    const displayDivisions = initialData.divisions && initialData.divisions.length > 0 
        ? initialData.divisions 
        : (initialData as any).division 
            ? [(initialData as any).division]
            : [];

    return (
        <div className="mt-6 border bg-slate-100 rounded-md p-4">
            <div className="font-medium flex items-center justify-between">
                الكلية ونوعها
                <Button onClick={toggleEdit} variant="ghost">
                    {isEditing ? (
                        <>إلغاء</>
                    ) : (
                        <>
                            <Pencil className="h-4 w-4 mr-2" />
                            تعديل
                        </>
                    )}
                </Button>
            </div>
            {!isEditing && (
                <div className="mt-4 space-y-2">
                    <div className="text-sm">
                        <span className="font-medium">الكلية: </span>
                        <span className="text-muted-foreground">
                            {initialData.grade === COURSE_GRADE_ALL ? "الكل (جميع الكليات)" : (initialData.grade || "غير محدد")}
                        </span>
                    </div>
                    {initialData.grade && initialData.grade !== COURSE_GRADE_ALL && (
                        <div className="text-sm">
                            <span className="font-medium">نوع الكلية: </span>
                            <span className="text-muted-foreground">
                                {displayDivisions.length > 0 ? displayDivisions.join(", ") : "غير محدد"}
                            </span>
                        </div>
                    )}
                    {initialData.grade === COURSE_GRADE_ALL && (
                        <div className="text-sm text-blue-600">
                            ℹ️ هذا الكورس متاح لجميع الكليات
                        </div>
                    )}
                    {!initialData.grade && (
                        <div className="text-sm text-orange-600">
                            ⚠️ يجب تحديد الكلية ونوعها لعرض الكورس للطلاب
                        </div>
                    )}
                </div>
            )}
            {isEditing && (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <FormField
                            control={form.control}
                            name="grade"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الكلية</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            setSelectedGrade(value);
                                            form.setValue("divisions", []);
                                        }}
                                        value={field.value}
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر الكلية" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={COURSE_GRADE_ALL}>الكل (جميع الكليات)</SelectItem>
                                            {collegeOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedGrade && selectedGrade !== COURSE_GRADE_ALL && divisionOptions.length > 0 && (
                            <FormField
                                control={form.control}
                                name="divisions"
                                render={() => (
                                    <FormItem>
                                        <div className="mb-2">
                                            <FormLabel>نوع الكلية (يمكن اختيار أكثر من نوع)</FormLabel>
                                        </div>
                                        <div className="space-y-2">
                                            {divisionOptions.map((option) => (
                                                <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                                                    <Checkbox
                                                        id={`division-${option.value}`}
                                                        checked={selectedDivisions.includes(option.value)}
                                                        onCheckedChange={(checked) => {
                                                            handleDivisionToggle(option.value, checked as boolean);
                                                        }}
                                                        disabled={isLoading}
                                                    />
                                                    <Label
                                                        htmlFor={`division-${option.value}`}
                                                        className="text-sm font-normal cursor-pointer"
                                                    >
                                                        {option.label}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {selectedGrade === COURSE_GRADE_ALL && (
                            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md border border-blue-200">
                                ℹ️ عند اختيار "الكل"، سيظهر هذا الكورس لجميع الطلاب بغض النظر عن كلياتهم ونوعها.
                            </div>
                        )}

                        <div className="flex items-center gap-x-2">
                            <Button
                                disabled={isLoading || (selectedGrade && selectedGrade !== COURSE_GRADE_ALL && selectedDivisions.length === 0)}
                                type="submit"
                            >
                                حفظ
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </div>
    );
};
