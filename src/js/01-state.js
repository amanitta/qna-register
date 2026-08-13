  // ---------- Shared state, DOM refs, formatting helpers ----------
  const STORAGE_KEY = 'qna-register-data-v2';
  const UI_KEY = 'qna-register-ui-v2';
  const DRAFTS_KEY = 'qna-register-drafts-v1';
  const IDB_NAME = 'qna-register-fs';
  const IDB_STORE = 'handles';
  const STATUSES = ['Open','Answered','Closed'];

  let state = { label: 'Assessment', roleLabels: { Q: 'Authorities', A: 'CCP' }, threads: [] };
  let ui = { sidebarWidth: 340, sidebarCollapsed: false, composerHeight: 220, composerHeightCustom: false, composerCollapsed: false };
  let selectedId = null;
  let filters = { status: 'all', topic: 'all', doc: 'all', search: '' };
  let composerRole = 'Q';
  let composerImages = [];
  let modalImages = [];
  let editingEntryIdx = null;
  let pendingAction = null; // { type:'delete', threadId } | { type:'reorder', orderedIds }
  let drafts = {}; // keyed by thread.id; local-only, never part of `state` / the shared file

  let fileHandle = null;
  let fileName = null;
  const fsSupported = typeof window.showOpenFilePicker === 'function';

  const $ = (sel) => document.querySelector(sel);
  const threadListEl = $('#threadList');
  const detailEl = $('#detail');
  const sidebarEl = $('#sidebarPanel');
  const fileStatusBar = $('#fileStatusBar');
  const fileStatusEl = $('#fileStatus');

  function fmtDateTime(iso){
    const d = new Date(iso);
    const datePart = d.toLocaleDateString(undefined, { day:'2-digit', month:'short', year:'numeric' });
    const timePart = d.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit', hour12:false });
    return datePart + ', ' + timePart;
  }
  function statusClass(status){
    if(status === 'Open') return 'status-open';
    if(status === 'Answered') return 'status-answered';
    if(status === 'Closed') return 'status-closed';
    return 'status-open';
  }
  function nextSeq(){ return state.threads.reduce((m,t)=> Math.max(m, t.seq||0), 0) + 1; }
  function stampId(seq){ return 'Q-' + String(seq).padStart(3,'0'); }
  function migrateStatus(s){
    if(s === 'Follow-up needed') return 'Open';
    if(STATUSES.includes(s)) return s;
    return 'Open';
  }
  function migrateRoleLabels(s){
    if(!s.roleLabels || typeof s.roleLabels !== 'object') s.roleLabels = {};
    if(typeof s.roleLabels.Q !== 'string' || !s.roleLabels.Q.trim()) s.roleLabels.Q = 'Authorities';
    if(typeof s.roleLabels.A !== 'string' || !s.roleLabels.A.trim()) s.roleLabels.A = 'CCP';
  }
  function migrateOrder(parsed){
    parsed.threads.forEach(t => {
      if(typeof t.order !== 'number' || !isFinite(t.order)) t.order = t.seq || 0;
    });
  }
  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }
  // Chromium doesn't insert a newline into a textarea on Alt+Enter by default, so the
  // Jupyter-style "Alt+Enter = newline" shortcut has to insert it manually.
  function insertNewlineAtCursor(el){
    const start = el.selectionStart, end = el.selectionEnd;
    el.value = el.value.slice(0, start) + '\n' + el.value.slice(end);
    el.selectionStart = el.selectionEnd = start + 1;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

