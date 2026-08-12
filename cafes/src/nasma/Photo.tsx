import { makePhoto } from "../shared/photo";
import { MANIFEST, SLOTS } from "./assets";

export const Photo = makePhoto(SLOTS, MANIFEST, {
  plate: "border border-dashed border-sage/25 bg-raised",
  icon: "text-sage/45",
  label: "text-cream/70",
  note: "text-sage/50",
});
