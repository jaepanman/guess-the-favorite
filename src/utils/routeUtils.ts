export type RouteMode = 'teacher' | 'student';

export function getRouteMode(): RouteMode {
  if (typeof window === 'undefined') return 'student';

  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();

  // If URL explicitly targets teacher / host
  if (
    hash.includes('teacher') ||
    hash.includes('host') ||
    hash.includes('admin') ||
    hash.includes('setup') ||
    search.includes('role=teacher') ||
    search.includes('role=host')
  ) {
    return 'teacher';
  }

  // Default to student-only screen
  return 'student';
}

export function getStudentUrl(): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}#/student`;
}

export function getTeacherUrl(): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}#/teacher`;
}
