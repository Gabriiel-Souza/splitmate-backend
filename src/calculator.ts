import { Table, TableSummary, ParticipantSummary } from './types.js';

export function calculateTableSummary(table: Table): TableSummary {
  // Map participantId -> summary accumulator
  const summaryMap = new Map<string, ParticipantSummary>();

  for (const participant of table.participants) {
    summaryMap.set(participant.id, {
      participantId: participant.id,
      name: participant.name,
      subtotalCents: 0,
      serviceFeeCents: 0,
      totalCents: 0,
      consumedItems: [],
    });
  }

  let tableSubtotalCents = 0;

  for (const item of table.items) {
    const validConsumers = item.consumedByIds.filter((id) => summaryMap.has(id));
    if (validConsumers.length === 0) continue;

    const totalItemCents = item.priceCents * item.quantity;
    tableSubtotalCents += totalItemCents;

    const consumerCount = validConsumers.length;
    const baseShareCents = Math.floor(totalItemCents / consumerCount);
    const remainderCents = totalItemCents % consumerCount;

    validConsumers.forEach((participantId, index) => {
      // Distribute the remaining 1 cent to the first 'remainderCents' consumers
      const extraCent = index < remainderCents ? 1 : 0;
      const shareCents = baseShareCents + extraCent;

      const participantSummary = summaryMap.get(participantId)!;
      participantSummary.subtotalCents += shareCents;
      participantSummary.consumedItems.push({
        itemId: item.id,
        name: item.name,
        quantity: item.quantity,
        shareCents,
      });
    });
  }

  let tableServiceFeeCents = 0;
  let grandTotalCents = 0;

  const participantsSummary = Array.from(summaryMap.values()).map((p) => {
    const serviceFeeCents = table.serviceFeeEnabled
      ? Math.round(p.subtotalCents * 0.1)
      : 0;
    const totalCents = p.subtotalCents + serviceFeeCents;

    tableServiceFeeCents += serviceFeeCents;
    grandTotalCents += totalCents;

    return {
      ...p,
      serviceFeeCents,
      totalCents,
    };
  });

  return {
    code: table.code,
    venueName: table.venueName,
    serviceFeeEnabled: table.serviceFeeEnabled,
    subtotalCents: tableSubtotalCents,
    serviceFeeCents: tableServiceFeeCents,
    grandTotalCents,
    participants: participantsSummary,
  };
}