export const MARKET_PUBLISH_TITLE = "Qeemly Market Data Updated";
export const MARKET_PUBLISH_SUMMARY = "Fresh GCC benchmark coverage is now live across the platform.";

export type MarketPublishEvent = {
  id: string;
  title: string;
  summary: string;
  rowCount: number;
  publishedAt: string;
};

export function mapMarketPublishEventRow(row: Record<string, unknown>): MarketPublishEvent {
  return {
    id: String(row.id),
    title: String(row.title),
    summary: String(row.summary),
    rowCount: Number(row.row_count ?? 0),
    publishedAt: String(row.published_at),
  };
}
