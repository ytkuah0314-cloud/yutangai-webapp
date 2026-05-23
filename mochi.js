/**
 * 墨疾 (Mochi) — 像素风财务角色
 * 根据总存款自动切换形态，支持攻击/升级/待机动画
 */

// ── 等级/形态定义 ────────────────────────────────
const MOCHI_FORMS = [
  {
    minSave: 0, maxSave: 8000,
    title: '布衣少年', level: 1,
    hair: '#2a2a5a', skin: '#f5d6a8', body: '#f0f0ee', bodyLine: '#d0d0ce',
    leg: '#d8d8d4', feet: '#3a3a3a', armGuard: null, cape: null,
    swordColor: '#8B5E3C', swordGlow: null,
    weaponType: 'sticks',
    special: null, aura: null,
    desc: '一介白衣，心怀利刃'
  },
  {
    minSave: 8000, maxSave: 18000,
    title: '初出茅庐', level: 5,
    hair: '#1a1a2e', skin: '#f5d6a8', body: '#3da882', bodyLine: '#2a7a60',
    leg: '#1a5a7a', feet: '#0d3a50', armGuard: null, cape: null,
    swordColor: '#9ab8c8', swordGlow: null,
    weaponType: 'sword',
    special: null, aura: null,
    desc: '初探江湖，剑气初生'
  },
  {
    minSave: 18000, maxSave: 28000,
    title: '江湖游侠', level: 10,
    hair: '#1a1a2e', skin: '#f5d6a8', body: '#1a3a6e', bodyLine: '#c8b060',
    leg: '#0d2248', feet: '#060d1e', armGuard: '#c8b060', cape: null,
    swordColor: '#c0c8d8', swordGlow: null,
    weaponType: 'sword_ornate',
    special: null, aura: null,
    desc: '浪迹四方，剑走偏锋'
  },
  {
    minSave: 28000, maxSave: 38000,
    title: '门派弟子', level: 15,
    hair: '#2a2a4a', skin: '#f5d6a8', body: '#e8f4ff', bodyLine: '#a0c8e8',
    leg: '#b8d8f0', feet: '#4a6a80', armGuard: '#a0c8e8', cape: 'short',
    swordColor: '#60b8ff', swordGlow: '#40a0ff',
    weaponType: 'sword_glow',
    special: null, aura: null,
    desc: '门派修行，剑发蓝光'
  },
  {
    minSave: 38000, maxSave: 48000,
    title: '一方高手', level: 20,
    hair: '#1a1a2e', skin: '#f5d6a8', body: '#1a1a1a', bodyLine: '#c0c8d0',
    leg: '#0d0d12', feet: '#050505', armGuard: '#909aa8', cape: null,
    swordColor: '#d0d8e0', swordGlow: null,
    weaponType: 'sword_steel',
    special: 'silver_trim', aura: null,
    desc: '黑甲银刃，一方称雄'
  },
  {
    minSave: 48000, maxSave: 58000,
    title: '名震江湖', level: 25,
    hair: '#1a0808', skin: '#f5d6a8', body: '#4a0808', bodyLine: '#ff60c0',
    leg: '#250404', feet: '#100202', armGuard: '#8a1030', cape: 'long',
    swordColor: '#c040c0', swordGlow: '#e060ff',
    weaponType: 'sword_glow',
    special: null, aura: '#c040c0',
    desc: '血衣翻卷，紫芒四射'
  },
  {
    minSave: 58000, maxSave: 68000,
    title: '宗师境界', level: 30,
    hair: '#d4af37', skin: '#f5d6a8', body: '#0a0a0a', bodyLine: '#d4af37',
    leg: '#050505', feet: '#020202', armGuard: '#d4af37', cape: null,
    swordColor: '#f0d060', swordGlow: '#f8e840',
    weaponType: 'sword_gold',
    special: 'gold_trim', aura: '#4080ff',
    desc: '宗师金甲，蓝紫光环'
  },
  {
    minSave: 68000, maxSave: 78000,
    title: '天下无双', level: 35,
    hair: '#4a0a6a', skin: '#f5d6a8', body: '#3a1060', bodyLine: '#c080ff',
    leg: '#200640', feet: '#100220', armGuard: '#d0a0ff', cape: 'long_purple',
    swordColor: '#e0a0ff', swordGlow: '#d060ff',
    weaponType: 'sword_divine',
    special: 'vortex', aura: '#8040ff',
    desc: '紫金战甲，剑气漩涡'
  },
  {
    minSave: 78000, maxSave: 98000,
    title: '封神之路', level: 40,
    hair: '#f0f0f8', skin: '#f5e8d0', body: '#f8f8ff', bodyLine: '#d4af37',
    leg: '#e8e8f8', feet: '#c0c8e0', armGuard: '#d4af37', cape: 'light',
    swordColor: '#ffffff', swordGlow: '#c0e8ff',
    weaponType: 'sword_divine',
    special: 'float', aura: '#80c8ff',
    desc: '白甲悬空，神光护体'
  },
  {
    minSave: 98000, maxSave: Infinity,
    title: '龙魂剑圣', level: 50,
    hair: '#d4af37', skin: '#f5e0a0', body: '#f0d030', bodyLine: '#d4af37',
    leg: '#c8a020', feet: '#a08010', armGuard: '#f8f040', cape: 'dragon',
    swordColor: '#ffd700', swordGlow: '#ff8800',
    weaponType: 'dragon_swords',
    special: 'wings_halo', aura: '#ffd700',
    desc: '龙魂附体，剑圣归位'
  },
];

