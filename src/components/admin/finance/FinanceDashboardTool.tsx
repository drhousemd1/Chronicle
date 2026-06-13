import React, { useState, useMemo, useEffect } from "react";
import { fetchAdminUsageTimeseries } from "@/services/admin-usage-metrics";
import { OverviewPage } from "./overview/OverviewPage";
import { FinancePage } from "./projections/FinanceProjectionsPage";
import { UsersPage } from "./users/UserManagementPage";
import { UsagePage } from "./usage/ApiUsagePage";
import { TiersPage } from "./tiers/SubscriptionTiersPage";
import { StrategyPage } from "./strategy/StrategyPage";
import { RevenueCalcPage } from "./calculator/RevenueCalculatorPage";
import { DocumentsPage } from "./documents/DocumentsPage";
import { FinanceStyleRulesPage } from "./style-rules/FinanceStyleRulesPage";
import { FinanceSidebar } from "./shared/FinanceSidebar";
import { FinanceHeader } from "./shared/FinanceHeader";
import type { DashboardUser, FinanceNavItem, FinancePageId } from "@/types/finance-dashboard";
import { fetchFinanceDashboardUsers, resolveFinanceUserTier, saveFinanceUserTierOverride } from "@/services/finance-dashboard/finance-users";
import {
  GLOBAL_STYLE,
  D,
  C,
  DEFAULT_TIER_PRICES,
  PAID_TIER_SNAPSHOT_META,
} from "./shared/finance-shared";


const NAV: FinanceNavItem[] = [
  { id:"overview",  label:"Overview",              icon:"", desc:"" },
  { id:"finance",   label:"Finance & Projections", icon:"", desc:"" },
  { id:"strategy",  label:"Strategy",              icon:"", desc:"" },
  { id:"users",     label:"User Management",       icon:"", desc:"" },
  { id:"usage",     label:"API & Usage",           icon:"", desc:"" },
  { id:"tiers",     label:"Subscription Tiers",    icon:"", desc:"" },
  { id:"documents", label:"Documents",             icon:"", desc:"" },
  { id:"calculator", label:"Revenue Calculator",   icon:"", desc:"" },
  { id:"style",     label:"Styling Rules",         icon:"", desc:"" },
];

const PAGE_COMPONENTS: Partial<Record<FinancePageId, React.ComponentType<any>>> = {
  finance: FinancePage,
  strategy: StrategyPage,
  usage: UsagePage,
  tiers: TiersPage,
  documents: DocumentsPage,
  calculator: RevenueCalcPage,
  style: FinanceStyleRulesPage,
};

const PAGE_SUB: Record<FinancePageId, string> = {
  overview:  "Summary of all systems",
  finance:   "Revenue · EBITDA · scenarios · tier economics",
  strategy:  "Competitive intel · pricing sensitivity · unit economics · reality check",
  users:     "Manage accounts, tiers, strikes, and pending reviews",
  usage:     "xAI API consumption and cost tracking",
  tiers:     "Manage pricing, limits, and features — changes propagate to the app",
  documents: "Upload and view financial analysis, strategy docs, and reference material",
  calculator: "Interactive revenue, cost, and net income projections",
  style:     "Design rules — read this before making any styling changes",
};

const DARK_PAGES = new Set<FinancePageId>(["overview", "usage", "users", "documents", "tiers", "calculator", "strategy", "finance"]);

