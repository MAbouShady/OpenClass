export const SESSION_TYPES = ["ONLINE", "OFFLINE"] as const;

export type SessionType = (typeof SESSION_TYPES)[number];
