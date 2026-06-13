import { C, D } from "./finance-shared";
import type { FinanceNavItem, FinancePageId } from "@/types/finance-dashboard";

export function FinanceHeader({
  page,
  navItems,
  subText,
  activeUserBreakdown,
  isDarkPage,
}: {
  page: FinancePageId;
  navItems: FinanceNavItem[];
  subText: string;
  activeUserBreakdown: { label: string; count: number }[];
  isDarkPage: boolean;
}) {
  return (
    <div style={{ marginBottom:24, display:"flex", alignItems:"flex-start",
      justifyContent:"space-between", gap:16 }}>
      <div>
        <h1 style={{ fontSize:19, fontWeight:700,
          color: isDarkPage ? D.text : C.text,
          margin:"0 0 3px", letterSpacing:"-0.015em" }}>
          {navItems.find(n=>n.id===page)?.label}
        </h1>
        <p style={{ fontSize:12, color: isDarkPage ? D.muted : C.dim, margin:0 }}>
          {subText}
        </p>
      </div>
      <div style={{ display:"flex", gap:10, flexShrink:0, alignItems:"stretch" }}>
        <div style={{
          background: isDarkPage ? D.shell : "#fff",
          boxShadow: isDarkPage ? D.shellShadow : `1.5px solid ${C.cardBorder}`,
          border: isDarkPage ? "none" : `1.5px solid ${C.cardBorder}`,
          borderRadius:14, padding:"10px 18px", textAlign:"left",
        }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
            letterSpacing:"0.08em",
            color: isDarkPage ? D.muted : C.muted,
            marginBottom:6 }}>Active Users</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:"6px 12px" }}>
            {activeUserBreakdown.map((t) => (
              <div key={t.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, minWidth:76 }}>
                <span style={{ fontSize:11, fontWeight:700, color: isDarkPage ? D.muted : C.muted }}>{t.label}</span>
                <span style={{ fontSize:14, fontWeight:800, lineHeight:1,
                  color: isDarkPage ? D.text : C.text }}>{t.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: isDarkPage ? D.shell : C.greenSoft,
          boxShadow: isDarkPage ? D.shellShadow : `1.5px solid ${C.green}33`,
          border: isDarkPage ? "none" : `1.5px solid ${C.green}33`,
          borderRadius:14, padding:"10px 22px", textAlign:"right",
        }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
            letterSpacing:"0.08em",
            color: isDarkPage ? D.muted : C.green,
            marginBottom:3 }}>Net Income</div>
          <div style={{ fontSize:26, fontWeight:800, lineHeight:1,
            color: isDarkPage ? D.text : C.green }}>
            $658
          </div>
          <div style={{ fontSize:11, marginTop:3, fontWeight:500,
            color: isDarkPage ? D.muted : C.green }}>
            placeholder · wires to all sources
          </div>
        </div>
      </div>
    </div>
  );
}
