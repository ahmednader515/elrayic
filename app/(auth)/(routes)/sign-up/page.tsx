"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import { Check, X, Eye, EyeOff, ChevronLeft } from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SITE_NAME, SITE_SLOGAN } from "@/lib/site";
import {
  ABROAD_LOCATION,
  cohortOptions,
  collegeOptions,
  collegeTypeOptions,
  governorateOptions,
  studyLocationOptions,
} from "@/lib/academic";

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    parentPhoneNumber: "",
    grade: "",
    division: "",
    cohort: "",
    studyType: "",
    governorate: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "grade") {
      setFormData((prev) => ({
        ...prev,
        grade: value,
        division: "",
      }));
      return;
    }

    if (name === "studyType") {
      setFormData((prev) => ({
        ...prev,
        studyType: value,
        governorate: value === ABROAD_LOCATION ? ABROAD_LOCATION : "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePasswords = () => {
    return {
      match: formData.password === formData.confirmPassword,
      isValid: formData.password === formData.confirmPassword && formData.password.length > 0,
    };
  };

  const passwordChecks = validatePasswords();
  const isStudyingInEgypt = formData.studyType === "داخل مصر";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!passwordChecks.isValid) {
      toast.error("كلمات المرور غير متطابقة");
      setIsLoading(false);
      return;
    }

    if (!formData.grade || !formData.division || !formData.cohort || !formData.studyType) {
      toast.error("برجاء استكمال بيانات التسجيل");
      setIsLoading(false);
      return;
    }

    if (isStudyingInEgypt && !formData.governorate) {
      toast.error("برجاء اختيار المحافظة");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/auth/register", {
        ...formData,
        governorate: formData.studyType === ABROAD_LOCATION ? ABROAD_LOCATION : formData.governorate,
      });

      if (response.data.success) {
        toast.success("تم إنشاء الحساب بنجاح");
        router.push("/sign-in");
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 400) {
        const errorMessage = axiosError.response.data as string;
        if (errorMessage.includes("Phone number already exists")) {
          toast.error("رقم الهاتف مسجل مسبقاً");
        } else if (errorMessage.includes("Passwords do not match")) {
          toast.error("كلمات المرور غير متطابقة");
        } else {
          toast.error("حدث خطأ أثناء إنشاء الحساب");
        }
      } else {
        toast.error("حدث خطأ أثناء إنشاء الحساب");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="flex min-h-screen bg-background overflow-y-auto">
      <div className="absolute top-4 left-4 z-10">
        <Button variant="ghost" size="lg" asChild>
          <Link href="/">
            <ChevronLeft className="h-10 w-10" />
          </Link>
        </Button>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#0083d3]/10 to-[#0083d3]/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0083d3]/5"></div>
        <div className="relative z-10 flex items-center justify-center w-full">
          <div className="text-center space-y-6 p-8">
            <div className="relative w-64 h-64 mx-auto">
              <Image
                src="/logo.png"
                alt={SITE_NAME}
                fill
                className="object-cover rounded-full border-4 border-[#0083d3]/20 shadow-2xl"
                unoptimized
              />
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-[#0083d3]">
                مرحباً بك في {SITE_NAME}
              </h3>
              <p className="text-lg text-muted-foreground max-w-md">
                {SITE_SLOGAN} — كورسات للكليات الطبية في مصر والخارج
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Left Side - Form */}
      <div className="flex-1 flex items-start justify-center p-8">
        <div className="w-full max-w-md space-y-6 py-8 mt-8">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tight mt-8">
              إنشاء حساب جديد
            </h2>
            <p className="text-sm text-muted-foreground">
              أدخل بياناتك لإنشاء حساب جديد
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                disabled={isLoading}
                className="h-10"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="مثال: أحمد محمد علي حسن"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">رقم الهاتف (مدعوم WhatsApp)</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                required
                disabled={isLoading}
                className="h-10"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+20XXXXXXXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentPhoneNumber">رقم هاتف ولي الأمر</Label>
              <Input
                id="parentPhoneNumber"
                name="parentPhoneNumber"
                type="tel"
                autoComplete="tel"
                disabled={isLoading}
                className="h-10"
                value={formData.parentPhoneNumber}
                onChange={handleInputChange}
                placeholder="+20XXXXXXXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">الكلية</Label>
              <Select
                value={formData.grade}
                onValueChange={(value) => handleSelectChange("grade", value)}
                disabled={isLoading}
              >
                <SelectTrigger className="h-10">
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

            {formData.grade && (
              <div className="space-y-2">
                <Label htmlFor="division">نوع الكلية</Label>
                <Select
                  value={formData.division}
                  onValueChange={(value) => handleSelectChange("division", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-10">
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

            <div className="space-y-2">
              <Label htmlFor="cohort">الفرقة</Label>
              <Select
                value={formData.cohort}
                onValueChange={(value) => handleSelectChange("cohort", value)}
                disabled={isLoading}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="اختر الفرقة" />
                </SelectTrigger>
                <SelectContent className="max-h-[240px] overflow-y-auto">
                  {cohortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studyType">مكان الدراسة</Label>
              <Select
                value={formData.studyType}
                onValueChange={(value) => handleSelectChange("studyType", value)}
                disabled={isLoading}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="اختر مكان الدراسة" />
                </SelectTrigger>
                <SelectContent>
                  {studyLocationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isStudyingInEgypt && (
              <div className="space-y-2">
                <Label htmlFor="governorate">المحافظة</Label>
                <Select
                  value={formData.governorate}
                  onValueChange={(value) => handleSelectChange("governorate", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="اختر المحافظة" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {governorateOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  className="h-10"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  className="h-10"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {passwordChecks.match ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-muted-foreground">كلمات المرور متطابقة</span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-[#0083d3] hover:bg-[#0083d3]/90 text-white"
              disabled={isLoading || !passwordChecks.isValid}
            >
              {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
            </Button>
          </form>
          <div className="text-center text-sm">
            <span className="text-muted-foreground">لديك حساب بالفعل؟ </span>
            <Link
              href="/sign-in"
              className="text-primary hover:underline transition-colors"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
      </div>
  );
}
