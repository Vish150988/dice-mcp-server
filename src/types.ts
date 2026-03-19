export interface DiceJob {
  id: string;
  title: string;
  companyName?: string;
  companyPageUrl?: string;
  location?: string;
  salary?: string;
  employmentType?: string;
  workplaceTypes?: string[];
  postedDate?: string;
  detailsPageUrl?: string;
  summary?: string;
  description?: string;
  applyUrl?: string;
  skills?: string[];
}

export interface DiceSearchResponse {
  count: number;
  data: DiceRawJob[];
}

export interface DiceRawJob {
  id: string;
  title?: string;
  companyName?: string;
  companyPageUrl?: string;
  location?: string;
  salary?: string;
  employmentType?: string[];
  workplaceTypes?: string[];
  postedDate?: string;
  detailsPageUrl?: string;
  summary?: string;
  description?: string;
  applyUrl?: string;
  skills?: string[];
  isThirdParty?: boolean;
  easyApply?: boolean;
}

export interface SearchParams {
  query: string;
  location?: string;
  radius?: number;
  employmentType?: string;
  workplaceType?: string;
  postedDate?: string;
  page?: number;
  pageSize?: number;
}

export interface JobSearchResult {
  totalCount: number;
  page: number;
  pageSize: number;
  jobs: DiceJob[];
  hasMore: boolean;
}