// ── 当前状态 ────────────────────────────────────
let _savings    = 0;
let _formIdx    = 0;
let _prevFormIdx = 0;
let _isAttacking = false;

// ── 核心 SVG 生成 ────────────────────────────────
const PS = 5; // pixels per pixel-block

function rect(x, y, w, h, fill, opacity) {
  const op = opacity !== undefined ? ` opacity="${opacity}"` : '';
  return `<rect x="${x*PS}" y="${y*PS}" width="${w*PS}" height="${h*PS}" fill="${fill}"${op}/>`;
}

function buildCharSVG(form) {
  const { hair:H, skin:S, body:B, bodyLine:BL, leg:L, feet:FT,
          armGuard:AG, cape:CP, swordColor:SC, swordGlow:SG,
          weaponType:WT, special:SP, aura:AU } = form;

  let p = [];

  // ── 特效背景（光环） ──────────────────────────
  if (AU) {
    p.push(`<circle cx="${8*PS}" cy="${4*PS}" r="${6.5*PS}" fill="${AU}" opacity="0.12" class="halo-ring"/>`);
    p.push(`<circle cx="${8*PS}" cy="${4*PS}" r="${5.5*PS}" fill="none" stroke="${AU}" stroke-width="3" opacity="0.4" class="halo-ring"/>`);
  }

  // ── 翅膀（龙魂剑圣） ──────────────────────────
  if (SP === 'wings_halo') {
    // 天使翼（右）
    p.push(rect(8.5,6, 5,8, '#f0f8ff', 0.8));
    p.push(rect(10,8, 4,10, '#e0f0ff', 0.6));
    p.push(rect(12,9, 3, 9, '#d0e8ff', 0.5));
    // 龙翼（左）
    p.push(rect(-1.5,6, 5,8, '#4a1080', 0.8));
    p.push(rect(-2,8, 4,10, '#380c60', 0.6));
    p.push(rect(-1,9, 3, 9, '#2a0840', 0.5));
  }

  // ── 斗篷 ───────────────────────────────────────
  if (CP === 'short') {
    p.push(rect(11,9, 3,7, '#d0e8f8', 0.9));
    p.push(rect(12,15, 2,4, '#c0d8f0', 0.7));
  } else if (CP === 'long') {
    p.push(rect(11,9, 3,13, '#6a0808', 0.9));
    p.push(rect(12,20, 2,4, '#500606', 0.8));
  } else if (CP === 'long_purple') {
    p.push(rect(11,9, 3,13, '#3a0870', 0.9));
    p.push(rect(12,20, 2,4, '#28054a', 0.8));
  } else if (CP === 'light') {
    p.push(rect(11,9, 3,11, '#d8e8f8', 0.85));
    p.push(rect(12,18, 2,4, '#c8d8f0', 0.7));
  } else if (CP === 'dragon') {
    p.push(rect(11,9, 3,13, '#b08000', 0.9));
    p.push(rect(12,20, 2,4, '#906000', 0.8));
    // Dragon scale pattern on cape
    p.push(rect(11,10, 1,1, '#d4af37', 0.6));
    p.push(rect(12,12, 1,1, '#d4af37', 0.6));
    p.push(rect(11,14, 1,1, '#d4af37', 0.6));
  }

  // ── 头发（上方） ──────────────────────────────
  p.push(rect(4,0, 8,1, H));        // top
  p.push(rect(3,1, 10,1, H));       // wider
  p.push(rect(2,2, 12,1, H));       // widest
  p.push(rect(2,3, 2,6, H));        // left side
  p.push(rect(12,3, 2,6, H));       // right side
  // 发髻/发簪（高等级）
  if (_formIdx >= 6) {
    p.push(rect(7,0, 2,1, '#d4af37'));  // 发簪金色
    p.push(rect(7.5,-0.5, 1,1, '#f8e840'));
  }

  // ── 脸 ────────────────────────────────────────
  p.push(rect(4,3, 8,6, S));

  // 眼睛
  p.push(rect(5,5, 2,2, '#0a0a1a'));
  p.push(rect(9,5, 2,2, '#0a0a1a'));
  p.push(rect(5,5, 1,1, '#fff', 0.6)); // 眼光
  p.push(rect(9,5, 1,1, '#fff', 0.6));

  // 嘴巴
  p.push(rect(6,7, 4,1, '#b06050'));

  // 龙须（Lv10+）
  if (_formIdx >= 2) {
    p.push(`<line x1="${3*PS}" y1="${7*PS}" x2="${1*PS}" y2="${9*PS}" stroke="${H}" stroke-width="1.5" opacity="0.8"/>`);
    p.push(`<line x1="${13*PS}" y1="${7*PS}" x2="${15*PS}" y2="${9*PS}" stroke="${H}" stroke-width="1.5" opacity="0.8"/>`);
  }

  // ── 身体 ──────────────────────────────────────
  p.push(rect(3,9, 10,9, B));

  // 身体纹饰线
  if (BL) {
    p.push(rect(7,9, 2,9, BL, 0.45));  // 中线
    p.push(rect(3,10, 10,1, BL, 0.2)); // 领口
  }

  // 银色/金色甲边
  if (SP === 'silver_trim') {
    p.push(rect(3,9, 10,1, '#c0c8d8', 0.7));  // 领甲
    p.push(rect(3,9, 1,9, '#c0c8d8', 0.5));   // 左甲边
    p.push(rect(12,9, 1,9, '#c0c8d8', 0.5));  // 右甲边
  }
  if (SP === 'gold_trim') {
    p.push(rect(3,9, 10,1, '#d4af37', 0.8));
    p.push(rect(3,9, 1,9, '#d4af37', 0.6));
    p.push(rect(12,9, 1,9, '#d4af37', 0.6));
  }

  // ── 手臂 ──────────────────────────────────────
  if (AG) {
    p.push(rect(1,10, 2,3, AG));
    p.push(rect(13,10, 2,3, AG));
    p.push(rect(1,13, 2,3, S));
    p.push(rect(13,13, 2,3, S));
  } else {
    p.push(rect(1,10, 2,6, S));
    p.push(rect(13,10, 2,6, S));
  }

  // ── 腿 ────────────────────────────────────────
  p.push(rect(3,18, 4,7, L));
  p.push(rect(9,18, 4,7, L));

  // ── 脚 ────────────────────────────────────────
  p.push(rect(2,25, 6,1, FT));
  p.push(rect(8,25, 6,1, FT));

  // 悬空效果（Lv40+）
  if (SP === 'float') {
    p.push(`<ellipse cx="${8*PS}" cy="${27*PS}" rx="${6*PS}" ry="${1.5*PS}" fill="${AU||'#80c8ff'}" opacity="0.3"/>`);
  }

  // ── 武器 ──────────────────────────────────────
  buildWeapons(p, WT, SC, SG);

  // ── 漩涡特效（天下无双） ──────────────────────
  if (SP === 'vortex') {
    p.push(`<circle cx="${8*PS}" cy="${18*PS}" r="${3*PS}" fill="none" stroke="${AU||'#8040ff'}" stroke-width="2" opacity="0.5" class="vortex"/>`);
    p.push(`<circle cx="${8*PS}" cy="${18*PS}" r="${5*PS}" fill="none" stroke="${AU||'#c080ff'}" stroke-width="1" opacity="0.35" class="vortex"/>`);
  }

  const width  = 16 * PS;
  const height = 28 * PS;
  return `<svg id="mochi-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="mochi-char">${p.join('')}</svg>`;
}

