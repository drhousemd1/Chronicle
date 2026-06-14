import { supabase } from "@/integrations/supabase/client";

export const ADMIN_NOTES_KEY = "overview_notes";

const ALLOWED_NOTE_TAGS = new Set([
  "a",
  "b",
  "br",
  "div",
  "em",
  "i",
  "input",
  "li",
  "ol",
  "p",
  "s",
  "span",
  "strike",
  "strong",
  "u",
  "ul",
]);

const DROP_NOTE_TAGS_WITH_CONTENT = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "link",
  "meta",
]);

const SAFE_NOTE_STYLE_PROPERTIES = new Set([
  "accent-color",
  "align-items",
  "color",
  "cursor",
  "display",
  "flex-shrink",
  "font-size",
  "font-style",
  "font-weight",
  "gap",
  "line-height",
  "margin",
  "margin-top",
  "min-width",
  "outline",
  "text-align",
  "text-decoration",
]);

function isUnsafeCssValue(value: string): boolean {
  return /(?:url\s*\(|expression\s*\(|javascript:|@import|behavior\s*:|-moz-binding)/i.test(value);
}

function sanitizeNoteStyle(style: string | null): string {
  if (!style) return "";

  return style
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const separatorIndex = declaration.indexOf(":");
      if (separatorIndex === -1) return "";

      const property = declaration.slice(0, separatorIndex).trim().toLowerCase();
      const value = declaration.slice(separatorIndex + 1).trim();
      if (!property || !value || !SAFE_NOTE_STYLE_PROPERTIES.has(property)) return "";
      if (isUnsafeCssValue(value)) return "";

      return `${property}:${value}`;
    })
    .filter(Boolean)
    .join(";");
}

function isSafeNoteHref(href: string | null): boolean {
  if (!href) return false;

  const trimmed = href.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("#") || trimmed.startsWith("/")) return true;

  try {
    const base = typeof window !== "undefined" ? window.location.origin : "https://chronicle.local";
    const url = new URL(trimmed, base);
    return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:" || url.protocol === "tel:";
  } catch {
    return false;
  }
}

function unwrapElement(element: Element): void {
  const parent = element.parentNode;
  if (!parent) return;

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }
  parent.removeChild(element);
}

function sanitizeNoteElement(element: Element): void {
  const tagName = element.tagName.toLowerCase();

  if (DROP_NOTE_TAGS_WITH_CONTENT.has(tagName)) {
    element.remove();
    return;
  }

  Array.from(element.childNodes).forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      sanitizeNoteElement(child as Element);
    } else if (child.nodeType !== Node.TEXT_NODE) {
      child.remove();
    }
  });

  if (!ALLOWED_NOTE_TAGS.has(tagName)) {
    unwrapElement(element);
    return;
  }

  const originalHref = element.getAttribute("href");
  const originalTarget = element.getAttribute("target");
  const originalChecked = element.hasAttribute("checked");
  const sanitizedStyle = sanitizeNoteStyle(element.getAttribute("style"));

  Array.from(element.attributes).forEach((attribute) => {
    element.removeAttribute(attribute.name);
  });

  if (sanitizedStyle) {
    element.setAttribute("style", sanitizedStyle);
  }

  if (tagName === "a") {
    if (isSafeNoteHref(originalHref)) {
      element.setAttribute("href", originalHref!.trim());
      if (originalTarget === "_blank") {
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noopener noreferrer");
      }
    }
    return;
  }

  if (tagName === "input") {
    element.setAttribute("type", "checkbox");
    if (originalChecked) {
      element.setAttribute("checked", "");
    }
  }
}

function textFromSanitizedHtml(contentHtml: string): string {
  if (typeof document === "undefined") {
    return contentHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = contentHtml;
  return (wrapper.textContent || "").replace(/\s+/g, " ").trim();
}

export function sanitizeFinanceNoteHtml(rawHtml: unknown): string {
  if (typeof rawHtml !== "string" || rawHtml.trim() === "") return "";

  if (typeof document === "undefined" || typeof Node === "undefined") {
    return rawHtml.replace(/<[^>]*>/g, "");
  }

  const template = document.createElement("template");
  template.innerHTML = rawHtml;

  Array.from(template.content.childNodes).forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      sanitizeNoteElement(child as Element);
    } else if (child.nodeType !== Node.TEXT_NODE) {
      child.remove();
    }
  });

  return template.innerHTML.trim();
}

export function buildAdminOverviewNotePayload(contentHtml: string, userId: string) {
  const sanitizedHtml = sanitizeFinanceNoteHtml(contentHtml);

  return {
    note_key: ADMIN_NOTES_KEY,
    content: textFromSanitizedHtml(sanitizedHtml),
    content_html: sanitizedHtml,
    author_id: userId,
    updated_by: userId,
  };
}

export async function fetchAdminOverviewNote() {
  const { data, error } = await supabase
    .from("admin_notes")
    .select("content_html, updated_at")
    .eq("note_key", ADMIN_NOTES_KEY)
    .maybeSingle();

  if (error) throw error;
  return data
    ? {
      ...data,
      content_html: sanitizeFinanceNoteHtml(data.content_html || ""),
    }
    : data;
}

export async function saveAdminOverviewNote(contentHtml: string) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user?.id) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("admin_notes")
    .upsert(buildAdminOverviewNotePayload(contentHtml, authData.user.id), { onConflict: "note_key" })
    .select("updated_at")
    .single();

  if (error) throw error;
  return data;
}
