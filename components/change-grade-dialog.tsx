"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";
import { collegeOptions, collegeTypeOptions } from "@/lib/academic";

interface ChangeGradeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ChangeGradeDialog = ({ open, onOpenChange }: ChangeGradeDialogProps) => {
    const { update } = useSession();
    const [grade, setGrade] = useState("");
    const [division, setDivision] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);

    useEffect(() => {
        if (open) {
            loadUserProfile();
        }
    }, [open]);

    const loadUserProfile = async () => {
        setIsLoadingProfile(true);
        try {
            const response = await axios.get("/api/user/profile");
            if (response.data) {
                setGrade(response.data.grade || "");
                setDivision(response.data.division || "");
            }
        } catch (error) {
            console.error("Error loading user profile:", error);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const handleGradeChange = (value: string) => {
        setGrade(value);
        setDivision("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!grade) {
            toast.error("الرجاء اختيار الكلية");
            return;
        }

        if (!division) {
            toast.error("الرجاء اختيار نوع الكلية");
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.patch("/api/user/profile", {
                grade,
                division: division || null
            });

            if (response.status === 200) {
                toast.success("تم تحديث بيانات الكلية بنجاح");
                await update();
                onOpenChange(false);
                window.location.reload();
            }
        } catch (error: any) {
            console.error("Error updating profile:", error);
            const errorMessage = error?.response?.data?.error || "حدث خطأ أثناء تحديث بيانات الكلية";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>تغيير الكلية</DialogTitle>
                    <DialogDescription>
                        اختر الكلية ونوعها
                    </DialogDescription>
                </DialogHeader>
                {isLoadingProfile ? (
                    <div className="py-4 text-center">جاري التحميل...</div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="grade">الكلية *</Label>
                            <Select value={grade} onValueChange={handleGradeChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الكلية" />
                                </SelectTrigger>
                                <SelectContent>
                                    {collegeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {grade && (
                            <div className="space-y-2">
                                <Label htmlFor="division">نوع الكلية *</Label>
                                <Select value={division} onValueChange={setDivision}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر نوع الكلية" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {collegeTypeOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "جاري الحفظ..." : "حفظ"}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};
