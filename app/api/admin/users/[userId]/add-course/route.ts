import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Context = { params: Promise<{ userId: string }> };

async function updateCourses(req: NextRequest, context: Context, remove: boolean) {
  try {
    const session = await auth();
    if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { userId } = await context.params;
    const body = await req.json();
    const ids = body.courseIds ?? (body.courseId ? [body.courseId] : []);
    if (!Array.isArray(ids) || !ids.length || ids.some((id: unknown) => typeof id !== "string" || !id.trim())) {
      return NextResponse.json({ error: "Select at least one course" }, { status: 400 });
    }
    const courseIds = [...new Set<string>(ids)];
    const student = await db.user.findUnique({ where: { id: userId, role: "USER" }, select: { id: true } });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    if (remove) {
      await db.purchase.deleteMany({ where: { userId, courseId: { in: courseIds } } });
    } else {
      const count = await db.course.count({ where: { id: { in: courseIds }, isPublished: true } });
      if (count !== courseIds.length) return NextResponse.json({ error: "Course not found or not published" }, { status: 404 });
      await db.$transaction(courseIds.map((courseId) => db.purchase.upsert({
        where: { userId_courseId: { userId, courseId } },
        create: { userId, courseId, status: "ACTIVE" },
        update: { status: "ACTIVE" },
      })));
    }
    return NextResponse.json({ message: remove ? "Courses removed successfully" : "Courses added successfully" });
  } catch (error) {
    console.error("[STUDENT_COURSES]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export function POST(req: NextRequest, context: Context) { return updateCourses(req, context, false); }
export function DELETE(req: NextRequest, context: Context) { return updateCourses(req, context, true); }
