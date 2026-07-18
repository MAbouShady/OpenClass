"use client";

type Props = {
  label: string;
  accent: string;
};

export function BookNowButton({ label, accent }: Props) {
  function handleClick() {
    window.dispatchEvent(new CustomEvent("open-courses"));
    document.getElementById("courses")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="animate-pulse flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      style={{ backgroundColor: accent }}
    >
      {label}
    </button>
  );
}
