export const ROLES = ["ADMIN", "TEACHER", "STUDENT", "PARENT", "SECRETARY"] as const;

export type Role = (typeof ROLES)[number];
