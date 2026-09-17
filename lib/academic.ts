export const COLLEGES = [
  "كلية الطب البشري",
  "كلية طب الأسنان",
  "كلية العلاج الطبيعي",
  "كلية الصيدلة",
  "كلية الطب البيطري",
  "كلية التمريض",
  "كلية العلوم الصحية",
  "معهد فني صحي",
  "معهد فني تمريض",
] as const;

export const COURSE_GRADE_ALL = "الكل";

export const COLLEGE_TYPES = ["حكومية", "أهلية", "خاصة"] as const;

export const STUDY_LOCATIONS = ["داخل مصر", "خارج مصر"] as const;

export const ABROAD_LOCATION = "خارج مصر";

export const COHORTS = [
  "الأولى",
  "الثانية",
  "الثالثة",
  "الرابعة",
  "الخامسة",
  "السادسة",
  "السابعة",
] as const;

export const GOVERNORATES = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "الدقهلية",
  "الشرقية",
  "المنوفية",
  "القليوبية",
  "البحيرة",
  "الغربية",
  "بورسعيد",
  "دمياط",
  "الإسماعيلية",
  "السويس",
  "كفر الشيخ",
  "الفيوم",
  "بني سويف",
  "المنيا",
  "أسيوط",
  "سوهاج",
  "قنا",
  "أسوان",
  "الأقصر",
  "البحر الأحمر",
  "الوادي الجديد",
  "مطروح",
  "شمال سيناء",
  "جنوب سيناء",
] as const;

export const collegeOptions = COLLEGES.map((value) => ({ value, label: value }));
export const collegeTypeOptions = COLLEGE_TYPES.map((value) => ({ value, label: value }));
export const studyLocationOptions = STUDY_LOCATIONS.map((value) => ({
  value,
  label: value,
}));
export const governorateOptions = GOVERNORATES.map((value) => ({ value, label: value }));
export const cohortOptions = COHORTS.map((value) => ({ value, label: value }));

export function getCollegeTypeOptions(college?: string | null | string[]) {
  if (Array.isArray(college)) {
    return college.length > 0 ? collegeTypeOptions : [];
  }

  if (!college || college === COURSE_GRADE_ALL) {
    return [];
  }

  return collegeTypeOptions;
}

export function getCourseFaculties(course: {
  grade?: string | null;
  grades?: string[] | null;
}) {
  if (course.grade === COURSE_GRADE_ALL) {
    return { isAll: true, faculties: [] as string[] };
  }

  const faculties =
    course.grades && course.grades.length > 0
      ? course.grades
      : course.grade
        ? [course.grade]
        : [];

  return { isAll: false, faculties };
}

export function studentCourseVisibilityWhere(student: {
  grade: string;
  division: string;
  cohort: string;
}) {
  return {
    OR: [
      // الكل: ignore faculty / نوع الكلية — only فرقة must match
      {
        AND: [
          { grade: COURSE_GRADE_ALL },
          { cohorts: { has: student.cohort } },
        ],
      },
      // Specific faculties: الكلية + نوع الكلية + فرقة
      {
        AND: [
          {
            OR: [
              { grades: { has: student.grade } },
              { grade: student.grade },
            ],
          },
          { divisions: { has: student.division } },
          { cohorts: { has: student.cohort } },
        ],
      },
    ],
  };
}

/** True when a student profile has the fields needed for course targeting. */
export function hasStudentTargetingProfile(student: {
  grade?: string | null;
  division?: string | null;
  cohort?: string | null;
  role?: string | null;
}) {
  return (
    student.role === "USER" &&
    !!student.grade &&
    !!student.division &&
    !!student.cohort
  );
}

export function isValidCollege(value: string) {
  return (COLLEGES as readonly string[]).includes(value);
}

export function isValidCollegeType(value: string) {
  return (COLLEGE_TYPES as readonly string[]).includes(value);
}

export function isValidStudyLocation(value: string) {
  return (STUDY_LOCATIONS as readonly string[]).includes(value);
}

export function isValidGovernorate(value: string) {
  return value === ABROAD_LOCATION || (GOVERNORATES as readonly string[]).includes(value);
}

export function isValidCohort(value: string) {
  return (COHORTS as readonly string[]).includes(value);
}
