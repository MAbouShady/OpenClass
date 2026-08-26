export type LadderRung = {
  /** Short-side target in pixels. */
  readonly rung: number;
  readonly videoBitrateKbps: number;
  readonly audioBitrateKbps: number;
};

/** Deliberately modest: four rungs cover phone-to-desktop without burning CPU. */
export const HLS_LADDER: readonly LadderRung[] = [
  { rung: 360, videoBitrateKbps: 800, audioBitrateKbps: 96 },
  { rung: 480, videoBitrateKbps: 1400, audioBitrateKbps: 128 },
  { rung: 720, videoBitrateKbps: 2800, audioBitrateKbps: 128 },
  { rung: 1080, videoBitrateKbps: 5000, audioBitrateKbps: 192 },
];

export type Variant = LadderRung & {
  readonly width: number;
  readonly height: number;
};

function toEven(value: number): number {
  const rounded = Math.round(value);
  return rounded % 2 === 0 ? rounded : rounded + 1;
}

/**
 * Picks the rungs worth producing for a source. Never upscales, and always
 * produces at least one variant so a tiny source still gets an HLS rendition.
 */
export function planVariants(sourceWidth: number, sourceHeight: number): Variant[] {
  const shortSide = Math.min(sourceWidth, sourceHeight);
  const landscape = sourceWidth >= sourceHeight;

  const usable = HLS_LADDER.filter((entry) => entry.rung <= shortSide);
  const chosen = usable.length > 0 ? usable : [HLS_LADDER[0]!];

  return chosen.map((entry) => {
    const target = Math.min(entry.rung, shortSide);
    const scale = target / shortSide;
    return landscape
      ? { ...entry, width: toEven(sourceWidth * scale), height: toEven(target) }
      : { ...entry, width: toEven(target), height: toEven(sourceHeight * scale) };
  });
}
