import { DisputeResolutionOutcome } from "./dispute-evidence";
export interface DisputeResolution {
  type: string;
  amount: number;
  currency: string;
  resolvedBy: string;
  resolvedAt: Date;
  notes: string;
}
