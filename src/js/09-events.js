  // ---------- Event wiring ----------
  $('#searchInput').addEventListener('input', (e) => { filters.search = e.target.value; renderList(); });
  $('#statusPills').addEventListener('click', (e) => {
    const btn = e.target.closest('.pill');
    if(!btn) return;
    filters.status = btn.getAttribute('data-status');
    document.querySelectorAll('#statusPills .pill').forEach(p => p.classList.toggle('active', p===btn));
    renderList();
  });
  $('#topicFilter').addEventListener('change', (e) => { filters.topic = e.target.value; renderList(); });
  $('#docFilter').addEventListener('change', (e) => { filters.doc = e.target.value; renderList(); });
  $('#exportBtn').addEventListener('click', exportCsv);
  $('#openFileBtn').addEventListener('click', openSharedFile);
  $('#saveFileBtn').addEventListener('click', saveNow);
  $('#legacyOpenInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file){
      const reader = new FileReader();
      reader.onload = () => {
        if(loadStateFromJsonText(reader.result)){ fileName = file.name; refreshStatusText(); }
        else alert('This file doesn\'t look like a Q&A Register JSON file.');
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  });

  const modalBackdrop = $('#modalBackdrop');
  const modalQuestion = $('#mQuestion');
  const modalPreview = $('#modalPreview');
  const modalAttachBtn = $('#modalAttachBtn');
  const modalAttachInput = $('#modalAttachInput');
  setupMentionAutocomplete(modalQuestion, $('#modalMentionBox'));
  modalQuestion.addEventListener('input', () => updateLivePreview(modalQuestion, modalPreview));
  modalAttachBtn.addEventListener('click', () => modalAttachInput.click());
  modalAttachInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => addImageFile(file, modalImages, renderModalImages));
    modalAttachInput.value = '';
  });
  modalQuestion.addEventListener('paste', (e) => {
    const items = Array.from(e.clipboardData ? e.clipboardData.items : []);
    const imageItem = items.find(it => it.type && it.type.startsWith('image/'));
    if(imageItem){ e.preventDefault(); const file = imageItem.getAsFile(); if(file) addImageFile(file, modalImages, renderModalImages); }
  });

  $('#newThreadBtn').addEventListener('click', () => {
    $('#mTopic').value = ''; $('#mDoc').value = ''; modalQuestion.value = '';
    modalImages = []; renderModalImages();
    modalPreview.innerHTML = '<span class="empty-note">Nothing to preview yet.</span>';
    modalBackdrop.classList.add('show');
    setTimeout(()=> $('#mTopic').focus(), 30);
  });
  $('#modalCancel').addEventListener('click', () => modalBackdrop.classList.remove('show'));
  modalBackdrop.addEventListener('click', (e) => { if(e.target === modalBackdrop) modalBackdrop.classList.remove('show'); });
  $('#lightbox').addEventListener('click', () => $('#lightbox').classList.remove('show'));

  function submitNewQuestion(){
    const topic = $('#mTopic').value.trim();
    const document_ = $('#mDoc').value.trim();
    const question = modalQuestion.value.trim();
    if(!question && modalImages.length === 0){ alert('Please write the question (or attach an image) before creating the entry.'); return; }
    const seq = nextSeq();
    const thread = {
      id: 'th_' + Date.now() + '_' + Math.random().toString(36).slice(2,8),
      seq, order: seq, topic: topic || 'Untitled topic', document: document_, status: 'Open',
      createdAt: new Date().toISOString(),
      entries: [{ role:'Q', text: question, date: new Date().toISOString(), images: modalImages.slice(), edited:false }]
    };
    state.threads.push(thread);
    modalBackdrop.classList.remove('show');
    persist();
    populateFilterOptions();
    selectThread(thread.id);
    composerRole = 'A';
    renderDetail();
  }
  $('#modalCreate').addEventListener('click', submitNewQuestion);
  modalQuestion.addEventListener('keydown', (e) => {
    if(e.key !== 'Enter') return;
    if(e.altKey){ e.preventDefault(); insertNewlineAtCursor(modalQuestion); return; }
    if(!e.shiftKey && !e.ctrlKey && !e.metaKey){ e.preventDefault(); submitNewQuestion(); }
  });

  const deleteModalBackdrop = $('#deleteModalBackdrop');
  function closePendingActionModal(){
    deleteModalBackdrop.classList.remove('show');
    pendingAction = null;
  }
  $('#deleteModalCancel').addEventListener('click', closePendingActionModal);
  deleteModalBackdrop.addEventListener('click', (e) => { if(e.target === deleteModalBackdrop) closePendingActionModal(); });
  $('#deleteModalKeep').addEventListener('click', () => {
    if(pendingAction && pendingAction.type === 'delete'){
      deleteThread(pendingAction.threadId, false);
    }
    // reorder: order was already applied + persisted at drop time — nothing further to do
    closePendingActionModal();
  });
  $('#deleteModalRenumber').addEventListener('click', () => {
    if(pendingAction && pendingAction.type === 'delete'){
      deleteThread(pendingAction.threadId, true);
    } else if(pendingAction && pendingAction.type === 'reorder'){
      const ordered = pendingAction.orderedIds.map(id => state.threads.find(t=>t.id===id)).filter(Boolean);
      renumberSeqToMatchOrder(ordered);
      persist(); populateFilterOptions(); renderList(); renderDetail();
    }
    closePendingActionModal();
  });

  const roleLabelsModalBackdrop = $('#roleLabelsModalBackdrop');
  $('#roleLabelsBtn').addEventListener('click', () => {
    $('#roleLabelQ').value = state.roleLabels.Q;
    $('#roleLabelA').value = state.roleLabels.A;
    roleLabelsModalBackdrop.classList.add('show');
  });
  $('#roleLabelsCancel').addEventListener('click', () => roleLabelsModalBackdrop.classList.remove('show'));
  roleLabelsModalBackdrop.addEventListener('click', (e) => { if(e.target === roleLabelsModalBackdrop) roleLabelsModalBackdrop.classList.remove('show'); });
  $('#roleLabelsSave').addEventListener('click', () => {
    state.roleLabels = {
      Q: $('#roleLabelQ').value.trim() || 'Authorities',
      A: $('#roleLabelA').value.trim() || 'CCP',
    };
    persist();
    renderDetail();
    roleLabelsModalBackdrop.classList.remove('show');
  });
