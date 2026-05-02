import { IplPredictor } from "@/components/ipl/predictor";
import { Suspense } from "react";

export default function AppPage() {
  return (
    <Suspense fallback={null}>
      <IplPredictor />
    </Suspense>
  );
}

