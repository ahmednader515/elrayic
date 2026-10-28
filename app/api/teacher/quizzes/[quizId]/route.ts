import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { parseQuizOptions, stringifyQuizOptions } from "@/lib/utils";

const isStaff = (role?: string | null) => role === "ADMIN" || role === "TEACHER";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ quizId: string }> }
) {
    try {
        const { userId, user } = await auth();
        const resolvedParams = await params;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!isStaff(user?.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const quiz = await db.quiz.findUnique({
            where: { id: resolvedParams.quizId },
            include: {
                courses: { select: { id: true, title: true } },
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                questions: {
                    select: {
                        id: true,
                        text: true,
                        type: true,
                        options: true,
                        correctAnswer: true,
                        points: true,
                        imageUrl: true,
                        position: true
                    },
                    orderBy: {
                        position: 'asc'
                    }
                }
            }
        });

        if (!quiz) {
            return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
        }

        const quizWithParsedOptions = {
            ...quiz,
            questions: quiz.questions.map(question => {
                try {
                    return {
                        ...question,
                        options: parseQuizOptions(question.options)
                    };
                } catch (parseError) {
                    console.log("[TEACHER_QUIZ_GET] Error parsing options for question:", question.id, parseError);
                    return {
                        ...question,
                        options: question.options ? JSON.parse(question.options) : null
                    };
                }
            })
        };

        return NextResponse.json(quizWithParsedOptions);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ quizId: string }> }
) {
    try {
        const { userId, user } = await auth();
        const resolvedParams = await params;
        const { title, description, questions, position, timer, courseId, courseIds: requestedCourseIds, isFree, maxAttempts } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!isStaff(user?.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const currentQuiz = await db.quiz.findUnique({
            where: { id: resolvedParams.quizId },
            select: { courseId: true, position: true, courses: { select: { id: true } } }
        });

        if (!currentQuiz) {
            return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
        }

        // Use the courseId from request if provided, otherwise use current quiz's courseId
        const courseIds = requestedCourseIds ?? (courseId ? [courseId] : [currentQuiz.courseId, ...currentQuiz.courses.map(course => course.id)]);
        if (!Array.isArray(courseIds) || !courseIds.length || courseIds.some(id => typeof id !== "string" || !id.trim()) || (isFree !== undefined && typeof isFree !== "boolean")) {
            return NextResponse.json({ error: "Select at least one course and a valid free setting" }, { status: 400 });
        }
        const uniqueCourseIds = [...new Set<string>(courseIds)];
        if (await db.course.count({ where: { id: { in: uniqueCourseIds } } }) !== uniqueCourseIds.length) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }
        const targetCourseId = uniqueCourseIds[0];

        // Validate required fields
        if (!title || !title.trim()) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        // Handle position - use current position if not provided or invalid
        let quizPosition = position;
        if (!quizPosition || quizPosition <= 0) {
            quizPosition = currentQuiz.position;
        }

        // Validate questions
        if (!questions || questions.length === 0) {
            return NextResponse.json({ error: "At least one question is required" }, { status: 400 });
        }

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            
            if (!question.text || !question.text.trim()) {
                return NextResponse.json({ error: `Question ${i + 1}: Text is required` }, { status: 400 });
            }

            if (question.type === "MULTIPLE_CHOICE") {
                if (!question.options || question.options.length < 2) {
                    return NextResponse.json({ error: `Question ${i + 1}: At least 2 options are required` }, { status: 400 });
                }

                const validOptions = question.options.filter((option: string) => option && option.trim() !== "");
                if (validOptions.length < 2) {
                    return NextResponse.json({ error: `Question ${i + 1}: At least 2 valid options are required` }, { status: 400 });
                }

                // For multiple choice, correctAnswer should be an index
                if (typeof question.correctAnswer !== 'number' || question.correctAnswer < 0 || question.correctAnswer >= validOptions.length) {
                    return NextResponse.json({ error: `Question ${i + 1}: Valid correct answer index is required` }, { status: 400 });
                }
            } else if (question.type === "TRUE_FALSE") {
                if (!question.correctAnswer || (question.correctAnswer !== "true" && question.correctAnswer !== "false")) {
                    return NextResponse.json({ error: `Question ${i + 1}: Correct answer must be "true" or "false"` }, { status: 400 });
                }
            } else if (question.type === "SHORT_ANSWER") {
                if (!question.correctAnswer || !question.correctAnswer.toString().trim()) {
                    return NextResponse.json({ error: `Question ${i + 1}: Correct answer is required` }, { status: 400 });
                }
            }

            if (!question.points || question.points <= 0) {
                return NextResponse.json({ error: `Question ${i + 1}: Points must be greater than 0` }, { status: 400 });
            }
        }

        // Note: Position reordering is now handled by the separate reorder API
        // This API just updates the quiz with the provided position

        await db.$transaction(async tx => {
            const existingQuestions = await tx.question.findMany({
                where: { quizId: resolvedParams.quizId },
            });
            const existingIds = new Set(existingQuestions.map(question => question.id));
            const retainedIds = questions
                .filter((question: { id?: string }) => question.id && existingIds.has(question.id))
                .map((question: { id: string }) => question.id);

            await tx.quiz.update({
                where: { id: resolvedParams.quizId },
                data: {
                    title,
                    description,
                    courseId: targetCourseId,
                    isFree,
                    courses: { set: uniqueCourseIds.map(id => ({ id })) },
                    position: Number(quizPosition),
                    timer: timer || null,
                    maxAttempts: maxAttempts && maxAttempts > 0 ? Number(maxAttempts) : 1,
                },
            });

            // Preserve existing question IDs so course/access edits retain submitted answers.
            await tx.question.deleteMany({
                where: { quizId: resolvedParams.quizId, id: { notIn: retainedIds } },
            });
            for (const [index, question] of questions.entries()) {
                const validOptions = question.type === "MULTIPLE_CHOICE"
                    ? question.options.filter((option: string) => option && option.trim() !== "")
                    : [];
                const data = {
                    text: question.text,
                    type: question.type,
                    options: question.type === "MULTIPLE_CHOICE" ? stringifyQuizOptions(question.options) : null,
                    correctAnswer: question.type === "MULTIPLE_CHOICE" ? validOptions[question.correctAnswer] : question.correctAnswer,
                    points: question.points,
                    imageUrl: question.imageUrl || null,
                    position: index + 1,
                };
                if (question.id && existingIds.has(question.id)) {
                    const existing = existingQuestions.find(existing => existing.id === question.id);
                    const changed = Object.entries(data).some(([key, value]) => existing?.[key as keyof typeof existing] !== value);
                    if (changed) await tx.question.update({ where: { id: question.id }, data });
                } else {
                    await tx.question.create({ data: { ...data, quizId: resolvedParams.quizId } });
                }
            }
        }, { timeout: 30000 });

        // Fetch the updated quiz with questions
        const quizWithQuestions = await db.quiz.findUnique({
            where: { id: resolvedParams.quizId },
            include: {
                courses: { select: { id: true, title: true } },
                course: {
                    select: {
                        title: true
                    }
                },
                questions: {
                    orderBy: {
                        position: 'asc'
                    }
                }
            }
        });

        if (!quizWithQuestions) {
            return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 });
        }

        // Parse options for the response
        const quizWithParsedOptions = {
            ...quizWithQuestions,
            questions: quizWithQuestions.questions.map(question => ({
                ...question,
                options: parseQuizOptions(question.options)
            }))
        };

        return NextResponse.json(quizWithParsedOptions);
    } catch (error) {
        console.log("[QUIZ_PATCH]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
} 