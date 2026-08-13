  // ---------- Filters / list ----------
  let draggedThreadId = null;
  function uniqueValues(field){
    const set = new Set();
    state.threads.forEach(t => { if(t[field]) set.add(t[field]); });
    return Array.from(set).sort((a,b)=> a.localeCompare(b));
  }
  function populateFilterOptions(){
    const topicSel = $('#topicFilter'); const docSel = $('#docFilter');
    const curTopic = topicSel.value, curDoc = docSel.value;
    topicSel.innerHTML = '<option value="all">All topics</option>' + uniqueValues('topic').map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
    docSel.innerHTML = '<option value="all">All related documents</option>' + uniqueValues('document').map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
    if(Array.from(topicSel.options).some(o=>o.value===curTopic)) topicSel.value = curTopic;
    else { topicSel.value = 'all'; filters.topic = 'all'; }
    if(Array.from(docSel.options).some(o=>o.value===curDoc)) docSel.value = curDoc;
    else { docSel.value = 'all'; filters.doc = 'all'; }
    $('#topicOptions').innerHTML = uniqueValues('topic').map(t => `<option value="${escapeHtml(t)}">`).join('');
    $('#docOptions').innerHTML = uniqueValues('document').map(d => `<option value="${escapeHtml(d)}">`).join('');
  }
  function filteredThreads(){
    return state.threads.filter(t => {
      if(filters.status !== 'all' && t.status !== filters.status) return false;
      if(filters.topic !== 'all' && t.topic !== filters.topic) return false;
      if(filters.doc !== 'all' && t.document !== filters.doc) return false;
      if(filters.search){
        const q = filters.search.toLowerCase();
        const hay = [t.topic, t.document, stampId(t.seq), String(t.seq), ...t.entries.map(e=>e.text)].join(' ').toLowerCase();
        if(!hay.includes(q)) return false;
      }
      return true;
    }).sort((a,b)=> (a.order||0) - (b.order||0));
  }
  function lastEntrySnippet(t){
    if(!t.entries.length) return 'No entries yet.';
    const last = t.entries[t.entries.length-1];
    const roleLabel = last.role === 'Q' ? 'Q: ' : 'A: ';
    return roleLabel + (last.text || (last.images && last.images.length ? '[image attached]' : ''));
  }
  function snapshotCurrentDraft(){
    if(!selectedId) return;
    const composerTextEl = $('#composerText');
    const composerText = composerTextEl ? composerTextEl.value : '';
    const editTextEl = $('#editEntryText');
    const editText = editTextEl ? editTextEl.value : '';
    const hasContent = composerText.trim() !== '' || composerImages.length > 0 || editingEntryIdx !== null;
    if(!hasContent){
      delete drafts[selectedId];
    } else {
      drafts[selectedId] = {
        composerRole,
        composerText,
        composerImages: composerImages.slice(),
        editingEntryIdx,
        editText: editingEntryIdx !== null ? editText : ''
      };
    }
    saveDrafts();
  }
  function draftHasContent(id){
    const d = drafts[id];
    if(!d) return false;
    return (d.composerText||'').trim() !== '' || (d.composerImages||[]).length > 0 || d.editingEntryIdx != null;
  }
  function selectThread(id){
    snapshotCurrentDraft();
    selectedId = id;
    const d = drafts[id];
    composerRole = d ? d.composerRole : 'Q';
    composerImages = d ? d.composerImages.slice() : [];
    editingEntryIdx = d && d.editingEntryIdx != null ? d.editingEntryIdx : null;
    renderList(); renderDetail();
  }
  function renderList(){
    const items = filteredThreads();
    if(state.threads.length === 0){
      threadListEl.innerHTML = `<div class="empty-list">No questions yet.<br>Create the first one to start the register.</div>`;
      return;
    }
    if(items.length === 0){
      threadListEl.innerHTML = `<div class="empty-list">No questions match these filters.</div>`;
      return;
    }
    threadListEl.innerHTML = items.map(t => `
      <div class="thread-card ${t.id===selectedId ? 'selected':''}" draggable="true" data-id="${t.id}">
        ${draftHasContent(t.id) ? '<span class="draft-dot" title="Unsaved draft in this browser"></span>' : ''}
        <div class="thread-top">
          <span class="stamp">${stampId(t.seq)}</span>
          <span class="status-badge ${statusClass(t.status)}">${escapeHtml(t.status)}</span>
        </div>
        <div class="thread-topic">${escapeHtml(t.topic || 'Untitled topic')}</div>
        <div class="thread-meta">${escapeHtml(t.document || 'No document linked')}</div>
        <div class="thread-snippet">${escapeHtml(lastEntrySnippet(t))}</div>
      </div>
    `).join('');
    threadListEl.querySelectorAll('.thread-card').forEach(card => {
      card.addEventListener('click', () => selectThread(card.getAttribute('data-id')));
      card.addEventListener('dragstart', (e) => {
        draggedThreadId = card.getAttribute('data-id');
        e.dataTransfer.effectAllowed = 'move';
        try{ e.dataTransfer.setData('text/plain', draggedThreadId); }catch(err){}
      });
      card.addEventListener('dragover', (e) => {
        if(!draggedThreadId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if(card.getAttribute('data-id') === draggedThreadId) return;
        const rect = card.getBoundingClientRect();
        const before = (e.clientY - rect.top) < rect.height / 2;
        threadListEl.querySelectorAll('.thread-card').forEach(c => c.classList.remove('drag-over-before','drag-over-after'));
        card.classList.add(before ? 'drag-over-before' : 'drag-over-after');
      });
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetId = card.getAttribute('data-id');
        const before = card.classList.contains('drag-over-before');
        threadListEl.querySelectorAll('.thread-card').forEach(c => c.classList.remove('drag-over-before','drag-over-after'));
        if(!draggedThreadId || draggedThreadId === targetId){ draggedThreadId = null; return; }
        finalizeReorder(draggedThreadId, targetId, before ? 'before' : 'after');
        draggedThreadId = null;
      });
      card.addEventListener('dragend', () => {
        threadListEl.querySelectorAll('.thread-card').forEach(c => c.classList.remove('drag-over-before','drag-over-after'));
        draggedThreadId = null;
      });
    });
  }
  function finalizeReorder(draggedId, targetId, position){
    const ordered = state.threads.slice().sort((a,b)=>(a.order||0)-(b.order||0));
    const draggedIdx = ordered.findIndex(th=>th.id===draggedId);
    if(draggedIdx === -1) return;
    const [draggedThread] = ordered.splice(draggedIdx, 1);
    let targetIdx = ordered.findIndex(th=>th.id===targetId);
    if(targetIdx === -1) return;
    if(position === 'after') targetIdx += 1;
    ordered.splice(targetIdx, 0, draggedThread);
    ordered.forEach((th, i) => { th.order = i + 1; });
    persist();
    renderList();
    pendingAction = { type: 'reorder', orderedIds: ordered.map(th => th.id) };
    $('#pendingActionTitle').textContent = 'Renumber after reorder?';
    $('#pendingActionBody').textContent = 'The question order has changed. Keep the existing Q-numbers (they may no longer match the list position), or renumber them to match the new order (any @Q-XXX references are rewritten automatically).';
    $('#deleteModalKeep').textContent = 'Keep numbering';
    $('#deleteModalRenumber').textContent = 'Renumber to match';
    $('#deleteModalBackdrop').classList.add('show');
  }
  function openLightbox(src){ $('#lightboxImg').src = src; $('#lightbox').classList.add('show'); }
