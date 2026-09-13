-- AlterTable
ALTER TABLE "Course" ADD COLUMN "grades" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill existing single-faculty courses
UPDATE "Course"
SET "grades" = ARRAY["grade"]
WHERE "grade" IS NOT NULL AND "grade" <> 'الكل';
