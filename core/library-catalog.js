import { journeyGroups, getSupportMaterials } from "./content-catalog.js";

export function getLibraryGroups() {
  const seen = new Set();
  return journeyGroups
    .map((group) => ({
      ...group,
      entries: group.items.flatMap((mission) => {
        const materials = getSupportMaterials(mission.progressId);
        if (seen.has(mission.progressId) || !materials.length) return [];
        seen.add(mission.progressId);
        return [{ mission, materialCount: materials.length }];
      }),
    }))
    .filter((group) => group.entries.length > 0);
}
