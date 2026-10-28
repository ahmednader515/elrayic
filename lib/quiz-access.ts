import { db } from "@/lib/db";

/** Keep legacy single-course quizzes readable alongside shared quizzes. */
export const quizInCourse = (courseId: string) => ({
    OR: [{ courseId }, { courses: { some: { id: courseId } } }],
});

/** A free quiz or free course needs no purchase; paid access must be ACTIVE. */
export async function canAccessQuiz(userId: string, courseId: string, quizId: string) {
    const course = await db.course.findUnique({
        where: { id: courseId, isPublished: true },
        select: { price: true, purchases: { where: { userId, status: "ACTIVE" }, select: { id: true } } },
    });
    if (!course) return false;
    const quiz = await db.quiz.findFirst({
        where: { id: quizId, isPublished: true, ...quizInCourse(courseId) },
        select: { isFree: true },
    });
    return !!quiz && (quiz.isFree || course.price === 0 || course.purchases.length > 0);
}
