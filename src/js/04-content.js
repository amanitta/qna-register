  // ---------- Content rendering: math + markdown + mentions ----------
  function renderContent(raw){
    if(!raw) return '';
    const mathStore = [];
    let text = raw;
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (m, expr) => {
      const idx = mathStore.length;
      let html;
      try{ html = katex.renderToString(expr.trim(), { throwOnError:false, displayMode:true }); }
      catch(e){ html = escapeHtml(m); }
      mathStore.push(html);
      return '\u0002MATH' + idx + '\u0002';
    });
    text = text.replace(/\$([^\$\n]+?)\$/g, (m, expr) => {
      const idx = mathStore.length;
      let html;
      try{ html = katex.renderToString(expr.trim(), { throwOnError:false, displayMode:false }); }
      catch(e){ html = escapeHtml(m); }
      mathStore.push(html);
      return '\u0002MATH' + idx + '\u0002';
    });
    let out;
    try{ out = marked.parse(text, { breaks:true }); out = DOMPurify.sanitize(out); }
    catch(e){ out = escapeHtml(text).replace(/\n/g,'<br>'); }
    out = out.replace(/\u0002MATH(\d+)\u0002/g, (m, idx) => mathStore[Number(idx)] || '');
    return out;
  }
  function linkifyMentions(root, clickable){
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    let node;
    while((node = walker.nextNode())) textNodes.push(node);
    const re = /@(Q-\d{1,4})\b/gi;
    textNodes.forEach(tn => {
      const text = tn.nodeValue;
      re.lastIndex = 0;
      if(!re.test(text)) return;
      re.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let lastIndex = 0, m;
      while((m = re.exec(text))){
        if(m.index > lastIndex) frag.appendChild(document.createTextNode(text.slice(lastIndex, m.index)));
        const seq = parseInt(m[1].split('-')[1], 10);
        const target = state.threads.find(x => x.seq === seq);
        if(target){
          const span = document.createElement('span');
          span.className = 'mention';
          span.textContent = m[0];
          if(clickable) span.setAttribute('data-jump', target.id);
          frag.appendChild(span);
        } else { frag.appendChild(document.createTextNode(m[0])); }
        lastIndex = re.lastIndex;
      }
      if(lastIndex < text.length) frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      tn.parentNode.replaceChild(frag, tn);
    });
  }
  function updateLivePreview(textEl, previewEl){
    const val = textEl.value.trim();
    if(!val){ previewEl.innerHTML = '<span class="empty-note">Nothing to preview yet.</span>'; return; }
    previewEl.innerHTML = renderContent(val);
    linkifyMentions(previewEl, false);
  }
