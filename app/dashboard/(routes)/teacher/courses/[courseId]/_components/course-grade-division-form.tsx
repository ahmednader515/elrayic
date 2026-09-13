"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Course } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import {
    COURSE_GRADE_ALL,
    collegeOptions,
    collegeTypeOptions,
    getCourseFaculties,
} from "@/lib/academic";

const formSchema = z.object({
    forAllFaculties: z.boolean(),
    grades: z.array(z.string()),
    divisions: z.array(z.string()),
});

interface CourseGradeDivisionFormProps {
    initialData: Course & { grades?: string[]; divisions?: string[] };
    courseId: string;
}

const getInitialValues = (initialData: CourseGradeDivisionFormProps["initialData"]) => {
    const { isAll, faculties } = getCourseFaculties(initialData);
    const divisions = initialData.divisions && initialData.divisions.length > 0
        ? initialData.divisions
        : (initialData as { division?: string }).division
            ? [(initialData as { division?: string }).division as string]
            : [];

    return {
        forAllFaculties: isAll,
        grades: faculties,
        divisions,
    };
};

export const CourseGradeDivisionForm = ({
    initialData,
    courseId
}: CourseGradeDivisionFormProps) => {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: getInitialValues(initialData),
    });

    const toggleEdit = () => {
        if (isEditing) {
            form.reset(getInitialValues(initialData));
        }
        setIsEditing((current) => !current);
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setIsLoading(true);

            const updateData = values.forAllFaculties
                ? { grade: COURSE_GRADE_ALL, grades: [], divisions: [] }
                : {
                    grade: values.grades[0] ?? null,
                    grades: values.grades,
                    divisions: values.divisions,
                };

            const response = await axios.patch(`/api/courses/${courseId}`, updateData);

            if (response.status === 200) {
                toast.success("تم تحديث الكلية ونوعها");
                toggleEdit();
                router.refresh();
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.message || "حدث خطأ ما";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedGrades = form.watch("grades") || [];
    const selectedDivisions = form.watch("divisions") || [];
    const forAllFaculties = form.watch("forAllFaculties");
    const { isAll, faculties } = getCourseFaculties(initialData);

    const handleFacultyToggle = (faculty: string, checked: boolean) => {
        const current = form.getValues("grades") || [];
        form.setValue("forAllFaculties", false);
        form.setValue(
            "grades",
            checked ? [...current, faculty] : current.filter((value) => value !== faculty)
        );
    };

    const handleDivisionToggle = (divisionValue: string, checked: boolean) => {
        const current = form.getValues("divisions") || [];
        form.setValue(
            "divisions",
            checked ? [...current, divisionValue] : current.filter((value) => value !== divisionValue)
        );
    };

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
                            {isAll
                                ? "الكل (جميع الكليات)"
                                : faculties.length > 0
                                    ? faculties.join("، ")
                                    : "غير محدد"}
                        </span>
                    </div>
                    {!isAll && faculties.length > 0 && (
                        <div className="text-sm">
                            <span className="font-medium">نوع الكلية: </span>
                            <span className="text-muted-foreground">
                                {(initialData.divisions?.length ?? 0) > 0
                                    ? initialData.divisions.join("، ")
                                    : "غير محدد"}
                            </span>
                        </div>
                    )}
                    {isAll && (
                        <div className="text-sm text-blue-600">
                            ℹ️ هذا الكورس متاح لجميع الكليات
                        </div>
                    )}
                    {!isAll && faculties.length === 0 && (
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
                            name="grades"
                            render={() => (
                                <FormItem>
                                    <FormLabel>الكلية (يمكن اختيار أكثر من كلية)</FormLabel>
                                    <div className="max-h-56 overflow-y-auto overscroll-contain rounded-md border bg-white p-3 space-y-2 touch-pan-y">
                                        <div className="flex items-center space-x-2 space-x-reverse">
                                            <Checkbox
                                                id="faculty-all"
                                                checked={forAllFaculties}
                                                onCheckedChange={(checked) => {
                                                    form.setValue("forAllFaculties", Boolean(checked));
                                                    form.setValue("grades", []);
                                                    form.setValue("divisions", []);
                                                }}
                                                disabled={isLoading}
                                            />
                                            <Label htmlFor="faculty-all" className="text-sm font-normal cursor-pointer">
                                                الكل (جميع الكليات)
                                            </Label>
                                        </div>
                                        {collegeOptions.map((option) => (
                                            <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                                                <Checkbox
                                                    id={`faculty-${option.value}`}
                                                    checked={selectedGrades.includes(option.value)}
                                                    onCheckedChange={(checked) => {
                                                        handleFacultyToggle(option.value, Boolean(checked));
                                                    }}
                                                    disabled={isLoading || forAllFaculties}
                                                />
                                                <Label
                                                    htmlFor={`faculty-${option.value}`}
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

                        {!forAllFaculties && selectedGrades.length > 0 && (
                            <FormField
                                control={form.control}
                                name="divisions"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>نوع الكلية (يمكن اختيار أكثر من نوع)</FormLabel>
                                        <div className="space-y-2">
                                            {collegeTypeOptions.map((option) => (
                                                <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                                                    <Checkbox
                                                        id={`division-${option.value}`}
                                                        checked={selectedDivisions.includes(option.value)}
                                                        onCheckedChange={(checked) => {
                                                            handleDivisionToggle(option.value, Boolean(checked));
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

                        {forAllFaculties && (
                            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md border border-blue-200">
                                ℹ️ عند اختيار &quot;الكل&quot;، سيظهر هذا الكورس لجميع الطلاب بغض النظر عن كلياتهم ونوعها.
                            </div>
                        )}

                        <div className="flex items-center gap-x-2">
                            <Button
                                disabled={isLoading || (!forAllFaculties && (selectedGrades.length === 0 || selectedDivisions.length === 0))}
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