function buildWeapons(p, type, sc, sg) {
  const glow = sg || sc;

  if (type === 'sticks') {
    // 左木棍
    p.push(rect(0,8, 1,17, '#8B5E3C'));
    p.push(rect(0,8, 1,2, '#c09060'));  // 顶端
    // 右木棍
    p.push(rect(15,8, 1,17, '#8B5E3C'));
    p.push(rect(15,8, 1,2, '#c09060'));

  } else if (type === 'sword' || type === 'sword_ornate') {
    // 左剑
    p.push(rect(0,4, 1,14, sc));          // 剑身
    p.push(rect(-0.5,12, 2,1, '#888'));   // 护手
    p.push(rect(0,13, 1,4, '#5a3a1a'));   // 剑柄
    // 右剑
    p.push(rect(15,4, 1,14, sc));
    p.push(rect(14.5,12, 2,1, '#888'));
    p.push(rect(15,13, 1,4, '#5a3a1a'));
    // 纹饰
    if (type === 'sword_ornate') {
      p.push(rect(0,7, 1,1, '#d4af37', 0.8));
      p.push(rect(15,7, 1,1, '#d4af37', 0.8));
    }

  } else if (type === 'sword_glow') {
    // 发光剑
    p.push(`<rect x="${0*PS}" y="${4*PS}" width="${1*PS}" height="${14*PS}" fill="${sc}" filter="url(#glow)"/>`);
    p.push(`<rect x="${15*PS}" y="${4*PS}" width="${1*PS}" height="${14*PS}" fill="${sc}" filter="url(#glow)"/>`);
    p.push(rect(-0.5,12, 2,1, sc));
    p.push(rect(14.5,12, 2,1, sc));
    p.push(rect(0,13, 1,4, '#3a2a0a'));
    p.push(rect(15,13, 1,4, '#3a2a0a'));

  } else if (type === 'sword_steel') {
    p.push(rect(0,4, 1,14, '#d0d8e4'));
    p.push(rect(0.1,4, 0.5,14, '#fff', 0.3)); // 刃光
    p.push(rect(-0.5,12, 2,1, '#c0c4cc'));
    p.push(rect(0,13, 1,4, '#2a2a3a'));
    p.push(rect(15,4, 1,14, '#d0d8e4'));
    p.push(rect(15.1,4, 0.5,14, '#fff', 0.3));
    p.push(rect(14.5,12, 2,1, '#c0c4cc'));
    p.push(rect(15,13, 1,4, '#2a2a3a'));

  } else if (type === 'sword_gold') {
    p.push(`<rect x="${0*PS}" y="${4*PS}" width="${1*PS}" height="${14*PS}" fill="#f0d060" filter="url(#glow-gold)"/>`);
    p.push(`<rect x="${15*PS}" y="${4*PS}" width="${1*PS}" height="${14*PS}" fill="#f0d060" filter="url(#glow-gold)"/>`);
    p.push(rect(-0.5,12, 2,1, '#d4af37'));
    p.push(rect(14.5,12, 2,1, '#d4af37'));
    p.push(rect(0,13, 1,4, '#4a3010'));
    p.push(rect(15,13, 1,4, '#4a3010'));

  } else if (type === 'sword_divine') {
    p.push(`<rect x="${0*PS}" y="${4*PS}" width="${1.5*PS}" height="${15*PS}" fill="${sc}" filter="url(#glow-big)"/>`);
    p.push(`<rect x="${14*PS}" y="${4*PS}" width="${1.5*PS}" height="${15*PS}" fill="${sc}" filter="url(#glow-big)"/>`);
    p.push(rect(-0.5,12, 2,1, sc));
    p.push(rect(13.5,12, 2,1, sc));
    p.push(rect(0,13, 1,4, '#1a0a2a'));
    p.push(rect(14,13, 1,4, '#1a0a2a'));

  } else if (type === 'dragon_swords') {
    // 化龙双刀：金色+龙形
    p.push(`<rect x="${0*PS}" y="${3*PS}" width="${1.5*PS}" height="${16*PS}" fill="#ffd700" filter="url(#glow-gold)"/>`);
    p.push(`<rect x="${14*PS}" y="${3*PS}" width="${1.5*PS}" height="${16*PS}" fill="#ffd700" filter="url(#glow-gold)"/>`);
    // 龙纹
    p.push(rect(-0.5,6, 0.5,2, '#ff8800', 0.8));
    p.push(rect(-0.5,10, 0.5,2, '#ff8800', 0.8));
    p.push(rect(15,6, 0.5,2, '#ff8800', 0.8));
    p.push(rect(15,10, 0.5,2, '#ff8800', 0.8));
    p.push(rect(-0.5,12, 2.5,1, '#d4af37'));
    p.push(rect(13.5,12, 2.5,1, '#d4af37'));
  }
}

