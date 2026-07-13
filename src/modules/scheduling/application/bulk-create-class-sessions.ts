import type { ClassSessionRepository } from "@/modules/scheduling/domain/class-session-repository";
import type { ClassSession } from "@/modules/scheduling/domain/class-session";

export type BulkScheduleEntry = {
  readonly dayOfWeek: number; // 0=Sun … 6=Sat
  readonly startHHMM: string; // "HH:MM"
  readonly endHHMM: string;
};

export type BulkCreateClassSessionsInput = {
  readonly courseId: string;
  readonly semesterId: string;
  readonly fromDate: Date;
  readonly toDate: Date;
  readonly schedule: readonly BulkScheduleEntry[];
};

const MAX_SESSIONS = 500;

function parseHHMM(hhmm: string): [number, number] {
  const parts = hhmm.split(":");
  return [parseInt(parts[0] ?? "0", 10), parseInt(parts[1] ?? "0", 10)];
}

function buildSession(
  base: Date,
  startHHMM: string,
  endHHMM: string,
): { startTime: Date; endTime: Date } {
  const [sh, sm] = parseHHMM(startHHMM);
  const [eh, em] = parseHHMM(endHHMM);

  const startTime = new Date(base);
  startTime.setHours(sh, sm, 0, 0);

  const endTime = new Date(base);
  endTime.setHours(eh, em, 0, 0);

  if (endTime <= startTime) {
    endTime.setDate(endTime.getDate() + 1);
  }

  return { startTime, endTime };
}

export async function bulkCreateClassSessions(
  deps: { readonly classSessionRepository: ClassSessionRepository },
  input: BulkCreateClassSessionsInput,
): Promise<{ created: number; skippedDuplicate: number; skippedCap: number }> {
  const byDay = new Map(input.schedule.map((s) => [s.dayOfWeek, s]));

  // Fetch existing sessions once to build dedup set
  const existing = await deps.classSessionRepository.findByCourse(input.courseId);
  const existingTimes = new Set(existing.map((s) => s.startTime.getTime()));

  const toCreate: Array<{ courseId: string; semesterId: string; startTime: Date; endTime: Date }> =
    [];
  let skippedDuplicate = 0;

  const cur = new Date(input.fromDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(input.toDate);
  end.setHours(23, 59, 59, 999);

  while (cur <= end && toCreate.length < MAX_SESSIONS) {
    const entry = byDay.get(cur.getDay());
    if (entry) {
      const { startTime, endTime } = buildSession(cur, entry.startHHMM, entry.endHHMM);
      if (endTime > startTime) {
        if (existingTimes.has(startTime.getTime())) {
          skippedDuplicate++;
        } else {
          toCreate.push({
            courseId: input.courseId,
            semesterId: input.semesterId,
            startTime,
            endTime,
          });
          existingTimes.add(startTime.getTime()); // prevent self-dups in one bulk run
        }
      }
    }
    cur.setDate(cur.getDate() + 1);
  }

  // Count days skipped due to cap
  let skippedCap = 0;
  while (cur <= end) {
    if (byDay.has(cur.getDay())) skippedCap++;
    cur.setDate(cur.getDate() + 1);
  }

  await Promise.all(toCreate.map((s) => deps.classSessionRepository.create(s)));

  return { created: toCreate.length, skippedDuplicate, skippedCap };
}
