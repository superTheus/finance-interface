import { Utils } from "@/services/utils";

export const mounths = (new Utils).getMonthsUntilNow().map((m, i) => {
  return { label: m, value: i + 1 }
});
