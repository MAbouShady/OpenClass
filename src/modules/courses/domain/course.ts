import type { SessionType } from "@/modules/courses/domain/session-type";

export type Course = {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly sessionType: SessionType;
  readonly levelId: string;
  readonly teacherId: string;
};
