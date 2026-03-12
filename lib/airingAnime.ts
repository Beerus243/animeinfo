import { getCurrentSeasonLabel } from "@/lib/animeSeason";
import Anime from "@/models/Anime";

export async function getPreferredAiringFilter() {
  const icotakuCount = await Anime.countDocuments({
    notificationsEnabled: { $ne: false },
    status: "airing",
    tags: "icotaku",
  });

  if (icotakuCount > 0) {
    return {
      notificationsEnabled: { $ne: false },
      status: "airing",
      tags: "icotaku",
    };
  }

  const currentSeasonLabel = getCurrentSeasonLabel();
  return {
    notificationsEnabled: { $ne: false },
    $or: [{ status: "airing" }, { currentSeasonLabel }, { seasons: currentSeasonLabel }],
  };
}