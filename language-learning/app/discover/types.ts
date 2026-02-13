export type DiscoverPartner = {
  id: string;
  first_name: string | null;
  level: string;
  target_language: string;
};

export type DiscoverListResponse = {
  items: DiscoverPartner[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

