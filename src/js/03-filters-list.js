  // ---------- Filters / list ----------
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
    if(Array.from(docSel.options).some(o=>o.value===curDoc)) docSel.value = curDoc;
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
        const hay = [t.topic, t.document, ...t.entries.map(e=>e.text)].join(' ').toLowerCase();
        if(!hay.includes(q)) return false;
      }
      return true;
    }).sort((a,b)=> (a.seq||0) - (b.seq||0));
  }
  function lastEntrySnippet(t){
    if(!t.entries.length) return 'No entries yet.';
    const last = t.entries[t.entries.length-1];
    const roleLabel = last.role === 'Q' ? 'Q: ' : 'A: ';
    return roleLabel + (last.text || (last.images && last.images.length ? '[image attached]' : ''));
  }
  function selectThread(id){
    selectedId = id; composerRole = 'Q'; composerImages = []; editingEntryIdx = null;
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
      <div class="thread-card ${t.id===selectedId ? 'selected':''}" data-id="${t.id}">
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
    });
  }
  function openLightbox(src){ $('#lightboxImg').src = src; $('#lightbox').classList.add('show'); }
