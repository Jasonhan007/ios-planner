/* ===== 计划表 · iOS 风格 · localStorage ===== */
(function () {
  'use strict';

  const STORAGE_KEY = 'ios-planner-v1';
  const KAOYAN_DEADLINE = '2026-12-19';
  const CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 12.5 10.2 16.2 17.5 8.5"/></svg>';
  const TRASH_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10M10 7V5.5A1.5 1.5 0 0 1 11.5 4h1A1.5 1.5 0 0 1 14 5.5V7M8.5 7l.7 11a1.5 1.5 0 0 0 1.5 1.4h2.6a1.5 1.5 0 0 0 1.5-1.4L15.5 7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /** @type {{ goals: Array<{id:string,title:string,desc:string,deadline:string,color:string,createdAt:string}>, tasks: Array<{id:string,title:string,date:string,done:boolean,createdAt:string}>, view: string, calCursor: Date|null, selectedDate: string|null, goalColor: string, openGoalId: string|null, calMode: 'month'|'week' }} */
  const state = {
    goals: [],
    tasks: [],
    view: 'home',
    calCursor: null,
    selectedDate: null,
    goalColor: '#007AFF',
    openGoalId: null,
    calMode: 'month',
  };

  // ---------- utils ----------
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const pad = (n) => (n < 10 ? '0' + n : String(n));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const $ = (id) => document.getElementById(id);

  function toDateStr(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function parseDateStr(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  const todayStr = () => toDateStr(new Date());

  function daysBetween(fromStr, toStr) {
    const a = parseDateStr(fromStr);
    const b = parseDateStr(toStr);
    a.setHours(0, 0, 0, 0);
    b.setHours(0, 0, 0, 0);
    return Math.round((b - a) / 86400000);
  }

  function formatDateCN(s) {
    const d = parseDateStr(s);
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  function formatShort(s) {
    const d = parseDateStr(s);
    return d.getMonth() + 1 + '/' + d.getDate();
  }

  const weekdayCN = (d) => ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];

  /** 周一为一周第一天 */
  function startOfWeek(d) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const offset = (x.getDay() + 6) % 7;
    x.setDate(x.getDate() - offset);
    return x;
  }

  function weekDays(anchor) {
    const start = startOfWeek(anchor || new Date());
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      list.push(d);
    }
    return list;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---------- persistence ----------
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seed();
      const data = JSON.parse(raw);
      state.goals = (Array.isArray(data.goals) ? data.goals : []).filter(
        (g) => g && g.id && g.title && g.deadline
      );
      state.tasks = (Array.isArray(data.tasks) ? data.tasks : [])
        .filter((t) => t && t.id && t.title && t.date)
        .map((t) => ({ ...t, done: !!t.done }));
    } catch (e) {
      console.warn('load failed', e);
      seed();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ goals: state.goals, tasks: state.tasks }));
    } catch (e) {
      console.warn('save failed', e);
    }
  }

  function seed() {
    const now = new Date();
    const d = (n) => {
      const x = new Date(now.getFullYear(), now.getMonth(), now.getDate() + n);
      return toDateStr(x);
    };
    const iso = new Date().toISOString();
    state.goals = [
      { id: uid(), title: '完成课程项目', desc: '前端答辩演示与文档整理', deadline: d(12), color: '#007AFF', createdAt: iso },
      { id: uid(), title: '英语六级备考', desc: '刷完近五年真题', deadline: d(28), color: '#FF9500', createdAt: iso },
      { id: uid(), title: '健身打卡 30 天', desc: '每周至少 4 次力量训练', deadline: d(45), color: '#34C759', createdAt: iso },
    ];
    state.tasks = [
      { id: uid(), title: '整理项目大纲', date: d(0), done: true, createdAt: iso },
      { id: uid(), title: '背 50 个单词', date: d(0), done: false, createdAt: iso },
      { id: uid(), title: '阅读 30 分钟', date: d(0), done: false, createdAt: iso },
      { id: uid(), title: '复习线性代数第三章', date: d(1), done: false, createdAt: iso },
      { id: uid(), title: '提交实验报告', date: d(3), done: false, createdAt: iso },
    ];
    save();
  }

  // ---------- toast ----------
  let toastTimer = null;
  function toast(msg) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => {
        el.hidden = true;
      }, 300);
    }, 1800);
  }

  // ---------- helpers ----------
  function goalStats(goal) {
    const daysLeft = daysBetween(todayStr(), goal.deadline);
    const created = goal.createdAt ? String(goal.createdAt).slice(0, 10) : todayStr();
    const totalDays = Math.max(1, daysBetween(created, goal.deadline));
    return { daysLeft, totalDays, remaining: Math.max(0, daysLeft) };
  }

  function ringHTML(color, daysLeft, totalDays, size, radius) {
    const c = 2 * Math.PI * radius;
    let ratio = totalDays <= 0 || daysLeft <= 0 ? 1 : clamp(daysLeft / totalDays, 0, 1);
    const offset = c * (1 - ratio);
    const center = size / 2;
    const isOverdue = daysLeft < 0;
    if (size === 72) {
      return `
        <div class="ring-wrap" style="--g-color:${color}">
          <svg viewBox="0 0 ${size} ${size}" aria-hidden="true">
            <circle class="ring-bg" cx="${center}" cy="${center}" r="${radius}"></circle>
            <circle class="ring-fg" cx="${center}" cy="${center}" r="${radius}"
              stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"></circle>
          </svg>
          <div class="ring-center">
            <span class="ring-days">${isOverdue ? '!' : daysLeft}</span>
            <span class="ring-unit">${isOverdue ? '逾期' : '天'}</span>
          </div>
        </div>`;
    }
    return `
      <span class="goal-ring" style="--g-color:${color}">
        <svg viewBox="0 0 ${size} ${size}" aria-hidden="true">
          <circle class="ring-bg" cx="${center}" cy="${center}" r="${radius}"></circle>
          <circle class="ring-fg" cx="${center}" cy="${center}" r="${radius}"
            stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"></circle>
        </svg>
        <span class="ring-days">${isOverdue ? '!' : daysLeft}</span>
      </span>`;
  }

  function byDeadline(list) {
    return list.slice().sort((a, b) => a.deadline.localeCompare(b.deadline));
  }

  // ---------- render: home ----------
  function updateKaoyan() {
    const daysEl = $('kaoyan-days');
    const badge = $('kaoyan-badge');
    if (!daysEl || !badge) return;
    const left = daysBetween(todayStr(), KAOYAN_DEADLINE);
    const unit = badge.querySelector('.kaoyan-unit');
    if (left < 0) {
      badge.classList.add('overdue');
      daysEl.textContent = '已考';
      if (unit) unit.textContent = '';
      return;
    }
    badge.classList.remove('overdue');
    daysEl.textContent = String(left);
    if (unit) unit.textContent = '天';
    badge.title = '考研倒计时 · ' + formatDateCN(KAOYAN_DEADLINE);
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 6) return '夜深了';
    if (h < 12) return '早上好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  }

  function renderHome() {
    const now = new Date();
    $('home-eyebrow').textContent =
      now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 · 星期' + weekdayCN(now);
    $('home-title').textContent = greeting();
    updateKaoyan();

    const td = todayStr();
    const todayTasks = state.tasks.filter((t) => t.date === td);
    const doneCount = todayTasks.filter((t) => t.done).length;
    const activeGoals = byDeadline(state.goals);

    $('stat-goals').textContent = activeGoals.length;
    $('stat-today').textContent = todayTasks.length;
    $('stat-done').textContent = doneCount;
    $('today-date-label').textContent = formatShort(td) + ' 今天';

    const strip = $('home-countdowns');
    if (activeGoals.length === 0) {
      strip.innerHTML = '<p class="empty-hint" style="padding:20px 8px;width:100%">暂无目标，去「目标」页新建</p>';
    } else {
      strip.innerHTML = activeGoals
        .slice(0, 8)
        .map((g) => {
          const st = goalStats(g);
          const overdue = st.daysLeft < 0;
          const color = overdue ? '#FF3B30' : g.color;
          return `
            <button type="button" class="countdown-card" data-goal-id="${g.id}" style="--g-color:${color}">
              ${ringHTML(color, st.daysLeft, st.totalDays, 72, 30)}
              <div>
                <div class="cd-title">${escapeHtml(g.title)}</div>
                <div class="cd-date">${formatShort(g.deadline)} 截止</div>
              </div>
            </button>`;
        })
        .join('');
    }

    renderTaskList('home-task-list', 'home-task-empty', todayTasks);

    const deadlineCard = $('deadline-card');
    const soon = activeGoals.filter((g) => daysBetween(td, g.deadline) <= 30);
    if (soon.length === 0) {
      deadlineCard.innerHTML = '<p class="deadline-empty">近 30 天没有截止的目标</p>';
    } else {
      deadlineCard.innerHTML = soon
        .map((g) => {
          const st = goalStats(g);
          const overdue = st.daysLeft < 0;
          const color = overdue ? '#FF3B30' : g.color;
          return `
            <button type="button" class="deadline-row" data-goal-id="${g.id}" style="--g-color:${color}">
              <span class="deadline-bar"></span>
              <span class="deadline-info">
                <strong>${escapeHtml(g.title)}</strong>
                <span>${formatDateCN(g.deadline)} 截止${g.desc ? ' · ' + escapeHtml(g.desc) : ''}</span>
              </span>
              <span class="deadline-days">
                <strong>${overdue ? '逾期' : st.daysLeft}</strong>
                <span>${overdue ? Math.abs(st.daysLeft) + ' 天' : '天后'}</span>
              </span>
            </button>`;
        })
        .join('');
    }
  }

  // ---------- tasks UI ----------
  function renderTaskList(listId, emptyId, tasks) {
    const ul = $(listId);
    const empty = emptyId ? $(emptyId) : null;
    if (!ul) return;

    if (tasks.length === 0) {
      ul.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    const sorted = tasks.slice().sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return String(a.createdAt).localeCompare(String(b.createdAt));
    });

    ul.innerHTML = sorted
      .map(
        (t) => `
      <li class="task-item ${t.done ? 'done' : ''}" data-task-id="${t.id}">
        <button type="button" class="check ${t.done ? 'checked' : ''}" data-toggle="${t.id}"
          aria-label="${t.done ? '标记未完成' : '标记完成'}" aria-pressed="${t.done}">${CHECK_SVG}</button>
        <span class="task-text">${escapeHtml(t.title)}</span>
        <button type="button" class="task-del" data-delete="${t.id}" aria-label="删除任务">${TRASH_SVG}</button>
      </li>`
      )
      .join('');
  }

  // ---------- calendar ----------
  function setCalMode(mode) {
    state.calMode = mode === 'week' ? 'week' : 'month';
    const isMonth = state.calMode === 'month';
    document.querySelectorAll('[data-cal-mode]').forEach((btn) => {
      const on = btn.dataset.calMode === state.calMode;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    $('cal-grid').hidden = !isMonth;
    $('cal-weekdays').hidden = !isMonth;
    $('week-view').hidden = isMonth;
    renderCalendar(true);
  }

  function renderCalendar(switchAnim) {
    if (state.calMode === 'week') {
      renderWeekView(switchAnim);
      renderSelectedDay();
      return;
    }

    const cursor = state.calCursor;
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    $('cal-month-label').textContent = y + '年' + (m + 1) + '月';
    updateTodayChip();

    const grid = $('cal-grid');
    const first = new Date(y, m, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const gridStart = new Date(y, m, 1 - startOffset);

    const td = todayStr();
    const sel = state.selectedDate;
    const goalDates = new Set(state.goals.map((g) => g.deadline));
    const tasksByDate = new Map();
    state.tasks.forEach((t) => {
      if (!tasksByDate.has(t.date)) tasksByDate.set(t.date, []);
      tasksByDate.get(t.date).push(t);
    });

    let html = '';
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      const ds = toDateStr(d);
      const other = d.getMonth() !== m;
      const isToday = ds === td;
      const isSel = ds === sel;
      const dayTasks = tasksByDate.get(ds) || [];
      const hasGoal = goalDates.has(ds);

      let previewHtml = '<span class="cal-preview"></span>';
      if (dayTasks.length) {
        const pending = dayTasks.filter((t) => !t.done);
        const pool = pending.length ? pending : dayTasks;
        const show = pool.slice(0, 2);
        const more = pool.length - show.length;
        const label = show.map((t) => escapeHtml(t.title)).join(' · ');
        const moreHtml = more > 0 ? ` <span class="more">+${more}</span>` : '';
        const full = dayTasks.map((t) => (t.done ? '✓ ' : '') + t.title).join(' / ');
        previewHtml = `<span class="cal-preview has-task" title="${escapeHtml(full)}">${label}${moreHtml}</span>`;
      }

      const cls = ['cal-day', other ? 'other' : '', isToday ? 'today' : '', isSel ? 'selected' : '']
        .filter(Boolean)
        .join(' ');

      const dots = hasGoal ? '<span class="dots"><span class="dot" title="目标截止"></span></span>' : '';

      const ariaParts = [
        d.getMonth() + 1 + '月' + d.getDate() + '日',
        isToday ? '今天' : '',
        dayTasks.length ? '任务：' + dayTasks.map((t) => t.title).join('、') : '',
        hasGoal ? '有目标截止' : '',
      ].filter(Boolean);

      html += `<button type="button" class="${cls}" data-date="${ds}" role="gridcell"
        aria-label="${escapeHtml(ariaParts.join('，'))}" aria-selected="${isSel}">
        <span class="cal-num">${d.getDate()}</span>
        ${previewHtml}
        ${dots}
      </button>`;
    }
    grid.innerHTML = html;

    if (switchAnim) {
      grid.classList.remove('switching');
      void grid.offsetWidth;
      grid.classList.add('switching');
    }

    renderSelectedDay();
  }

  function updateTodayChip() {
    const todayChip = $('cal-toolbar-today');
    if (!todayChip) return;
    const now = new Date();
    const anchor = state.calMode === 'week' ? startOfWeek(now) : new Date(now.getFullYear(), now.getMonth(), 1);
    const cursor = state.calMode === 'week' ? startOfWeek(state.calCursor || now) : state.calCursor;
    const same =
      cursor.getFullYear() === anchor.getFullYear() &&
      cursor.getMonth() === anchor.getMonth() &&
      cursor.getDate() === anchor.getDate();
    const onTodayDate = state.selectedDate === todayStr();
    const active = same && onTodayDate;
    todayChip.classList.toggle('is-today', active);
    todayChip.textContent = active ? '已在今天' : '今天';
  }

  function renderWeekView(switchAnim) {
    const anchor = state.calCursor || new Date();
    const days = weekDays(anchor);
    const first = days[0];
    const last = days[6];
    const sameMonth = first.getMonth() === last.getMonth();
    $('cal-month-label').textContent = sameMonth
      ? first.getFullYear() + '年' + (first.getMonth() + 1) + '月'
      : formatShort(toDateStr(first)) + ' – ' + formatShort(toDateStr(last));

    updateTodayChip();

    const td = todayStr();
    const sel = state.selectedDate;
    const goalSet = new Set(state.goals.map((g) => g.deadline));

    let total = 0;
    let done = 0;
    let goalCount = 0;

    const cards = days
      .map((d, i) => {
        const ds = toDateStr(d);
        const list = state.tasks.filter((t) => t.date === ds);
        const dDone = list.filter((t) => t.done).length;
        total += list.length;
        done += dDone;
        const hasGoal = goalSet.has(ds);
        if (hasGoal) goalCount += 1;
        const pct = list.length ? Math.round((dDone / list.length) * 100) : 0;
        const isToday = ds === td;
        const isSel = ds === sel;
        const label = i === 0 || d.getDate() === 1 ? weekdayCN(d) : weekdayCN(d);
        return `
          <button type="button" class="week-day ${isToday ? 'today' : ''} ${isSel ? 'selected' : ''}"
            data-date="${ds}" role="listitem" aria-label="${d.getMonth() + 1}月${d.getDate()}日 星期${weekdayCN(d)}，${dDone}/${list.length} 完成"
            style="animation-delay:${i * 0.03}s">
            <span class="wd-label">${label}</span>
            <span class="wd-num">${d.getDate()}</span>
            <span class="wd-bar ${list.length && dDone === list.length ? 'full' : ''}"><i style="width:${pct}%"></i></span>
            <span class="wd-count ${list.length && dDone === list.length && list.length ? 'done' : ''}"><strong>${dDone}</strong>/${list.length}</span>
            <span class="wd-goal" ${hasGoal ? '' : 'hidden'} title="有目标截止"></span>
          </button>`;
      })
      .join('');

    $('week-days').innerHTML = cards;
    const pctAll = total ? Math.round((done / total) * 100) : 0;
    $('week-stats').innerHTML = `
      <span class="chip blue">本周任务 ${done}/${total}</span>
      <span class="chip ${total && done === total ? 'green' : 'blue'}">完成率 ${pctAll}%</span>
      ${goalCount ? `<span class="chip orange">截止 ${goalCount} 个目标</span>` : ''}
    `;

    if (switchAnim) {
      const el = $('week-view');
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = '';
    }
  }

  function renderSelectedDay() {
    const ds = state.selectedDate;
    const title = $('cal-day-title');
    const summary = $('cal-day-summary');
    if (!ds) {
      title.textContent = '当日安排';
      summary.innerHTML = '';
      renderTaskList('cal-task-list', 'cal-task-empty', []);
      return;
    }

    const d = parseDateStr(ds);
    const td = todayStr();
    title.textContent =
      d.getMonth() + 1 + '月' + d.getDate() + '日 · 星期' + weekdayCN(d) + (ds === td ? '（今天）' : '');

    const dayTasks = state.tasks.filter((t) => t.date === ds);
    const done = dayTasks.filter((t) => t.done).length;
    const dayGoals = state.goals.filter((g) => g.deadline === ds);

    const chips = [
      `<span class="chip ${dayTasks.length && done === dayTasks.length ? 'green' : 'blue'}">任务 ${done}/${dayTasks.length}</span>`,
      ...dayGoals.map((g) => `<span class="chip orange">截止 · ${escapeHtml(g.title)}</span>`),
    ];
    summary.innerHTML = chips.join('');

    renderTaskList('cal-task-list', 'cal-task-empty', dayTasks);
    $('cal-task-input').placeholder = '为 ' + formatShort(ds) + ' 添加任务…';
  }

  // ---------- goals ----------
  function renderGoals() {
    const list = $('goal-list');
    const empty = $('goals-empty');
    const sorted = byDeadline(state.goals);

    if (sorted.length === 0) {
      list.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    list.innerHTML = sorted
      .map((g) => {
        const st = goalStats(g);
        const overdue = st.daysLeft < 0;
        const color = overdue ? '#FF3B30' : g.color;
        return `
        <button type="button" class="goal-card ${overdue ? 'overdue' : ''}" data-goal-id="${g.id}" style="--g-color:${color}">
          ${ringHTML(color, st.daysLeft, st.totalDays, 56, 24)}
          <span class="goal-main">
            <h3>${escapeHtml(g.title)}</h3>
            <p>${escapeHtml(g.desc || '无备注')}</p>
          </span>
          <span class="goal-side">
            <span class="days">${st.daysLeft < 0 ? '-' + Math.abs(st.daysLeft) : st.daysLeft}</span>
            <span class="unit">${st.daysLeft < 0 ? '天前截止' : '天'}</span>
            <span class="due">${formatShort(g.deadline)} · ${g.deadline.slice(0, 4)}</span>
          </span>
        </button>`;
      })
      .join('');
  }

  function renderActiveView() {
    if (state.view === 'home') renderHome();
    else if (state.view === 'calendar') renderCalendar(false);
    else if (state.view === 'goals') renderGoals();
  }

  function renderAll() {
    renderHome();
    renderCalendar(false);
    renderGoals();
    refreshClearBtns();
  }

  // ---------- navigation ----------
  function navigate(view) {
    if (!['home', 'calendar', 'goals'].includes(view)) return;
    state.view = view;
    document.querySelectorAll('.view').forEach((el) => {
      el.classList.toggle('active', el.dataset.view === view);
    });
    document.querySelectorAll('.tab').forEach((btn) => {
      const active = btn.dataset.nav === view;
      btn.classList.toggle('active', active);
      if (active) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
    renderActiveView();
  }

  // ---------- task ops ----------
  function addTask(title, date) {
    const t = title.trim();
    if (!t) {
      toast('请输入任务内容');
      return false;
    }
    state.tasks.push({
      id: uid(),
      title: t,
      date: date || todayStr(),
      done: false,
      createdAt: new Date().toISOString(),
    });
    save();
    renderAll();
    toast('已添加任务');
    return true;
  }

  function toggleTask(id) {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;
    t.done = !t.done;
    save();
    renderAll();
  }

  function deleteTask(id) {
    const i = state.tasks.findIndex((x) => x.id === id);
    if (i < 0) return;
    const el = document.querySelector('[data-task-id="' + id + '"]');
    const finish = () => {
      state.tasks.splice(i, 1);
      save();
      renderAll();
      toast('已删除');
    };
    if (el) {
      el.classList.add('removing');
      setTimeout(finish, 200);
    } else {
      finish();
    }
  }

  /** 清理已完成：scope = 'all' | 'today' | 'date' */
  function clearCompleted(scope, date) {
    const match = (t) => {
      if (!t.done) return false;
      if (scope === 'all') return true;
      if (scope === 'today') return t.date === todayStr();
      if (scope === 'date') return t.date === date;
      return false;
    };
    const before = state.tasks.length;
    state.tasks = state.tasks.filter((t) => !match(t));
    const removed = before - state.tasks.length;
    if (removed === 0) {
      toast(scope === 'all' ? '没有已完成任务' : '这一天没有已完成任务');
      return;
    }
    save();
    renderAll();
    toast('已清理 ' + removed + ' 项已完成');
  }

  function refreshClearBtns() {
    const doneAll = state.tasks.filter((t) => t.done).length;
    const btnHome = $('clear-done-home');
    const btnCal = $('clear-done-cal');
    if (btnHome) {
      btnHome.disabled = doneAll === 0;
      btnHome.classList.toggle('is-empty', doneAll === 0);
      btnHome.title = doneAll === 0 ? '暂无已完成任务' : '一键删除全部已完成任务（' + doneAll + '）';
    }
    if (btnCal) {
      const ds = state.selectedDate || todayStr();
      const dayDone = state.tasks.filter((t) => t.done && t.date === ds).length;
      btnCal.disabled = dayDone === 0;
      btnCal.classList.toggle('is-empty', dayDone === 0);
      btnCal.title = dayDone === 0 ? '这一天没有已完成任务' : '清理这一天已完成（' + dayDone + '）';
    }
  }

  function selectDate(ds) {
    state.selectedDate = ds;
    const d = parseDateStr(ds);
    if (state.calMode === 'week') {
      state.calCursor = d;
    } else if (!state.calCursor || d.getMonth() !== state.calCursor.getMonth() || d.getFullYear() !== state.calCursor.getFullYear()) {
      state.calCursor = new Date(d.getFullYear(), d.getMonth(), 1);
    }
    renderCalendar(false);
  }

  // ---------- browser notifications ----------
  const NOTIFY_KEY = 'ios-planner-notify-seen';
  let notifyTimer = null;

  function notifySupported() {
    return typeof Notification !== 'undefined';
  }

  function notifyPerm() {
    return notifySupported() ? Notification.permission : 'unsupported';
  }

  function updateNotifyUI() {
    const btn = $('notify-toggle');
    const label = $('notify-label');
    if (!btn || !label) return;
    const perm = notifyPerm();
    btn.classList.remove('on', 'blocked');
    if (perm === 'granted') {
      btn.classList.add('on');
      label.textContent = '通知已开';
      btn.title = '目标截止 / 今日待办会在页面打开时提醒';
    } else if (perm === 'denied' || perm === 'unsupported' || (location.protocol !== 'https:' && location.protocol !== 'http:')) {
      if (location.protocol === 'file:') {
        label.textContent = '需在线开启通知';
        btn.title = '本地 file:// 无法通知，请用在线地址或本地服务器';
      } else {
        btn.classList.add('blocked');
        label.textContent = '通知被阻止';
        btn.title = '请在浏览器地址栏允许通知';
      }
    } else {
      label.textContent = '开启通知';
      btn.title = '允许浏览器通知以提醒截止与待办';
    }
  }

  async function enableNotifications() {
    if (!notifySupported()) {
      toast('当前浏览器不支持通知');
      return;
    }
    if (location.protocol === 'file:') {
      toast('请用在线地址开启通知');
      return;
    }
    if (Notification.permission === 'granted') {
      updateNotifyUI();
      fireReminders(true);
      toast('通知已开启');
      return;
    }
    if (Notification.permission === 'denied') {
      updateNotifyUI();
      toast('通知已被拒绝，请在浏览器设置中允许');
      return;
    }
    try {
      const res = await Notification.requestPermission();
      updateNotifyUI();
      if (res === 'granted') {
        toast('通知已开启');
        fireReminders(true);
      } else {
        toast('未授予通知权限');
      }
    } catch (e) {
      console.warn(e);
      toast('无法请求通知权限');
    }
  }

  function showNotification(title, body) {
    if (!notifySupported() || Notification.permission !== 'granted') return false;
    try {
      const n = new Notification(title, {
        body,
        tag: 'ios-planner',
        icon: 'icon-256.png',
        badge: 'favicon-32.png',
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
      return true;
    } catch (e) {
      console.warn(e);
      return false;
    }
  }

  /** 收集需要提醒的内容；force 时忽略当天已提醒标记 */
  function fireReminders(force) {
    if (!notifySupported() || Notification.permission !== 'granted') return;
    const td = todayStr();
    const tm = toDateStr(new Date(Date.now() + 86400000));
    const seenRaw = localStorage.getItem(NOTIFY_KEY);
    const seen = seenRaw ? JSON.parse(seenRaw) : {};
    const dayKey = td;

    if (!force && seen.day === dayKey && seen.goals) return;

    const parts = [];
    const dueToday = state.goals.filter((g) => g.deadline === td);
    const dueTomorrow = state.goals.filter((g) => g.deadline === tm);
    const overdue = state.goals.filter((g) => daysBetween(td, g.deadline) < 0);
    const pendingToday = state.tasks.filter((t) => t.date === td && !t.done);

    if (dueToday.length) parts.push('今日截止：' + dueToday.map((g) => g.title).join('、'));
    if (dueTomorrow.length) parts.push('明日截止：' + dueTomorrow.map((g) => g.title).join('、'));
    if (overdue.length) parts.push('已逾期 ' + overdue.length + ' 个目标');
    if (pendingToday.length) parts.push('今日还有 ' + pendingToday.length + ' 项未完成');

    if (!parts.length) {
      if (force) toast('暂无需要提醒的内容');
      localStorage.setItem(NOTIFY_KEY, JSON.stringify({ day: dayKey, goals: true }));
      return;
    }

    showNotification('计划表提醒', parts.join(' · '));
    localStorage.setItem(NOTIFY_KEY, JSON.stringify({ day: dayKey, goals: true }));
    if (force) toast('已发送提醒');
  }

  function startNotifyTimer() {
    if (notifyTimer) clearInterval(notifyTimer);
    notifyTimer = setInterval(() => fireReminders(false), 60000);
  }
  function addGoal({ title, desc, deadline, color }) {
    if (!title.trim()) {
      toast('请输入目标名称');
      return false;
    }
    if (!deadline) {
      toast('请选择截止日期');
      return false;
    }
    if (deadline !== todayStr() && daysBetween(todayStr(), deadline) < 0) {
      toast('截止日期不能早于今天');
      return false;
    }
    state.goals.push({
      id: uid(),
      title: title.trim(),
      desc: (desc || '').trim(),
      deadline,
      color: color || '#007AFF',
      createdAt: new Date().toISOString(),
    });
    save();
    renderAll();
    toast('目标已创建');
    return true;
  }

  function deleteGoal(id) {
    const i = state.goals.findIndex((g) => g.id === id);
    if (i < 0) return;
    state.goals.splice(i, 1);
    save();
    closeDetail();
    renderAll();
    toast('目标已删除');
  }

  // ---------- modals ----------
  function openGoalModal() {
    const form = $('goal-form');
    form.reset();
    const d = new Date();
    d.setDate(d.getDate() + 14);
    $('goal-deadline').value = toDateStr(d);
    $('goal-deadline').min = todayStr();
    state.goalColor = '#007AFF';
    document.querySelectorAll('#color-row .color-dot').forEach((dot) => {
      const on = dot.dataset.color === state.goalColor;
      dot.classList.toggle('selected', on);
      dot.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    $('goal-modal').hidden = false;
    setTimeout(() => $('goal-title').focus(), 80);
  }

  const closeGoalModal = () => {
    $('goal-modal').hidden = true;
  };

  function openDetail(goalId) {
    const g = state.goals.find((x) => x.id === goalId);
    if (!g) return;
    state.openGoalId = goalId;
    const st = goalStats(g);
    const overdue = st.daysLeft < 0;
    const color = overdue ? '#FF3B30' : g.color;

    const hero = $('detail-hero');
    hero.style.setProperty('--g-color', color);
    hero.innerHTML = `
      <div>
        <div class="big-days" style="color:${color}">${st.daysLeft < 0 ? Math.abs(st.daysLeft) : st.daysLeft}</div>
        <span class="big-unit">${st.daysLeft < 0 ? '天前已截止' : '天后截止'}</span>
      </div>`;

    $('detail-title').textContent = g.title;
    const desc = $('detail-desc');
    desc.textContent = g.desc || '暂无备注';
    desc.hidden = !g.desc;

    const created = g.createdAt ? String(g.createdAt).slice(0, 10) : '';
    $('detail-meta').innerHTML = `
      <div class="row"><span>截止日期</span><span>${formatDateCN(g.deadline)}</span></div>
      <div class="row"><span>星期</span><span>星期${weekdayCN(parseDateStr(g.deadline))}</span></div>
      ${created ? `<div class="row"><span>创建于</span><span>${formatDateCN(created)}</span></div>` : ''}
      <div class="row"><span>周期长度</span><span>${st.totalDays} 天</span></div>`;

    $('detail-modal').hidden = false;
  }

  function closeDetail() {
    $('detail-modal').hidden = true;
    state.openGoalId = null;
  }

  // ---------- events ----------
  function bindEvents() {
    document.querySelectorAll('[data-nav]').forEach((el) => {
      el.addEventListener('click', () => navigate(el.dataset.nav));
    });

    $('home-task-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('home-task-input');
      if (addTask(input.value, todayStr())) input.value = '';
    });

    $('clear-done-home').addEventListener('click', () => clearCompleted('all'));
    $('clear-done-cal').addEventListener('click', () => clearCompleted('date', state.selectedDate || todayStr()));
    $('notify-toggle').addEventListener('click', () => enableNotifications());

    $('cal-task-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('cal-task-input');
      if (!state.selectedDate) {
        toast('请先选择日期');
        return;
      }
      if (addTask(input.value, state.selectedDate)) input.value = '';
    });

    document.body.addEventListener('click', (e) => {
      const toggle = e.target.closest('[data-toggle]');
      if (toggle) return toggleTask(toggle.dataset.toggle);

      const del = e.target.closest('[data-delete]');
      if (del) return deleteTask(del.dataset.delete);

      const goalBtn = e.target.closest('[data-goal-id]');
      if (goalBtn && !e.target.closest('[data-close-modal], [data-close-detail]')) {
        openDetail(goalBtn.dataset.goalId);
      }
    });

    $('cal-prev').addEventListener('click', () => {
      if (state.calMode === 'week') {
        const a = state.calCursor || new Date();
        state.calCursor = new Date(a.getFullYear(), a.getMonth(), a.getDate() - 7);
      } else {
        state.calCursor = new Date(state.calCursor.getFullYear(), state.calCursor.getMonth() - 1, 1);
      }
      renderCalendar(true);
    });
    $('cal-next').addEventListener('click', () => {
      if (state.calMode === 'week') {
        const a = state.calCursor || new Date();
        state.calCursor = new Date(a.getFullYear(), a.getMonth(), a.getDate() + 7);
      } else {
        state.calCursor = new Date(state.calCursor.getFullYear(), state.calCursor.getMonth() + 1, 1);
      }
      renderCalendar(true);
    });
    const goToday = () => {
      const n = new Date();
      state.calCursor = state.calMode === 'week' ? n : new Date(n.getFullYear(), n.getMonth(), 1);
      state.selectedDate = todayStr();
      renderCalendar(true);
      toast('已回到今天');
    };
    $('cal-goto-today').addEventListener('click', goToday);
    $('cal-toolbar-today').addEventListener('click', goToday);

    document.querySelectorAll('[data-cal-mode]').forEach((btn) => {
      btn.addEventListener('click', () => setCalMode(btn.dataset.calMode));
    });

    $('cal-grid').addEventListener('click', (e) => {
      const cell = e.target.closest('[data-date]');
      if (!cell) return;
      selectDate(cell.dataset.date);
    });
    $('week-days').addEventListener('click', (e) => {
      const cell = e.target.closest('[data-date]');
      if (!cell) return;
      selectDate(cell.dataset.date);
    });

    $('open-goal-modal').addEventListener('click', openGoalModal);
    document.querySelectorAll('[data-close-modal]').forEach((el) => {
      el.addEventListener('click', closeGoalModal);
    });

    $('color-row').addEventListener('click', (e) => {
      const dot = e.target.closest('.color-dot');
      if (!dot) return;
      state.goalColor = dot.dataset.color;
      document.querySelectorAll('#color-row .color-dot').forEach((d) => {
        const on = d === dot;
        d.classList.toggle('selected', on);
        d.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    });

    $('goal-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = addGoal({
        title: $('goal-title').value,
        desc: $('goal-desc').value,
        deadline: $('goal-deadline').value,
        color: state.goalColor,
      });
      if (ok) closeGoalModal();
    });

    document.querySelectorAll('[data-close-detail]').forEach((el) => {
      el.addEventListener('click', closeDetail);
    });
    $('detail-delete').addEventListener('click', () => {
      if (state.openGoalId) deleteGoal(state.openGoalId);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeGoalModal();
        closeDetail();
      }
    });
  }

  // ---------- init ----------
  function init() {
    load();
    const n = new Date();
    state.calCursor = new Date(n.getFullYear(), n.getMonth(), 1);
    state.selectedDate = todayStr();
    bindEvents();
    renderAll();
    navigate('home');
    updateNotifyUI();
    startNotifyTimer();
    if (notifySupported() && Notification.permission === 'granted') {
      setTimeout(() => fireReminders(false), 800);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && notifySupported() && Notification.permission === 'granted') {
        fireReminders(false);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
