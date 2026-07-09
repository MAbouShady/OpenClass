export const ROLES = ["ADMIN", "TEACHER", "STUDENT", "PARENT"] as const;

export type Role = (typeof ROLES)[number];
