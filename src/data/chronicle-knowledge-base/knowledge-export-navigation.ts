/** Trusted, self-contained navigation for the downloaded Knowledge Base only. */
export const KNOWLEDGE_EXPORT_SCRIPT = String.raw`(() => {
  "use strict";

  function tabsFor(section) {
    return Array.from(section.querySelectorAll('.knowledge-tab-rail [role="tab"]'))
      .filter(tab => tab.closest('.knowledge-switcher') === section);
  }

  function panelFor(section, tab) {
    const id = tab.getAttribute('aria-controls');
    const panel = id ? document.getElementById(id) : null;
    return panel && panel.matches('.knowledge-content-panel[role="tabpanel"]')
      && panel.closest('.knowledge-switcher') === section ? panel : null;
  }

  function selectTab(section, selectedTab, moveFocus) {
    const selectedPanel = panelFor(section, selectedTab);
    if (!selectedPanel) return false;
    const changed = selectedTab.getAttribute('aria-selected') !== 'true' || selectedPanel.hidden;
    for (const tab of tabsFor(section)) {
      const selected = tab === selectedTab;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const panel = panelFor(section, tab);
      if (panel) panel.hidden = !selected;
    }
    if (changed) selectedPanel.scrollTop = 0;
    if (moveFocus) selectedTab.focus({ preventScroll: true });
    return true;
  }

  function hashTarget(hash) {
    if (!hash || hash === '#') return null;
    try {
      return document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch {
      return null;
    }
  }

  function revealHash() {
    const target = hashTarget(window.location.hash);
    if (!target) return;
    for (let ancestor = target; ancestor; ancestor = ancestor.parentElement) {
      if (ancestor.hasAttribute('data-export-sources')) ancestor.hidden = false;
      if (ancestor.tagName === 'DETAILS') ancestor.open = true;
      if (ancestor.matches('.knowledge-content-panel[role="tabpanel"]')) {
        const section = ancestor.closest('.knowledge-switcher');
        const tab = section && tabsFor(section)
          .find(candidate => candidate.getAttribute('aria-controls') === ancestor.id);
        if (tab) selectTab(section, tab, false);
      }
    }
    if (typeof target.scrollIntoView === 'function') target.scrollIntoView({ block: 'start' });
  }

  function initialize() {
    const trigger = document.querySelector('.chronicle-knowledge-download-button');
    const menu = document.querySelector('[data-export-menu]');
    if (trigger && menu) {
      const items = Array.from(menu.querySelectorAll('[data-export-format]'));
      let saving = false;
      trigger.disabled = false;
      trigger.removeAttribute('disabled');
      trigger.setAttribute('aria-busy', 'false');
      trigger.setAttribute('aria-controls', menu.id);
      trigger.setAttribute('aria-haspopup', 'menu');
      for (const item of items) item.tabIndex = -1;

      function closeMenu(restoreFocus) {
        menu.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('data-state', 'closed');
        if (restoreFocus) trigger.focus({ preventScroll: true });
      }

      function openMenu(index) {
        menu.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        trigger.setAttribute('data-state', 'open');
        if (items[index]) items[index].focus({ preventScroll: true });
      }

      async function saveCopy(format) {
        if (saving || (format !== 'html' && format !== 'markdown')) return;
        saving = true;
        const extension = format === 'html' ? '.html' : '.md';
        const type = format === 'html' ? 'text/html' : 'text/markdown';
        const exportedAt = document.querySelector('meta[name="exported-at"]');
        const timestamp = (exportedAt && exportedAt.content) || new Date().toISOString();
        const filename = 'chronicle-knowledge-base-' + timestamp.replace(/[:.]/g, '-') + extension;
        try {
          // Native destination selection must retain the original user gesture.
          // Do not serialize the large document or await anything beforehand.
          const selection = typeof window.showSaveFilePicker === 'function'
            ? window.showSaveFilePicker({
              suggestedName: filename,
              types: [{ description: format === 'html' ? 'HTML document' : 'Markdown document', accept: { [type]: [extension] } }]
            }) : null;
          closeMenu(true);
          const target = selection ? await selection : null;
          const markdown = document.getElementById('knowledge-export-markdown');
          if (format === 'markdown' && (!markdown || !markdown.content)) throw new Error('The Markdown copy is unavailable in this file.');
          const text = format === 'html'
            ? '<!DOCTYPE html>\n' + document.documentElement.outerHTML
            : markdown.content.textContent;
          const blob = new Blob([text], { type: type + ';charset=utf-8' });
          if (target) {
            const writable = await target.createWritable();
            try {
              await writable.write(blob);
              await writable.close();
            } catch (error) {
              if (typeof writable.abort === 'function') {
                try { await writable.abort(); } catch { /* Preserve the original save error. */ }
              }
              throw error;
            }
          } else {
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = filename;
            document.body.append(anchor);
            try { anchor.click(); } finally {
              anchor.remove();
              window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
            }
          }
        } catch (error) {
          closeMenu(true);
          if (!error || error.name !== 'AbortError') window.alert('Could not save the Knowledge Base. ' + (error && error.message ? error.message : 'Please try again.'));
        } finally {
          saving = false;
        }
      }

      closeMenu(false);
      trigger.addEventListener('click', () => menu.hidden ? openMenu(0) : closeMenu(true));
      trigger.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          openMenu(event.key === 'ArrowUp' ? items.length - 1 : 0);
        }
      });
      for (const item of items) {
        item.addEventListener('click', () => { void saveCopy(item.getAttribute('data-export-format')); });
        item.addEventListener('keydown', event => {
          const index = items.indexOf(item);
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
          } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            void saveCopy(item.getAttribute('data-export-format'));
          }
        });
      }
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !menu.hidden) {
          event.preventDefault();
          closeMenu(true);
        }
      });
      document.addEventListener('click', event => {
        if (!menu.hidden && event.target instanceof Node && !menu.contains(event.target) && !trigger.contains(event.target)) closeMenu(true);
      });
    }

    for (const back of document.querySelectorAll('.chronicle-knowledge-header .chronicle-knowledge-back')) {
      back.addEventListener('click', event => {
        event.preventDefault();
        const top = document.getElementById('knowledge-base-top') || document.body;
        if (typeof top.scrollIntoView === 'function') top.scrollIntoView({ block: 'start' });
      });
    }
    for (const section of document.querySelectorAll('.knowledge-switcher')) {
      const tabs = tabsFor(section).filter(tab => panelFor(section, tab));
      const initial = tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0];
      if (initial) selectTab(section, initial, false);
      for (const tab of tabs) {
        tab.addEventListener('click', () => selectTab(section, tab, false));
        tab.addEventListener('keydown', event => {
          let next;
          const index = tabs.indexOf(tab);
          if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
          else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = tabs.length - 1;
          else return;
          event.preventDefault();
          selectTab(section, tabs[next], true);
        });
      }
    }

    document.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      const href = anchor && anchor.getAttribute('href');
      if (!href || !href.startsWith('#') || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self') || !hashTarget(href)) return;
      event.preventDefault();
      if (window.location.hash !== href) window.history.pushState(null, '', href);
      revealHash();
    });
    window.addEventListener('hashchange', revealHash);
    window.addEventListener('popstate', revealHash);
    revealHash();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();`;
