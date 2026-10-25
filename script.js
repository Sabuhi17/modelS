/* =====================================================================
   script.js — Welfare State Simulator: oyun məntiqi
   Struktur:
     1. Köməkçi funksiyalar        6. Birinci mərhələ (kartların yerləşdirilməsi)
     2. Vəziyyət və yaddaş         7. İkinci mərhələ (öz modelini yarat)
     3. Taymer və keçidlər         8. Yekun səhifə
     4. Bildirişlər və pəncərələr  9. Hesabat səhifəsi
     5. Qiymətləndirmə             10. Hadisələr və başlanğıc
   Məlumatlar (kartlar, cavab açarı, variantlar) data.js faylındadır.
   ===================================================================== */
(function () {
  "use strict";

  /* ================= 1. Köməkçi funksiyalar ================= */
  const MIN = 60000;
  const LIMITS = {
    s1: CONFIG.S1_MIN * MIN,
    s2: (CONFIG.S1_MIN + CONFIG.S2_MIN) * MIN,   // ikinci mərhələ ümumi vaxtın 22-ci dəqiqəsində bitir
    total: CONFIG.TOTAL_MIN * MIN
  };
  const app = document.getElementById("app");
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const MODEL_BY_ID = {};
  MODELS.forEach(m => { MODEL_BY_ID[m.id] = m; });
  const CARD_BY_ID = {};
  CARDS.forEach(c => { CARD_BY_ID[c.id] = c; });
  const IND_BY_ID = {};
  INDICATORS.forEach(i => { IND_BY_ID[i.id] = i; });

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  const pad = n => String(n).padStart(2, "0");
  function fmtClock(ms) {
    const s = Math.ceil(Math.max(0, ms) / 1000);
    return pad(Math.floor(s / 60)) + ":" + pad(s % 60);
  }
  function fmtDur(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    return Math.floor(s / 60) + " dəq " + pad(s % 60) + " san";
  }
  function fmt(n) {                       // 1.25 → «1,25»
    return (Math.round(n * 100) / 100).toString().replace(".", ",");
  }
  function fmtDate(ts) {
    try {
      return new Date(ts).toLocaleString("az-AZ", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) { return new Date(ts).toLocaleString(); }
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  /* ================= 2. Vəziyyət və yaddaş ================= */
  let state = null;
  let saveWarned = false;

  function newState(name, surname) {
    return {
      v: 1, name: name, surname: surname, startTs: Date.now(),
      phase: "s1",                 // s1 | s2 | final
      view: "results",             // final mərhələdə: results | report
      s1: { order: shuffle(ACTIVE_CARDS.map(c => c.id)), place: {}, checked: false, checkedAt: null, filter: "all" },
      s2: { ctype: "existing", country: "", hypo: "", modelName: "", choices: {}, just: "", done: false },
      finishedAt: null, reason: null, savedAt: null, timeNotified: false,
      teacher: { score: "", notes: "" }
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || s.v !== 1 || !s.s1 || !s.s2 || !s.startTs) return null;
      const ids = new Set(ACTIVE_CARDS.map(c => c.id));
      s.s1.order = (s.s1.order || []).filter(id => ids.has(id));
      ACTIVE_CARDS.forEach(c => { if (s.s1.order.indexOf(c.id) < 0) s.s1.order.push(c.id); });
      s.s1.place = s.s1.place || {};
      Object.keys(s.s1.place).forEach(k => { if (!ids.has(k) || !MODEL_BY_ID[s.s1.place[k]]) delete s.s1.place[k]; });
      s.s2.choices = s.s2.choices || {};
      s.teacher = s.teacher || { score: "", notes: "" };
      return s;
    } catch (e) { return null; }
  }

  function saveState() {
    try { localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state)); }
    catch (e) {
      if (!saveWarned) {
        saveWarned = true;
        toast("Brauzer yaddaşına yazmaq mümkün olmadı. Səhifəni yeniləsəniz məlumatlar itə bilər.", "error", 7000);
      }
    }
  }

  /* ================= 3. Taymer və keçidlər =================
     Başlama vaxtı (startTs) localStorage-da saxlanılır; qalan vaxt hər dəfə
     «indiki vaxt − başlama vaxtı» ilə hesablanır. Buna görə səhifənin
     yenilənməsi taymeri sıfırlamır. */
  function tick() {
    if (!state) return;
    const now = Date.now();
    const rem = Math.max(0, state.startTs + LIMITS.total - now);
    const val = $("#timerValue");
    if (val) val.textContent = fmtClock(rem);
    const box = $("#timerBox");
    if (box) {
      box.classList.toggle("warn", rem <= 5 * MIN && rem > MIN);
      box.classList.toggle("danger", rem <= MIN);
    }
    const sub = $("#timerSub");
    if (sub) {
      if (state.phase === "s1" && !state.s1.checked) sub.textContent = "1-ci mərhələ: " + fmtClock(state.startTs + LIMITS.s1 - now);
      else if (state.phase === "final") sub.textContent = "Yekunlaşdırma";
      else sub.textContent = "2-ci mərhələ: " + fmtClock(state.startTs + LIMITS.s2 - now);
    }
    if (state.phase !== "final") {
      if (now >= state.startTs + LIMITS.s2) forceFinish();
      else if (state.phase === "s1" && !state.s1.checked && now >= state.startTs + LIMITS.s1) forceStage1End();
    } else if (rem === 0 && !state.timeNotified) {
      state.timeNotified = true; saveState();
      toast("Ümumi 25 dəqiqəlik vaxt bitdi. Nəticəni yadda saxlaya bilərsiniz.", "info", 6000);
    }
  }

  function forceStage1End() {
    const r = checkStage1();
    state.phase = "s2";
    saveState(); render(); window.scrollTo(0, 0);
    openModal({
      title: "Birinci mərhələnin vaxtı bitdi",
      html: "<p>Cari cavablarınız saxlanıldı və yoxlanıldı. İkinci mərhələyə keçildi.</p>" + countsHtml(r),
      actions: [{ label: "İkinci mərhələyə davam et", kind: "primary" }]
    });
  }

  function forceFinish() {
    if (!state.s1.checked) checkStage1();
    finalize("time");
    openModal({
      title: "Vaxt bitdi",
      html: "<p>Cari məlumatlarınız saxlanıldı. Tamamlanmayan tapşırıqlar ayrıca «tamamlanmamış» kimi göstərilir. Yekun nəticə səhifəsinə keçildi.</p>",
      actions: [{ label: "Nəticələrə bax", kind: "primary" }]
    });
  }

  function finalize(reason) {
    state.phase = "final";
    state.view = "results";
    state.reason = reason;
    state.finishedAt = reason === "time" ? Math.min(Date.now(), state.startTs + LIMITS.s2) : Date.now();
    state.s2.done = s2Status().ready;
    saveState(); render(); window.scrollTo(0, 0);
  }

  /* ================= 4. Bildirişlər və pəncərələr ================= */
  function toast(msg, type, ms) {
    const root = $("#toasts");
    if (!root) return;
    const el = document.createElement("div");
    el.className = "toast " + (type || "info");
    const icon = type === "success" ? "✓" : type === "error" ? "!" : "i";
    el.innerHTML = '<span class="toast-ico" aria-hidden="true">' + icon + "</span><span>" + esc(msg) + "</span>";
    root.appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 300); }, ms || 3200);
    while (root.children.length > 4) root.removeChild(root.firstChild);
  }

  let modalActions = [];
  function openModal(opt) {
    const root = $("#modalRoot");
    modalActions = opt.actions || [];
    root.innerHTML =
      '<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
      '<h2 id="modalTitle">' + esc(opt.title) + "</h2>" +
      '<div class="modal-body">' + opt.html + "</div>" +
      '<div class="modal-actions">' +
      modalActions.map((a, i) => '<button type="button" class="btn ' + (a.kind || "ghost") + '" data-modal-action="' + i + '">' + esc(a.label) + "</button>").join("") +
      "</div></div></div>";
    const first = $(".modal .btn.primary, .modal .btn", root);
    if (first) first.focus();
  }
  function closeModal() { $("#modalRoot").innerHTML = ""; modalActions = []; }

  /* ================= 5. Qiymətləndirmə ================= */
  function computeS1() {
    const place = state.s1.place;
    const N = ACTIVE_CARDS.length;
    const per = CONFIG.STAGE1_MAX / N;
    const perModel = {};
    MODELS.forEach(m => { perModel[m.id] = { total: 0, correct: 0, wrong: 0, incomplete: 0 }; });
    const items = [];
    let correct = 0, wrong = 0, incomplete = 0;
    ACTIVE_CARDS.forEach(c => {
      const k = ANSWER_KEY[c.id];
      const placed = place[c.id] || null;
      let status;
      if (!placed) { status = "none"; incomplete++; }
      else if (placed === k.model) { status = "ok"; correct++; }
      else { status = "bad"; wrong++; }
      const pm = perModel[k.model];
      pm.total++;
      pm[status === "ok" ? "correct" : status === "bad" ? "wrong" : "incomplete"]++;
      items.push({ card: c, key: k, placed: placed, status: status });
    });
    return { N: N, per: per, correct: correct, wrong: wrong, incomplete: incomplete, score: correct * per, perModel: perModel, items: items };
  }

  function s2Answered(ind) {
    const ch = state.s2.choices[ind];
    return ind === 12 ? (Array.isArray(ch) && ch.length > 0) : !!ch;
  }
  function s2Value(ind) {
    const ch = state.s2.choices[ind];
    if (!ch || ind === 12) return null;
    const o = S2_OPTIONS[ind].options.find(x => x.id === ch);
    return o ? o.v : null;
  }
  function s2OptionText(ind) {
    const ch = state.s2.choices[ind];
    if (!ch) return null;
    const list = Array.isArray(ch) ? ch : [ch];
    return list.map(id => { const o = S2_OPTIONS[ind].options.find(x => x.id === id); return o ? o.text : ""; }).filter(Boolean);
  }
  function countryValid() {
    return state.s2.ctype === "existing" ? COUNTRIES.indexOf(state.s2.country) >= 0 : state.s2.hypo.trim().length >= 2;
  }
  function countryName() {
    return state.s2.ctype === "existing" ? state.s2.country : state.s2.hypo.trim();
  }
  function s2Status() {
    let inds = 0;
    INDICATORS.forEach(i => { if (s2Answered(i.id)) inds++; });
    const country = countryValid();
    const name = state.s2.modelName.trim().length >= 3;
    const just = state.s2.just.trim().length >= CONFIG.JUSTIF_MIN_CHARS;
    const missing = [];
    if (!country) missing.push("ölkə");
    if (!name) missing.push("modelin adı");
    if (inds < 12) missing.push((12 - inds) + " göstərici");
    if (!just) missing.push("əsaslandırma (ən azı " + CONFIG.JUSTIF_MIN_CHARS + " simvol)");
    const count = (country ? 1 : 0) + (name ? 1 : 0) + inds + (just ? 1 : 0);
    return { country: country, name: name, inds: inds, just: just, missing: missing, count: count, total: 15, ready: missing.length === 0 };
  }

  function evalRules() {
    const v = n => s2Value(n);
    return LOGIC_RULES.map(r => {
      const absent = r.involves.filter(i => !s2Answered(i));
      if (absent.length) return { rule: r, status: "na", points: 0 };
      const bad = r.violated(v);
      return { rule: r, status: bad ? "fail" : "pass", points: bad ? 0 : r.points };
    });
  }

  function computeAll() {
    const s1 = computeS1();
    const st = s2Status();
    const rules = evalRules();
    const completeScore = st.inds / 12 * CONFIG.S2_COMPLETE_MAX;
    const logicScore = rules.reduce((a, r) => a + r.points, 0);
    const s2Auto = completeScore + logicScore;
    const auto = s1.score + s2Auto;
    const tRaw = parseFloat(String(state.teacher.score).replace(",", "."));
    const teacherEntered = isFinite(tRaw);
    const teacher = teacherEntered ? clamp(tRaw, 0, CONFIG.S2_JUSTIF_MAX) : 0;
    const s1Tasks = s1.N, s1Done = s1.correct + s1.wrong;
    const s2Tasks = st.total, s2Done = st.count;
    return {
      s1: s1, st: st, rules: rules, completeScore: completeScore, logicScore: logicScore, s2Auto: s2Auto,
      auto: auto, teacherEntered: teacherEntered, teacher: teacher, total: auto + teacher,
      tasks: { s1Tasks: s1Tasks, s1Done: s1Done, s2Tasks: s2Tasks, s2Done: s2Done,
               done: s1Done + s2Done, all: s1Tasks + s2Tasks, notDone: (s1Tasks - s1Done) + (s2Tasks - s2Done) }
    };
  }

  function overallProgress() {
    const N = ACTIVE_CARDS.length;
    const placed = Object.keys(state.s1.place).length;
    const st = s2Status();
    return { s1: placed / N, s2: st.count / st.total, overall: (placed + st.count) / (N + st.total) };
  }

  function updateHeader() {
    if (!state) return;
    const p = overallProgress();
    const pct = Math.round(p.overall * 100);
    const fill = $("#progressFill"), txt = $("#progressText");
    if (fill) fill.style.width = pct + "%";
    if (txt) txt.textContent = "Tamamlanma: " + pct + "%";
    const bar = $("#progressBar");
    if (bar) bar.setAttribute("aria-valuenow", pct);
    const idx = state.phase === "s1" ? 1 : state.phase === "s2" ? 2 : 3;
    [1, 2, 3].forEach(n => {
      const el = $("#pill" + n);
      if (!el) return;
      el.classList.toggle("active", n === idx);
      el.classList.toggle("done", n < idx);
      if (n === idx) el.setAttribute("aria-current", "step"); else el.removeAttribute("aria-current");
    });
  }

  function countsHtml(r) {
    return '<div class="count-row">' +
      '<span class="chip ok">✓ Düzgün: ' + r.correct + "</span>" +
      '<span class="chip bad">✗ Səhv: ' + r.wrong + "</span>" +
      '<span class="chip none">○ Yerləşdirilməyib: ' + r.incomplete + "</span></div>" +
      "<p><strong>Birinci mərhələnin balı: " + fmt(r.score) + " / " + CONFIG.STAGE1_MAX + "</strong></p>";
  }

  /* ================= 6. Birinci mərhələ ================= */
  let dragCardId = null;

  function modelButtons(cid) {
    return MODELS.map(m =>
      '<button type="button" class="mbtn" style="--mc:' + m.color + ';--ms:' + m.soft + '" data-action="place" data-card="' + cid +
      '" data-model="' + m.id + '" aria-label="' + esc(m.name) + ' modelinə yerləşdir" title="' + esc(m.name) + '">' + m.code + "</button>").join("");
  }

  function renderS1() {
    const s1 = state.s1;
    const locked = s1.checked;
    const res = locked ? computeS1() : null;
    const resById = {};
    if (res) res.items.forEach(it => { resById[it.card.id] = it; });
    const N = ACTIVE_CARDS.length;
    const placedCount = Object.keys(s1.place).length;
    const prevScroll = window.scrollY;
    const oldPool = $(".pool-list");
    const poolScroll = oldPool ? oldPool.scrollTop : 0;

    // Yerləşdirilməmiş kartlar (təsadüfi ardıcıllıqla)
    const unplaced = s1.order.filter(id => !s1.place[id]).map(id => CARD_BY_ID[id]);
    const visible = unplaced.filter(c => s1.filter === "all" || c.ind === Number(s1.filter));

    const chips = ['<button type="button" class="fchip' + (s1.filter === "all" ? " on" : "") + '" data-action="filter" data-filter="all">Hamısı (' + unplaced.length + ")</button>"]
      .concat(INDICATORS.map(i => {
        const left = unplaced.filter(c => c.ind === i.id).length;
        return '<button type="button" class="fchip' + (String(s1.filter) === String(i.id) ? " on" : "") + (left === 0 ? " done" : "") +
          '" data-action="filter" data-filter="' + i.id + '" title="' + esc(i.name) + '">' + i.id + (left === 0 ? " ✓" : "") + "</button>";
      })).join("");

    const poolCards = visible.length ? visible.map(c =>
      '<article class="card" draggable="' + (locked ? "false" : "true") + '" data-drag-card="' + c.id + '">' +
      '<div class="card-ind">' + c.ind + ". " + esc(IND_BY_ID[c.ind].name) + "</div>" +
      '<p class="card-text">' + esc(c.text) + "</p>" +
      (locked ? "" : '<div class="card-place"><span class="card-place-label">Yerləşdir:</span>' + modelButtons(c.id) + "</div>") +
      "</article>").join("")
      : '<p class="empty-note">' + (unplaced.length === 0 ? "Bütün kartlar yerləşdirilib. Cavabları yoxlaya bilərsiniz." : "Bu göstərici üzrə yerləşdirilməmiş kart qalmayıb.") + "</p>";

    const panels = MODELS.map(m => {
      let cnt = 0;
      const rows = INDICATORS.map(i => {
        const card = ACTIVE_CARDS.find(c => c.ind === i.id && s1.place[c.id] === m.id);
        if (card) cnt++;
        let cls = "slot", body, status = "";
        if (card) {
          const it = resById[card.id];
          cls += " filled" + (it ? " " + it.status : "");
          body = '<p class="slot-text">' + esc(card.text) + "</p>";
          if (it && it.status === "ok") {
            status = '<div class="fb ok"><strong>✓ Düzgün.</strong> ' + esc(it.key.why) + basisNote(it.key) + "</div>";
          } else if (it && it.status === "bad") {
            status = '<div class="fb bad"><strong>✗ Səhv model.</strong> Bu xüsusiyyət «' + esc(MODEL_BY_ID[it.key.model].name) + '» modelinə aiddir. ' +
              esc(it.key.why) + basisNote(it.key) + "</div>";
          }
          if (!locked) body += '<button type="button" class="slot-x" data-action="unplace" data-card="' + card.id + '" aria-label="Kartı geri qaytar" title="Kartı geri qaytar">↩ Geri qaytar</button>';
        } else {
          body = '<p class="slot-empty">' + (locked ? "Bu göstərici üzrə kart yerləşdirilməyib" : "Boşdur") + "</p>";
        }
        return '<div class="' + cls + '" ' + (card && !locked ? 'draggable="true" data-drag-card="' + card.id + '"' : "") + ">" +
          '<div class="slot-ind">' + i.id + ". " + esc(i.name) + "</div>" + body + status + "</div>";
      }).join("");
      return '<section class="model-panel" data-model="' + m.id + '" style="--mc:' + m.color + ';--ms:' + m.soft + '" aria-label="' + esc(m.name) + '">' +
        '<header class="model-head"><span class="model-code">' + m.code + "</span><h3>" + esc(m.name) + '</h3><span class="model-count">' + cnt + "/12</span></header>" +
        '<div class="slots">' + rows + "</div></section>";
    }).join("");

    let unplacedFb = "";
    if (locked && res.incomplete) {
      unplacedFb = '<section class="panel"><h3>Yerləşdirilməyən kartlar (' + res.incomplete + ')</h3><p class="muted">Bunlar səhv deyil, tamamlanmamış tapşırıq kimi sayılır.</p><ul class="fb-list">' +
        res.items.filter(it => it.status === "none").map(it =>
          "<li><strong>" + it.card.ind + ". " + esc(IND_BY_ID[it.card.ind].name) + ":</strong> " + esc(it.card.text) +
          '<br><span class="muted">Düzgün model: ' + esc(MODEL_BY_ID[it.key.model].name) + ". " + esc(it.key.why) + esc(basisText(it.key)) + "</span></li>").join("") + "</ul></section>";
    }

    const actions = locked
      ? '<div class="actions"><button type="button" class="btn ghost" data-action="showSummary">Nəticə xülasəsi</button>' +
        '<button type="button" class="btn primary big" data-action="goS2">İkinci mərhələyə keç →</button></div>' +
        '<p class="muted center">Birinci mərhələni vaxtından tez bitirdiyiniz üçün qalan vaxt itmir: ikinci mərhələ ümumi vaxtın 22-ci dəqiqəsinə qədər davam edir.</p>'
      : '<div class="actions"><span class="muted">' + (placedCount < N ? (N - placedCount) + " kart yerləşdirilməyib." : "Bütün kartlar yerləşdirilib.") + '</span>' +
        '<button type="button" class="btn primary big" data-action="check1">Cavabları yoxla və davam et</button></div>';

    app.innerHTML =
      '<section class="stage-head s1"><div><span class="eyebrow">1-ci mərhələ · 12 dəqiqə · ' + CONFIG.STAGE1_MAX + " bal</span>" +
      "<h1>Mövcud modelləri qur</h1>" +
      "<p>Hər kart dörd sosial siyasət modelindən birinə aiddir. Kartı kompüterdə model qutusuna <strong>sürüşdürün</strong> və ya (mobil üçün) kartın altındakı rəngli <strong>model düymələrinə</strong> toxunun. " +
      "Hər modeldə hər göstərici üçün yalnız bir kart ola bilər; kartı dəyişmək üçün «Geri qaytar» düyməsini və ya başqa kartı həmin yerə atın. Hər düzgün cavab " + fmt(res ? res.per : CONFIG.STAGE1_MAX / N) + " baldır.</p></div>" +
      '<div class="stage-meter"><strong>' + placedCount + " / " + N + '</strong><span>kart yerləşdirilib</span>' +
      '<div class="mini-bar"><i style="width:' + Math.round(placedCount / N * 100) + '%"></i></div></div></section>' +
      '<div class="legend">' + MODELS.map(m => '<span class="lg" style="--mc:' + m.color + '"><i></i>' + m.code + " — " + esc(m.name) + "</span>").join("") + "</div>" +
      '<div class="s1-layout">' +
      '<aside class="pool" data-drop-pool="1"><h2>Kartlar</h2>' +
      '<div class="fchips" role="group" aria-label="Göstərici filtri">' + chips + "</div>" +
      '<div class="pool-list">' + poolCards + "</div></aside>" +
      '<div class="models-grid">' + panels + "</div></div>" + unplacedFb + actions;

    window.scrollTo(0, prevScroll);
    const np = $(".pool-list");
    if (np) np.scrollTop = poolScroll;
    updateHeader();
  }

  function basisText(k) {
    return k.basis === "interp" ? " (Qeyd: bu cavab dərs materialında birbaşa göstərilmir, ümumi prinsiplərdən çıxarılan interpretasiyadır.)" : "";
  }
  function basisNote(k) {
    return k.basis === "interp" ? ' <em class="interp">Qeyd: bu cavab dərs materialında birbaşa göstərilmir, ümumi prinsiplərdən çıxarılan interpretasiyadır.</em>' : "";
  }

  function placeCard(cid, mid) {
    if (!state || state.phase !== "s1" || state.s1.checked) return;
    const card = CARD_BY_ID[cid];
    if (!card || !MODEL_BY_ID[mid] || !ACTIVE_CARDS.some(c => c.id === cid)) return;
    const place = state.s1.place;
    if (place[cid] === mid) { toast("Bu kart artıq həmin modeldədir.", "info"); return; }
    let replaced = false;
    ACTIVE_CARDS.forEach(c => {            // eyni modeldə eyni göstəricinin ikinci kartı ola bilməz
      if (c.id !== cid && c.ind === card.ind && place[c.id] === mid) { delete place[c.id]; replaced = true; }
    });
    place[cid] = mid;                      // bir kart yalnız bir yerdə ola bilər
    saveState(); renderS1();
    toast(replaced ? "Kart yerləşdirildi, əvvəlki kart geri qaytarıldı." : "Kart «" + MODEL_BY_ID[mid].short + "» modelinə yerləşdirildi.", "success", 1800);
  }

  function unplaceCard(cid) {
    if (!state || state.phase !== "s1" || state.s1.checked) return;
    if (!state.s1.place[cid]) return;
    delete state.s1.place[cid];
    saveState(); renderS1();
    toast("Kart geri qaytarıldı.", "info", 1500);
  }

  function checkStage1() {
    state.s1.checked = true;
    state.s1.checkedAt = Date.now();
    saveState();
    return computeS1();
  }

  function onCheck1() {
    const N = ACTIVE_CARDS.length;
    const left = N - Object.keys(state.s1.place).length;
    const run = () => {
      const r = checkStage1();
      renderS1(); window.scrollTo(0, 0);
      showS1Summary(r);
    };
    if (left > 0) {
      openModal({
        title: "Bütün kartlar yerləşdirilməyib",
        html: "<p><strong>" + left + "</strong> kart hələ yerləşdirilməyib. Onlar səhv deyil, «tamamlanmamış» kimi ayrıca göstəriləcək, lakin bal verilməyəcək. Yoxlama başladıqdan sonra birinci mərhələyə qayıtmaq mümkün olmayacaq.</p>",
        actions: [
          { label: "Geri qayıt", kind: "ghost" },
          { label: "Yenə də yoxla", kind: "primary", onClick: run }
        ]
      });
    } else run();
  }

  function showS1Summary(r) {
    r = r || computeS1();
    openModal({
      title: "Birinci mərhələnin nəticəsi",
      html: countsHtml(r) + '<p class="muted">Hər kartın altında düzgün və ya səhv cavabın izahı göstərilir. İstədiyiniz vaxt ikinci mərhələyə keçə bilərsiniz.</p>',
      actions: [
        { label: "Cavablara bax", kind: "ghost" },
        { label: "İkinci mərhələyə keç →", kind: "primary", onClick: goStage2 }
      ]
    });
  }

  function goStage2() {
    if (!state || state.phase !== "s1" || !state.s1.checked) return;
    state.phase = "s2";
    saveState(); render(); window.scrollTo(0, 0);
    toast("İkinci mərhələ başladı. Qalan vaxt itməyib.", "success");
  }

  /* ================= 7. İkinci mərhələ ================= */
  function renderS2() {
    const s2 = state.s2;
    const optHtml = INDICATORS.map(i => {
      const def = S2_OPTIONS[i.id];
      const type = def.multi ? "checkbox" : "radio";
      const sel = s2.choices[i.id];
      const opts = def.options.map(o => {
        const checked = def.multi ? (Array.isArray(sel) && sel.indexOf(o.id) >= 0) : sel === o.id;
        return '<label class="opt' + (checked ? " selected" : "") + '"><input class="opt-input" type="' + type + '" name="ind' + i.id +
          '" value="' + o.id + '" data-ind="' + i.id + '"' + (checked ? " checked" : "") + "><span>" + esc(o.text) + "</span></label>";
      }).join("");
      return '<fieldset class="ind-set" id="set' + i.id + '"><legend><span class="ind-no">' + i.id + "</span> " + esc(i.name) +
        '<span class="ind-ok" aria-hidden="true"></span></legend><p class="muted">' + esc(def.hint) + '</p><div class="opts">' + opts + "</div></fieldset>";
    }).join("");

    const countryOpts = '<option value="">— Ölkə seçin —</option>' +
      COUNTRIES.map(c => '<option value="' + esc(c) + '"' + (s2.country === c ? " selected" : "") + ">" + esc(c) + "</option>").join("");

    app.innerHTML =
      '<section class="stage-head s2"><div><span class="eyebrow">2-ci mərhələ · maksimum 10 dəqiqə + qalan vaxt · 40 bal</span>' +
      "<h1>Öz rifah dövlətini yarat</h1>" +
      "<p>Birinci mərhələdə öyrəndiklərinizdən istifadə edərək ölkəniz üçün yeni sosial siyasət modeli qurun. Burada «düzgün cavab» yoxdur: klassik modellərin xüsusiyyətlərini birləşdirib hibrid model yarada bilərsiniz.</p></div>" +
      '<div class="stage-meter"><strong id="s2count">0 / 15</strong><span>bölmə doldurulub</span><div class="mini-bar"><i id="s2bar"></i></div></div></section>' +
      '<details class="panel criteria"><summary>Bu mərhələ necə qiymətləndirilir?</summary>' +
      "<ul><li><strong>20 bal:</strong> 12 göstəricinin hamısının doldurulması (hər göstərici 1,67 bal).</li>" +
      "<li><strong>10 bal:</strong> seçimlərin daxili məntiqi uyğunluğu. Yalnız bir-birini istisna edən seçimlər yoxlanılır (məsələn, hamı üçün pulsuz xidmət, amma maliyyə mənbəyi yoxdur). Klassik modellərdən fərqlənmək və ya hibrid model qurmaq xal itirmir.</li>" +
      "<li><strong>10 bal:</strong> əsaslandırma. Elmi keyfiyyətini avtomatik sistem etibarlı qiymətləndirə bilmədiyi üçün bu bal müəllim tərəfindən verilir.</li></ul></details>" +
      '<form id="s2form" class="s2-form" novalidate autocomplete="off">' +
      '<section class="panel"><h2>1. Ölkə seçimi</h2>' +
      '<p class="muted">Seçdiyiniz ölkə yalnız modelinizi qurduğunuz kontekstdir; ölkənin real modeli avtomatik müəyyən edilmir.</p>' +
      '<div class="radio-row"><label><input type="radio" name="ctype" value="existing"' + (s2.ctype === "existing" ? " checked" : "") + "> Mövcud ölkə</label>" +
      '<label><input type="radio" name="ctype" value="hypo"' + (s2.ctype === "hypo" ? " checked" : "") + "> Hipotetik ölkə</label></div>" +
      '<div id="boxExisting"' + (s2.ctype === "existing" ? "" : " hidden") + '><label class="lbl" for="countrySel">Ölkə</label><select id="countrySel">' + countryOpts + "</select></div>" +
      '<div id="boxHypo"' + (s2.ctype === "hypo" ? "" : " hidden") + '><label class="lbl" for="hypoName">Hipotetik ölkənin adı</label>' +
      '<input id="hypoName" type="text" maxlength="40" value="' + esc(s2.hypo) + '" placeholder="Məs.: Yeni Rifah Respublikası"></div></section>' +
      '<section class="panel"><h2>2. Modelin adı</h2><label class="lbl" for="modelName">Yeni sosial siyasət modelinizin adı</label>' +
      '<input id="modelName" type="text" maxlength="60" value="' + esc(s2.modelName) + '" placeholder="Öz adınızı yazın (ən azı 3 simvol)"></section>' +
      '<section class="panel"><h2>3. Modelin 12 göstəricisi</h2><p class="muted">Hər göstərici üçün bir variant seçin (12-ci göstərici üçün 1–3 variant).</p></section>' +
      optHtml +
      '<section class="panel"><h2>4. Əsaslandırma</h2><label class="lbl" for="just">Niyə bu sosial siyasət modelini seçdin? Modelinin ölkədəki sosial problemlərin həllinə hansı töhfəni verəcəyini düşünürsən?</label>' +
      '<textarea id="just" rows="5" maxlength="' + CONFIG.JUSTIF_MAX_CHARS + '" placeholder="Fikirlərinizi qısa yazın...">' + esc(s2.just) + "</textarea>" +
      '<div class="counter"><span id="justCount">0</span> / ' + CONFIG.JUSTIF_MAX_CHARS + " simvol</div></section>" +
      '<div class="submit-bar"><div id="s2missing" class="muted"></div><button type="button" id="finishBtn" class="btn primary big" data-action="finishS2" disabled>Modelimi tamamla</button></div>' +
      "</form>";
    updateS2UI();
    updateHeader();
  }

  function updateS2UI() {
    if (!state || state.phase !== "s2") return;
    const st = s2Status();
    const c = $("#s2count"), b = $("#s2bar"), jc = $("#justCount"), btn = $("#finishBtn"), ms = $("#s2missing");
    if (c) c.textContent = st.count + " / " + st.total;
    if (b) b.style.width = Math.round(st.count / st.total * 100) + "%";
    if (jc) jc.textContent = state.s2.just.length;
    if (btn) btn.disabled = !st.ready;
    if (ms) ms.textContent = st.ready ? "Hər şey hazırdır. Modelinizi tamamlaya bilərsiniz." : "Qalan: " + st.missing.join(", ") + ".";
    INDICATORS.forEach(i => {
      const set = $("#set" + i.id);
      if (set) set.classList.toggle("complete", s2Answered(i.id));
    });
    updateHeader();
  }

  function onS2Input(e) {
    if (!state || state.phase !== "s2") return;
    const t = e.target, s2 = state.s2;
    if (t.name === "ctype") {
      s2.ctype = t.value;
      $("#boxExisting").hidden = s2.ctype !== "existing";
      $("#boxHypo").hidden = s2.ctype !== "hypo";
    } else if (t.id === "countrySel") s2.country = t.value;
    else if (t.id === "hypoName") s2.hypo = t.value;
    else if (t.id === "modelName") s2.modelName = t.value;
    else if (t.id === "just") s2.just = t.value.slice(0, CONFIG.JUSTIF_MAX_CHARS);
    else if (t.classList && t.classList.contains("opt-input")) {
      const ind = Number(t.dataset.ind), def = S2_OPTIONS[ind];
      if (def.multi) {
        let list = Array.isArray(s2.choices[ind]) ? s2.choices[ind].slice() : [];
        const opt = def.options.find(o => o.id === t.value);
        if (t.checked) {
          if (opt && opt.exclusive) list = [t.value];
          else {
            list = list.filter(id => { const o = def.options.find(x => x.id === id); return !(o && o.exclusive); });
            if (list.length >= def.max) { t.checked = false; toast("Ən çox " + def.max + " variant seçmək olar.", "error"); return; }
            if (list.indexOf(t.value) < 0) list.push(t.value);
          }
        } else list = list.filter(id => id !== t.value);
        if (list.length) s2.choices[ind] = list; else delete s2.choices[ind];
        $$('input[name="ind' + ind + '"]').forEach(x => { x.checked = list.indexOf(x.value) >= 0; });
      } else s2.choices[ind] = t.value;
      $$('input[name="ind' + ind + '"]').forEach(x => x.closest(".opt").classList.toggle("selected", x.checked));
    } else return;
    saveState(); updateS2UI();
  }

  function onFinishS2() {
    const st = s2Status();
    if (!st.ready) { toast("Əvvəlcə çatışmayanları doldurun: " + st.missing.join(", ") + ".", "error", 4500); return; }
    openModal({
      title: "Modeli tamamlamaq istəyirsiniz?",
      html: "<p>Tamamladıqdan sonra ikinci mərhələyə qayıtmaq mümkün olmayacaq və yekun nəticə səhifəsi açılacaq.</p>",
      actions: [
        { label: "Geri qayıt", kind: "ghost" },
        { label: "Modelimi tamamla", kind: "primary", onClick: () => { finalize("user"); toast("Model tamamlandı. Nəticələr hazırdır.", "success"); } }
      ]
    });
  }

  /* ================= 8. Yekun səhifə ================= */
  function masteryBars(res) {
    return MODELS.map(m => {
      const p = res.s1.perModel[m.id];
      const pct = p.total ? Math.round(p.correct / p.total * 100) : 0;
      return '<div class="mastery" style="--mc:' + m.color + ';--ms:' + m.soft + '"><div class="mastery-top"><strong>' + esc(m.name) + "</strong><span>" + p.correct + " / " + p.total + " düzgün</span></div>" +
        '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
        '<div class="muted small">Səhv yerləşdirilib: ' + p.wrong + " · Yerləşdirilməyib: " + p.incomplete + "</div></div>";
    }).join("");
  }

  function insightsHtml(res) {
    const arr = MODELS.map(m => { const p = res.s1.perModel[m.id]; return { m: m, p: p, r: p.total ? p.correct / p.total : 0 }; });
    const answered = res.s1.correct + res.s1.wrong;
    if (!answered) return "<p>Birinci mərhələ üzrə qiymətləndirilə bilən cavab yoxdur.</p>";
    const sorted = arr.slice().sort((a, b) => b.r - a.r);
    const best = sorted[0], worst = sorted[sorted.length - 1];
    let html = "<p><strong>Ən yaxşı mənimsənilən model:</strong> " + esc(best.m.name) + " (" + best.p.correct + "/" + best.p.total + ").</p>";
    if (best.m.id !== worst.m.id && worst.r < 1) html += "<p><strong>Təkrar etməyə dəyər model:</strong> " + esc(worst.m.name) + " (" + worst.p.correct + "/" + worst.p.total + ").</p>";
    const badInds = {};
    res.s1.items.filter(it => it.status === "bad").forEach(it => { badInds[it.card.ind] = (badInds[it.card.ind] || 0) + 1; });
    const keys = Object.keys(badInds);
    if (keys.length) html += "<p><strong>Səhvlərin olduğu göstəricilər:</strong> " + keys.map(k => esc(IND_BY_ID[k].name)).join("; ") + ".</p>";
    else html += "<p>Yerləşdirdiyiniz bütün kartlar düzgündür.</p>";
    return html;
  }

  function ownModelTable(withHeading) {
    const st = s2Status();
    const rows = INDICATORS.map(i => {
      const t = s2OptionText(i.id);
      return "<tr><th scope='row'>" + i.id + ". " + esc(i.name) + "</th><td>" +
        (t && t.length ? t.map(x => "<div>" + esc(x) + "</div>").join("") : '<span class="tag none">Doldurulmayıb</span>') + "</td></tr>";
    }).join("");
    return '<div class="own-head">' +
      "<div><span class='muted small'>Ölkə</span><strong>" + (st.country ? esc(countryName()) : '<span class="tag none">Seçilməyib</span>') + (state.s2.ctype === "hypo" && st.country ? " (hipotetik)" : "") + "</strong></div>" +
      "<div><span class='muted small'>Modelin adı</span><strong>" + (st.name ? esc(state.s2.modelName.trim()) : '<span class="tag none">Ad verilməyib</span>') + "</strong></div></div>" +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th>Göstərici</th><th>Seçilmiş variant</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
      '<div class="just-box"><span class="muted small">İştirakçının əsaslandırması</span><p>' + (state.s2.just.trim() ? esc(state.s2.just.trim()) : '<span class="tag none">Əsaslandırma yazılmayıb</span>') + "</p></div>";
  }

  function rulesHtml(res) {
    return '<ul class="rules">' + res.rules.map(r => {
      const ic = r.status === "pass" ? "✓" : r.status === "fail" ? "✗" : "–";
      const txt = r.status === "pass" ? r.rule.okText : r.status === "fail" ? r.rule.failText : "Qiymətləndirilə bilmədi: bu meyar üçün lazım olan göstəricilər doldurulmayıb.";
      return '<li class="rule ' + r.status + '"><span class="rule-ic">' + ic + "</span><div><strong>" + esc(r.rule.title) + "</strong> — " + r.points + "/" + r.rule.points + " bal<br><span class='muted'>" + esc(txt) + "</span></div></li>";
    }).join("") + "</ul>";
  }

  function scoreCards(res) {
    return '<div class="score-grid">' +
      '<div class="score big-score"><span class="muted small">Ümumi bal</span><strong>' + fmt(res.total) + '<small> / 100</small></strong>' +
      '<span class="muted small">' + (res.teacherEntered ? "Müəllimin əsaslandırma balı daxil olmaqla" : "Əsaslandırma balı (10) müəllim tərəfindən əlavə olunacaq") + "</span></div>" +
      '<div class="score"><span class="muted small">1-ci mərhələ</span><strong>' + fmt(res.s1.score) + '<small> / ' + CONFIG.STAGE1_MAX + "</small></strong></div>" +
      '<div class="score"><span class="muted small">2-ci mərhələ (avtomatik)</span><strong>' + fmt(res.s2Auto) + '<small> / ' + (CONFIG.S2_COMPLETE_MAX + CONFIG.S2_LOGIC_MAX) + "</small></strong>" +
      '<span class="muted small">Tamamlanma ' + fmt(res.completeScore) + "/" + CONFIG.S2_COMPLETE_MAX + " · Məntiq " + res.logicScore + "/" + CONFIG.S2_LOGIC_MAX + "</span></div>" +
      '<div class="score"><span class="muted small">Əsaslandırma (müəllim)</span><strong>' + (res.teacherEntered ? fmt(res.teacher) : "—") + '<small> / ' + CONFIG.S2_JUSTIF_MAX + "</small></strong></div></div>";
  }

  function countsGrid(res) {
    const s1 = res.s1, t = res.tasks;
    return '<div class="count-grid">' +
      '<div class="cnt ok"><strong>' + s1.correct + "</strong><span>Düzgün cavab</span></div>" +
      '<div class="cnt bad"><strong>' + s1.wrong + "</strong><span>Səhv cavab</span></div>" +
      '<div class="cnt none"><strong>' + s1.incomplete + "</strong><span>Yerləşdirilməyən kart</span></div>" +
      '<div class="cnt"><strong>' + t.done + " / " + t.all + "</strong><span>Tamamlanmış tapşırıq</span></div>" +
      '<div class="cnt none"><strong>' + t.notDone + "</strong><span>Tamamlanmamış tapşırıq</span></div></div>" +
      '<p class="muted small">Tapşırıqlar: 1-ci mərhələdə ' + t.s1Tasks + " kart, 2-ci mərhələdə " + t.s2Tasks + " bölmə (ölkə, modelin adı, 12 göstərici, əsaslandırma). Tamamlanmamış tapşırıqlar səhv cavab kimi sayılmır.</p>";
  }

  function renderFinal() {
    const res = computeAll();
    const reasonNote = state.reason === "time" ? '<div class="notice warn">Vaxt bitdiyi üçün oyun avtomatik yekunlaşdırıldı. Doldurulmayan hissələr «tamamlanmamış» kimi göstərilir.</div>' : "";
    app.innerHTML =
      '<section class="stage-head final"><div><span class="eyebrow">Yekunlaşdırma</span><h1>Yekun nəticə</h1>' +
      "<p><strong>" + esc(state.name + " " + state.surname) + "</strong> · oyun müddəti: " + fmtDur(state.finishedAt - state.startTs) + "</p></div></section>" +
      reasonNote + scoreCards(res) +
      '<section class="panel"><h2>Tapşırıqların vəziyyəti</h2>' + countsGrid(res) + "</section>" +
      '<section class="panel"><h2>Birinci mərhələ: modellər üzrə mənimsəmə</h2><div class="mastery-grid">' + masteryBars(res) + "</div>" +
      '<div class="insight">' + insightsHtml(res) + "</div></section>" +
      '<section class="panel own"><h2>İkinci mərhələ: yaratdığınız sosial siyasət modeli</h2>' + ownModelTable() +
      "<h3>Məntiqi uyğunluq yoxlaması</h3>" + rulesHtml(res) + "</section>" +
      '<div class="actions"><button type="button" class="btn ghost" data-action="restart">Yenidən başla</button>' +
      '<button type="button" class="btn primary big" data-action="saveResult">Nəticəni yadda saxla</button></div>';
    updateHeader();
  }

  function saveResult() {
    state.savedAt = Date.now();
    state.view = "report";
    saveState();
    try {                                   // sonuncu nəticələrin qısa siyahısı (yalnız bu brauzerdə)
      const res = computeAll();
      const key = CONFIG.STORAGE_KEY + "_history";
      const hist = JSON.parse(localStorage.getItem(key) || "[]");
      hist.unshift({ name: state.name + " " + state.surname, date: state.savedAt, total: Math.round(res.total * 100) / 100, model: state.s2.modelName });
      localStorage.setItem(key, JSON.stringify(hist.slice(0, 10)));
    } catch (e) { /* tarixçə vacib deyil */ }
    if (location.hash !== "#hesabat") location.hash = "#hesabat";
    render(); window.scrollTo(0, 0);
    toast("Nəticə brauzer yaddaşında saxlandı. Hesabat səhifəsi hazırdır.", "success", 4000);
  }

  /* ================= 9. Hesabat səhifəsi ================= */
  function renderReport() {
    const res = computeAll();
    const s1 = res.s1;
    const byCell = {};                       // model + göstərici → yerləşdirilmiş kart
    ACTIVE_CARDS.forEach(c => { const m = state.s1.place[c.id]; if (m) byCell[m + "|" + c.ind] = c; });

    const modelTables = MODELS.map(m => {
      const p = s1.perModel[m.id];
      const rows = INDICATORS.map(i => {
        const c = byCell[m.id + "|" + i.id];
        let cell, st;
        if (!c) { cell = '<span class="muted">—</span>'; st = '<span class="tag none">Boş</span>'; }
        else {
          const k = ANSWER_KEY[c.id];
          cell = esc(c.text);
          st = k.model === m.id ? '<span class="tag ok">✓ Düzgün</span>'
            : '<span class="tag bad">✗ Səhv</span><div class="small muted">Aid olduğu model: ' + esc(MODEL_BY_ID[k.model].short) + "</div>";
          if (k.basis === "interp") st += '<div class="small muted">Interpretasiya</div>';
        }
        return "<tr><th scope='row'>" + i.id + ". " + esc(i.name) + "</th><td>" + cell + "</td><td>" + st + "</td></tr>";
      }).join("");
      return '<section class="rep-sec model-sec" style="--mc:' + m.color + ';--ms:' + m.soft + '"><h3><span class="model-code">' + m.code + "</span> " + esc(m.name) +
        '<small>Bu modelə aid 12 kartdan düzgün yerləşdirilən: ' + p.correct + "</small></h3>" +
        '<div class="table-wrap"><table class="tbl"><thead><tr><th>Göstərici</th><th>İştirakçının bu modelə yerləşdirdiyi kart</th><th>Nəticə</th></tr></thead><tbody>' + rows + "</tbody></table></div></section>";
    }).join("");

    const unplaced = s1.items.filter(it => it.status === "none");
    const unplacedHtml = unplaced.length ? '<section class="rep-sec"><h3>Yerləşdirilməyən kartlar (' + unplaced.length + ")</h3><ul class='fb-list'>" +
      unplaced.map(it => "<li>" + it.card.ind + ". " + esc(IND_BY_ID[it.card.ind].name) + ": " + esc(it.card.text) + " <span class='muted'>(Düzgün model: " + esc(MODEL_BY_ID[it.key.model].short) + ")</span></li>").join("") + "</ul></section>" : "";

    const wrongs = s1.items.filter(it => it.status === "bad");
    const wrongHtml = wrongs.length ? '<section class="rep-sec"><h3>Səhv cavablar və izahlar (' + wrongs.length + ")</h3><ul class='fb-list'>" +
      wrongs.map(it => "<li><strong>" + it.card.ind + ". " + esc(IND_BY_ID[it.card.ind].name) + ":</strong> " + esc(it.card.text) +
        "<br><span class='muted'>Seçilən: " + esc(MODEL_BY_ID[it.placed].short) + " → Düzgün: " + esc(MODEL_BY_ID[it.key.model].short) + ". " + esc(it.key.why) + esc(basisText(it.key)) + "</span></li>").join("") + "</ul></section>" : "";

    const interpCount = ACTIVE_CARDS.filter(c => ANSWER_KEY[c.id].basis === "interp").length;

    app.innerHTML =
      '<div class="toolbar no-print">' +
      '<button type="button" class="btn ghost" data-action="backResults">← Yekun səhifə</button>' +
      '<span class="spacer"></span>' +
      '<button type="button" class="btn ghost" data-action="shot">Ekran görüntüsü üçün hazırla</button>' +
      '<button type="button" class="btn primary" data-action="print">Çap et / PDF kimi saxla</button>' +
      '<button type="button" class="btn danger-ghost" data-action="restart">Yenidən başla</button></div>' +
      '<article class="report" id="report">' +
      '<header class="rep-head"><div><span class="eyebrow">Hesabat</span><h1>Welfare State Simulator</h1><p class="subtitle">Rifah Dövləti Qurucusu</p></div>' +
      '<div class="rep-meta"><div><span class="muted small">İştirakçı</span><strong>' + esc(state.name + " " + state.surname) + "</strong></div>" +
      '<div><span class="muted small">Oyunun tarixi</span><strong>' + esc(fmtDate(state.startTs)) + "</strong></div>" +
      '<div><span class="muted small">Tamamlanma müddəti</span><strong>' + fmtDur(state.finishedAt - state.startTs) + " / " + CONFIG.TOTAL_MIN + " dəq</strong></div>" +
      '<div><span class="muted small">Bitmə səbəbi</span><strong>' + (state.reason === "time" ? "Vaxt bitdi" : "İştirakçı tamamladı") + "</strong></div></div></header>" +
      '<section class="rep-sec"><h2>Yekun bal</h2>' + scoreCards(res) +
      '<p class="muted small">Qiymətləndirmə: 1-ci mərhələ ' + CONFIG.STAGE1_MAX + " bal (hər düzgün cavab " + fmt(s1.per) + " bal); 2-ci mərhələ " +
      (CONFIG.S2_COMPLETE_MAX + CONFIG.S2_LOGIC_MAX + CONFIG.S2_JUSTIF_MAX) + " bal (tamamlanma " + CONFIG.S2_COMPLETE_MAX + ", məntiqi uyğunluq " + CONFIG.S2_LOGIC_MAX + ", əsaslandırma " + CONFIG.S2_JUSTIF_MAX + " — müəllim qiymətləndirir).</p></section>" +
      '<section class="rep-sec"><h2>Cavabların sayı</h2>' + countsGrid(res) + "</section>" +
      '<section class="rep-sec"><h2>Birinci mərhələ — modellər üzrə nəticə</h2><div class="mastery-grid">' + masteryBars(res) + "</div>" +
      '<p><strong>Birinci mərhələnin nəticəsi:</strong> ' + fmt(s1.score) + " / " + CONFIG.STAGE1_MAX + " bal</p></section>" +
      '<h2 class="rep-h2">Birinci mərhələ — 4 model üzrə 12 göstərici</h2>' + modelTables + wrongHtml + unplacedHtml +
      '<section class="rep-sec own"><h2>İkinci mərhələ — iştirakçının yaratdığı model</h2>' + ownModelTable() +
      "<h3>Məntiqi uyğunluq meyarları</h3>" + rulesHtml(res) + "</section>" +
      '<section class="rep-sec teacher"><h2>Müəllimin qiymətləndirməsi və qeydləri</h2>' +
      '<div class="teacher-row"><label for="tScore">Əsaslandırma balı (0–' + CONFIG.S2_JUSTIF_MAX + ")</label>" +
      '<input id="tScore" type="number" min="0" max="' + CONFIG.S2_JUSTIF_MAX + '" step="0.5" value="' + esc(state.teacher.score) + '" placeholder="__">' +
      "<span class='muted small'>Bu meyar avtomatik qiymətləndirilmir.</span></div>" +
      '<label for="tNotes" class="lbl">Müəllimin qeydləri</label><textarea id="tNotes" rows="5">' + esc(state.teacher.notes) + "</textarea></section>" +
      '<footer class="rep-foot muted small">Nəticələr yalnız bu brauzerin yaddaşında saxlanılır; mərkəzi verilənlər bazası yoxdur. ' +
      (interpCount ? interpCount + " kartın cavabı dərs materialında birbaşa deyil, ümumi prinsiplərdən çıxarılan interpretasiyadır və hesabatda belə qeyd olunub. " : "") +
      "Mənbə: «Mövzu 5. Sosial siyasətin modelləri» dərs materialı.</footer></article>";
    updateHeader();
  }

  function updateTeacher(e) {
    if (!state) return;
    if (e.target.id === "tScore") {
      state.teacher.score = e.target.value;
      saveState();
      const res = computeAll();
      const grid = $(".score-grid");
      if (grid) { grid.outerHTML = scoreCards(res); }
    } else if (e.target.id === "tNotes") { state.teacher.notes = e.target.value; saveState(); }
  }

  function enterShotMode() {
    document.body.classList.add("shot");
    window.scrollTo(0, 0);
    let b = $("#shotExit");
    if (!b) {
      b = document.createElement("button");
      b.id = "shotExit"; b.type = "button"; b.className = "shot-exit"; b.textContent = "× Çıx (Esc)";
      b.setAttribute("data-action", "exitShot");
      document.body.appendChild(b);
    }
    toast("Hesabat ekran görüntüsü üçün hazırdır. Ekran görüntüsünü alın, sonra Esc düyməsi ilə çıxın.", "info", 6000);
  }
  function exitShotMode() {
    document.body.classList.remove("shot");
    const b = $("#shotExit"); if (b) b.remove();
  }

  /* ================= 10. Hadisələr və başlanğıc ================= */
  function renderIntro() {
    const N = ACTIVE_CARDS.length, per = CONFIG.STAGE1_MAX / N;
    app.innerHTML =
      '<section class="intro"><div class="intro-hero"><span class="eyebrow">Tədris simulyasiyası</span>' +
      "<h1>Welfare State Simulator</h1><p class='subtitle'>Rifah Dövləti Qurucusu</p>" +
      "<p>Sosial siyasətin dörd əsas modelini təsnif edin, sonra öz ölkəniz üçün yeni rifah modeli qurun. Oyun fərdi şəkildə keçilir, hesab və ya şifrə tələb olunmur.</p></div>" +
      '<div class="intro-grid"><article class="panel"><h2>Tədris məqsədi</h2>' +
      "<p>«Mövzu 5. Sosial siyasətin modelləri» üzrə biliklərinizi yoxlamaq: sosial-demokratik, liberal, konservativ-korporatist və Aralıq dənizi modellərinin " +
      "dövlətin rolu, pensiya, səhiyyə, maliyyələşmə, əhatə, ailə, fərdi məsuliyyət, vergi, yardım, əmək bazarı, bərabərsizlik və ölkə nümunələri üzrə fərqlərini ayırd etmək və bu biliklərdən öz modelinizi yaratmaq üçün istifadə etmək.</p></article>" +
      '<article class="panel"><h2>Ümumi vaxt: 25 dəqiqə</h2><p>Taymer yuxarıda geri sayır və mərhələlər arasında sıfırlanmır. Səhifəni yeniləsəniz, vaxt və cavablar bərpa olunur. Vaxt bitəndə cari məlumatlar saxlanılır və yekun nəticə açılır.</p></article></div>' +
      '<div class="stage-cards">' +
      '<article class="sc s1"><span class="sc-no">1</span><h3>Mövcud modelləri qur</h3><span class="sc-time">12 dəqiqə · 60 bal</span><p>' + N + " kartı dörd modelə yerləşdirin. Hər düzgün cavab " + fmt(per) + " baldır. Səhvlər izah olunur.</p></article>" +
      '<article class="sc s2"><span class="sc-no">2</span><h3>Öz rifah dövlətini yarat</h3><span class="sc-time">10 dəqiqə · 40 bal</span><p>Ölkə seçin, modelə ad verin, 12 göstərici üzrə seçim edin və 300 simvolluq əsaslandırma yazın. Birinci mərhələni tez bitirsəniz, qalan vaxt itmir.</p></article>' +
      '<article class="sc s3"><span class="sc-no">3</span><h3>Yekunlaşdırma</h3><span class="sc-time">3 dəqiqə</span><p>Nəticələrə baxın, hesabatı yadda saxlayın, ekran görüntüsü alın və ya PDF kimi çap edin.</p></article></div>' +
      '<form id="introForm" class="panel start-form" novalidate><h2>İştirakçı</h2>' +
      '<div class="form-row"><div><label class="lbl" for="fName">Ad</label><input id="fName" type="text" maxlength="40" autocomplete="given-name" required><div class="err" id="eName"></div></div>' +
      '<div><label class="lbl" for="fSurname">Soyad</label><input id="fSurname" type="text" maxlength="40" autocomplete="family-name" required><div class="err" id="eSurname"></div></div></div>' +
      '<button type="submit" class="btn primary big">Oyuna başla</button></form></section>';
    updateHeaderVisibility();
  }

  function onIntroSubmit(e) {
    e.preventDefault();
    const n = $("#fName").value.trim().replace(/\s+/g, " "), s = $("#fSurname").value.trim().replace(/\s+/g, " ");
    let ok = true;
    const set = (id, eid, bad, msg) => { $("#" + id).setAttribute("aria-invalid", bad ? "true" : "false"); $("#" + eid).textContent = bad ? msg : ""; if (bad) ok = false; };
    set("fName", "eName", n.length < 2, "Adınızı yazın (ən azı 2 simvol).");
    set("fSurname", "eSurname", s.length < 2, "Soyadınızı yazın (ən azı 2 simvol).");
    if (!ok) { toast("Davam etmək üçün ad və soyadı doldurun.", "error"); ($("#fName").getAttribute("aria-invalid") === "true" ? $("#fName") : $("#fSurname")).focus(); return; }
    state = newState(n, s);
    saveState(); render(); window.scrollTo(0, 0);
    toast("Oyun başladı. Uğurlar, " + n + "!", "success");
  }

  function restart() {
    openModal({
      title: "Yenidən başlamaq istəyirsiniz?",
      html: "<p>Bütün cavablar, taymer və nəticələr silinəcək. Bu əməliyyatı geri qaytarmaq mümkün deyil.</p>",
      actions: [
        { label: "Ləğv et", kind: "ghost" },
        { label: "Bəli, yenidən başla", kind: "danger", onClick: () => {
          try { localStorage.removeItem(CONFIG.STORAGE_KEY); } catch (e) { /* yaddaş əlçatmazdır */ }
          exitShotMode();
          state = null;
          if (location.hash) history.replaceState(null, "", location.pathname + location.search);
          render(); window.scrollTo(0, 0);
        } }
      ]
    });
  }

  function updateHeaderVisibility() {
    const h = $("#appHeader");
    if (h) h.hidden = !state;
  }

  function render() {
    updateHeaderVisibility();
    document.body.classList.toggle("report-view", !!state && state.phase === "final" && state.view === "report");
    if (!state) { renderIntro(); return; }
    if (state.phase === "final") { if (state.view === "report") renderReport(); else renderFinal(); }
    else if (state.phase === "s2") renderS2();
    else renderS1();
    tick();
  }

  /* ---- Klik hadisələri (bir yerdən idarə olunur) ---- */
  document.addEventListener("click", function (e) {
    const ma = e.target.closest("[data-modal-action]");
    if (ma) {
      const a = modalActions[Number(ma.dataset.modalAction)];
      closeModal();
      if (a && a.onClick) a.onClick();
      return;
    }
    const el = e.target.closest("[data-action]");
    if (!el || !state && el.dataset.action !== "exitShot") return;
    const d = el.dataset;
    switch (d.action) {
      case "place": placeCard(d.card, d.model); break;
      case "unplace": unplaceCard(d.card); break;
      case "filter": state.s1.filter = d.filter; saveState(); renderS1(); break;
      case "check1": onCheck1(); break;
      case "showSummary": showS1Summary(); break;
      case "goS2": goStage2(); break;
      case "finishS2": onFinishS2(); break;
      case "saveResult": saveResult(); break;
      case "backResults": state.view = "results"; saveState(); if (location.hash) history.replaceState(null, "", location.pathname + location.search); render(); window.scrollTo(0, 0); break;
      case "shot": enterShotMode(); break;
      case "exitShot": exitShotMode(); break;
      case "print": window.print(); break;
      case "restart": restart(); break;
    }
  });

  // Mətn sahələri «input», seçim elementləri «change» hadisəsi ilə işlənir (ikiqat işləmənin qarşısı)
  document.addEventListener("input", function (e) {
    const t = e.target;
    if (t.type === "radio" || t.type === "checkbox" || t.tagName === "SELECT") return;
    onS2Input(e); updateTeacher(e);
  });
  document.addEventListener("change", function (e) {
    const t = e.target;
    if (t.type === "radio" || t.type === "checkbox" || t.tagName === "SELECT") onS2Input(e);
  });
  document.addEventListener("submit", function (e) {
    if (e.target.id === "introForm") onIntroSubmit(e); else e.preventDefault();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (document.body.classList.contains("shot")) exitShotMode();
      else if ($("#modalRoot .modal")) closeModal();
    }
  });

  /* ---- Drag & drop (kompüter). Mobil üçün kartlardakı model düymələri istifadə olunur. ---- */
  document.addEventListener("dragstart", function (e) {
    const el = e.target.closest && e.target.closest("[data-drag-card]");
    if (!el || !state || state.phase !== "s1" || state.s1.checked) { e.preventDefault(); return; }
    dragCardId = el.dataset.dragCard;
    try { e.dataTransfer.setData("text/plain", dragCardId); e.dataTransfer.effectAllowed = "move"; } catch (err) { /* köhnə brauzer */ }
    el.classList.add("dragging");
  });
  document.addEventListener("dragend", function () {
    dragCardId = null;
    $$(".dragging, .drag-over").forEach(x => x.classList.remove("dragging", "drag-over"));
  });
  document.addEventListener("dragover", function (e) {
    if (!dragCardId) return;
    const zone = e.target.closest(".model-panel, .pool");
    if (zone) { e.preventDefault(); zone.classList.add("drag-over"); }
  });
  document.addEventListener("dragleave", function (e) {
    const zone = e.target.closest && e.target.closest(".model-panel, .pool");
    if (zone && !zone.contains(e.relatedTarget)) zone.classList.remove("drag-over");
  });
  document.addEventListener("drop", function (e) {
    if (!dragCardId) return;
    const panel = e.target.closest(".model-panel");
    const pool = e.target.closest(".pool");
    if (panel) { e.preventDefault(); placeCard(dragCardId, panel.dataset.model); }
    else if (pool) { e.preventDefault(); unplaceCard(dragCardId); }
    dragCardId = null;
    $$(".drag-over").forEach(x => x.classList.remove("drag-over"));
  });

  window.addEventListener("hashchange", function () {
    if (state && state.phase === "final") {
      state.view = location.hash === "#hesabat" ? "report" : "results";
      saveState(); render();
    }
  });
  window.addEventListener("storage", function (e) {            // başqa tabda yenidən başlama
    if (e.key === CONFIG.STORAGE_KEY && !e.newValue && state) { state = null; render(); }
  });

  /* ---- Başlanğıc: saxlanılmış oyun varsa bərpa et ---- */
  state = loadState();
  render();
  if (state && state.phase !== "final" && Date.now() >= state.startTs + LIMITS.s2) { /* tick() özü yekunlaşdırır */ }
  setInterval(tick, 500);
  if (state) toast("Oyun bərpa olundu. Taymer sıfırlanmayıb.", "info", 3500);

  // Test və sazlama üçün (istifadəçi interfeysinə təsiri yoxdur)
  window.__wss = { getState: () => state, computeAll: computeAll };
})();