// ── SVG 滤镜定义 ─────────────────────────────────
const SVG_DEFS = `
<defs>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="2" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="glow-gold" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="3" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="glow-big" x="-100%" y="-100%" width="300%" height="300%">
    <feGaussianBlur stdDeviation="4" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="levelup">
    <feColorMatrix type="saturate" values="3"/>
    <feGaussianBlur stdDeviation="1"/>
  </filter>
</defs>`;

// ── CSS 动画注入 ──────────────────────────────────
function injectCSS() {
  if (document.getElementById('mochi-styles')) return;
  const style = document.createElement('style');
  style.id = 'mochi-styles';
  style.textContent = `
  /* 待机浮动 */
  @keyframes mochiBreathe {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-4px); }
  }

  /* 右手攻击 */
  @keyframes mochiAttackR {
    0%   { transform: translateX(0) rotate(0deg); }
    30%  { transform: translateX(16px) rotate(25deg); }
    60%  { transform: translateX(10px) rotate(15deg); }
    100% { transform: translateX(0) rotate(0deg); }
  }

  /* 左手攻击 */
  @keyframes mochiAttackL {
    0%   { transform: translateX(0) rotate(0deg); }
    30%  { transform: translateX(-16px) rotate(-25deg); }
    60%  { transform: translateX(-10px) rotate(-15deg); }
    100% { transform: translateX(0) rotate(0deg); }
  }

  /* 升级闪光 */
  @keyframes mochiLevelUp {
    0%,100% { filter: brightness(1) drop-shadow(0 0 0px #4af); }
    25%      { filter: brightness(2.5) drop-shadow(0 0 12px #4af); }
    50%      { filter: brightness(1) drop-shadow(0 0 0px #4af); }
    75%      { filter: brightness(2.5) drop-shadow(0 0 16px #4af); }
  }

  /* 光环旋转 */
  @keyframes mochiHalo {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* 漩涡 */
  @keyframes mochiVortex {
    from { transform: rotate(0deg) scale(1); opacity: 0.5; }
    to   { transform: rotate(-360deg) scale(1.2); opacity: 0.2; }
  }

  /* 翅膀扑动 */
  @keyframes mochiWing {
    0%,100% { transform: scaleX(1); }
    50%      { transform: scaleX(0.7) scaleY(1.1); }
  }

  /* 整体容器 */
  .mochi-char { animation: mochiBreathe 2.2s ease-in-out infinite; }

  .mochi-attacking .mochi-char {
    animation: mochiBreathe 2.2s ease-in-out infinite;
  }

  .mochi-levelup .mochi-char {
    animation: mochiLevelUp 0.4s ease-in-out 3;
  }

  .halo-ring {
    transform-origin: ${8*PS}px ${4*PS}px;
    animation: mochiHalo 4s linear infinite;
  }
  .vortex {
    transform-origin: ${8*PS}px ${18*PS}px;
    animation: mochiVortex 3s linear infinite;
  }

  /* 角色卡片 */
  .mochi-card {
    display: flex; flex-direction: column; align-items: center;
    padding: 24px 20px 20px;
    background: linear-gradient(160deg, rgba(34,211,238,.06) 0%, transparent 60%);
    border-color: rgba(34,211,238,.2);
    text-align: center; position: relative; overflow: hidden;
  }
  .mochi-card::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 0%, rgba(34,211,238,.06) 0%, transparent 60%);
    pointer-events: none;
  }
  .mochi-wrap {
    position: relative; cursor: pointer;
    margin-bottom: 12px;
    filter: drop-shadow(0 4px 16px rgba(34,211,238,.15));
    transition: filter .3s;
  }
  .mochi-wrap:hover { filter: drop-shadow(0 4px 24px rgba(34,211,238,.3)); }

  .mochi-name {
    font-family: var(--f-display); font-size: 18px; font-weight: 700;
    color: var(--text); margin-bottom: 3px; letter-spacing: .04em;
  }
  .mochi-title-tag {
    font-size: 11px; font-weight: 600; letter-spacing: .12em;
    text-transform: uppercase; color: var(--cyan);
    background: var(--cyan-dim); border: 1px solid rgba(34,211,238,.2);
    border-radius: 100px; padding: 3px 12px; margin-bottom: 12px; display: inline-block;
  }
  .mochi-desc { font-size: 12px; color: var(--text-3); margin-bottom: 14px; font-style: italic; }

  .mochi-stats { width: 100%; display: flex; flex-direction: column; gap: 6px; }

  .mochi-savings {
    font-family: var(--f-mono); font-size: 22px; font-weight: 700;
    color: var(--income); letter-spacing: -.02em;
    margin-bottom: 4px;
  }
  .mochi-savings-label { font-size: 11px; color: var(--text-3); margin-bottom: 10px; }

  .mochi-lv-bar { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; margin-bottom: 4px; }
  .mochi-lv-fill {
    height: 100%; border-radius: 3px;
    background: linear-gradient(90deg, var(--cyan), var(--violet));
    transition: width 1s cubic-bezier(.16,1,.3,1);
  }
  .mochi-lv-row { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-3); margin-bottom: 10px; }

  .mochi-next {
    font-size: 12px; color: var(--text-2);
    background: var(--card-2); border: 1px solid var(--border);
    border-radius: 8px; padding: 7px 12px;
  }
  .mochi-next span { color: var(--cyan); font-weight: 600; font-family: var(--f-mono); }

  /* XP 特效浮字 */
  .mochi-xp {
    position: absolute; top: 20%; left: 50%; transform: translateX(-50%);
    font-family: var(--f-display); font-size: 18px; font-weight: 800;
    color: #4af; text-shadow: 0 0 12px rgba(64,160,255,.6);
    pointer-events: none; z-index: 20;
    animation: xpFloat 1.2s ease forwards;
  }

  /* 攻击时右手武器位移 */
  .mochi-attack-r { animation: mochiAttackR 0.4s ease forwards; }
  .mochi-attack-l { animation: mochiAttackL 0.4s ease forwards; }
  `;
  document.head.appendChild(style);
}

