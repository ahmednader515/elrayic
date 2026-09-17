import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  COURSE_GRADE_ALL,
  hasStudentTargetingProfile,
  studentCourseVisibilityWhere,
} from "@/lib/academic";

export async function GET() {
  try {
    // Try to get user for filtering
    let userId = null;
    let student = null;
    
    try {
      const authResult = await auth();
      userId = authResult.userId;
      
      if (userId) {
        student = await db.user.findUnique({
          where: { id: userId },
          select: { grade: true, division: true, cohort: true, role: true }
        });
      }
    } catch (error) {
      // User not authenticated, continue without filtering
    }

    const whereClause: any = {
      isPublished: true,
      showOnHomepage: true,
    };

    if (student?.role === "USER") {
      if (hasStudentTargetingProfile(student)) {
        whereClause.AND = [
          { isPublished: true },
          { showOnHomepage: true },
          studentCourseVisibilityWhere({
            grade: student.grade!,
            division: student.division!,
            cohort: student.cohort!,
          }),
        ];
        delete whereClause.isPublished;
        delete whereClause.showOnHomepage;
      } else if (student.grade && student.division) {
        whereClause.grade = COURSE_GRADE_ALL;
      } else {
        whereClause.id = { in: [] };
      }
    }

    // Use select instead of include to only fetch needed fields
    // Use _count instead of including purchases to reduce database operations
    const courses = await db.course.findMany({
      where: whereClause,
      select: {
        id: true,
        userId: true,
        title: true,
        description: true,
        imageUrl: true,
        price: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        chapters: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          },
        },
        quizzes: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            purchases: {
              where: {
                status: "ACTIVE",
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Return courses with default progress of 0 for public view
    const coursesWithDefaultProgress = courses.map((course: typeof courses[0]) => ({
      id: course.id,
      userId: course.userId,
      title: course.title,
      description: course.description,
      imageUrl: course.imageUrl,
      price: course.price,
      isPublished: course.isPublished,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      chapters: course.chapters,
      quizzes: course.quizzes,
      progress: 0,
      enrollmentCount: course._count.purchases,
    }));

    return NextResponse.json(coursesWithDefaultProgress);
  } catch (error) {
    console.log("[COURSES_PUBLIC]", error);
    
    // If the table doesn't exist or there's a database connection issue,
    // return an empty array instead of an error
    if (error instanceof Error && (
      error.message.includes("does not exist") || 
      error.message.includes("P2021") ||
      error.message.includes("table")
    )) {
      return NextResponse.json([]);
    }
    
    return new NextResponse("Internal Error", { status: 500 });
  }
} 