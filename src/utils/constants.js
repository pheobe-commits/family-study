// ── 기본 과목 8개 ──
export const DEFAULT_SUBJECTS = [
  { id: 'kor',  label: '국어',   emoji: '📖', color: '#FFB4B4', bg: '#FFF0F0' },
  { id: 'math', label: '수학',   emoji: '📐', color: '#B4D4FF', bg: '#F0F6FF' },
  { id: 'da',   label: '대수',   emoji: '🔢', color: '#C4A8FF', bg: '#F5F0FF' },
  { id: 'st',   label: '확통',   emoji: '📈', color: '#FFB4E8', bg: '#FFF0FA' },
  { id: 'eng',  label: '영어',   emoji: '🌍', color: '#B4F0C8', bg: '#F0FFF5' },
  { id: 'sci',  label: '과학',   emoji: '🔬', color: '#FFD4B4', bg: '#FFF8F0' },
  { id: 'soc',  label: '사회',   emoji: '🗺️', color: '#D4B4FF', bg: '#F8F0FF' },
  { id: 'his',  label: '한국사', emoji: '🏛️', color: '#FFF4B4', bg: '#FFFFF0' },
];

// ── 교재 종류 ──
export const MAT_BASE = [
  { id: 'tb',  label: '교과서', emoji: '📗', hasUnit: true,  hasPage: true,  hasNum: false },
  { id: 'lc',  label: '인강',   emoji: '💻', hasUnit: false, hasPage: false, hasNum: true  },
  { id: 'wb',  label: '문제집', emoji: '📝', hasUnit: false, hasPage: true,  hasNum: false, hasName: true },
  { id: 'sp',  label: '부교재', emoji: '📓', hasUnit: true,  hasPage: true,  hasNum: false },
];
export const MAT_ERR = { id: 'err', label: '오답노트', emoji: '✏️', hasUnit: true, hasPage: false, hasNum: false };

export const getMats = (subjId) => {
  const base = [...MAT_BASE];
  if (subjId === 'da' || subjId === 'st') base.push(MAT_ERR);
  return base;
};
export const getMat = (id) => [...MAT_BASE, MAT_ERR].find(m => m.id === id) || MAT_BASE[0];

// ── 아바타 ──
export const AVATARS = ['🐱','🐶','🐰','🦊','🐻','🐼','🐸','🐨','🦁','🐯','🦄','🐙','🦋','🐢','🦖','🐳','🦒','🦘','🐧','🦅'];
export const QUICK_CHEERS = ['👏','💪','🌟','❤️','🔥'];

// ── 날짜 ──
export const todayKey = () => new Date().toISOString().split('T')[0];
export const nowMs = () => Date.now();

export const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
};

export const formatTimer = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const p = n => String(n).padStart(2, '0');
  return h > 0 ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
};

export const formatDate = (str) => {
  if (!str) return '';
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
};

export const getDDay = (dateStr) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const exam  = new Date(dateStr); exam.setHours(0,0,0,0);
  return Math.ceil((exam - today) / 86400000);
};

export const formatTimeAgo = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff/60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`;
  return `${Math.floor(diff/86400)}일 전`;
};

export const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length:3}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
};

export const getWeekDates = () => {
  const today = new Date();
  const dow = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({length:7}, (_,i) => {
    const d = new Date(mon); d.setDate(mon.getDate()+i);
    return d.toISOString().split('T')[0];
  });
};

export const DAY_LABELS = ['월','화','수','목','금','토','일'];

// 달성률 계산
// 겹치는 구간 병합 (오버카운트 방지)
const mergeRanges = (ranges) => {
  if (!ranges.length) return [];
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i][0] <= last[1] + 1) last[1] = Math.max(last[1], sorted[i][1]);
    else merged.push(sorted[i]);
  }
  return merged;
};

export const calcAchiev = (records, range) => {
  if (!range) return 0;

  let totalWeight = 0;
  let doneWeight  = 0;

  const matIds = ['tb', 'sp', 'wb', 'lc', 'err'];
  matIds.forEach(mid => {
    const r = range[mid];
    if (!r) return;

    if (mid === 'tb' || mid === 'sp' || mid === 'wb') {
      // ── 페이지 기반 ──
      const s = Number(r.s), e = Number(r.e);
      if (!s || !e || e <= s) return;
      const totalPages = e - s + 1;
      totalWeight += totalPages;

      // 완료된 기록 중 pageS/pageE 있는 것만
      const studied = records
        .filter(rec => rec.mat === mid && rec.done && rec.pageS && rec.pageE)
        .map(rec => [
          Math.max(Number(rec.pageS), s),
          Math.min(Number(rec.pageE), e),
        ])
        .filter(([ps, pe]) => pe >= ps);

      const covered = mergeRanges(studied)
        .reduce((sum, [ps, pe]) => sum + (pe - ps + 1), 0);
      doneWeight += Math.min(covered, totalPages);

    } else if (mid === 'lc') {
      // ── 강의 회차 기반 ──
      const target = parseInt(r.num) || 0;
      if (!target) return;
      totalWeight += target;

      const completed = records
        .filter(rec => rec.mat === 'lc' && rec.done && rec.lectureNum)
        .reduce((sum, rec) => sum + (parseInt(rec.lectureNum) || 0), 0);
      doneWeight += Math.min(completed, target);

    } else if (mid === 'err') {
      // ── 오답노트: 단원 완료 여부 ──
      if (!r.unit) return;
      totalWeight += 1;
      if (records.some(rec => rec.mat === 'err' && rec.done)) doneWeight += 1;
    }
  });

  return totalWeight === 0 ? 0 : Math.round(doneWeight / totalWeight * 100);
};
