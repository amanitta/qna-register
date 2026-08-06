  // ---------- Composer/modal widgets: image attachments + @mention autocomplete ----------
  function renderComposerImages(){
    const wrap = $('#composerImagesWrap');
    if(!wrap) return;
    wrap.innerHTML = composerImages.map((src, idx) => `<div class="thumb"><img src="${src}"><button class="remove" data-idx="${idx}" type="button" title="Remove">×</button></div>`).join('');
    wrap.querySelectorAll('.remove').forEach(btn => { btn.addEventListener('click', () => { composerImages.splice(Number(btn.getAttribute('data-idx')), 1); renderComposerImages(); }); });
  }
  function renderModalImages(){
    const wrap = $('#modalImagesWrap');
    if(!wrap) return;
    wrap.innerHTML = modalImages.map((src, idx) => `<div class="thumb"><img src="${src}"><button class="remove" data-idx="${idx}" type="button" title="Remove">×</button></div>`).join('');
    wrap.querySelectorAll('.remove').forEach(btn => { btn.addEventListener('click', () => { modalImages.splice(Number(btn.getAttribute('data-idx')), 1); renderModalImages(); }); });
  }
  function addImageFile(file, targetArray, rerenderFn){
    if(!file || !file.type || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1000;
        let w = img.width, h = img.height;
        if(w > maxDim || h > maxDim){
          if(w > h){ h = Math.round(h * (maxDim / w)); w = maxDim; } else { w = Math.round(w * (maxDim / h)); h = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        targetArray.push(canvas.toDataURL('image/jpeg', 0.82));
        rerenderFn();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
  function setupMentionAutocomplete(textarea, dropdownEl){
    textarea.addEventListener('input', () => {
      const val = textarea.value;
      const pos = textarea.selectionStart;
      const uptoCursor = val.slice(0, pos);
      const match = /@([A-Za-z0-9\-]{0,6})$/.exec(uptoCursor);
      if(!match){ dropdownEl.style.display = 'none'; return; }
      const query = match[1].toLowerCase();
      const candidates = state.threads.filter(t => {
        const stamp = stampId(t.seq).toLowerCase();
        return stamp.includes(query.replace(/^q-?/,'')) || stamp.includes(query) || (t.topic||'').toLowerCase().includes(query);
      }).slice(0, 6);
      if(candidates.length === 0){ dropdownEl.style.display = 'none'; return; }
      dropdownEl.innerHTML = candidates.map(c => `<div class="mention-option" data-stamp="${stampId(c.seq)}">${stampId(c.seq)} — ${escapeHtml(c.topic || 'Untitled topic')}</div>`).join('');
      dropdownEl.style.display = 'block';
      dropdownEl.querySelectorAll('.mention-option').forEach(opt => {
        opt.addEventListener('mousedown', (ev) => {
          ev.preventDefault();
          const stamp = opt.getAttribute('data-stamp');
          const newVal = val.slice(0, match.index) + '@' + stamp + ' ' + val.slice(pos);
          textarea.value = newVal;
          const newPos = match.index + stamp.length + 2;
          textarea.focus(); textarea.setSelectionRange(newPos, newPos);
          dropdownEl.style.display = 'none';
          textarea.dispatchEvent(new Event('input'));
        });
      });
    });
    textarea.addEventListener('blur', () => setTimeout(() => { dropdownEl.style.display = 'none'; }, 150));
  }
