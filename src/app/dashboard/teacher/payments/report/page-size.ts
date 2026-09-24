/**
 * Kept out of `pagination.tsx` deliberately: that file is `"use client"`, and a plain constant exported from a
 * client module doesn't cross back into a Server Component as itself (it arrives as a client reference, not the
 * real array) — `page.tsx` needs the real array to validate the `pageSize` query param.
 */

/** Allowed "records per page" values; `"all"` means every row on one (unpaginated) page. */
export const PAGE_SIZE_OPTIONS = ["10", "25", "50", "100", "all"] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];