// ── 获取当前形态 ──────────────────────────────────
function getFormIdx(savings) {
  for (let i = MOCHI_FORMS.length - 1; i >= 0; i--) {
    if (savings >= MOCHI_FORMS[i].minSave) return i;
  }
  return 0;
}

function getNextThreshold(idx) {
  const form = MOCHI_FORMS[idx];
  return form.maxSave === Infinity ? null : form.maxSave;
}

// ── 渲染角色 ─────────────────────────────────────
function renderMochi(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;

  injectCSS();

  const form  = MOCHI_FORMS[_formIdx];
  const next  = getNextThreshold(_formIdx);
  const pct   = next
    ? Math.min((_savings - form.minSave) / (form.maxSave - form.minSave) * 100, 100)
    : 100;

  const svgStr = SVG_DEFS + buildCharSVG(form);

  wrap.innerHTML = `
  <div class="card mochi-card">
    <div class="mochi-wrap" id="mochi-wrap" onclick="mochiAttack()">
      ${svgStr}
    </div>
    <div class="mochi-name">墨疾 <span style="font-size:14px;color:var(--cyan)">· Lv.${form.level}</span></div>
    <div class="mochi-title-tag">「${form.title}」</div>
    <div class="mochi-desc">${form.desc}</div>

    <div class="mochi-stats">
      <div style="font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">总存款</div>
      <div class="mochi-savings" id="mochi-savings-val" data-raw-amt="${_savings}">${fmtAmt(_savings)}</div>

      <div class="mochi-lv-bar">
        <div class="mochi-lv-fill" id="mochi-lv-fill" style="width:0%"></div>
      </div>
      <div class="mochi-lv-row">
        <span>${fmtAmt(form.minSave)}</span>
        <span>${pct.toFixed(0)}%</span>
        <span>${next ? fmtAmt(next) : '已满'}</span>
      </div>

      ${next
        ? `<div class="mochi-next">升级还需 <span>${fmtAmt(next - _savings)}</span></div>`
        : `<div class="mochi-next" style="color:var(--income)">🎉 最高境界，龙魂归位！</div>`
      }
    </div>
  </div>`;

  // 动画进度条 + 同步遮罩状态
  requestAnimationFrame(() => {
    const fill = document.getElementById('mochi-lv-fill');
    if (fill) fill.style.width = pct + '%';
    if (typeof applyAmtMask === 'function') applyAmtMask();
  });
}

