  // ---------- CSV export ----------
  function toCsvField(v){
    const s = String(v == null ? '' : v);
    if(/[",\n]/.test(s)) return '"' + s.replace(/"/g,'""') + '"';
    return s;
  }
  function exportCsv(){
    const rows = [['Thread ID','Topic','Related document','Status','Opened','Entry type','Entry date/time','Entry text','Edited','Images attached']];
    state.threads.slice().sort((a,b)=>a.seq-b.seq).forEach(t => {
      if(t.entries.length === 0){ rows.push([stampId(t.seq), t.topic, t.document, t.status, fmtDateTime(t.createdAt), '', '', '', '', '']); }
      t.entries.forEach(e => {
        rows.push([stampId(t.seq), t.topic, t.document, t.status, fmtDateTime(t.createdAt),
          e.role === 'Q' ? 'Question' : 'Answer', fmtDateTime(e.date), e.text, e.edited ? 'Yes' : 'No', (e.images ? e.images.length : 0)]);
      });
    });
    const csv = rows.map(r => r.map(toCsvField).join(',')).join('\n');
    downloadBlob(csv, 'text/csv;charset=utf-8;', (state.label || 'qna-register').replace(/[^a-z0-9\-_]+/gi,'_') + '.csv');
  }
