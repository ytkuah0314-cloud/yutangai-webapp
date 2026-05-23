const SUPABASE_URL = 'https://zgtyeuuqfamvdpdrsxgj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_dTDcTEdyEfKzY6gbGWSX6A_Ganqbcoq';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const EXPENSE_CATEGORIES = ['餐饮', '购物', '住宿', '娱乐', '交通', '医疗保险', '话费', '其他支出'];
const INCOME_CATEGORIES  = ['工资', '兼职副业', '投资理财', '红包', '其他收入'];
const ACCOUNTS           = ['TouchNGo', '银行卡', '信用卡'];

const CAT_ICONS = {
  '餐饮': '🍜', '购物': '🛍️', '住宿': '🏠', '娱乐': '🎮',
  '交通': '🚗', '医疗保险': '🏥', '话费': '📱', '其他支出': '💸',
  '工资': '💼', '兼职副业': '🔧', '投资理财': '📈', '红包': '🧧', '其他收入': '💰',
};

function fmtAmt(n) {
  return 'RM ' + parseFloat(n || 0).toFixed(2);
}

function fmtDate(d) {
  const dt = new Date(d + 'T00:00:00');
  return `${dt.getMonth() + 1}月${dt.getDate()}日`;
}

function fmtMonth(y, m) {
  return `${y}年${m}月`;
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

function highlightNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-nav a, .bottom-nav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === page);
  });
}

// HTML 转义，防止 XSS
function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 全局记录缓存（供 modal.js 读取）
window.__txCache = window.__txCache || {};

// 渲染单条交易记录（点击行打开编辑弹窗）
function renderTxItem(r, { showDate = true } = {}) {
  window.__txCache[r.id] = r;
  const datePart = showDate ? `${fmtDate(r.date)} · ` : '';
  return `
    <li class="tx-item" data-id="${escHtml(r.id)}" onclick="openEditModal(this.dataset.id)">
      <div class="tx-icon ${escHtml(r.type)}">${CAT_ICONS[r.category] || '💰'}</div>
      <div class="tx-info">
        <div class="tx-cat">${escHtml(r.category)}</div>
        <div class="tx-meta">${datePart}${escHtml(r.account)}${r.notes ? ' · ' + escHtml(r.notes) : ''}</div>
      </div>
      <span class="tx-amount ${escHtml(r.type)}">${r.type === 'expense' ? '-' : '+'}${fmtAmt(r.amount)}</span>
    </li>`;
}

// ── XP 浮动动画 ─────────────────────────────────
function showXpFloat(xp = 10) {
  const el = document.createElement('div');
  el.className = 'xp-float';
  el.textContent = '+' + xp + ' XP';
  el.style.left = (Math.random() * 60 + 20) + '%';
  el.style.top  = '40%';
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// ── 银行卡余额操作 ────────────────────────────────
async function getBankBalance() {
  const { data } = await db.from('accounts').select('balance,updated_at').eq('name', '银行卡').maybeSingle();
  return data || null;
}

async function setBankBalance(newBalance) {
  const { error } = await db.from('accounts').upsert(
    { name: '银行卡', balance: Math.round(newBalance * 100) / 100, updated_at: new Date().toISOString() },
    { onConflict: 'name' }
  );
  return !error;
}

async function adjustBankBalance(delta) {
  const row = await getBankBalance();
  const current = row ? parseFloat(row.balance) : 0;
  return setBankBalance(current + delta);
}

// delta from a transaction: +amount for income, -amount for expense (only for 银行卡 account)
function bankDelta(type, amount) {
  return type === 'income' ? +amount : -amount;
}

// 主题切换
function toggleTheme() {
  const html  = document.documentElement;
  const isLight = html.getAttribute('data-theme') === 'light';
  const next  = isLight ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('yutang-theme', next);
  _updateThemeBtn(next);
}

function _updateThemeBtn(theme) {
  const icon  = document.getElementById('theme-icon');
  const label = document.getElementById('theme-label');
  if (!icon) return;
  if (theme === 'light') { icon.textContent = '☀️'; label.textContent = '深色模式'; }
  else                   { icon.textContent = '🌙'; label.textContent = '浅色模式'; }
}

// 恢复已保存主题
(function initTheme() {
  const saved = localStorage.getItem('yutang-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.addEventListener('DOMContentLoaded', () => _updateThemeBtn(saved));
})();

document.addEventListener('DOMContentLoaded', highlightNav);

// ══════════════════════════════════════════════════
// 金额显示 / 隐藏  (全局)
// ══════════════════════════════════════════════════
window.__amtHidden = localStorage.getItem('yutang-amthidden') === '1';

function isAmtHidden() { return window.__amtHidden; }

// 根据 fmt 将 rawValue(数字) 格式化成真实文字
function _fmtReal(v, fmt) {
  if (fmt === 'boss-dmg')  return `已打 ${(+v * 100).toFixed(1)}%`;
  if (fmt === 'boss-left') return `剩余 ${fmtAmt(Math.max(100000 - +v, 0))}`;
  return fmtAmt(+v);
}

// 遮罩占位文字
function _fmtMask(fmt) {
  if (fmt === 'boss-dmg')  return '已打 ••••';
  if (fmt === 'boss-left') return '剩余 RM ••••••';
  return 'RM ••••••';
}

function _applyElMask(el) {
  if (!('rawAmt' in el.dataset)) return;
  const fmt = el.dataset.rawFmt || '';
  el.textContent = isAmtHidden() ? _fmtMask(fmt) : _fmtReal(el.dataset.rawAmt, fmt);
}

// 设置某个元素的敏感金额，自动遵守当前显示状态
function setMasked(idOrEl, rawValue, fmt) {
  const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
  if (!el) return;
  el.dataset.rawAmt = rawValue;
  if (fmt) el.dataset.rawFmt = fmt;
  _applyElMask(el);
}

// 重新扫描所有 [data-raw-amt] 元素并刷新
function applyAmtMask() {
  document.querySelectorAll('[data-raw-amt]').forEach(_applyElMask);
  _syncEyeIcon();
}

// 切换显示 / 隐藏
function toggleAmtVisibility() {
  window.__amtHidden = !window.__amtHidden;
  localStorage.setItem('yutang-amthidden', window.__amtHidden ? '1' : '0');
  applyAmtMask();
}

const _SVG_EYE_OPEN = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const _SVG_EYE_SHUT = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

function _syncEyeIcon() {
  const btn = document.getElementById('eye-toggle-btn');
  if (!btn) return;
  btn.innerHTML = isAmtHidden() ? _SVG_EYE_SHUT : _SVG_EYE_OPEN;
  btn.title = isAmtHidden() ? '点击显示金额' : '点击隐藏金额';
  btn.setAttribute('aria-pressed', isAmtHidden() ? 'true' : 'false');
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.createElement('button');
  btn.id = 'eye-toggle-btn';
  btn.className = 'eye-toggle-btn';
  btn.onclick = toggleAmtVisibility;
  btn.innerHTML = isAmtHidden() ? _SVG_EYE_SHUT : _SVG_EYE_OPEN;
  btn.title = isAmtHidden() ? '点击显示金额' : '点击隐藏金额';
  document.body.appendChild(btn);
});
