import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import ExcelJS from "exceljs";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const ROLE_LABELS: Record<string, string> = {
  USER: "طالب",
  TEACHER: "معلم",
  ADMIN: "مشرف",
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const students = await db.user.findMany({
      where: { role: "USER" },
      select: {
        fullName: true,
        phoneNumber: true,
        parentPhoneNumber: true,
        grade: true,
        division: true,
        cohort: true,
        studyType: true,
        governorate: true,
        balance: true,
        createdAt: true,
        purchases: {
          where: { status: "ACTIVE" },
          select: {
            course: {
              select: { title: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "elrayic";
    const sheet = workbook.addWorksheet("الطلاب", {
      views: [{ rightToLeft: true }],
    });

    sheet.columns = [
      { header: "الاسم", key: "fullName", width: 28 },
      { header: "رقم الهاتف", key: "phoneNumber", width: 18 },
      { header: "رقم هاتف ولي الأمر", key: "parentPhoneNumber", width: 20 },
      { header: "الدور", key: "role", width: 12 },
      { header: "الكلية", key: "grade", width: 24 },
      { header: "نوع الكلية", key: "division", width: 14 },
      { header: "الفرقة", key: "cohort", width: 14 },
      { header: "مكان الدراسة", key: "studyType", width: 16 },
      { header: "المحافظة", key: "governorate", width: 16 },
      { header: "الرصيد", key: "balance", width: 12 },
      { header: "عدد الكورسات", key: "purchaseCount", width: 14 },
      { header: "الكورسات المشتراة", key: "courses", width: 48 },
      { header: "تاريخ التسجيل", key: "createdAt", width: 16 },
    ];

    sheet.getRow(1).font = { bold: true };

    for (const student of students) {
      const row = sheet.addRow({
        fullName: student.fullName,
        phoneNumber: student.phoneNumber,
        parentPhoneNumber: student.parentPhoneNumber || "",
        role: ROLE_LABELS.USER,
        grade: student.grade || "",
        division: student.division || "",
        cohort: student.cohort || "",
        studyType: student.studyType || "",
        governorate: student.governorate || "",
        balance: student.balance,
        purchaseCount: student.purchases.length,
        courses: student.purchases.map((purchase) => purchase.course.title).join(" | "),
        createdAt: student.createdAt.toLocaleDateString("en-GB"),
      });

      row.getCell("phoneNumber").numFmt = "@";
      row.getCell("parentPhoneNumber").numFmt = "@";
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="students.xlsx"',
      },
    });
  } catch (error) {
    console.error("[TEACHER_USERS_EXPORT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