// ── 攻击动画 ─────────────────────────────────────
function mochiAttack() {
  if (_isAttacking) return;
  _isAttacking = true;

  const svg = document.getElementById('mochi-svg');
  if (!svg) { _isAttacking = false; return; }

  // 找到武器相关 rect（最后几个元素） — 简化：整个 svg 摇动
  svg.style.animation = 'none';
  svg.style.transform = 'translateX(3px) rotate(2deg)';
  setTimeout(() => {
    svg.style.transform = 'translateX(-3px) rotate(-2deg)';
    setTimeout(() => {
      svg.style.transform = '';
      svg.style.animation = '';
      _isAttacking = false;
    }, 120);
  }, 120);

  // XP 浮字
  const wrap = document.getElementById('mochi-wrap');
  if (wrap) {
    const xp = document.createElement('div');
    xp.className = 'mochi-xp';
    xp.textContent = '+XP';
    wrap.appendChild(xp);
    xp.addEventListener('animationend', () => xp.remove());
  }
}

// ── 升级动画 ─────────────────────────────────────
function mochiLevelUpAnim() {
  const wrap = document.getElementById('mochi-wrap');
  if (!wrap) return;
  wrap.classList.add('mochi-levelup');

  // 撒花
  if (typeof triggerMilestone === 'function') {
    // reuse milestone confetti
  } else {
    const colors = ['#22D3EE','#A78BFA','#4ADE80','#FBBF24','#F87171'];
    for (let i = 0; i < 40; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.cssText = `left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};animation-delay:${Math.random()*.5}s;animation-duration:${1.5+Math.random()}s;width:${4+Math.random()*5}px;height:${4+Math.random()*5}px;border-radius:${Math.random()>.5?'50%':'2px'};`;
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }

  setTimeout(() => {
    wrap.classList.remove('mochi-levelup');
  }, 1400);
}

// ── 主 API ───────────────────────────────────────
window.mochiInit = async function(containerId) {
  injectCSS();
  // 读取所有交易计算总存款
  const { data } = await db.from('transactions').select('type,amount');
  const rows   = data || [];
  const allInc = rows.filter(r=>r.type==='income').reduce((s,r)=>s + +r.amount,0);
  const allExp = rows.filter(r=>r.type==='expense').reduce((s,r)=>s + +r.amount,0);
  _savings     = Math.max(0, allInc - allExp);
  _prevFormIdx = _formIdx;
  _formIdx     = getFormIdx(_savings);

  renderMochi(containerId);
};

window.mochiOnIncome = function(amount) {
  _savings  += amount;
  const newIdx = getFormIdx(_savings);
  if (newIdx > _formIdx) {
    _formIdx = newIdx;
    renderMochi('mochi-container');
    mochiLevelUpAnim();
  }
  mochiAttack();
};

window.mochiAttack = mochiAttack;
window.mochiRefresh = function(containerId) {
  _formIdx = getFormIdx(_savings);
  renderMochi(containerId || 'mochi-container');
};

// fmtAmt 由 app.js 提供，mochi.js 直接使用全局版本
