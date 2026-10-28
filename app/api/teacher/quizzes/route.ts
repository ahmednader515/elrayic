import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { parseQuizOptions, stringifyQuizOptions } from "@/lib/utils";

const isStaff = (role?: string | null) => role === "ADMIN" || role === "TEACHER";

export async function GET(req: Request) {
    try {
        const { userId, user } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!isStaff(user?.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const quizzes = await db.quiz.findMany({
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
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        // Parse options for multiple choice questions
        const quizzesWithParsedOptions = quizzes.map(quiz => ({
            ...quiz,
            questions: quiz.questions.map(question => ({
                ...question,
                options: parseQuizOptions(question.options)
            }))
        }));

        return NextResponse.json(quizzesWithParsedOptions);
    } catch (error) {
        console.log("[TEACHER_QUIZZES_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { userId, user } = await auth();
        const { title, description, courseId: legacyCourseId, courseIds: requestedCourseIds, isFree = false, questions, position, timer, maxAttempts } = await req.json();

        console.log("Received position:", position, "Type:", typeof position);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Validate required fields
        if (!title || !title.trim()) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        if (!isStaff(user?.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const courseIds = requestedCourseIds ?? (legacyCourseId ? [legacyCourseId] : []);
        if (!Array.isArray(courseIds) || !courseIds.length || courseIds.some(id => typeof id !== "string" || !id.trim()) || typeof isFree !== "boolean") {
            return NextResponse.json({ error: "Select at least one course and a valid free setting" }, { status: 400 });
        }
        const uniqueCourseIds = [...new Set<string>(courseIds)];
        const courseId = uniqueCourseIds[0];
        if (await db.course.count({ where: { id: { in: uniqueCourseIds } } }) !== uniqueCourseIds.length) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // Get the next position if not provided
        let quizPosition = position;
        console.log("Initial quizPosition:", quizPosition);
        if (!quizPosition || quizPosition <= 0) {
            const lastQuiz = await db.quiz.findFirst({
                where: {
                    courseId: courseId
                },
                orderBy: {
                    position: 'desc'
                }
            });
            quizPosition = lastQuiz ? lastQuiz.position + 1 : 1;
            console.log("Calculated quizPosition:", quizPosition, "Last quiz position:", lastQuiz?.position);
        }
        console.log("Final quizPosition:", quizPosition);

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

        // Create the quiz
        const finalMaxAttempts = maxAttempts && maxAttempts > 0 ? Number(maxAttempts) : 1;
        console.log("Creating quiz with position:", quizPosition);
        console.log("Quiz data object:", {
            title,
            description,
            position: quizPosition,
            courseId,
            timer: timer || null,
            maxAttempts: finalMaxAttempts
        });
        
        const quizData = {
            title,
            description,
            position: Number(quizPosition), // Explicitly cast to number
            courseId,
            isFree,
            courses: { connect: uniqueCourseIds.map(id => ({ id })) },
            isPublished: true,
            timer: timer || null, // Timer in minutes, null means no time limit
            maxAttempts: finalMaxAttempts, // Use provided maxAttempts or default to 1
            questions: {
                create: questions.map((question: any, index: number) => {
                    let correctAnswerValue = question.correctAnswer;
                    
                    // For multiple choice questions, convert index to actual option value
                    if (question.type === "MULTIPLE_CHOICE") {
                        const validOptions = question.options.filter((option: string) => option && option.trim() !== "");
                        correctAnswerValue = validOptions[question.correctAnswer];
                    }
                    
                    return {
                        text: question.text,
                        type: question.type,
                        options: question.type === "MULTIPLE_CHOICE" ? stringifyQuizOptions(question.options) : null,
                        correctAnswer: correctAnswerValue,
                        points: question.points,
                        imageUrl: question.imageUrl || null,
                        position: index + 1
                    };
                })
            }
        };

        console.log("Final quiz data:", JSON.stringify(quizData, null, 2));
        
        const quiz = await db.quiz.create({ data: quizData });

        // Fetch the quiz with questions
        const quizWithQuestions = await db.quiz.findUnique({
            where: { id: quiz.id },
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
            return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
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
        console.log("[TEACHER_QUIZZES_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
} 