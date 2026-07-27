import { Loader2 } from "lucide-react";
import { T } from "../../../shared/theme/tokens";

export default function TranscribingScreen() {
  return (
    <div className="max-w-lg mx-auto text-center py-24">
      <Loader2 className="animate-spin mx-auto" size={28} style={{ color: T.teal }} />
      <p style={{ fontFamily: "Inter", color: T.inkSoft }} className="mt-4 text-sm">
        Separating clinician and patient audio, transcribing conversation…
      </p>
    </div>
  );
}
