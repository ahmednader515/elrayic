/** Stable display count shared by course cards; independent of real enrollments. */
export function getCourseDisplayEnrollmentCount(courseId: string): number {
  let hash = 2166136261;
  for (let index = 0; index < courseId.length; index++) {
    hash = Math.imul(hash ^ courseId.charCodeAt(index), 16777619);
  }
  return 500 + ((hash >>> 0) % 501);
}
