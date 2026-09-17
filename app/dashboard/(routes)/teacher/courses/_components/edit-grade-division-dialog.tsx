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
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { GraduationCap } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
    COURSE_GRADE_ALL,
    cohortOptions,
    collegeOptions,
    collegeTypeOptions,
    getCourseFaculties,
} from "@/lib/academic";

const formSchema = z.object({
    forAllFaculties: z.boolean(),
    grades: z.array(z.string()),
    divisions: z.array(z.string()),
    cohorts: z.array(z.string()),
});

interface EditGradeDivisionDialogProps {
    course: Course & { grades?: string[]; divisions?: string[]; cohorts?: string[] };
}

const getInitialValues = (course: EditGradeDivisionDialogProps["course"]) => {
    const { isAll, faculties } = getCourseFaculties(course);
    const divisions = course.divisions && course.divisions.length > 0
        ? course.divisions
        : (course as { division?: string }).division
            ? [(course as { division?: string }).division as string]
            : [];

    return {
        forAllFaculties: isAll,
        grades: faculties,
        divisions,
        cohorts: course.cohorts || [],
    };
};

export const EditGradeDivisionDialog = ({ course }: EditGradeDivisionDialogProps) => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: getInitialValues(course),
    });

    useEffect(() => {
        if (open) {
            form.reset(getInitialValues(course));
        }
    }, [open, course, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setIsLoading(true);

            const updateData = values.forAllFaculties
                ? {
                    grade: COURSE_GRADE_ALL,
                    grades: [],
                    divisions: [],
                    cohorts: values.cohorts,
                }
                : {
                    grade: values.grades[0] ?? null,
                    grades: values.grades,
                    divisions: values.divisions,
                    cohorts: values.cohorts,
                };

            const response = await axios.patch(`/api/courses/${course.id}`, updateData);

            if (response.status === 200) {
                toast.success("تم تحديث الكلية والفرقة ونوعها");
                setOpen(false);
                router.refresh();
            }
        } catch (error: any) {
            let errorMessage = "حدث خطأ ما";

            if (error?.response?.data) {
                if (typeof error.response.data === "string") {
                    errorMessage = error.response.data;
                } else if (error.response.data.error) {
                    errorMessage = error.response.data.error;
                }
            } else if (error?.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedGrades = form.watch("grades") || [];
    const selectedDivisions = form.watch("divisions") || [];
    const selectedCohorts = form.watch("cohorts") || [];
    const forAllFaculties = form.watch("forAllFaculties");

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

    const handleCohortToggle = (cohortValue: string, checked: boolean) => {
        const current = form.getValues("cohorts") || [];
        form.setValue(
            "cohorts",
            checked ? [...current, cohortValue] : current.filter((value) => value !== cohortValue)
        );
    };

    const canSave = forAllFaculties
        ? selectedCohorts.length > 0
        : selectedGrades.length > 0 && selectedDivisions.length > 0 && selectedCohorts.length > 0;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="تعديل الكلية والفرقة ونوعها">
                    <GraduationCap className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] overflow-hidden sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>تعديل الكلية والفرقة ونوعها</DialogTitle>
                    <DialogDescription>
                        حدد كلية واحدة أو أكثر، والفرقة المستهدفة، أو اختر &quot;الكل&quot; لعرض الكورس لجميع الكليات.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="grades"
                            render={() => (
                                <FormItem>
                                    <FormLabel>الكلية (يمكن اختيار أكثر من كلية)</FormLabel>
                                    <div className="max-h-56 overflow-y-auto overscroll-contain rounded-md border p-3 space-y-2 touch-pan-y">
                                        <div className="flex items-center space-x-2 space-x-reverse">
                                            <Checkbox
                                                id="dialog-faculty-all"
                                                checked={forAllFaculties}
                                                onCheckedChange={(checked) => {
                                                    form.setValue("forAllFaculties", Boolean(checked));
                                                    form.setValue("grades", []);
                                                    form.setValue("divisions", []);
                                                }}
                                                disabled={isLoading}
                                            />
                                            <Label htmlFor="dialog-faculty-all" className="text-sm font-normal cursor-pointer">
                                                الكل (جميع الكليات)
                                            </Label>
                                        </div>
                                        {collegeOptions.map((option) => (
                                            <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                                                <Checkbox
                                                    id={`dialog-faculty-${option.value}`}
                                                    checked={selectedGrades.includes(option.value)}
                                                    onCheckedChange={(checked) => {
                                                        handleFacultyToggle(option.value, Boolean(checked));
                                                    }}
                                                    disabled={isLoading || forAllFaculties}
                                                />
                                                <Label
                                                    htmlFor={`dialog-faculty-${option.value}`}
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
                                                        id={`dialog-division-${option.value}`}
                                                        checked={selectedDivisions.includes(option.value)}
                                                        onCheckedChange={(checked) => {
                                                            handleDivisionToggle(option.value, Boolean(checked));
                                                        }}
                                                        disabled={isLoading}
                                                    />
                                                    <Label
                                                        htmlFor={`dialog-division-${option.value}`}
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

                        <FormField
                            control={form.control}
                            name="cohorts"
                            render={() => (
                                <FormItem>
                                    <FormLabel>الفرقة (يمكن اختيار أكثر من فرقة)</FormLabel>
                                    <div className="max-h-56 overflow-y-auto overscroll-contain rounded-md border p-3 space-y-2 touch-pan-y">
                                        {cohortOptions.map((option) => (
                                            <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                                                <Checkbox
                                                    id={`dialog-cohort-${option.value}`}
                                                    checked={selectedCohorts.includes(option.value)}
                                                    onCheckedChange={(checked) => {
                                                        handleCohortToggle(option.value, Boolean(checked));
                                                    }}
                                                    disabled={isLoading}
                                                />
                                                <Label
                                                    htmlFor={`dialog-cohort-${option.value}`}
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

                        {forAllFaculties && (
                            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md border border-blue-200">
                                ℹ️ عند اختيار &quot;الكل&quot;، سيظهر هذا الكورس لجميع الطلاب بغض النظر عن كلياتهم ونوعها، حسب الفرق المحددة.
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isLoading}
                            >
                                إلغاء
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || !canSave}
                            >
                                حفظ
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
