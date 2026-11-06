// ==UserScript==
// @name         Plaud Transcript Helper / 转录编辑助手
// @name:zh-CN   Plaud 转录编辑助手
// @namespace    local.plaud.transcript-helper
// @version      1.0.0
// @description  Pinned edit buttons, find & replace with per-segment preview, serial native saves, and restore. Operates only Plaud's own editor. 中英文界面。
// @description:zh-CN 固定编辑入口、逐段预览、串行保存和原文恢复。仅操作 Plaud 原生编辑框。支持中英文界面。
// @author       listen-hai
// @license      MIT
// @homepageURL  https://github.com/listen-hai/plaud-transcript-helper
// @supportURL   https://github.com/listen-hai/plaud-transcript-helper/issues
// @downloadURL  https://github.com/listen-hai/plaud-transcript-helper/releases/latest/download/plaud-transcript-helper.user.js
// @updateURL    https://github.com/listen-hai/plaud-transcript-helper/releases/latest/download/plaud-transcript-helper.user.js
// @match        https://web.plaud.ai/file/*
// @run-at       document-idle
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

(() => {
  'use strict';
  if (document.querySelector('#pth-host')) return;
  const VERSION = '1.0.0';
  const ROW = '.transcribe-item';
  const TEXT = '.transcript-item[data-transcript-index]';
  const EDITOR = 'textarea.edit-textarea';
  const filePath = location.pathname;
  const storageKey = 'plaud-helper-journal:' + filePath;
  const LANG_KEY = 'plaud-helper-lang';
  // Journal states are stored values from 0.2.x; keep them unchanged for compatibility.
  const UNSENT = '未提交', PENDING = '待核对', UPDATED = '页面已更新', VERIFIED = '核对一致';

  const I18N = {
    zh: {
      toggle: '转录编辑助手', lang: 'EN', title: `Plaud 转录编辑助手 · ${VERSION}`,
      intro: '先预览，再逐段提交。双击原文或点击“编辑此段”打开原生编辑框；Ctrl/⌘ + Enter 点击外部提交。',
      scan: '扫描整篇', visible: '读取已渲染段落', stop: '停止操作',
      idle: '尚未扫描。不会自动修改或导出转录。',
      find: '查找（普通文字，区分大小写）', replace: '替换为',
      preview: '预览替换', manual: '逐段编辑已读取内容', select: '全选预览项', deselect: '全不选',
      patchSummary: '批量导入整句／整段改写',
      patchHelp: '粘贴修改清单：每条包含 time（时间戳）、speaker（说话人）、before（完整原文）、after（完整新文）。先扫描，再导入预览。',
      patchLabel: '整句改写清单',
      patchPlaceholder: '[{"time":"00:00:34","speaker":"Speaker 1","before":"完整原文","after":"修正后的完整句子"}]',
      importBtn: '预览整句修改清单',
      reviewHelp: '预览中的每段可单独改写。勾选后才会提交；空白新文本不提交。人名和有歧义的词请逐处判断。',
      save: '提交勾选修改', verify: '刷新后核对上批结果', undo: '预览恢复上批原文',
      storageHelp: '修改记录保存在本机 Tampermonkey 存储中，包含原文。页面显示更新不等于服务器已保存：请刷新 Plaud 后点“核对”。',
      forget: '清除本机修改记录', editThis: '编辑此段',
      afterLabel: (time, speaker) => `${time} ${speaker} 修改后`,
      switched: '已切换录音，请刷新页面后再使用助手。',
      stopped: '已停止；已提交的段落保留，剩余段落未提交。',
      noScroller: '未找到转录滚动区域。请先打开 Transcript。',
      fileChanged: '录音已切换，操作停止。',
      ambiguous: '段落定位不唯一，已停止。',
      noNativeEdit: '找不到原生编辑按钮；Plaud 页面结构可能已改变。',
      finishEdit: '请先点击编辑框外部，结束当前原生编辑。',
      finishEditScan: '请先结束当前原生编辑，再扫描。',
      finishEditShort: '请先结束当前原生编辑。',
      scanning: n => `正在扫描：已读取 ${n} 段。扫描过程中请不要滚动页面。`,
      scanDone: n => `已从顶部扫描到底部，读取 ${n} 段，序号连续。可预览替换。`,
      scanPartial: n => `已读取 ${n} 段，但扫描未确认完整。可处理这些段落，或重新扫描。`,
      notFound: time => `无法找到 ${time} 的原段落，已停止。`,
      busyEditor: '页面已有未结束的编辑，已停止。',
      mismatch: time => `${time} 原文与预览不一致，请重新读取后再改。`,
      noEditor: time => `${time} 编辑框未打开。`,
      editorChanged: time => `${time} 编辑框原文发生变化，已停止。`,
      noNewText: time => `${time} 未看到预期新文本；本段可能已提交，请核对后再继续。`,
      stopping: '正在停止；当前段落若已提交，会先记录结果。',
      visibleRead: n => `已读取 ${n} 段；可能仅为整篇中的一部分。`,
      needFind: '请填写要查找的文字。',
      needScan: '请先扫描整篇或读取已渲染段落。',
      found: n => `找到 ${n} 段。请检查并勾选需要提交的段落。`,
      needRead: '请先读取段落。',
      listed: n => `已列出 ${n} 段，可逐段修改并勾选。`,
      needScanTarget: '请先扫描整篇或读取目标段落。',
      badJson: '修改清单不是有效的 JSON，请检查引号、逗号和换行转义。',
      badArray: '修改清单应为包含 1–5000 条修改的数组。',
      badEntry: i => `第 ${i} 条需要非空 time、speaker、before 和 after。`,
      noMatch: (i, time) => `第 ${i} 条（${time}）未唯一匹配当前原文。清单未载入，请核对时间、说话人和完整原文。`,
      duplicate: i => `第 ${i} 条重复修改同一段落，清单未载入。`,
      matched: n => `已匹配 ${n} 条整句／整段修改。请检查并勾选后提交。`,
      noneSelected: '没有勾选已修改的段落。',
      emptySelected: '有勾选段落的新文本为空，未提交。',
      saving: (i, n, time) => `正在提交 ${i}/${n} · ${time}。请不要切换录音或操作转录。`,
      saved: n => `${n} 段在页面上已更新。请刷新 Plaud 后点“刷新后核对上批结果”，确认仍保留。`,
      noJournal: '没有本机修改记录。',
      noSubmitted: '上批没有已提交或待核对的段落。',
      verifyResult: (m, n) => `当前页面核对：${m}/${n} 段与提交内容一致。`,
      verifyDiff: list => `\n需检查：${list.join('、')}`,
      verifyNote: '\n只有在你先刷新 Plaud 后进行核对，这个结果才能验证刷新后仍保留。',
      noRestorable: '上批没有可恢复的记录。',
      restoreResult: (n, c) => `可恢复 ${n} 段；${c} 段当前文本不同或未找到，未纳入恢复。请勾选后提交。`,
      forgetConfirm: '清除这条录音在本机保存的修改记录？清除后助手无法恢复原文；Plaud 内容不会改变。',
      forgotten: '本机修改记录已清除。',
    },
    en: {
      toggle: 'Transcript Helper', lang: '中文', title: `Plaud Transcript Helper · ${VERSION}`,
      intro: 'Preview first, then submit segment by segment. Double-click text or click "Edit" to open Plaud\'s editor; Ctrl/⌘ + Enter clicks outside to submit.',
      scan: 'Scan all', visible: 'Read visible segments', stop: 'Stop',
      idle: 'Not scanned yet. Nothing is changed or exported automatically.',
      find: 'Find (plain text, case-sensitive)', replace: 'Replace with',
      preview: 'Preview replace', manual: 'Edit read segments', select: 'Select all', deselect: 'Select none',
      patchSummary: 'Import whole-sentence / segment rewrites',
      patchHelp: 'Paste a change list: each item has time, speaker, before (full current text) and after (full new text). Scan first, then import to preview.',
      patchLabel: 'Rewrite list',
      patchPlaceholder: '[{"time":"00:00:34","speaker":"Speaker 1","before":"full original text","after":"full corrected text"}]',
      importBtn: 'Preview rewrite list',
      reviewHelp: 'Each previewed segment can be edited. Only checked segments are submitted; empty text is never submitted. Check names and ambiguous words one by one.',
      save: 'Submit checked', verify: 'Verify last batch after reload', undo: 'Preview restore of last batch',
      storageHelp: 'Change records, including original text, are kept in local Tampermonkey storage. An updated page is not proof the server saved it: reload Plaud, then click "Verify".',
      forget: 'Clear local change records', editThis: 'Edit',
      afterLabel: (time, speaker) => `${time} ${speaker} new text`,
      switched: 'Recording changed. Reload the page before using the helper.',
      stopped: 'Stopped. Submitted segments are kept; the rest were not submitted.',
      noScroller: 'Transcript scroll area not found. Open the Transcript tab first.',
      fileChanged: 'Recording changed; operation stopped.',
      ambiguous: 'Segment match is not unique; stopped.',
      noNativeEdit: 'Plaud\'s edit button not found; the page structure may have changed.',
      finishEdit: 'Click outside the editor to finish the current edit first.',
      finishEditScan: 'Finish the current edit before scanning.',
      finishEditShort: 'Finish the current edit first.',
      scanning: n => `Scanning: ${n} segments read. Please don't scroll during the scan.`,
      scanDone: n => `Scanned top to bottom: ${n} segments, indices contiguous. Ready to preview.`,
      scanPartial: n => `Read ${n} segments, but the scan could not confirm completeness. Work with these or scan again.`,
      notFound: time => `Could not find the segment at ${time}; stopped.`,
      busyEditor: 'An edit is already open on the page; stopped.',
      mismatch: time => `${time}: text differs from the preview. Read again before editing.`,
      noEditor: time => `${time}: editor did not open.`,
      editorChanged: time => `${time}: editor text changed; stopped.`,
      noNewText: time => `${time}: expected new text not seen. It may have been submitted; check before continuing.`,
      stopping: 'Stopping. If the current segment was submitted, its result is recorded first.',
      visibleRead: n => `${n} segments read; this may be only part of the transcript.`,
      needFind: 'Enter text to find.',
      needScan: 'Scan all or read visible segments first.',
      found: n => `Found ${n} segments. Review and check the ones to submit.`,
      needRead: 'Read segments first.',
      listed: n => `Listed ${n} segments. Edit and check the ones to submit.`,
      needScanTarget: 'Scan all or read the target segments first.',
      badJson: 'The change list is not valid JSON. Check quotes, commas and escaped line breaks.',
      badArray: 'The change list must be an array of 1–5000 items.',
      badEntry: i => `Item ${i} needs non-empty time, speaker, before and after.`,
      noMatch: (i, time) => `Item ${i} (${time}) does not uniquely match current text. List not loaded; check time, speaker and full text.`,
      duplicate: i => `Item ${i} edits the same segment twice. List not loaded.`,
      matched: n => `Matched ${n} rewrites. Review and check them before submitting.`,
      noneSelected: 'No changed segments are checked.',
      emptySelected: 'A checked segment has empty new text; nothing submitted.',
      saving: (i, n, time) => `Submitting ${i}/${n} · ${time}. Don't switch recordings or touch the transcript.`,
      saved: n => `${n} segments updated on the page. Reload Plaud, then click "Verify last batch after reload".`,
      noJournal: 'No local change records.',
      noSubmitted: 'The last batch has no submitted or pending segments.',
      verifyResult: (m, n) => `Page check: ${m}/${n} segments match what was submitted.`,
      verifyDiff: list => `\nCheck: ${list.join(', ')}`,
      verifyNote: '\nThis only proves the changes persisted if you reloaded Plaud before verifying.',
      noRestorable: 'The last batch has nothing to restore.',
      restoreResult: (n, c) => `${n} segments can be restored; ${c} differ now or were not found and are excluded. Check and submit.`,
      forgetConfirm: 'Clear local change records for this recording? The helper will no longer be able to restore the original text. Plaud content is not changed.',
      forgotten: 'Local change records cleared.',
    },
  };
  let lang = GM_getValue(LANG_KEY, '') ||
    (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
  if (!I18N[lang]) lang = 'en';
  const t = (key, ...args) => {
    const v = I18N[lang][key];
    return typeof v === 'function' ? v(...args) : v;
  };

  let busy = false, stop = false, catalog = new Map(), proposals = [];
  let scanComplete = false;
  let journal = GM_getValue(storageKey, []);
  if (!Array.isArray(journal)) journal = [];
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const q = (selector, root = document) => root.querySelector(selector);
  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const sameFile = () => {
    if (location.pathname !== filePath) throw new Error(t('switched'));
    if (stop) throw new Error(t('stopped'));
  };
  const keyOf = x => `${x.index}|${x.time}|${x.speaker}`;
  function data(row) {
    const text = q(TEXT, row);
    if (!text) return null;
    const index = Number(text.dataset.transcriptIndex);
    if (!Number.isInteger(index) || index < 0) return null;
    return {
      index, time: q('.timestamp', row)?.textContent.trim() || '',
      speaker: q('.speaker-name', row)?.textContent.trim() || '',
      original: text.textContent,
    };
  }
  function scroller() {
    let p = q(ROW)?.parentElement;
    while (p) {
      if (/(auto|scroll)/.test(getComputedStyle(p).overflowY) &&
          p.scrollHeight > p.clientHeight + 5) return p;
      p = p.parentElement;
    }
    throw new Error(t('noScroller'));
  }
  function activeRows() {
    return all(ROW).filter(row => {
      if (row.getBoundingClientRect().width <= 0) return false;
      // Plaud parks recycled, inactive rows at translateY(-9999px).
      // They still have width and stale text, so width alone is insufficient.
      const view = row.closest('.vue-recycle-scroller__item-view');
      if (view) {
        const transform = getComputedStyle(view).transform;
        if (transform !== 'none' && new DOMMatrixReadOnly(transform).m42 < 0) return false;
      }
      return true;
    });
  }
  function recordVisible(container) {
    for (const row of activeRows()) {
      const item = data(row);
      if (!item) continue;
      item.offset = Math.max(0, container.scrollTop +
        row.getBoundingClientRect().top - container.getBoundingClientRect().top - 20);
      catalog.set(keyOf(item), item);
    }
  }
  function contiguous() {
    const ids = [...new Set([...catalog.values()].map(x => x.index))].sort((a,b) => a-b);
    return ids.length > 0 && ids[0] === 0 && ids.every((v, i) => v === i);
  }
  const style = document.createElement('style');
  style.textContent = `
    .transcribe-item .item-header-right {opacity:1!important;visibility:visible!important;pointer-events:auto!important}
    .pth-edit {display:inline-block!important;margin-left:8px!important;padding:3px 8px!important;
      font:12px system-ui!important;color:#1649a0!important;background:#eef4ff!important;
      border:1px solid #bad0f9!important;border-radius:5px!important;cursor:pointer!important}
  `;
  document.head.append(style);
  const host = document.createElement('div');
  host.id = 'pth-host';
  document.body.append(host);
  const shadow = host.attachShadow({mode:'open'});
  shadow.innerHTML = `
    <style>
      :host {all:initial;font:13px/1.5 system-ui,-apple-system,sans-serif;color:#17212f}
      * {box-sizing:border-box} button,input,textarea {font:inherit}
      button {border:1px solid #c7d0dd;background:#fff;border-radius:7px;padding:7px 10px;cursor:pointer}
      button:hover {background:#edf3ff} button:disabled {opacity:.45;cursor:default}
      #toggle {position:fixed;right:18px;bottom:18px;z-index:2147483646;
        background:#1e4f99;color:white;box-shadow:0 3px 15px #0003}
      #panel {position:fixed;right:18px;bottom:66px;width:min(580px,calc(100vw - 36px));
        max-height:78vh;overflow:auto;z-index:2147483646;background:white;border:1px solid #bbc8db;
        border-radius:12px;box-shadow:0 6px 30px #0003;padding:16px}
      [hidden] {display:none!important} h2 {font-size:17px;margin:0}
      header {display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px}
      #lang {padding:3px 9px;font-size:12px}
      p {margin:7px 0} .muted {color:#576477;font-size:12px}
      .bar {display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}
      label.field {display:block;margin:8px 0} input[type=text],textarea {width:100%;border:1px solid #bdc8d7;
        border-radius:6px;padding:8px;background:white;color:#17212f}
      textarea {resize:vertical;min-height:68px} .primary {background:#1e4f99;color:#fff}
      article {border-top:1px solid #dfe5ed;margin-top:12px;padding-top:10px}
      .before {white-space:pre-wrap;background:#fff3ee;padding:8px;border-radius:6px;overflow-wrap:anywhere}
      #status {white-space:pre-wrap;background:#eef4ff;padding:9px;border-radius:6px}
      input[type=checkbox] {margin-right:6px} .count {font-weight:600}
    </style>
    <button id="toggle" data-i="toggle"></button>
    <section id="panel" hidden>
      <header><h2 data-i="title"></h2><button id="lang" data-i="lang"></button></header>
      <p class="muted" data-i="intro"></p>
      <div class="bar">
        <button id="scan" data-i="scan"></button><button id="visible" data-i="visible"></button>
        <button id="stop" data-i="stop"></button>
      </div>
      <div id="status" role="status"></div>
      <label class="field"><span data-i="find"></span><input id="find" type="text"></label>
      <label class="field"><span data-i="replace"></span><input id="replace" type="text"></label>
      <div class="bar">
        <button id="preview" data-i="preview"></button><button id="manual" data-i="manual"></button>
        <button id="select" data-i="select"></button><button id="deselect" data-i="deselect"></button>
      </div>
      <details>
        <summary data-i="patchSummary"></summary>
        <p class="muted" data-i="patchHelp"></p>
        <textarea id="patches"></textarea>
        <button id="import" data-i="importBtn"></button>
      </details>
      <p class="muted" data-i="reviewHelp"></p>
      <div class="bar">
        <button id="save" class="primary" data-i="save"></button>
        <button id="verify" data-i="verify"></button>
        <button id="undo" data-i="undo"></button>
      </div>
      <p class="muted" data-i="storageHelp"></p>
      <button id="forget" data-i="forget"></button>
      <div id="list"></div>
    </section>`;
  const ui = id => shadow.getElementById(id);
  const status = message => {ui('status').textContent = message;};
  function applyLang() {
    for (const el of all('[data-i]', shadow)) el.textContent = t(el.dataset.i);
    ui('patches').setAttribute('aria-label', t('patchLabel'));
    ui('patches').placeholder = t('patchPlaceholder');
    for (const button of all('.pth-edit')) button.textContent = t('editThis');
  }
  applyLang();
  status(t('idle'));
  function clickOutsideEditor() {
    // Plaud's outside-click directive tracks both mouse-down and mouse-up.
    // A lone element.click() updates neither part of that pair.
    const target = ui('status');
    for (const type of ['mousedown','mouseup','click'])
      target.dispatchEvent(new MouseEvent(type,{bubbles:true,composed:true,button:0}));
  }
  function lock(value) {
    busy = value;
    for (const button of all('button', shadow))
      if (!['toggle','stop','lang'].includes(button.id)) button.disabled = value;
    for (const input of all('input,textarea', shadow)) input.disabled = value;
  }
  async function run(action) {
    if (busy) return;
    stop = false; lock(true);
    try {sameFile(); await action();}
    catch (error) {status(error.message || String(error));}
    finally {lock(false); enhance();}
  }
  async function waitFor(fn, description, ms = 4000) {
    const deadline = Date.now() + ms;
    do {
      // Finish observing an in-flight submission even if Stop was pressed.
      if (location.pathname !== filePath) throw new Error(t('fileChanged'));
      const result = fn();
      if (result) return result;
      await sleep(60);
    } while (Date.now() < deadline);
    throw new Error(description);
  }
  function findRow(item) {
    const matches = activeRows().filter(row => {
      const d = data(row);
      return d && keyOf(d) === keyOf(item);
    });
    if (matches.length > 1) throw new Error(t('ambiguous'));
    return matches[0];
  }
  function nativeEdit(row) {
    const controls = all('.item-header-right use', row);
    const icon = controls.find(el =>
      (el.getAttribute('href') || el.getAttribute('xlink:href')) === '#svg-icon_rename');
    const button = icon?.closest('span');
    if (!button) throw new Error(t('noNativeEdit'));
    button.click();
  }
  function enhance() {
    for (const row of activeRows()) {
      if (!q('.pth-edit', row)) {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'pth-edit'; button.textContent = t('editThis');
        button.addEventListener('click', event => {
          event.preventDefault(); event.stopPropagation();
          if (busy) return;
          try {
            sameFile();
            if (q(EDITOR)) {status(t('finishEdit')); return;}
            nativeEdit(row);
          } catch (e) {status(e.message);}
        });
        q('.item-header-left', row)?.append(button);
      }
    }
  }
  document.addEventListener('dblclick', event => {
    if (busy || !(event.target instanceof Element) || q(EDITOR)) return;
    const text = event.target.closest(TEXT);
    if (!text) return;
    try {sameFile(); nativeEdit(text.closest(ROW));} catch(e) {status(e.message);}
  });
  document.addEventListener('keydown', event => {
    if (!(event.target instanceof Element) || !event.target.matches(EDITOR) || busy) return;
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      // Plaud commits when a click is made outside its textarea.
      clickOutsideEditor();
      ui('toggle').focus();
    }
  });
  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {scheduled = false; enhance();});
  }).observe(document.body, {childList:true,subtree:true});
  enhance();
  async function scan() {
    if (q(EDITOR)) throw new Error(t('finishEditScan'));
    const container = scroller(), start = container.scrollTop;
    catalog = new Map(); scanComplete = false;
    let stableBottom = 0, previous = -1;
    try {
      container.scrollTop = 0;
      await sleep(220);
      for (let step = 0; step < 3000; step++) {
        sameFile();
        recordVisible(container);
        status(t('scanning', catalog.size));
        const bottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 3;
        if (bottom && catalog.size === previous) stableBottom++;
        else stableBottom = 0;
        if (stableBottom >= 3) {
          scanComplete = contiguous();
          break;
        }
        previous = catalog.size;
        if (!bottom) container.scrollTop += Math.max(100, container.clientHeight * .7);
        await sleep(180);
      }
    } finally {container.scrollTop = start;}
    status(t(scanComplete ? 'scanDone' : 'scanPartial', catalog.size));
  }
  function render() {
    const list = ui('list'); list.replaceChildren();
    for (const p of proposals) {
      const article = document.createElement('article');
      const label = document.createElement('label');
      const check = document.createElement('input'); check.type = 'checkbox'; check.checked = !!p.selected;
      check.addEventListener('change', () => {p.selected = check.checked;});
      label.append(check, `${p.index + 1} · ${p.time} · ${p.speaker}`);
      const before = document.createElement('p'); before.className = 'before'; before.textContent = p.original;
      const after = document.createElement('textarea'); after.value = p.after;
      after.setAttribute('aria-label', t('afterLabel', p.time, p.speaker));
      after.addEventListener('input', () => {p.after = after.value;});
      article.append(label, before, after); list.append(article);
    }
    // render() may run while a scan/save operation still holds the lock.
    for (const input of all('input,textarea', list)) input.disabled = busy;
  }
  async function locate(item) {
    sameFile();
    const container = scroller();
    container.scrollTop = Math.min(item.offset || 0, container.scrollHeight);
    await sleep(200);
    let row = findRow(item);
    if (row) {
      row.scrollIntoView({block:'center'});
      await sleep(100);
      return findRow(item) || row;
    }
    // Reflow changes offsets. Search through visible rows instead of app state.
    container.scrollTop = 0;
    for (let step = 0; step < 3000; step++) {
      sameFile(); await sleep(120);
      row = findRow(item);
      if (row) {row.scrollIntoView({block:'center'}); await sleep(100); return findRow(item) || row;}
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 3) break;
      container.scrollTop += Math.max(100, container.clientHeight * .7);
    }
    throw new Error(t('notFound', item.time));
  }
  async function saveOne(item, entry) {
    sameFile();
    if (q(EDITOR)) throw new Error(t('busyEditor'));
    let row = await locate(item);
    if (data(row)?.original !== item.original) throw new Error(t('mismatch', item.time));
    nativeEdit(row);
    const area = await waitFor(() => q(EDITOR, row), t('noEditor', item.time));
    if (area.value !== item.original) throw new Error(t('editorChanged', item.time));
    sameFile();
    // The before-image is persisted before triggering any value-changing event.
    entry.state = PENDING; GM_setValue(storageKey, journal);
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(area,item.after);
    area.dispatchEvent(new Event('input',{bubbles:true}));
    area.dispatchEvent(new Event('change',{bubbles:true}));
    area.blur();
    clickOutsideEditor();
    await waitFor(() => {
      row = findRow(item);
      return row && !q(EDITOR,row) && data(row)?.original === item.after;
    }, t('noNewText', item.time));
    entry.state = UPDATED; GM_setValue(storageKey,journal);
    catalog.set(keyOf(item), {...item,original:item.after});
    await sleep(450); // One native save at a time.
  }
  ui('toggle').onclick = () => {ui('panel').hidden = !ui('panel').hidden;};
  ui('lang').onclick = () => {
    lang = lang === 'zh' ? 'en' : 'zh';
    GM_setValue(LANG_KEY, lang);
    applyLang(); render();
  };
  ui('stop').onclick = () => {stop = true; status(t('stopping'));};
  ui('scan').onclick = () => run(scan);
  ui('visible').onclick = () => run(async () => {
    if (q(EDITOR)) throw new Error(t('finishEditShort'));
    recordVisible(scroller());
    status(t('visibleRead', catalog.size));
  });
  ui('preview').onclick = () => run(async () => {
    const from = ui('find').value, to = ui('replace').value;
    if (!from) throw new Error(t('needFind'));
    if (!catalog.size) throw new Error(t('needScan'));
    proposals = [...catalog.values()].filter(p => p.original.includes(from))
      .map(p => ({...p,after:p.original.split(from).join(to),selected:false}))
      .filter(p => p.original !== p.after).sort((a,b) => a.index-b.index);
    render();
    status(t('found', proposals.length));
  });
  ui('manual').onclick = () => run(async () => {
    if (!catalog.size) throw new Error(t('needRead'));
    proposals = [...catalog.values()].sort((a,b) => a.index-b.index)
      .map(p => ({...p,after:p.original,selected:false}));
    render(); status(t('listed', proposals.length));
  });
  ui('import').onclick = () => run(async () => {
    if (!catalog.size) throw new Error(t('needScanTarget'));
    let patches;
    try {patches = JSON.parse(ui('patches').value);}
    catch (_) {throw new Error(t('badJson'));}
    if (!Array.isArray(patches) || !patches.length || patches.length > 5000)
      throw new Error(t('badArray'));
    const next = [], seen = new Set();
    for (let i = 0; i < patches.length; i++) {
      const p = patches[i];
      if (!p || !['time','speaker','before','after'].every(k => typeof p[k] === 'string' && p[k].trim()))
        throw new Error(t('badEntry', i + 1));
      const matches = [...catalog.values()].filter(x =>
        x.time === p.time && x.speaker === p.speaker && x.original === p.before);
      if (matches.length !== 1) throw new Error(t('noMatch', i + 1, p.time));
      const key = keyOf(matches[0]);
      if (seen.has(key)) throw new Error(t('duplicate', i + 1));
      seen.add(key);
      if (p.before !== p.after) next.push({...matches[0],after:p.after,selected:false});
    }
    proposals = next.sort((a,b) => a.index-b.index);
    render(); status(t('matched', proposals.length));
  });
  ui('select').onclick = () => {proposals.forEach(p => p.selected = true); render();};
  ui('deselect').onclick = () => {proposals.forEach(p => p.selected = false); render();};
  ui('save').onclick = () => run(async () => {
    const selected = proposals.filter(p => p.selected && p.after !== p.original);
    if (!selected.length) throw new Error(t('noneSelected'));
    if (selected.some(p => !p.after.trim())) throw new Error(t('emptySelected'));
    const batch = {
      id:Date.now(),file:filePath,created:new Date().toISOString(),
      entries:selected.map(p => ({...p,state:UNSENT}))
    };
    journal.push(batch); GM_setValue(storageKey,journal);
    let done = 0;
    for (let i = 0; i < selected.length; i++) {
      status(t('saving', i + 1, selected.length, selected[i].time));
      await saveOne(selected[i],batch.entries[i]); done++;
      selected[i].selected = false;
      selected[i].original = selected[i].after;
    }
    render();
    status(t('saved', done));
  });
  ui('verify').onclick = () => run(async () => {
    const batch = [...journal].reverse().find(b => b.entries.some(x => x.state !== UNSENT));
    if (!batch) throw new Error(t('noJournal'));
    const entries = batch.entries.filter(x => x.state !== UNSENT);
    if (!entries.length) throw new Error(t('noSubmitted'));
    await scan();
    let matches = 0;
    const differences = [];
    for (const item of entries) {
      const current = catalog.get(keyOf(item));
      if (current?.original === item.after) {matches++;item.state=VERIFIED;}
      else differences.push(item.time);
    }
    GM_setValue(storageKey,journal);
    status(t('verifyResult', matches, entries.length) +
      (differences.length ? t('verifyDiff', differences) : '') + t('verifyNote'));
  });
  ui('undo').onclick = () => run(async () => {
    const batch = [...journal].reverse().find(b => b.entries.some(x => x.state !== UNSENT));
    if (!batch) throw new Error(t('noJournal'));
    const entries = batch.entries.filter(x => x.state !== UNSENT);
    if (!entries.length) throw new Error(t('noRestorable'));
    await scan();
    let conflicts = 0;
    proposals = [];
    for (const item of entries) {
      const current = catalog.get(keyOf(item));
      if (current?.original === item.after)
        proposals.push({...current,after:item.original,selected:false});
      else conflicts++;
    }
    render();
    status(t('restoreResult', proposals.length, conflicts));
  });
  ui('forget').onclick = () => {
    if (busy) return;
    if (!confirm(t('forgetConfirm'))) return;
    GM_deleteValue(storageKey); journal = []; status(t('forgotten'));
  };
})();
