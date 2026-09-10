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
import { COURSE_GRADE_ALL, collegeOptions, getCollegeTypeOptions } from "@/lib/academic";

const formSchema = z.object({
    grade: z.string().optional(),
    divisions: z.array(z.string()).optional(),
});

interface EditGradeDivisionDialogProps {
    course: Course & { divisions?: string[] };
}

const getDivisionOptions = (grade: string | null | undefined) => getCollegeTypeOptions(grade);

export const EditGradeDivisionDialog = ({ course }: EditGradeDivisionDialogProps) => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedGrade, setSelectedGrade] = useState<string | null>(course.grade || null);

    // Handle legacy division field (string) and new divisions field (array)
    const initialDivisions = course.divisions && course.divisions.length > 0 
        ? course.divisions 
        : (course as any).division 
            ? [(course as any).division]
            : [];

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            grade: course.grade || "",
            divisions: initialDivisions,
        },
    });

    // Reset divisions when grade changes
    const gradeValue = form.watch("grade");
    useEffect(() => {
        if (gradeValue !== selectedGrade) {
            setSelectedGrade(gradeValue || null);
            if (open && gradeValue !== COURSE_GRADE_ALL) {
                form.setValue("divisions", []);
            } else if (gradeValue === COURSE_GRADE_ALL) {
                form.setValue("divisions", []);
            }
        }
    }, [gradeValue, selectedGrade, form, open]);

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (open) {
            const divisions = course.divisions && course.divisions.length > 0 
                ? course.divisions 
                : (course as any).division 
                    ? [(course as any).division]
                    : [];
            
            form.reset({
                grade: course.grade || "",
                divisions: divisions,
            });
            setSelectedGrade(course.grade || null);
        }
    }, [open, course, form]);

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
            
            console.log("Submitting grade/division update:", updateData);
            
            const response = await axios.patch(`/api/courses/${course.id}`, updateData);
            
            if (response.status === 200) {
                toast.success("تم تحديث الكلية ونوعها");
                setOpen(false);
                router.refresh();
            }
        } catch (error: any) {
            console.error("Error updating course grade/division:", error);
            let errorMessage = "حدث خطأ ما";
            
            if (error?.response?.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.error) {
                    errorMessage = error.response.data.error;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="تعديل الكلية ونوعها">
                    <GraduationCap className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>تعديل الكلية ونوعها</DialogTitle>
                    <DialogDescription>
                        حدد الكلية ونوعها لهذا الكورس لعرضه للطلاب المناسبين. يمكنك اختيار "الكل" لعرض الكورس لجميع الكليات، أو اختيار أكثر من نوع.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                        {/* Show division checkboxes only if grade is selected and not "الكل" */}
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

                        {/* Show info message when "الكل" is selected */}
                        {selectedGrade === COURSE_GRADE_ALL && (
                            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md border border-blue-200">
                                ℹ️ عند اختيار "الكل"، سيظهر هذا الكورس لجميع الطلاب بغض النظر عن كلياتهم ونوعها.
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
                                disabled={isLoading || (selectedGrade && selectedGrade !== COURSE_GRADE_ALL && selectedDivisions.length === 0)}
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
