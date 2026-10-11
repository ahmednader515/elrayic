import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { userId, user } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    if (user?.role !== "TEACHER" && user?.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }
    const { courseId } = await params;
    const course = await db.course.findUnique({ where: { id: courseId }, select: { id: true } });
    if (!course) return new NextResponse("Course not found", { status: 404 });
    const purchases = await db.purchase.findMany({
      where: { courseId, status: "ACTIVE", user: { role: "USER" } },
      select: { user: { select: { id: true, fullName: true, phoneNumber: true, grade: true, cohort: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ students: purchases.map(({ user }) => user) });
  } catch (error) {
    console.error("[COURSE_STUDENTS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
