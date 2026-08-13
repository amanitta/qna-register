  // ---------- Init ----------
  async function init(){
    detailEl.innerHTML = `<div class="detail-empty">Loading…</div>`;
    loadLocalCache();
    loadUiPrefs();
    loadDrafts();
    applyLayout();
    updateDividerIcons();
    populateFilterOptions();
    renderList();
    renderDetail();
    await tryReconnect();
  }
  init();
