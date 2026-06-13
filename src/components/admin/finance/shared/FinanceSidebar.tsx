import { D } from "./finance-shared";
import type { FinanceNavItem, FinancePageId } from "@/types/finance-dashboard";

export function FinanceSidebar({ navItems, page, onPageChange }: {
  navItems: FinanceNavItem[];
  page: FinancePageId;
  onPageChange: (page: FinancePageId) => void;
}) {
  return (
    <aside style={{
      width:230, flexShrink:0,
      background: D.sidebar,
      borderRight:"1px solid rgba(0,0,0,0.4)",
      boxShadow:"4px 0 12px rgba(0,0,0,0.3)",
      display:"flex", flexDirection:"column",
      position:"sticky", top:0, height:"100vh", overflowY:"auto",
    }}>
      <div style={{ padding:"24px 20px 20px" }}>
        <div style={{ fontSize:18, fontWeight:800, color:D.text, letterSpacing:"-0.03em" }}>
          Chronicle
        </div>
        <div style={{ fontSize:10, color:D.text, marginTop:3, fontWeight:700,
          textTransform:"uppercase", letterSpacing:"0.07em" }}>
          Finance Dashboard
        </div>
      </div>

      <nav style={{ padding:"8px 10px", flex:1 }}>
        {navItems.map(item => {
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => onPageChange(item.id)}
              style={{
                width:"100%", textAlign:"left",
                display:"flex", alignItems:"center", gap:10,
                padding:"9px 14px", borderRadius:8, border:"none",
                cursor:"pointer", marginBottom:2, transition:"all .15s",
                background: active ? D.blueActive : "transparent",
                color:       active ? D.blue      : D.muted,
                fontWeight:  700,
                fontSize:11,
                textTransform:"uppercase",
                letterSpacing:"0.07em",
                boxShadow: active ? "inset 1px 1px 0 rgba(255,255,255,0.09)" : "none",
              }}>
              <span style={{ flex:1 }}>{item.label}</span>
              {item.desc && (
                <span style={{ fontSize:10,
                  background: active ? D.blue : D.elevated,
                  color:"#fff", borderRadius:10, padding:"2px 7px", fontWeight:700 }}>
                  {item.desc}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ padding:"14px 20px", borderTop:`1px solid ${D.divider}`,
        fontSize:10, color:D.dim, lineHeight:1.6,
        textTransform:"uppercase", letterSpacing:"0.05em" }}>
        <div style={{ fontWeight:700, color:D.muted }}>Chronicle RPG Studio</div>
        <div>Finance dashboard · live telemetry</div>
      </div>
    </aside>
  );
}
