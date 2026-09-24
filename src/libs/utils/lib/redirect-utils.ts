import { redirect } from "next/navigation";

import { RouteDirectory, SpecialtyPages } from "@aces/types";
// Imported by path, not through `@aces/features`: that barrel pulls in feature
// components which import `@aces/cf`, which imports `@aces/utils` — and the
// resulting cycle crashes at module-init time with a temporal-dead-zone error.
import { EnableArticles } from "../../features/config";

export const specialtyPageRedirect = (specialtyPage: string) => {
  if (specialtyPage) {
    switch (specialtyPage) {
      case SpecialtyPages.Homepage:
        redirect(RouteDirectory.Homepage);
      case SpecialtyPages.KnowledgeHome:
        if (EnableArticles) {
          redirect(RouteDirectory.Articles);
        }
      default:
        break;
    }
  }
};
