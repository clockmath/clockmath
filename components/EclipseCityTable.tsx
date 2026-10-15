import StackedTable, { type StackedColumn } from '@/components/StackedTable';

/**
 * City timings table shared by the eclipse countdown pages. Rows come from
 * each page's generated eclipseData.ts. One table markup that stacks on
 * phones (see StackedTable) — the values join on one line under the place.
 */
type Row = { place: string } & Record<string, string>;

export type EclipseColumn = StackedColumn;

export default function EclipseCityTable({ rows, columns }: { rows: ReadonlyArray<Row>; columns: EclipseColumn[] }) {
  return <StackedTable rows={rows} columns={columns} />;
}
