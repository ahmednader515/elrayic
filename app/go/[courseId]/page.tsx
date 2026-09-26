import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function CourseShortlinkPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/go/${courseId}`)}`);
  }

  const course = await db.course.findUnique({
    where: {
      id: courseId,
      isPublished: true,
    },
    include: {
      chapters: {
        where: { isPublished: true },
        orderBy: { position: "asc" },
        take: 1,
        select: { id: true },
      },
    },
  });

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-lg">هذا الكورس غير متاح حالياً</p>
      </div>
    );
  }

  await db.purchase.upsert({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
    create: {
      userId: session.user.id,
      courseId,
      status: "ACTIVE",
    },
    update: {
      status: "ACTIVE",
    },
  });

  const firstChapter = course.chapters[0];
  if (firstChapter) {
    redirect(`/courses/${courseId}/chapters/${firstChapter.id}`);
  }

  redirect(`/courses/${courseId}/preview`);
}
