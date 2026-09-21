"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Opens the browser print dialog; choosing "Save as PDF" there produces the PDF report. Browser printing is used
 * (instead of a server-side PDF library) because it shapes Arabic/RTL text correctly with no extra dependency.
 *
 * @param props.label - Localised button text.
 */
export function PrintButton({ label }: { readonly label: string }) {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()} className="gap-1.5">
      <Printer className="h-4 w-4" />
      {label}
    </Button>
  );
}
