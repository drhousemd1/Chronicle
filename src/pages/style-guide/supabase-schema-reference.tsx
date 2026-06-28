import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getSchemaReferenceSearchIndex,
  schemaReferenceObjects,
  splitSchemaReferenceAccess,
  type SchemaReferenceObject,
  type SchemaReferenceObjectType,
  type SchemaReferenceRow,
} from "@/data/supabase-schema-reference";

type FilterValue = "all" | SchemaReferenceObjectType;

const pageStyles = ".supabase-schema-reference-page {\n  color-scheme: dark;\n  --page-bg: #121214;\n  --topbar: #f5f5f6;\n  --topbar-text: #111111;\n  --rail: #2e2e33;\n  --panel: #2a2a2f;\n  --panel-2: #35363d;\n  --field: #1c1c1f;\n  --text: #e0e0e0;\n  --muted: #b6bcc8;\n  --faint: #9aa2af;\n  --blue-1: #5a7292;\n  --blue-2: #4a5f7f;\n  --line: rgba(255, 255, 255, 0.08);\n  --line-strong: rgba(255, 255, 255, 0.15);\n  --shadow:\n    0 12px 32px -2px rgba(0, 0, 0, 0.5),\n    inset 1px 1px 0 rgba(255, 255, 255, 0.09),\n    inset -1px -1px 0 rgba(0, 0, 0, 0.35);\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", ui-sans-serif, system-ui, sans-serif;\n}\n\n.supabase-schema-reference-page,\n.supabase-schema-reference-page * {\n  box-sizing: border-box;\n}\n\n.supabase-schema-reference-page {\n  scroll-behavior: smooth;\n}\n\n.supabase-schema-reference-page {\n  min-height: 100vh;\n  margin: 0;\n  background: var(--page-bg);\n  color: var(--text);\n}\n\n.supabase-schema-reference-page button,\n.supabase-schema-reference-page input {\n  font: inherit;\n}\n.supabase-schema-reference-page code {\n  border-radius: 5px;\n  background: #191a1e;\n  color: #f7f7f8;\n  padding: 2px 5px;\n  font-family: \"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace;\n  font-size: 11px;\n  font-weight: 850;\n}\n\n.topbar {\n  min-height: 76px;\n  display: flex;\n  align-items: center;\n  gap: 18px;\n  padding: 14px 24px;\n  background: rgba(255, 255, 255, 0.96);\n  backdrop-filter: blur(10px);\n  color: var(--topbar-text);\n  border-bottom: 1px solid #e0e0e0;\n  position: sticky;\n  top: 0;\n  z-index: 30;\n}\n\n.back-mark {\n  width: 36px;\n  height: 36px;\n  border: 0;\n  background: transparent;\n  padding: 0;\n  display: grid;\n  place-items: center;\n  border-radius: 999px;\n  color: #27282e;\n  cursor: pointer;\n  transition: background 0.15s ease, color 0.15s ease;\n}\n\n.back-mark:hover {\n  background: #f1f5f9;\n}\n\n.back-mark svg {\n  width: 20px;\n  height: 20px;\n  display: block;\n  stroke: currentColor;\n  stroke-width: 2.5;\n  stroke-linecap: round;\n  stroke-linejoin: round;\n}\n\n.brand-title strong {\n  display: block;\n  font-size: 17px;\n  line-height: 1.1;\n  font-weight: 900;\n  letter-spacing: 0.5px;\n  text-transform: uppercase;\n}\n\n.header-actions {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  margin-left: auto;\n}\n\n.legend-toggle-btn {\n  min-height: 40px;\n  border: 0;\n  outline: none;\n  border-radius: 14px;\n  background: #2f3137;\n  color: #eaedf1;\n  padding: 0 20px;\n  box-shadow:\n    0 8px 24px rgba(0, 0, 0, 0.28),\n    inset 0 1px 0 rgba(255, 255, 255, 0.09),\n    inset 0 -1px 0 rgba(0, 0, 0, 0.2);\n  cursor: pointer;\n  font-size: 12px;\n  font-weight: 700;\n  white-space: nowrap;\n  transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;\n}\n\n.legend-toggle-btn:hover {\n  background: #34363c;\n}\n\n.legend-toggle-btn[aria-expanded=\"true\"] {\n  background: #38414c;\n}\n\n.legend-toggle-btn:active {\n  transform: scale(0.98);\n}\n\n.page {\n  min-height: calc(100vh - 76px);\n  padding: 24px 24px 64px 320px;\n}\n\n.sidebar {\n  position: fixed;\n  top: 76px;\n  bottom: 0;\n  left: 0;\n  width: 296px;\n  overflow-y: auto;\n  overflow-x: hidden;\n  padding: 16px 14px 20px;\n  background: var(--rail);\n  border-right: 1px solid rgba(255, 255, 255, 0.08);\n  box-shadow:\n    0 18px 42px -24px rgba(0, 0, 0, 0.68),\n    inset 1px 0 0 rgba(255, 255, 255, 0.04),\n    inset -1px 0 0 rgba(0, 0, 0, 0.26);\n  z-index: 20;\n  scrollbar-width: none;\n}\n\n.sidebar::-webkit-scrollbar {\n  display: none;\n}\n\n.nav-root-link {\n  display: flex;\n  align-items: center;\n  min-height: 44px;\n  width: 100%;\n  margin-bottom: 14px;\n  padding: 0 16px;\n  border-radius: 14px;\n  background: linear-gradient(180deg, #6f8db5 0%, #4f688a 100%);\n  color: #f7fbff;\n  text-decoration: none;\n  font-size: 13px;\n  line-height: 1.15;\n  font-weight: 800;\n  box-shadow:\n    0 10px 22px rgba(0, 0, 0, 0.28),\n    inset 0 1px 0 rgba(255, 255, 255, 0.16),\n    inset 0 -1px 0 rgba(0, 0, 0, 0.22);\n}\n\n.sidebar h2,\n.detail-section h3 {\n  margin: 0;\n  color: #bbbbc3;\n  font-size: 12px;\n  line-height: 1.2;\n  font-weight: 950;\n  letter-spacing: 0.18em;\n  text-transform: uppercase;\n}\n\n.browse-controls {\n  padding: 0 0 16px;\n  margin-bottom: 14px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n}\n\n.search-input {\n  width: 100%;\n  min-height: 40px;\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  border-radius: 20px;\n  background: #1c1c1f;\n  color: var(--text);\n  padding: 0 14px;\n  outline: none;\n  font-size: 13px;\n  font-weight: 850;\n  margin-top: 14px;\n}\n\n.search-input::placeholder {\n  color: #8f9099;\n}\n\n.filter-group {\n  display: flex;\n  gap: 10px;\n  margin-top: 14px;\n}\n\n.filter-button {\n  min-height: 34px;\n  border: 0;\n  border-radius: 18px;\n  background: transparent;\n  color: #b8b8bf;\n  padding: 0 14px;\n  font-size: 12px;\n  font-weight: 950;\n  cursor: pointer;\n}\n\n.filter-button.active {\n  background: linear-gradient(180deg, #6f8db5 0%, #4f688a 100%);\n  color: #fff;\n  box-shadow:\n    0 8px 18px rgba(0, 0, 0, 0.18),\n    inset 0 1px 0 rgba(255, 255, 255, 0.14),\n    inset 0 -1px 0 rgba(0, 0, 0, 0.18);\n}\n\n.jump-list {\n  display: flex;\n  flex-direction: column;\n  gap: 14px;\n}\n\n.nav-section {\n  display: flex;\n  flex-direction: column;\n  gap: 9px;\n}\n\n.nav-section.hidden {\n  display: none;\n}\n\n.nav-section-title {\n  display: flex;\n  align-items: center;\n  min-height: 42px;\n  padding: 0 14px;\n  border-radius: 14px;\n  background: #3c3e47;\n  border: 1px solid rgba(0, 0, 0, 0.3);\n  color: rgba(255, 255, 255, 0.94);\n  font-size: 13px;\n  line-height: 1.15;\n  font-weight: 800;\n  box-shadow:\n    0 8px 20px rgba(0, 0, 0, 0.28),\n    inset 0 1px 0 rgba(255, 255, 255, 0.07),\n    inset 0 -1px 0 rgba(0, 0, 0, 0.18);\n}\n\n.nav-tree-group {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  margin-left: 4px;\n  padding-left: 8px;\n}\n\n.jump-link {\n  display: flex;\n  align-items: stretch;\n  min-height: 36px;\n  text-decoration: none;\n  color: #d9d9df;\n  font-size: 13px;\n  line-height: 1.2;\n  font-weight: 800;\n}\n\n.jump-link:hover .nav-link-body,\n.jump-link.active .nav-link-body {\n  background:\n    linear-gradient(180deg, rgba(111, 141, 181, 0.18) 0%, rgba(79, 104, 138, 0.22) 100%),\n    rgba(255, 255, 255, 0.03);\n  border-color: rgba(110, 137, 173, 0.45);\n}\n\n.nav-link-body {\n  display: flex;\n  min-width: 0;\n  width: 100%;\n  flex-direction: column;\n  justify-content: center;\n  min-height: 36px;\n  padding: 6px 12px;\n  border: 1px solid transparent;\n  border-radius: 12px;\n  transition: background 0.15s ease, border-color 0.15s ease;\n}\n\n.jump-link.hidden {\n  display: none;\n}\n\n.jump-name {\n  display: block;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  color: #fff;\n  font-family: \"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace;\n  font-size: 12px;\n  line-height: 1.25;\n  font-weight: 950;\n  white-space: nowrap;\n}\n\n.jump-meta {\n  display: block;\n  margin-top: 5px;\n  color: #c8c8d0;\n  font-size: 10px;\n  line-height: 1.2;\n  font-weight: 900;\n  letter-spacing: 0.1em;\n  text-transform: uppercase;\n}\n\n.main-column {\n  width: 100%;\n  max-width: 1720px;\n}\n\n.objects-heading {\n  margin-bottom: 20px;\n}\n\n.objects-heading h2 {\n  margin: 0;\n  color: #fff;\n  font-size: 22px;\n  line-height: 1.18;\n  font-weight: 950;\n}\n\n.objects-heading p {\n  max-width: 1160px;\n  margin: 8px 0 0;\n  color: #b8b8c0;\n  font-size: 13px;\n  line-height: 1.5;\n  font-weight: 760;\n}\n\n.reference-legend {\n  overflow: hidden;\n  margin-bottom: 24px;\n  border-radius: 24px;\n  background: var(--panel);\n  box-shadow: var(--shadow);\n}\n\n.reference-legend[hidden] {\n  display: none;\n}\n\n.legend-header {\n  position: relative;\n  overflow: hidden;\n  padding: 14px 20px 12px;\n  background: linear-gradient(180deg, var(--blue-1), var(--blue-2));\n  border-top: 1px solid rgba(255, 255, 255, 0.2);\n  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);\n}\n\n.legend-header::after,\n.object-card-header::after {\n  content: \"\";\n  position: absolute;\n  inset: 0;\n  background: linear-gradient(180deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0) 30%);\n  pointer-events: none;\n}\n\n.legend-kicker {\n  position: relative;\n  z-index: 1;\n  color: rgba(235, 241, 250, 0.82);\n  font-size: 11px;\n  line-height: 1.2;\n  font-weight: 800;\n  letter-spacing: 0.12em;\n  text-transform: uppercase;\n}\n\n.legend-header h2 {\n  position: relative;\n  z-index: 1;\n  margin: 4px 0 0;\n  color: #f7f9fc;\n  font-size: 23px;\n  line-height: 1.15;\n  font-weight: 900;\n  letter-spacing: -0.03em;\n}\n\n.legend-body {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 18px;\n  padding: 18px;\n}\n\n.legend-section {\n  min-width: 0;\n  border-radius: 20px;\n  background: #2e2e33;\n  padding: 16px;\n  box-shadow:\n    inset 1px 1px 0 rgba(255, 255, 255, 0.07),\n    inset -1px -1px 0 rgba(0, 0, 0, 0.3),\n    0 4px 12px rgba(0, 0, 0, 0.25);\n}\n\n.legend-section.wide {\n  grid-column: 1 / -1;\n}\n\n.legend-section h3 {\n  margin: 0 0 10px;\n  color: #9fb3d0;\n  font-size: 11px;\n  line-height: 1.2;\n  font-weight: 800;\n  letter-spacing: 0.1em;\n  text-transform: uppercase;\n}\n\n.legend-section p {\n  margin: 8px 0 0;\n  color: #c7ccd5;\n  font-size: 13px;\n  line-height: 1.55;\n  font-weight: 600;\n}\n\n.legend-rule-list {\n  display: grid;\n  gap: 10px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.legend-rule-list li {\n  border: 1px solid rgba(255, 255, 255, 0.05);\n  border-radius: 14px;\n  background: #1c1c1f;\n  color: #c7ccd5;\n  padding: 12px 13px;\n  font-size: 13px;\n  line-height: 1.55;\n  font-weight: 600;\n  box-shadow:\n    inset 0 3px 10px rgba(0, 0, 0, 0.6),\n    inset 0 1px 0 rgba(255, 255, 255, 0.05);\n}\n\n.legend-rule-list strong {\n  color: #fff;\n  font-weight: 950;\n}\n\n.legend-chip-row {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 10px;\n  margin-top: 10px;\n}\n\n.legend-chip {\n  display: inline-flex;\n  align-items: center;\n  min-height: 30px;\n  border-radius: 10px;\n  background: #111216;\n  padding: 0 10px;\n  font-size: 12px;\n  font-weight: 950;\n}\n\n.object-stack {\n  display: grid;\n  gap: 16px;\n}\n\n.object-card {\n  overflow: hidden;\n  border-radius: 16px;\n  background: var(--panel);\n  box-shadow: var(--shadow);\n  scroll-margin-top: 92px;\n  transition: opacity 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease;\n}\n\n.object-card.hidden {\n  display: none;\n}\n\n.object-card-header {\n  position: relative;\n  min-height: 46px;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 18px;\n  padding: 10px 16px;\n  background: linear-gradient(180deg, var(--blue-1), var(--blue-2));\n  border-top: 1px solid rgba(255, 255, 255, 0.2);\n  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);\n}\n\n.object-title-line {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  min-width: 0;\n  position: relative;\n  z-index: 1;\n}\n\n.object-name {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  color: #fff;\n  font-family: \"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace;\n  font-size: 16px;\n  line-height: 1.2;\n  font-weight: 800;\n  letter-spacing: -0.015em;\n  white-space: nowrap;\n}\n\n.object-kind {\n  min-height: 23px;\n  display: inline-grid;\n  place-items: center;\n  padding: 0 10px;\n  border-radius: 8px;\n  background: rgba(0, 0, 0, 0.24);\n  color: rgba(255, 255, 255, 0.84);\n  font-size: 10px;\n  font-weight: 950;\n  letter-spacing: 0.1em;\n  text-transform: uppercase;\n}\n\n.card-toggle {\n  width: 32px;\n  min-width: 32px;\n  height: 32px;\n  border: 0;\n  border-radius: 6px;\n  background: transparent;\n  color: rgba(255, 255, 255, 0.7);\n  cursor: pointer;\n  display: grid;\n  place-items: center;\n  padding: 4px;\n  outline: none;\n  position: relative;\n  z-index: 1;\n  transition: color 0.15s ease, background 0.15s ease, transform 0.15s ease;\n}\n\n.card-toggle:hover {\n  background: rgba(255, 255, 255, 0.1);\n  color: #ffffff;\n}\n\n.card-toggle:focus-visible {\n  outline: none;\n}\n\n.card-toggle svg {\n  display: block;\n  width: 20px;\n  height: 20px;\n  stroke: currentColor;\n  stroke-width: 2;\n  stroke-linecap: round;\n  stroke-linejoin: round;\n  transition: transform 160ms ease;\n}\n\n.object-card.collapsed .card-toggle svg {\n  transform: rotate(180deg);\n}\n\n.object-detail {\n  padding: 16px 18px 18px;\n}\n\n.object-card.collapsed .object-detail {\n  display: none;\n}\n\n.detail-grid {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);\n  gap: 10px;\n  margin-bottom: 14px;\n}\n\n.detail-section {\n  min-width: 0;\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  border-radius: 14px;\n  background: #35363d;\n  padding: 13px 14px;\n  box-shadow:\n    0 10px 22px rgba(0, 0, 0, 0.26),\n    inset 0 1px 0 rgba(255, 255, 255, 0.05);\n}\n\n.detail-section p {\n  margin: 8px 0 0;\n  color: #aeb5c1;\n  font-size: 12px;\n  line-height: 1.65;\n  font-weight: 600;\n}\n\n.matrix-wrap {\n  overflow-x: auto;\n  border-radius: 16px;\n  background: #1c1c1f;\n  border: 1px solid rgba(255, 255, 255, 0.05);\n  box-shadow:\n    inset 0 3px 10px rgba(0, 0, 0, 0.56),\n    inset 0 1px 0 rgba(255, 255, 255, 0.05),\n    0 10px 22px rgba(0, 0, 0, 0.26);\n}\n\ntable {\n  width: 100%;\n  border-collapse: collapse;\n}\n\n.data-table {\n  min-width: 1400px;\n  table-layout: fixed;\n}\n\nth {\n  padding: 11px 10px;\n  background: #24252a;\n  color: #c0c7d2;\n  text-align: left;\n  font-size: 9.5px;\n  line-height: 1.22;\n  font-weight: 800;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.07);\n}\n\ntd {\n  padding: 11px 10px;\n  color: #c7ccd5;\n  vertical-align: top;\n  font-size: 11.5px;\n  line-height: 1.45;\n  font-weight: 600;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.07);\n  overflow-wrap: anywhere;\n}\n\ntbody tr:nth-child(even) td {\n  background: rgba(255, 255, 255, 0.018);\n}\n\ntr:last-child td {\n  border-bottom: 0;\n}\n\nth:first-child,\ntd:first-child {\n  position: sticky;\n  left: 0;\n  z-index: 1;\n}\n\nth:first-child {\n  z-index: 2;\n}\n\ntd:first-child {\n  background: #24252a;\n}\n\ntbody tr:nth-child(even) td:first-child {\n  background: #27282e;\n}\n\n.col-field {\n  width: 155px;\n}\n\n.col-type {\n  width: 75px;\n}\n\n.col-purpose {\n  width: 330px;\n}\n\n.col-category {\n  width: 135px;\n}\n\n.col-sensitivity {\n  width: 84px;\n}\n\n.col-raw {\n  width: 106px;\n}\n\n.col-ui {\n  width: 90px;\n}\n\n.col-location {\n  width: 145px;\n}\n\n.col-access {\n  width: 70px;\n}\n\n.value {\n  color: #f2f2f5;\n  font-weight: 950;\n}\n\n.value.yes {\n  color: #62f0a4;\n}\n\n.value.no {\n  color: #ff4f6d;\n}\n\n.value.low {\n  color: #9cff00;\n}\n\n.value.medium {\n  color: #f7e76a;\n}\n\n.value.high {\n  color: #ff3d8b;\n}\n\n.value.owner {\n  color: #ff9f1c;\n}\n\n.value.admin {\n  color: #00e5ff;\n}\n\n.value.signed-in {\n  color: #c084fc;\n}\n\n.value.system {\n  color: #ffffff;\n}\n\n.value.public {\n  color: #00ff5a;\n}\n\n.value.none {\n  color: #85858e;\n}\n\n.muted-copy {\n  color: #85858e;\n}\n\n.access-cell {\n  overflow-wrap: normal;\n}\n\n.access-value {\n  display: grid;\n  gap: 3px;\n}\n\n.access-value .value {\n  display: block;\n  line-height: 1.16;\n}\n\n.empty-state {\n  display: none;\n  margin-top: 20px;\n  padding: 18px;\n  border-radius: 15px;\n  background: var(--panel);\n  color: #c9c9cf;\n  font-weight: 850;\n}\n\n.empty-state.visible {\n  display: block;\n}\n\n@media (max-width: 900px) {\n  .page {\n    padding: 24px;\n  }\n\n  .sidebar {\n    position: static;\n    width: auto;\n    max-height: none;\n  }\n\n  .detail-grid {\n    grid-template-columns: 1fr;\n  }\n\n  .legend-body {\n    grid-template-columns: 1fr;\n  }\n\n  .header-actions {\n    margin-left: 0;\n  }\n}";

const parityStyles = `
.supabase-schema-reference-page .header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e0e0e0;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  min-height: 76px;
}

.supabase-schema-reference-page .header h1 {
  margin: 0;
  font-size: 17px;
  font-weight: 900;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #111111;
}

.supabase-schema-reference-page .legend-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  height: 40px;
  min-height: 40px;
  padding: 0 20px;
  border-radius: 14px;
  border: none;
  background: #2f3137;
  color: #eaedf1;
  box-shadow:
    0 8px 24px rgba(0,0,0,0.45),
    inset 0 1px 0 rgba(255,255,255,0.09),
    inset 0 -1px 0 rgba(0,0,0,0.20);
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.supabase-schema-reference-page .legend-toggle-btn:hover {
  background: #343439;
}

.supabase-schema-reference-page .legend-toggle-btn[aria-expanded="true"] {
  background: #38414c;
}

.supabase-schema-reference-page .legend-toggle-btn:active {
  transform: scale(0.98);
}

.supabase-schema-reference-page .filter-group {
  display: inline-flex;
  align-items: center;
  width: auto;
  max-width: 100%;
  gap: 2px;
  margin-top: 14px;
  padding: 4px;
  border: 1px solid #2b2b2e;
  border-radius: 999px;
  background: #2b2b2e;
}

.supabase-schema-reference-page .filter-button {
  position: relative;
  min-height: 30px;
  border: 0;
  border-top: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: #a1a1aa;
  padding: 0 16px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.supabase-schema-reference-page .filter-button:hover {
  color: #e4e4e7;
}

.supabase-schema-reference-page .filter-button.active {
  overflow: hidden;
  border-top-color: rgba(255, 255, 255, 0.2);
  background: linear-gradient(180deg, #5a7292 0%, #4a5f7f 100%);
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.14);
}

.supabase-schema-reference-page .filter-button.active::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.07) 0%, transparent 50%, transparent 100%);
  pointer-events: none;
}

.supabase-schema-reference-page .card-toggle svg,
.supabase-schema-reference-page .object-card.collapsed .card-toggle svg {
  transform: none;
}
`;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "table", label: "Tables" },
  { value: "storage", label: "Storage" },
];

