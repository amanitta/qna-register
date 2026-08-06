  // ---------- Init ----------
  async function init(){
    detailEl.innerHTML = `<div class="detail-empty">Loading…</div>`;
    loadLocalCache();
    loadUiPrefs();
    applyLayout();
    updateDividerIcons();
    populateFilterOptions();
    renderList();
    renderDetail();
    await tryReconnect();
  }
  init();
