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

export function getCollegeTypeOptions(college?: string | null) {
  if (!college || college === COURSE_GRADE_ALL) {
    return [];
  }

  return collegeTypeOptions;
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