function normalizeClassValue(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function splitCodeValue(value: string) {
  return value.split(",").map((part) => part.trim()).filter(Boolean);
}

function CodeCell({ value }: { value: string }) {
  const parts = splitCodeValue(value);

  return (
    <>
      {parts.map((part, index) => (
        <span key={part}>
          {index > 0 ? ", " : null}
          <code>{part}</code>
        </span>
      ))}
    </>
  );
}

function ValueCell({ value }: { value: string }) {
  return <span className={"value " + normalizeClassValue(value)}>{value}</span>;
}

function AccessCell({ value }: { value: string }) {
  const parts = splitSchemaReferenceAccess(value);
  return (
    <span className="access-value">
      {parts.map((part) => (
        <ValueCell key={part} value={part} />
      ))}
    </span>
  );
}

function PlainCell({ value }: { value: string }) {
  return <span className={value === "None" ? "muted-copy" : undefined}>{value}</span>;
}

function SchemaRow({ row, fieldLabel }: { row: SchemaReferenceRow; fieldLabel: string }) {
  return (
    <tr>
      <td data-label={fieldLabel} className="code-cell"><CodeCell value={row.field} /></td>
      <td data-label="Type">{row.type}</td>
      <td data-label="Purpose">{row.purpose}</td>
      <td data-label="Data Category"><PlainCell value={row.category} /></td>
      <td data-label="Sensitivity"><ValueCell value={row.sensitivity} /></td>
      <td data-label="Raw Backend Exposure"><ValueCell value={row.rawExposure} /></td>
      <td data-label="Read" className="access-cell"><AccessCell value={row.read} /></td>
      <td data-label="Write" className="access-cell"><AccessCell value={row.write} /></td>
      <td data-label="Update" className="access-cell"><AccessCell value={row.update} /></td>
      <td data-label="Delete" className="access-cell"><AccessCell value={row.delete} /></td>
      <td data-label="Feeds Front-End UI"><ValueCell value={row.feedsUi} /></td>
      <td data-label="App Location"><PlainCell value={row.appLocation} /></td>
    </tr>
  );
}

function SchemaCard({ object, collapsed, onToggle }: { object: SchemaReferenceObject; collapsed: boolean; onToggle: () => void }) {
  return (
    <article
      className={"object-card" + (collapsed ? " collapsed" : "")}
      id={object.id}
      data-type={object.type}
    >
      <header className="object-card-header">
        <div className="object-title-line">
          <span className="object-name">{object.name}</span>
          <span className="object-kind">{object.kind}</span>
        </div>
        <button
          className="card-toggle"
          type="button"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand section" : "Collapse section"}
          onClick={onToggle}
        >
          {collapsed ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </header>
      <div className="object-detail">
        <div className="detail-grid">
          <section className="detail-section">
            <h3>Purpose</h3>
            <p>{object.purpose}</p>
          </section>
          <section className="detail-section">
            <h3>Access / Security Rationale</h3>
            <p>{object.rationale}</p>
          </section>
        </div>
        <div className="matrix-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-field">{object.fieldLabel}</th>
                <th className="col-type">Type</th>
                <th className="col-purpose">Purpose</th>
                <th className="col-category">Data Category</th>
                <th className="col-sensitivity">Sensitivity</th>
                <th className="col-raw">Raw Backend Exposure</th>
                <th className="col-access">Read</th>
                <th className="col-access">Write</th>
                <th className="col-access">Update</th>
                <th className="col-access">Delete</th>
                <th className="col-ui">Feeds Front-End UI</th>
                <th className="col-location">App Location</th>
              </tr>
            </thead>
            <tbody>
              {object.rows.map((row) => (
                <SchemaRow key={object.id + "-" + row.field + "-" + row.type} row={row} fieldLabel={object.fieldLabel} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  );
}

function SchemaLegend() {
  return (
    <section className="reference-legend" id="schemaLegend" aria-label="Supabase schema reference legend">
      <div className="legend-header">
        <div className="legend-kicker">Reference Key</div>
        <h2>Supabase Schema Reference Legend</h2>
      </div>
      <div className="legend-body">
        <section className="legend-section">
          <h3>Sensitivity</h3>
          <ul className="legend-rule-list">
            <li><span className="legend-chip value high">High</span> Private content, private media paths, identifiers, moderation data, or anything risky if leaked.</li>
            <li><span className="legend-chip value medium">Medium</span> Account-linked settings, visibility flags, or operational metadata that should stay controlled.</li>
            <li><span className="legend-chip value low">Low</span> Technical metadata or already-intended public/display metadata.</li>
          </ul>
        </section>
        <section className="legend-section">
          <h3>Raw Backend Exposure</h3>
          <ul className="legend-rule-list">
            <li><span className="legend-chip value yes">Yes</span> A normal user can directly read/list the raw row or file outside the app's curated UI path.</li>
            <li><span className="legend-chip value no">No</span> Raw rows or files should not be directly listable; access should happen through intended UI, signed URLs, RPCs, or server-controlled logic.</li>
          </ul>
        </section>
        <section className="legend-section wide">
          <h3>Access Columns</h3>
          <p>Use actors only. Do not put statuses, actions, or content states in Read, Write, Update, or Delete. Signed-in means the Supabase authenticated role. Do not use "Reporter" or "Published" as access values.</p>
          <div className="legend-chip-row">
            <span className="legend-chip value none">None</span>
            <span className="legend-chip value owner">Owner</span>
            <span className="legend-chip value admin">Admin</span>
            <span className="legend-chip value signed-in">Signed-in</span>
            <span className="legend-chip"><span className="access-value"><span className="value owner">Owner</span><span className="value admin">Admin</span></span></span>
            <span className="legend-chip value public">Public</span>
            <span className="legend-chip value system">System</span>
          </div>
        </section>
        <section className="legend-section">
          <h3>Feeds Front-End UI</h3>
          <ul className="legend-rule-list">
            <li><span className="legend-chip value yes">Yes</span> This value directly affects a visible app page, card, selector, list, dashboard, or chat surface.</li>
            <li><span className="legend-chip value no">No</span> This value supports persistence, ownership, audit, or backend logic without directly rendering in the UI.</li>
          </ul>
        </section>
        <section className="legend-section">
          <h3>App Location</h3>
          <p>Use plain page/tool names only, such as Chat interface, Character library, Image library, My stories, Community gallery, or Admin panel / Reports. If Feeds Front-End UI is No, App Location must be <span className="muted-copy">None</span>.</p>
        </section>
      </div>
    </section>
  );
}

function NavLink({ object, active }: { object: SchemaReferenceObject; active: boolean }) {
  return (
    <a
      className={"jump-link" + (active ? " active" : "")}
      href={"#" + object.id}
      data-target={object.id}
      data-type={object.type}
    >
      <span className="nav-link-body">
        <span className="jump-name">{object.name}</span>
        <span className="jump-meta">{object.kind}</span>
      </span>
    </a>
  );
}

export default function SupabaseSchemaReferencePage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [query, setQuery] = useState("");
  const [legendOpen, setLegendOpen] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [activeId, setActiveId] = useState<string>(schemaReferenceObjects[0]?.id ?? "");
  const normalizedQuery = query.trim().toLowerCase();

  const visibleObjects = useMemo(() => {
    return schemaReferenceObjects.filter((object) => {
      const matchesType = filter === "all" || object.type === filter;
      if (!matchesType) return false;
      if (!normalizedQuery) return true;
      return getSchemaReferenceSearchIndex(object).includes(normalizedQuery);
    });
  }, [filter, normalizedQuery]);

  const tableObjects = useMemo(() => visibleObjects.filter((object) => object.type === "table"), [visibleObjects]);
  const storageObjects = useMemo(() => visibleObjects.filter((object) => object.type === "storage"), [visibleObjects]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visibleEntry?.target.id) setActiveId(visibleEntry.target.id);
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: [0.15, 0.35, 0.6] },
    );

    visibleObjects.forEach((object) => {
      const element = document.getElementById(object.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [visibleObjects]);

  const toggleCard = (id: string) => {
    setCollapsedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="supabase-schema-reference-page">
      <style>{pageStyles}</style>
      <style>{parityStyles}</style>
      <header className="header">
        <button
          type="button"
          onClick={() => navigate("/?tab=admin")}
          className="p-2 text-[hsl(var(--ui-surface-2))] hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Go back"
          title="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1>Supabase Schema Reference</h1>
        <div className="header-actions">
          <button
            className="legend-toggle-btn"
            id="legendToggle"
            type="button"
            aria-expanded={legendOpen}
            aria-controls="schemaLegend"
            onClick={() => setLegendOpen((open) => !open)}
          >
            {legendOpen ? "Hide Legend" : "View Legend"}
          </button>
        </div>
      </header>

      <main className="page" id="top">
        <aside className="sidebar" aria-label="Object navigation">
          <a className="nav-root-link" href="#top">Supabase Schema Reference</a>
          <div className="browse-controls">
            <h2>Browse Objects</h2>
            <input
              className="search-input"
              type="search"
              placeholder="Search objects or fields"
              aria-label="Search database objects"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="filter-group" role="group" aria-label="Object type">
              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={"filter-button" + (filter === item.value ? " active" : "")}
                  aria-pressed={filter === item.value}
                  onClick={() => setFilter(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <nav className="jump-list" aria-label="Object jump links">
            {tableObjects.length > 0 ? (
              <section className="nav-section" data-nav-section="table">
                <div className="nav-section-title">Tables</div>
                <div className="nav-tree-group">
                  {tableObjects.map((object) => <NavLink key={object.id} object={object} active={activeId === object.id} />)}
                </div>
              </section>
            ) : null}

            {storageObjects.length > 0 ? (
              <section className="nav-section" data-nav-section="storage">
                <div className="nav-section-title">Storage</div>
                <div className="nav-tree-group">
                  {storageObjects.map((object) => <NavLink key={object.id} object={object} active={activeId === object.id} />)}
                </div>
              </section>
            ) : null}
          </nav>
        </aside>

        <section className="main-column" aria-label="Database object cards">
          {legendOpen ? <SchemaLegend /> : null}
          <div className="objects-heading">
            <h2>Schema Objects</h2>
            <p aria-live="polite">Showing {visibleObjects.length} {visibleObjects.length === 1 ? "object" : "objects"}.</p>
          </div>
          <div className="object-stack" id="objectStack">
            {visibleObjects.map((object) => (
              <SchemaCard key={object.id} object={object} collapsed={collapsedIds.has(object.id)} onToggle={() => toggleCard(object.id)} />
            ))}
          </div>
          <div className={"empty-state" + (visibleObjects.length === 0 ? " visible" : "")}>No objects match the current search or type filter.</div>
        </section>
      </main>
    </div>
  );
}
