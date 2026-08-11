  // ---------- Resizable / collapsible layout ----------
  const ICON_LEFT = '<svg viewBox="0 0 8 12" width="7" height="10"><path d="M7 1L2 6L7 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_RIGHT = '<svg viewBox="0 0 8 12" width="7" height="10"><path d="M1 1L6 6L1 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_UP = '<svg viewBox="0 0 12 8" width="10" height="7"><path d="M1 7L6 2L11 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_DOWN = '<svg viewBox="0 0 12 8" width="10" height="7"><path d="M1 1L6 6L11 1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_TRASH = '<svg viewBox="0 0 16 16" width="13" height="13"><path d="M3 4h10M6.5 4V2.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1V4M4.5 4l.5 9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l.5-9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_EDIT = '<svg viewBox="0 0 16 16" width="13" height="13"><path d="M11.5 2.5a1.5 1.5 0 0 1 2.12 2.12L6 12.25l-3.25 1 1-3.25 7.75-7.5Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function updateDividerIcons(){
    $('#collapseSidebarBtn').innerHTML = ui.sidebarCollapsed ? ICON_RIGHT : ICON_LEFT;
  }
  function applyLayout(){
    if(ui.sidebarCollapsed){ sidebarEl.classList.add('collapsed'); }
    else { sidebarEl.classList.remove('collapsed'); sidebarEl.style.width = ui.sidebarWidth + 'px'; }
  }
  function applyVSplit(){
    const composerEl = detailEl.querySelector('#composerPanel');
    if(!composerEl) return;
    if(ui.composerCollapsed){
      composerEl.classList.add('collapsed');
      composerEl.style.height = '';
    } else {
      composerEl.classList.remove('collapsed');
      composerEl.style.flex = '0 0 auto';
      composerEl.style.height = ui.composerHeight + 'px';
    }
  }
  function updateVDividerIcons(){
    const compBtn = detailEl.querySelector('#collapseComposerBtn');
    if(!compBtn) return;
    compBtn.innerHTML = ui.composerCollapsed ? ICON_UP : ICON_DOWN;
  }
  // Generic drag-to-resize helper: returns a `start` handler to bind to a divider's
  // mousedown/touchstart. Handles pointer + touch move/end for a single axis.
  function initDragAxis(cursorClass, canDrag, applyFromClient){
    let active = false;
    function moveTo(clientX, clientY){ if(active) applyFromClient(clientX, clientY); }
    function end(){ if(active){ active = false; document.body.classList.remove(cursorClass); saveUiPrefs(); } }
    function start(e){
      if(e.target.closest('.divider-btn')) return;
      if(canDrag && !canDrag()) return;
      active = true; document.body.classList.add(cursorClass);
      if(e.cancelable) e.preventDefault();
    }
    window.addEventListener('mousemove', (e) => moveTo(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => { const t = e.touches[0]; if(t) moveTo(t.clientX, t.clientY); }, { passive:true });
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);
    return start;
  }
  // Generic collapse-toggle helper for a pair of mutually-exclusive panels.
  function bindCollapseToggle(btn, key, otherKey, applyFn, iconFn){
    if(!btn) return;
    btn.addEventListener('click', () => {
      ui[key] = !ui[key];
      if(ui[key] && otherKey) ui[otherKey] = false;
      applyFn(); iconFn(); saveUiPrefs();
    });
  }

  const startSidebarDrag = initDragAxis('resizing', () => !ui.sidebarCollapsed, (clientX) => {
    const mainRect = $('.main').getBoundingClientRect();
    ui.sidebarWidth = Math.max(220, Math.min(640, clientX - mainRect.left));
    applyLayout();
  });
  const startComposerDrag = initDragAxis('resizing-row', () => !ui.composerCollapsed, (_clientX, clientY) => {
    const detailRect = detailEl.getBoundingClientRect();
    ui.composerHeight = Math.max(120, Math.min(560, detailRect.bottom - clientY));
    applyVSplit();
  });

  const divider = $('#divider');
  divider.addEventListener('mousedown', startSidebarDrag);
  divider.addEventListener('touchstart', startSidebarDrag, { passive:true });
  bindCollapseToggle($('#collapseSidebarBtn'), 'sidebarCollapsed', null, applyLayout, updateDividerIcons);