export default function ChronicleAdmin() {
  const [page,setPage] = useState<FinancePageId>("overview");
  const [dashboardUsers, setDashboardUsers] = useState<DashboardUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [tierPrices, setTierPrices] = useState<Record<string, number>>(DEFAULT_TIER_PRICES);
  const [userTierOverrides, setUserTierOverrides] = useState<Record<string, string>>({});
  const [adminApiCostPerUser, setAdminApiCostPerUser] = useState(0);

  useEffect(() => {
    fetchAdminUsageTimeseries("month").then((ts) => {
      const totalCost = ts.points.reduce((s, p) => s + p.textCostUsd + p.imageCostUsd, 0);
      const latestPoint = ts.points[ts.points.length - 1];
      const monthlyCost = latestPoint ? (latestPoint.textCostUsd + latestPoint.imageCostUsd) : totalCost;
      setAdminApiCostPerUser(monthlyCost > 0 ? monthlyCost : totalCost);
    }).catch(() => {});
  }, []);

  const loadDashboardUsers = async () => {
    setUsersLoading(true);
    try {
      const result = await fetchFinanceDashboardUsers();
      setTierPrices(result.tierPrices);
      setUserTierOverrides(result.tierOverrides);
      setDashboardUsers(result.users);
    } catch (error) {
      console.error("Failed to load dashboard users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboardUsers();
  }, []);

  const handleTierChange = async (userId: string, rawTierSlug: unknown) => {
    const { tierSlug, tierLabel, shouldHaveAdminUi } = resolveFinanceUserTier(rawTierSlug);

    setDashboardUsers((currentUsers) => currentUsers.map((user) => (
      user.id === userId ? { ...user, tierSlug, tier: tierLabel, canViewAdminUi: shouldHaveAdminUi } : user
    )));

    const nextOverrides = { ...userTierOverrides, [userId]: tierSlug };
    setUserTierOverrides(nextOverrides);

    try {
      await saveFinanceUserTierOverride({ userId, tierSlug, nextOverrides, shouldHaveAdminUi });
    } catch (error) {
      console.error("Failed to save user tier override/admin access:", error);
      void loadDashboardUsers();
    }
  };

  const activeUserBreakdown = useMemo(() => {
    const counts: Record<string, number> = { Alpha:0, Starter:0, Premium:0, Elite:0, Admin:0, "Admin (CFO)":0 };
    dashboardUsers.forEach((user) => {
      if (user.status === "active" && user.tier in counts) {
        counts[user.tier] += 1;
      }
    });

    return [
      { label:"Alpha", count:counts.Alpha },
      { label:"Starter", count:counts.Starter },
      { label:"Premium", count:counts.Premium },
      { label:"Elite",   count:counts.Elite },
      { label:"Admin",   count:counts.Admin },
      { label:"Admin (CFO)", count:counts["Admin (CFO)"] },
    ];
  }, [dashboardUsers]);

  const snapshotRows = useMemo(() => {
    const adminUserCount = dashboardUsers.filter((user) => user.status === "active" && (user.tierSlug === "admin" || user.tierSlug === "admin_cfo")).length;
    return PAID_TIER_SNAPSHOT_META.map((tier) => ({
      ...tier,
      price: typeof tierPrices[tier.slug] === "number" ? tierPrices[tier.slug] : DEFAULT_TIER_PRICES[tier.slug],
      users: tier.slug === "admin"
        ? adminUserCount
        : dashboardUsers.filter((user) => user.status === "active" && user.tierSlug === tier.slug).length,
      apiCost: tier.slug === "admin" && adminUserCount > 0
        ? adminApiCostPerUser / adminUserCount
        : tier.apiCost,
    }));
  }, [dashboardUsers, tierPrices, adminApiCostPerUser]);

  const navItems = useMemo(() => NAV, []);
  const ActivePage = PAGE_COMPONENTS[page];
  const isDarkPage = DARK_PAGES.has(page);

  return (
    <div style={{ display:"flex", minHeight:"100vh",
      background: D.bg, fontFamily:"'Inter',system-ui,sans-serif" }}>
      <style>{GLOBAL_STYLE}</style>

      <FinanceSidebar navItems={navItems} page={page} onPageChange={setPage} />

      <main style={{ flex:1, overflowY:"auto", padding:"30px 34px", minWidth:0,
        background: isDarkPage ? D.bg : C.bg }}>
        <FinanceHeader
          page={page}
          navItems={navItems}
          subText={PAGE_SUB[page]}
          activeUserBreakdown={activeUserBreakdown}
          isDarkPage={isDarkPage}
        />

        {page === "overview" ? (
          <OverviewPage onNavigate={(nextPage) => setPage(nextPage as FinancePageId)} snapshotRows={snapshotRows} users={dashboardUsers}/>
        ) : page === "finance" ? (
          <FinancePage users={dashboardUsers} tierPrices={tierPrices} />
        ) : page === "users" ? (
          <UsersPage
            users={dashboardUsers}
            setUsers={setDashboardUsers}
            tierPrices={tierPrices}
            usersLoading={usersLoading}
            onTierChange={handleTierChange}
            onRefreshUsers={loadDashboardUsers}
          />
        ) : ActivePage ? (
          <ActivePage/>
        ) : null}
      </main>
    </div>
  );
}
