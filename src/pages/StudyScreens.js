import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getMats, getMat, formatTimer, formatDuration } from '../utils/constants';

// ── 과목/교재 선택 ──
export function StudyStartScreen({ initialSubjId, onBack, onStarted }) {
  const { subjects, startStudy, session } = useApp();
  const [subjId, setSubjId]   = useState(initialSubjId || null);
  const [mat, setMat]         = useState(null);
  const [fields, setFields]   = useState({});

  const mats = subjId ? getMats(subjId) : [];

  const handleStart = () => {
    if (!subjId || !mat) return;
    const detail = buildDetail(mat, fields);
    startStudy(subjId, mat, detail, fields);
    onStarted();
  };

  const buildDetail = (matId, f) => {
    if (matId === 'tb' || matId === 'sp') return `${f.unit || ''}${f.s && f.e ? ` p.${f.s}~${f.e}` : ''}`.trim();
    if (matId === 'lc') return `${f.name || ''} ${f.num || ''}`.trim();
    if (matId === 'wb') return `${f.name || ''}${f.s && f.e ? ` p.${f.s}~${f.e}` : ''}`.trim();
    if (matId === 'err') return f.unit || '';
    return '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="hdr">
        <button className="back" onClick={onBack}>←</button>
        <span className="hdr-title">공부 시작</span>
      </div>
      <div className="scroll">
        {/* 과목 선택 */}
        <div style={{ marginBottom: 16 }}>
          <div className="sec">📖 과목 선택</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
            {subjects.map(s => (
              <button key={s.id} onClick={() => { setSubjId(s.id); setMat(null); setFields({}); }}
                className="subj-chip"
                style={{ background: subjId === s.id ? s.color : s.bg, border: `1.5px solid ${subjId === s.id ? s.color : 'transparent'}`, color: subjId === s.id ? '#fff' : 'var(--txt)' }}>
                <span style={{ fontSize: 22 }}>{s.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 800 }}>{s.label}</span>
                {subjId === s.id && <span style={{ marginLeft: 'auto' }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* 교재 선택 */}
        {subjId && (
          <div style={{ marginBottom: 16 }}>
            <div className="sec">📚 교재 종류</div>
            <div className="mat-grid">
              {mats.map(m => (
                <button key={m.id} className={`mat-btn ${mat === m.id ? 'sel' : ''}`} onClick={() => { setMat(m.id); setFields({}); }}>
                  <span style={{ fontSize: 24 }}>{m.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: mat === m.id ? 'var(--pk)' : 'var(--txt2)' }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 세부 입력 */}
        {mat && <MatInput matId={mat} fields={fields} setFields={setFields} />}

        {/* 시작 버튼 */}
        {subjId && mat && (
          <button className="btn btn-p btn-full" style={{ padding: '14px' }} onClick={handleStart}>
            🚀 공부 시작!
          </button>
        )}
      </div>
    </div>
  );
}

function MatInput({ matId, fields, setFields }) {
  const set = (k, v) => setFields(p => ({ ...p, [k]: v }));
  if (matId === 'tb' || matId === 'sp') return (
    <div style={{ marginBottom: 14 }}>
      <div className="sec">단원명 / 쪽수</div>
      <input className="inp" placeholder="단원명 (예: 2단원 식물의 구조)" value={fields.unit||''} onChange={e=>set('unit',e.target.value)} style={{ marginBottom: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><div style={{ fontSize: 11, fontWeight: 800, color: 'var(--txt2)', marginBottom: 4 }}>시작 쪽</div><input className="inp" type="number" placeholder="32" value={fields.s||''} onChange={e=>set('s',e.target.value)} /></div>
        <div><div style={{ fontSize: 11, fontWeight: 800, color: 'var(--txt2)', marginBottom: 4 }}>끝 쪽</div><input className="inp" type="number" placeholder="67" value={fields.e||''} onChange={e=>set('e',e.target.value)} /></div>
      </div>
    </div>
  );
  if (matId === 'lc') return (
    <div style={{ marginBottom: 14 }}>
      <div className="sec">인강 정보</div>
      <input className="inp" placeholder="강의명 (예: 메가스터디 국어)" value={fields.name||''} onChange={e=>set('name',e.target.value)} style={{ marginBottom: 8 }} />
      <input className="inp" placeholder="회차 (예: 12강)" value={fields.num||''} onChange={e=>set('num',e.target.value)} />
    </div>
  );
  if (matId === 'wb') return (
    <div style={{ marginBottom: 14 }}>
      <div className="sec">문제집 정보</div>
      <input className="inp" placeholder="문제집명 (예: 수능완성, 마플)" value={fields.name||''} onChange={e=>set('name',e.target.value)} style={{ marginBottom: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><div style={{ fontSize: 11, fontWeight: 800, color: 'var(--txt2)', marginBottom: 4 }}>시작 페이지</div><input className="inp" type="number" placeholder="45" value={fields.s||''} onChange={e=>set('s',e.target.value)} /></div>
        <div><div style={{ fontSize: 11, fontWeight: 800, color: 'var(--txt2)', marginBottom: 4 }}>끝 페이지</div><input className="inp" type="number" placeholder="60" value={fields.e||''} onChange={e=>set('e',e.target.value)} /></div>
      </div>
    </div>
  );
  if (matId === 'err') return (
    <div style={{ marginBottom: 14 }}>
      <div className="sec">오답노트 단원명</div>
      <input className="inp" placeholder="단원명 (예: 2단원 수열)" value={fields.unit||''} onChange={e=>set('unit',e.target.value)} />
    </div>
  );
  return null;
}

// ── 타이머 ──
export function TimerScreen() {
  const { user, session, pauseStudy, resumeStudy, getElapsed, finishStudy, subjects } = useApp();
  const [elapsed, setElapsed]     = useState(0);
  const [progress, setProgress]   = useState('');
  const [showFinish, setShowFinish] = useState(false);
  const [showCant, setShowCant]   = useState(false);

  useEffect(() => {
    setElapsed(getElapsed());
    if (session && !session.paused) {
      const id = setInterval(() => setElapsed(getElapsed()), 1000);
      return () => clearInterval(id);
    }
  }, [session, getElapsed]);

  if (!session) return null;

  const subj = subjects.find(s => s.id === session.subjId) || subjects[0];
  const ml   = getMat(session.mat);
  const R = 76, C = 2 * Math.PI * R;
  const pct = Math.min(elapsed / 3600, 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="hdr">
        <div style={{ width: 34 }} />
        <span className="hdr-title" style={{ textAlign: 'center' }}>공부 중 📖</span>
        <div style={{ width: 34 }} />
      </div>
      <div className="scroll" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* 과목 뱃지 */}
        <div style={{ background: subj.bg, border: `1.5px solid ${subj.color}`, borderRadius: 20, padding: '7px 18px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 22 }}>{subj.emoji}</span>
          <span style={{ fontWeight: 800, fontSize: 15 }}>{subj.label}</span>
          <span style={{ color: 'var(--txt2)', fontSize: 12 }}>· {ml.emoji} {ml.label}</span>
        </div>

        {/* 타이머 링 */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <svg width={180} height={180} className="timer-ring">
            <circle className="timer-track" cx={90} cy={90} r={R} strokeWidth={10} />
            <circle className="timer-arc" cx={90} cy={90} r={R} strokeWidth={10}
              strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
              stroke={session.paused ? 'var(--txt3)' : subj.color} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'monospace', color: 'var(--txt)' }}>{formatTimer(elapsed)}</div>
            {session.paused && <div style={{ fontSize: 12, color: 'var(--txt3)', fontWeight: 700 }}>⏸ 일시정지</div>}
          </div>
        </div>

        <div style={{ color: 'var(--txt3)', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{formatDuration(elapsed)} 공부했어요</div>
        {session.detail && <div style={{ color: 'var(--txt2)', fontSize: 12, fontWeight: 700, marginBottom: 20 }}>📝 {session.detail}</div>}

        <div style={{ width: '100%' }}>
          <button className="btn btn-p btn-full" onClick={() => setShowFinish(true)}>✅ 공부 끝내기</button>
          <button className={`btn btn-full ${session.paused ? 'btn-g' : 'btn-s'}`}
            onClick={session.paused ? resumeStudy : pauseStudy}>
            {session.paused ? '▶️ 다시 시작' : '⏸ 잠시 정지'}
          </button>
        </div>
      </div>

      {/* 완료 모달 */}
      {showFinish && (
        <div className="ov show" onClick={() => setShowFinish(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="hdl" />
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 44 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6 }}>수고했어요!</div>
              <div style={{ color: 'var(--txt2)', fontWeight: 700, marginTop: 2 }}>{formatDuration(elapsed)} 공부했어요</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div className="sec">진도 내용 (선택)</div>
              <input className="inp" placeholder="예: p.45~67 완료, 3강 완료" value={progress} onChange={e => setProgress(e.target.value)} maxLength={60} />
            </div>
            <button className="btn btn-g btn-full" onClick={() => { finishStudy(progress, true); setShowFinish(false); }}>✅ 다했어요!</button>
            <button className="btn btn-o btn-full" onClick={() => { setShowFinish(false); setShowCant(true); }}>😅 다 못했어요</button>
            <button className="btn btn-s btn-full" onClick={() => setShowFinish(false)}>계속 공부할게요</button>
          </div>
        </div>
      )}

      {/* 못했어요 모달 */}
      {showCant && (
        <div className="ov show" onClick={() => setShowCant(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="hdl" />
            <div style={{ fontSize: 16, fontWeight: 900, textAlign: 'center', marginBottom: 16 }}>😅 어떻게 할까요?</div>
            <button className="btn btn-s btn-full" onClick={() => { finishStudy(progress, false); setShowCant(false); }}>📅 주말에 다시할래요</button>
            <button className="btn btn-s btn-full" onClick={() => { finishStudy(progress, false); setShowCant(false); }}>⏰ 아직 안 끝났어요 (나중에)</button>
            <button className="btn btn-r btn-full" onClick={() => setShowCant(false)}>취소 (계속 공부)</button>
          </div>
        </div>
      )}
    </div>
  );
}
