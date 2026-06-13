export type DashboardUser = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  tier: string;
  tierSlug: string;
  status: string;
  strikes: number;
  stories: number;
  reportCount: number;
  reported: boolean;
  joined: string;
  canViewAdminUi: boolean;
};

export type FinancePageId = "overview" | "finance" | "strategy" | "users" | "usage" | "tiers" | "documents" | "calculator" | "style";

export type FinanceNavItem = {
  id: FinancePageId;
  label: string;
  icon: string;
  desc: string;
};
