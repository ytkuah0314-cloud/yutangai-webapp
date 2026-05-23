// C:\YuTangAi-webapp\modal.js
// 编辑弹窗：动态注入 DOM，所有页面共享
// 依赖：app.js 中的 db, EXPENSE_CATEGORIES, INCOME_CATEGORIES, showToast, escHtml

(function () {
  const MODAL_HTML = `
<div id="edit-overlay">
  <div id="edit-modal">
    <div class="modal-handle"></div>
    <h3>编辑记录</h3>
    <div class="form-group">
      <label>收支类型</label>
      <div class="type-toggle">
        <button class="type-btn" id="m-btn-expense" onclick="modalSetType('expense')">💸 支出</button>
        <button class="type-btn" id="m-btn-income"  onclick="modalSetType('income')">💰 收入</button>
      </div>
    </div>
    <div class="form-group">
      <label>日期</label>
      <input type="date" id="m-date">
    </div>
    <div class="form-group">
      <label>类别</label>
      <select id="m-category"></select>
    </div>
    <div class="form-group">
      <label>金额（RM）</label>
      <input type="number" id="m-amount" min="0" step="0.01">
    </div>
    <div class="form-group">
      <label>账户</label>
      <select id="m-account">
        <option>TouchNGo</option>
        <option>银行卡</option>
        <option>信用卡</option>
      </select>
    </div>
    <div class="form-group">
      <label>备注（选填）</label>
      <input type="text" id="m-notes" maxlength="100">
    </div>
    <div class="modal-actions">
      <button class="modal-btn-delete" onclick="deleteEdit()">删除</button>
      <button class="modal-btn-cancel" onclick="closeEditModal()">取消</button>
      <button class="modal-btn-save"   onclick="saveEdit()">保存</button>
    </div>
  </div>
</div>`;

  function ensureModal() {
    if (document.getElementById('edit-overlay')) return;
    document.body.insertAdjacentHTML('beforeend', MODAL_HTML);
    document.getElementById('edit-overlay').addEventListener('click', function (e) {
      if (e.target === this) closeEditModal();
    });
  }

  let _currentId   = null;
  let _currentType = 'expense';

  window.openEditModal = function (id) {
    ensureModal();
    const r = (window.__txCache || {})[id];
    if (!r) return;

    _currentId   = id;
    _currentType = r.type;

    modalSetType(r.type);
    document.getElementById('m-date').value   = r.date;
    document.getElementById('m-amount').value = r.amount;
    document.getElementById('m-notes').value  = r.notes || '';

    document.getElementById('m-category').value = r.category;
    document.getElementById('m-account').value  = r.account;

    document.getElementById('edit-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeEditModal = function () {
    const overlay = document.getElementById('edit-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
    _currentId = null;
  };

  window.modalSetType = function (t) {
    _currentType = t;
    const cats = t === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const sel  = document.getElementById('m-category');
    if (sel) sel.innerHTML = cats.map(c => `<option>${escHtml(c)}</option>`).join('');

    const be = document.getElementById('m-btn-expense');
    const bi = document.getElementById('m-btn-income');
    if (be) be.className = 'type-btn' + (t === 'expense' ? ' active expense' : '');
    if (bi) bi.className = 'type-btn' + (t === 'income'  ? ' active income'  : '');
  };

  window.saveEdit = async function () {
    if (!_currentId) return;
    const date     = document.getElementById('m-date').value;
    const category = document.getElementById('m-category').value;
    const amount   = parseFloat(document.getElementById('m-amount').value);
    const account  = document.getElementById('m-account').value;
    const notes    = document.getElementById('m-notes').value.trim();

    if (!date || !amount || amount <= 0) { showToast('请填写完整信息'); return; }

    const old = window.__txCache?.[_currentId] || {};

    const { error } = await db
      .from('transactions')
      .update({ date, type: _currentType, category, amount, account, notes })
      .eq('id', _currentId);

    if (error) { showToast('❌ 保存失败：' + error.message); return; }

    // 银行卡余额联动：先撤销旧效果，再应用新效果
    if (typeof adjustBankBalance === 'function') {
      let delta = 0;
      if (old.account === '银行卡') delta -= bankDelta(old.type, parseFloat(old.amount));
      if (account      === '银行卡') delta += bankDelta(_currentType, amount);
      if (delta !== 0) await adjustBankBalance(delta);
    }

    if (window.__txCache?.[_currentId]) {
      Object.assign(window.__txCache[_currentId], {
        date, type: _currentType, category, amount, account, notes
      });
    }

    closeEditModal();
    showToast('✅ 已保存');
    window.__reload?.();
  };

  window.deleteEdit = async function () {
    if (!_currentId) return;
    if (!confirm('确定删除这条记录？')) return;

    const old = window.__txCache?.[_currentId] || {};

    const { error } = await db
      .from('transactions')
      .delete()
      .eq('id', _currentId);

    if (error) { showToast('❌ 删除失败：' + error.message); return; }

    // 银行卡余额联动：撤销被删记录的效果
    if (typeof adjustBankBalance === 'function' && old.account === '银行卡') {
      await adjustBankBalance(-bankDelta(old.type, parseFloat(old.amount)));
    }

    if (window.__txCache) delete window.__txCache[_currentId];
    closeEditModal();
    showToast('已删除');
    window.__reload?.();
  };
})();
