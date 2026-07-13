export type Student = {
  readonly id: string;
  readonly name: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly idNumber: number | null;
  readonly levelId: string | null;
  readonly levelName: string | null;
  readonly parentId: string | null;
  readonly parentName: string | null;
  readonly parentEmail: string | null;
};

export type StudentCourse = {
  readonly courseId: string;
  readonly courseTitle: string;
  readonly semesterId: string;
  readonly semesterStart: string;
  readonly semesterEnd: string;
};

export type StudentWithCourses = Student & {
  readonly enrolledCourses: readonly StudentCourse[];
};
