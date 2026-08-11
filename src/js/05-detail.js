  // ---------- Thread detail: header, log, composer ----------
  function renderDetail(){
    const t = state.threads.find(x => x.id === selectedId);
    if(!t){
      detailEl.innerHTML = `<div class="detail-empty">Select a question on the left, or create a new one to start tracking it here.</div>`;
      return;
    }
    const entriesHtml = t.entries.map((e, idx) => {
      if(editingEntryIdx === idx){
        return `
        <div class="entry role-${e.role}">
          <div class="entry-card" style="max-width:90%;">
            <div class="entry-head">
              <span class="entry-role">${e.role === 'Q' ? 'Question' : 'Answer'}</span>
              <span class="entry-date mono">${fmtDateTime(e.date)}</span>
            </div>
            <div class="edit-entry-box">
              <textarea id="editEntryText">${escapeHtml(e.text || '')}</textarea>
              <div class="edit-entry-actions">
                <button class="btn secondary small" id="cancelEditEntry" type="button">Cancel</button>
                <button class="btn small" id="saveEditEntry" type="button" data-idx="${idx}">Save</button>
              </div>
            </div>
          </div>
        </div>`;
      }
      const imagesHtml = (e.images && e.images.length) ? `<div class="entry-images">${e.images.map(src => `<img src="${src}" data-src="${src}">`).join('')}</div>` : '';
      const editedTag = e.edited ? `<span class="edited-tag" title="Edited ${fmtDateTime(e.editedAt)}">(edited)</span>` : '';
      return `
      <div class="entry role-${e.role}">
        <div class="entry-card">
          <div class="entry-head">
            <span class="entry-role">${e.role === 'Q' ? 'Question' : 'Answer'}</span>
            <span class="entry-date mono">${fmtDateTime(e.date)}</span>
            ${editedTag}
            <span class="entry-actions">
              <button class="entry-edit-btn" data-edit-idx="${idx}" type="button" title="Edit entry">${ICON_EDIT}</button>
              <button class="entry-delete-btn" data-delete-idx="${idx}" type="button" title="Delete entry">${ICON_TRASH}</button>
            </span>
          </div>
          <div class="entry-text" data-entry-idx="${idx}">${renderContent(e.text)}</div>
          ${imagesHtml}
        </div>
      </div>`;
    }).join('');

    detailEl.innerHTML = `
      <div class="detail-header">
        <div class="detail-header-top">
          <div class="detail-title-row">
            <span class="stamp">${stampId(t.seq)}</span>
            <input class="detail-title-input" id="editTitleTop" value="${escapeHtml(t.topic)}" title="Click to edit the question's title" placeholder="Untitled topic">
          </div>
          <button class="icon-btn" id="deleteThreadBtn">Delete</button>
        </div>
        <div class="detail-fields">
          <div class="field"><label for="editDoc">Related document</label><input id="editDoc" type="text" value="${escapeHtml(t.document)}"></div>
          <div class="field">
            <label for="editStatus">Status</label>
            <select id="editStatus">${STATUSES.map(s => `<option value="${s}" ${s===t.status?'selected':''}>${s}</option>`).join('')}</select>
          </div>
          <div class="field"><label>Opened</label><input type="text" value="${fmtDateTime(t.createdAt)}" disabled></div>
        </div>
      </div>
      <div class="log" id="logPanel">${entriesHtml || '<div class="empty-list">No entries yet. Add the first message below.</div>'}</div>
      <div class="h-divider" id="hDivider">
        <button class="divider-btn h" id="collapseComposerBtn" title="Collapse/expand message box">▼</button>
      </div>
      <div class="composer" id="composerPanel">
        <div class="composer-toggle">
          <button class="role-toggle ${composerRole==='Q'?'active-Q':''}" data-role="Q">Question</button>
          <button class="role-toggle ${composerRole==='A'?'active-A':''}" data-role="A">Answer</button>
          <button class="btn secondary small" id="attachImgBtn" type="button">+ Image</button>
        </div>
        <input type="file" id="attachImgInput" accept="image/*" multiple style="display:none">
        <div class="composer-images" id="composerImagesWrap"></div>
        <div class="hint-row"><span class="paste-hint">Markdown &amp; $LaTeX$ supported. Paste an image, or use "+ Image". Type @Q-001 to reference another question.</span></div>
        <div class="textarea-wrap">
          <textarea id="composerText" placeholder="Add a ${composerRole === 'Q' ? 'follow-up question' : 'answer'}…"></textarea>
          <div class="mention-autocomplete" id="composerMentionBox"></div>
        </div>
        <div class="preview-label">Preview</div>
        <div class="live-preview entry-text" id="composerPreview"><span class="empty-note">Nothing to preview yet.</span></div>
        <div class="composer-actions"><button class="btn" id="addEntryBtn">Add entry</button></div>
      </div>
    `;

    renderComposerImages();
    detailEl.querySelectorAll('.entry-text').forEach(el => linkifyMentions(el, true));
    detailEl.querySelectorAll('.mention[data-jump]').forEach(el => {
      el.addEventListener('click', () => selectThread(el.getAttribute('data-jump')));
    });

    $('#editTitleTop').addEventListener('change', (e) => {
      t.topic = e.target.value.trim();
      persist(); populateFilterOptions(); renderList();
    });
    $('#editDoc').addEventListener('change', (e) => { t.document = e.target.value.trim(); persist(); populateFilterOptions(); renderList(); });
    $('#editStatus').addEventListener('change', (e) => { t.status = e.target.value; persist(); renderList(); });
    $('#deleteThreadBtn').addEventListener('click', () => {
      if(confirm('Delete this question and its full history? This cannot be undone.')){
        state.threads = state.threads.filter(x => x.id !== t.id);
        selectedId = null; persist(); populateFilterOptions(); renderList(); renderDetail();
      }
    });
    detailEl.querySelectorAll('.role-toggle').forEach(btn => {
      btn.addEventListener('click', () => { composerRole = btn.getAttribute('data-role'); renderDetail(); });
    });
    detailEl.querySelectorAll('.entry-images img').forEach(img => {
      img.addEventListener('click', () => openLightbox(img.getAttribute('data-src')));
    });
    detailEl.querySelectorAll('.entry-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => { editingEntryIdx = Number(btn.getAttribute('data-edit-idx')); renderDetail(); });
    });
    detailEl.querySelectorAll('.entry-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-delete-idx'));
        if(confirm('Delete this entry? This cannot be undone.')){
          t.entries.splice(idx, 1);
          if(editingEntryIdx === idx) editingEntryIdx = null;
          persist(); renderList(); renderDetail();
        }
      });
    });
    const cancelEditBtn = $('#cancelEditEntry');
    if(cancelEditBtn) cancelEditBtn.addEventListener('click', () => { editingEntryIdx = null; renderDetail(); });
    const saveEditBtn = $('#saveEditEntry');
    if(saveEditBtn) saveEditBtn.addEventListener('click', () => {
      const idx = Number(saveEditBtn.getAttribute('data-idx'));
      const newText = $('#editEntryText').value.trim();
      const entry = t.entries[idx];
      if(newText !== (entry.text || '')){
        entry.text = newText; entry.edited = true; entry.editedAt = new Date().toISOString();
        persist(); renderList();
      }
      editingEntryIdx = null;
      renderDetail();
    });

    const attachBtn = $('#attachImgBtn');
    const attachInput = $('#attachImgInput');
    attachBtn.addEventListener('click', () => attachInput.click());
    attachInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      files.forEach(file => addImageFile(file, composerImages, renderComposerImages));
      attachInput.value = '';
    });

    const textarea = $('#composerText');
    const previewEl = $('#composerPreview');
    textarea.addEventListener('paste', (e) => {
      const items = Array.from(e.clipboardData ? e.clipboardData.items : []);
      const imageItem = items.find(it => it.type && it.type.startsWith('image/'));
      if(imageItem){ e.preventDefault(); const file = imageItem.getAsFile(); if(file) addImageFile(file, composerImages, renderComposerImages); }
    });
    textarea.addEventListener('input', () => updateLivePreview(textarea, previewEl));
    setupMentionAutocomplete(textarea, $('#composerMentionBox'));

    $('#addEntryBtn').addEventListener('click', () => {
      const text = textarea.value.trim();
      if(!text && composerImages.length === 0) return;
      t.entries.push({ role: composerRole, text, date: new Date().toISOString(), images: composerImages.slice(), edited:false });
      if(composerRole === 'Q' && (t.status === 'Answered' || t.status === 'Closed')){ t.status = 'Open'; }
      else if(composerRole === 'A' && t.status !== 'Closed'){ t.status = 'Answered'; }
      composerRole = composerRole === 'Q' ? 'A' : 'Q';
      composerImages = [];
      persist();
      renderList(); renderDetail();
    });

    const hDivider = detailEl.querySelector('#hDivider');
    if(hDivider){
      hDivider.addEventListener('mousedown', startComposerDrag);
      hDivider.addEventListener('touchstart', startComposerDrag, { passive:true });
    }
    bindCollapseToggle(detailEl.querySelector('#collapseComposerBtn'), 'composerCollapsed', null, applyVSplit, updateVDividerIcons);
    applyVSplit();
    updateVDividerIcons();

    const logEl = detailEl.querySelector('#logPanel');
    if(logEl) logEl.scrollTop = logEl.scrollHeight;
  }
