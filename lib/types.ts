export type LocationCode = 'ZMH' | 'MS';

export type Organization = {
  id: string;
  name: string;
  shortName: string;
  color: string;
};

export type Supply = {
  id: string;
  location: LocationCode;
  eventAt: Date;
  comment: string;
  organizations: Record<string, number>;
  total: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  revision: number;
};

export type SupplyDraft = Omit<
  Supply,
  'id' | 'createdAt' | 'updatedAt' | 'revision' | 'total'
>;

export type PeriodKey =
  | 'today'
  | '7days'
  | 'month'
  | 'lastMonth'
  | '3months'
  | 'year'
  | 'all'
  | 'custom';

export type FilterState = {
  period: PeriodKey;
  location: 'ALL' | LocationCode;
  organization: string;
  from: string;
  to: string;
  search: string;
};
