import type { DataProvider } from "ra-core";
import type { Deal, PropertyUnit } from "../../types";

const DEAL_STAGE_TO_UNIT_STATUS: Record<string, PropertyUnit["status"]> = {
  proposta: "proposta",
  trattativa: "proposta",
  compromesso: "compromesso",
  rogito: "rogito",
};

/**
 * When a deal's stage changes, update the status of every linked property unit
 * to mirror the deal stage.
 *
 * For the "perso" stage the units are reset to "disponibile" only when no other
 * active (non-archived, non-perso) deal still references them.
 */
export async function syncUnitStatuses(
  deal: Deal,
  previousDeal: Deal | undefined,
  dataProvider: DataProvider,
): Promise<void> {
  if (!previousDeal || deal.stage === previousDeal.stage) return;
  if (!deal.unit_ids || deal.unit_ids.length === 0) return;

  if (deal.stage === "perso") {
    await handlePerso(deal, dataProvider);
    return;
  }

  const targetStatus = DEAL_STAGE_TO_UNIT_STATUS[deal.stage];
  if (!targetStatus) return;

  await updateUnits(deal.unit_ids, targetStatus, dataProvider);
}

async function handlePerso(deal: Deal, dataProvider: DataProvider): Promise<void> {
  const { data: allDeals } = await dataProvider.getList<Deal>("deals", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "id", order: "ASC" },
    filter: { "archived_at@is": null },
  });

  const activeDeals = allDeals.filter(
    (d) => d.id !== deal.id && d.stage !== "perso",
  );

  const unitIdsToReset = deal.unit_ids.filter((unitId) => {
    const claimedByOther = activeDeals.some(
      (d) => d.unit_ids && d.unit_ids.includes(unitId),
    );
    return !claimedByOther;
  });

  if (unitIdsToReset.length > 0) {
    await updateUnits(unitIdsToReset, "disponibile", dataProvider);
  }
}

async function updateUnits(
  unitIds: Deal["unit_ids"],
  status: PropertyUnit["status"],
  dataProvider: DataProvider,
): Promise<void> {
  const results = await Promise.allSettled(
    unitIds.map(async (unitId) => {
      const { data: unit } = await dataProvider.getOne<PropertyUnit>(
        "property_units",
        { id: unitId },
      );
      if (unit.status === status) return;
      await dataProvider.update("property_units", {
        id: unitId,
        data: { status },
        previousData: unit,
      });
    }),
  );

  for (const r of results) {
    if (r.status === "rejected") {
      console.error("Failed to update unit status:", r.reason);
    }
  }
}
