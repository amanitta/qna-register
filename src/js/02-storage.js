  // ---------- IndexedDB: remembers the picked file handle across reloads ----------
  function idbOpen(){
    return new Promise((resolve,reject)=>{
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(IDB_STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idbSet(key, value){
    try{
      const db = await idbOpen();
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(value, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    }catch(e){ return false; }
  }
  async function idbGet(key){
    try{
      const db = await idbOpen();
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    }catch(e){ return null; }
  }

  // ---------- Local cache (safety net, always active) ----------
  function cacheLocally(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch(e){ console.error('Local cache error', e); }
  }
  function loadLocalCache(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        const parsed = JSON.parse(raw);
        if(parsed && Array.isArray(parsed.threads)){
          parsed.threads.forEach(t => {
            t.status = migrateStatus(t.status);
            (t.entries||[]).forEach(e => { if(!Array.isArray(e.images)) e.images = []; });
          });
          parsed.threads.sort((a,b)=> (a.seq||0) - (b.seq||0));
          state = parsed;
        }
      }
    }catch(e){ console.log('No local cache found, starting fresh.', e); }
  }
  function loadUiPrefs(){
    try{ const raw = localStorage.getItem(UI_KEY); if(raw) ui = Object.assign(ui, JSON.parse(raw)); }
    catch(e){ /* defaults */ }
  }
  function saveUiPrefs(){
    try{ localStorage.setItem(UI_KEY, JSON.stringify(ui)); }
    catch(e){ console.error('UI prefs save error', e); }
  }

  // ---------- Shared file connection ----------
  function refreshStatusText(){
    fileStatusBar.classList.remove('status-error');
    if(fileHandle){
      fileStatusEl.textContent = 'Connected to ' + fileName + (window.__lastSavedAt ? ' · saved ' + window.__lastSavedAt : ' · not saved yet') + ' — use "Link to JSON…" to switch to a different register.';
    } else if(fsSupported){
      fileStatusEl.textContent = 'Not connected to a file — working locally in this browser only. Use "Link to JSON…" to open a downloaded copy of the register JSON, or "Save" to create one.';
    } else {
      fileStatusEl.textContent = fileName
        ? ('Loaded ' + fileName + ' — this browser can\'t save back to it automatically. Click "Save" to download an updated copy, then re-upload it wherever the register is shared.')
        : 'This browser can\'t connect directly to a file. Use "Link to JSON…" to load the register JSON, and "Save" to download an updated copy to re-upload wherever the register is shared.';
    }
  }
  function showFileError(msg){
    fileStatusBar.classList.add('status-error');
    fileStatusEl.textContent = msg;
  }

  function loadStateFromJsonText(text){
    try{
      const parsed = JSON.parse(text);
      if(!parsed || !Array.isArray(parsed.threads)) throw new Error('invalid');
      parsed.threads.forEach(t => {
        t.status = migrateStatus(t.status);
        (t.entries||[]).forEach(e => { if(!Array.isArray(e.images)) e.images = []; });
      });
      parsed.threads.sort((a,b)=> (a.seq||0) - (b.seq||0));
      state = parsed;
      cacheLocally();
      selectedId = null;
      populateFilterOptions(); renderList(); renderDetail();
      return true;
    }catch(e){ return false; }
  }

  async function writeToHandle(handle, text){
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
  }

  async function persist(){
    cacheLocally();
    if(fileHandle){
      try{
        await writeToHandle(fileHandle, JSON.stringify(state, null, 2));
        window.__lastSavedAt = new Date().toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });
        refreshStatusText();
      }catch(e){
        console.error('Auto-save to shared file failed', e);
        fileHandle = null;
        showFileError('Lost connection to the shared file. Your latest changes are cached in this browser — click "Link to JSON…" to reconnect, or "Save" to download a copy.');
      }
    }
  }

  async function openSharedFile(){
    if(fsSupported){
      try{
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: 'Q&A Register JSON', accept: { 'application/json': ['.json'] } }],
        });
        const file = await handle.getFile();
        const text = await file.text();
        if(!loadStateFromJsonText(text)){ alert('This file doesn\'t look like a Q&A Register JSON file.'); return; }
        fileHandle = handle; fileName = file.name; window.__lastSavedAt = null;
        await idbSet('registerFile', handle);
        refreshStatusText();
      }catch(e){ if(e.name !== 'AbortError') console.error(e); }
    } else {
      $('#legacyOpenInput').click();
    }
  }

  async function saveNow(){
    if(fsSupported && fileHandle){
      await persist();
      return;
    }
    if(fsSupported && !fileHandle){
      try{
        const handle = await window.showSaveFilePicker({
          suggestedName: (state.label || 'qna-register').replace(/[^a-z0-9\-_]+/gi,'_') + '.json',
          types: [{ description: 'Q&A Register JSON', accept: { 'application/json': ['.json'] } }],
        });
        fileHandle = handle; fileName = handle.name;
        await idbSet('registerFile', handle);
        await persist();
        refreshStatusText();
      }catch(e){ if(e.name !== 'AbortError') console.error(e); }
      return;
    }
    downloadBlob(JSON.stringify(state, null, 2), 'application/json', (state.label || 'qna-register').replace(/[^a-z0-9\-_]+/gi,'_') + '.json');
  }

  function showReconnectPrompt(handle){
    fileStatusEl.innerHTML = '';
    const span = document.createElement('span');
    span.textContent = 'Reconnect to ' + handle.name + ' to resume saving straight to the shared file. ';
    const btn = document.createElement('button');
    btn.className = 'icon-btn'; btn.type = 'button'; btn.textContent = 'Reconnect';
    btn.addEventListener('click', async () => {
      try{
        const perm = await handle.requestPermission({ mode:'readwrite' });
        if(perm === 'granted'){
          const file = await handle.getFile();
          const text = await file.text();
          if(loadStateFromJsonText(text)){ fileHandle = handle; fileName = file.name; refreshStatusText(); }
        }
      }catch(e){ console.error(e); }
    });
    fileStatusEl.appendChild(span);
    fileStatusEl.appendChild(btn);
  }

  async function tryReconnect(){
    if(!fsSupported){ refreshStatusText(); return; }
    const handle = await idbGet('registerFile');
    if(!handle){ refreshStatusText(); return; }
    try{
      const perm = await handle.queryPermission({ mode:'readwrite' });
      if(perm === 'granted'){
        const file = await handle.getFile();
        const text = await file.text();
        if(loadStateFromJsonText(text)){ fileHandle = handle; fileName = file.name; refreshStatusText(); return; }
      }
      showReconnectPrompt(handle);
    }catch(e){ console.error('Reconnect check failed', e); refreshStatusText(); }
  }

  function downloadBlob(content, type, filename){
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
