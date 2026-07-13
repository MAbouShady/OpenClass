export type Level = {
  readonly id: string;
  readonly name: string;
  readonly order: number;
  readonly description: string | null;
  readonly parentLevelId: string | null;
  readonly teacherId: string | null;
};
