export type PortalStudent = {
  readonly id: string;
  readonly name: string;
  readonly code: number;
};

/**
 * Lookup port for the code-number portal. Students have no password and often
 * no account at all — their code number is the only identifier they carry.
 */
export interface StudentDirectory {
  findByCode(code: number): Promise<PortalStudent | null>;
  findById(id: string): Promise<PortalStudent | null>;
}
