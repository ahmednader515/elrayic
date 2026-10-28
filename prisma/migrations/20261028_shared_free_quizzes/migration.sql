ALTER TABLE "Quiz" ADD COLUMN "isFree" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "_SharedQuizCourses" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_SharedQuizCourses_AB_pkey" PRIMARY KEY ("A", "B")
);
CREATE INDEX "_SharedQuizCourses_B_index" ON "_SharedQuizCourses"("B");
ALTER TABLE "_SharedQuizCourses" ADD CONSTRAINT "_SharedQuizCourses_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_SharedQuizCourses" ADD CONSTRAINT "_SharedQuizCourses_B_fkey" FOREIGN KEY ("B") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
INSERT INTO "_SharedQuizCourses" ("A", "B") SELECT "courseId", "id" FROM "Quiz";
