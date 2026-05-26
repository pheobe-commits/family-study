import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { formatDuration, getWeekDates, DAY_LABELS, calcAchiev, getMat } from '../utils/constants';

export default function StatsScreen() {
  const { user, subjects, ranges, records: todayRecs, getRecordsByPeriod, updateRecord, deleteRecord, saveRange, toast } = useApp();
  const [period, setPeriod]   = useState('today');
  const [recs, setRecs]       = useState([]);
  const [view, setView]       = useState('main'); // main | achiev | range
  const [selSubj, setSelSubj] = useState(null);
  const [editRec, setEditRec] = useState(null);
  const [rangeForm, setRangeForm] = useState({});
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (period === 'today') { setRecs(todayRecs.filter(r => r.userId === user?.id)); return; }
    getRecordsByPeriod(period === 'week' ? 'week' : 'month').then(setRecs);
  }, [period, todayRecs]);

  const total = recs.reduce((s, r) => s + (r.duration || 0), 0);

  // Weekly bars
  const weekDates = getWeekDates();
  const weekData  = weekDates.map((date, i) => ({
    label: DAY_LABELS[i],
    val: recs.filter(r => r.date === date).reduce((s, r) => s + (r.duration || 0), 0),
    isToday: date === today,
  }));
  const maxBar = Math.max(...weekData.map(d => d.val), 1);

  // Missed records
  const missed = recs.filter(r => !r.done);

  // Achiev detail
  const openAchiev = (s) => { setSelSubj(s); setView('achiev'); };
  const openRange  = (s) => {
    setSelSubj(s);
    const r = ranges[s.id] || {};
    setRangeForm({ tb: r.tb||{}, lc: r.lc||{}, wb: r.wb||{}, sp: r.sp||{}, err: r.err||{} });
    setView('range');
  };

  const handleSaveRange = async () => {
    await saveRange(selSubj.id, rangeForm);
    setView('achiev');
  };

  const handleSaveRec = async () => {
    if (!editRec) return;
    const { id, ...updates } = editRec;
    await updateRecord(id, updates);
    setEditRec(null);
    // refresh
    if (period === 'today') setRecs(todayRecs.filter(r => r.userId === user?.id));
    else getRecordsByPeriod(period === 'week' ? 'week' : 'month').then(setRecs);
  };

  const handleDelRec = async () => {
    if (!editRec) return;
    await deleteRecord(editRec.id);
    setEditRec(null);
    if (period === 'today') setRecs(todayRecs.filter(r => r.userId === user?.id));
    else getRecordsByPeriod(period === 'week' ? 'week' : 'month').then(setRecs);
    if (view === 'achiev') setView('achiev');
  };

  // ── Range form view ──
  if (view === 'range' && selSubj) {
    const isMath = selSubj.id === 'da' || selSubj.id === 'st';
    const rf = rangeForm;
    const set = (mat, key, val) => setRangeForm(p => ({ ...p, [mat]: { ...p[mat], [key]: val } }));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div className="hdr">
          <button className="back" onClick={() => setView('achiev')}>←</button>
          <span className="hdr-title">{selSubj.emoji} {selSubj.label} · 시험 범위</span>
        </div>
        <div className="scroll">
          {[['tb','📗','교과서',true,true],['lc','💻','인강',false,true],['wb','📝','문제집',true,true,true],['sp','📓','부교재',true,true]].map(([mid,em,lb,hasUnit,hasPage,hasName]) => (
            <div key={mid} style={{ marginBottom: 12 }}>
              <div className="sec">{em} {lb}</div>
              <div className="card">
                {hasName && <><div style={{ fontSize: 11, fontWeight: 800, color: 'var(--txt2)', marginBottom: 4 }}>{lb}명</div><input className="inp" placeholder={`${lb}명`} value={rf[mid]?.name||''} onChange={e=>set(mid,'name',e.target.value)} style={{ marginBottom: 8 }} /></>}
                {hasUnit && !hasName && <><div style={{ fontSize: 11, fontWeight: 800, color: 'var(--txt2)', marginBottom: 4 }}>단원명</div><input className="inp" placeholder="단원명" value={rf[mid]?.unit||''} onChange={e=>set(mid,'unit',e.target.value)} style={{ marginBottom: 8 }} /></>}
                {hasPage && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div><div style={{ fontSize: 11, fontWeight: 800, color: 'var(--txt2)', marginBottom: 4 }}>시작</div><input className="inp" type="number" placeholder="1" value={rf[mid]?.s||''} onChange={e=>set(mid,'s',e.target.value)} /></div>
                    <div><div style={{ fontSize: 11, fontWeight: 800, color: 'var(--txt2)', marginBottom: 4 }}>끝</div><input className="inp" type="number" placeholder="50" value={rf[mid]?.e||''} onChange={e=>set(mid,'e',e.target.value)} /></div>
                  </div>
                )}
                {mid === 'lc' && <><div style={{ fontSize: 11, fontWeight: 800, color: 'var(--txt2)', marginBottom: 4 }}>강의명</div><input className="inp" placeholder="강의명" value={rf.lc?.name||''} onChange={e=>set('lc','name',e.target.value)} style={{ marginBottom: 8 }} /><div style={{ fontSize: 11, fontWeight: 800, color: 'var(--txt2)', marginBottom: 4 }}>목표 회차</div><input className="inp" placeholder="15강" value={rf.lc?.num||''} onChange={e=>set('lc','num',e.target.value)} /></>}
              </div>
            </div>
          ))}
          {isMath && (
            <div style={{ marginBottom: 12 }}>
              <div className="sec">✏️ 오답노트</div>
              <div className="card"><input className="inp" placeholder="단원명 (예: 2단원 수열)" value={rf.err?.unit||''} onChange={e=>set('err','unit',e.target.value)} /></div>
            </div>
          )}
          <button className="btn btn-p btn-full" onClick={handleSaveRange}>저장하기</button>
          <button className="btn btn-s btn-full" onClick={() => setView('achiev')}>취소</button>
        </div>
      </div>
    );
  }

  // ── Achiev detail view ──
  if (view === 'achiev' && selSubj) {
    const subjRecs = recs.filter(r => r.subjId === selSubj.id);
    const rng = ranges[selSubj.id] || {};
    const pct = calcAchiev(subjRecs, rng);
    const col = pct >= 80 ? 'var(--mint)' : pct >= 50 ? 'var(--sky)' : 'var(--pk)';
    const done = subjRecs.filter(r => r.done).length;
    const hasRange = Object.values(rng).some(v => v && (v.unit || v.name || v.s || v.num));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div className="hdr">
          <button className="back" onClick={() => setView('main')}>←</button>
          <span className="hdr-title">{selSubj.emoji} {selSubj.label} 달성률</span>
        </div>
        <div className="scroll">
          {/* 달성률 카드 */}
          <div className="card" style={{ background: selSubj.bg, border: `1.5px solid ${selSubj.color}`, textAlign: 'center', padding: 20, marginBottom: 12 }}>
            <div style={{ fontSize: 48, marginBottom: 6 }}>{selSubj.emoji}</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{selSubj.label}</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: col, margin: '6px 0' }}>{pct}%</div>
            <div className="prog-wrap"><div className="prog-fill" style={{ width: `${pct}%`, background: col }} /></div>
            <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 6, fontWeight: 700 }}>{subjRecs.length}개 세션 중 {done}개 완료</div>
          </div>

          {/* 설정된 시험범위 + 범위 수정하기 */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="sec" style={{ marginBottom: 6 }}>설정된 시험 범위</div>
            {hasRange ? (
              <>
                {rng.tb?.s && <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>📗 교과서: {rng.tb.unit} p.{rng.tb.s}~{rng.tb.e}</div>}
                {rng.lc?.name && <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>💻 인강: {rng.lc.name} ~{rng.lc.num}</div>}
                {rng.wb?.name && <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>📝 문제집: {rng.wb.name} p.{rng.wb.s}~{rng.wb.e}</div>}
                {rng.sp?.s && <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>📓 부교재: {rng.sp.unit} p.{rng.sp.s}~{rng.sp.e}</div>}
                {rng.err?.unit && <div style={{ fontSize: 12, fontWeight: 700 }}>✏️ 오답노트: {rng.err.unit}</div>}
              </>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--txt3)', fontStyle: 'italic' }}>시험 범위가 설정되지 않았어요</div>
            )}
            <button className="btn btn-s btn-sm" style={{ width: '100%', marginTop: 10 }} onClick={() => openRange(selSubj)}>✏️ 범위 수정하기</button>
          </div>

          {/* 공부 기록 (수정 가능) */}
          <div className="sec">공부 기록 <span style={{ fontSize: 10, color: 'var(--pk)', fontWeight: 700 }}>✏️ 탭해서 수정</span></div>
          {subjRecs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 20, color: 'var(--txt3)', fontWeight: 700 }}>아직 공부 기록이 없어요 📭</div>
          ) : subjRecs.map(r => {
            const ml = getMat(r.mat);
            return (
              <div key={r.id} className="card card-tap" style={{ marginBottom: 8 }} onClick={() => setEditRec({ ...r, newDetail: r.detail || '', newProgress: r.progress || '', newMinutes: Math.floor(r.duration/60), newDone: r.done })}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{ml.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{ml.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--txt2)' }}>{r.detail}{r.progress ? ` → ${r.progress}` : ''}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`bdg ${r.done ? 'bdone' : 'bmiss'}`}>{r.done ? '완료' : '미달성'}</span>
                    <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>{formatDuration(r.duration)}</div>
                  </div>
                </div>
                <div style={{ background: 'var(--pk3)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 800, color: 'var(--pk)', textAlign: 'center' }}>✏️ 탭해서 수정하기</div>
                {!r.done && (
                  <div className="edit-row">
                    <button className="btn btn-g btn-sm" style={{ flex: 1 }} onClick={e => { e.stopPropagation(); toast('🔄 다시 공부 세션 추가됐어요!'); }}>🔄 다시 공부</button>
                    <button className="btn btn-s btn-sm" onClick={e => { e.stopPropagation(); toast('건너뜁니다'); }}>건너뛰기</button>
                  </div>
                )}
              </div>
            );
          })}
          <button className="btn btn-s btn-full" onClick={() => setView('main')}>← 통계로 돌아가기</button>
        </div>

        {/* 기록 수정 시트 */}
        {editRec && (
          <div className="ov show" onClick={() => setEditRec(null)}>
            <div className="sheet" onClick={e => e.stopPropagation()}>
              <div className="hdl" />
              <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 4 }}>✏️ 기록 수정</div>
              <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 14, fontWeight: 700 }}>{selSubj.emoji} {selSubj.label} · {getMat(editRec.mat).emoji} {getMat(editRec.mat).label}</div>
              <div className="sec">진도 내용</div>
              <input className="inp" value={editRec.newDetail} onChange={e => setEditRec(p => ({ ...p, newDetail: e.target.value }))} style={{ marginBottom: 10 }} />
              <div className="sec">완료 진도 (선택)</div>
              <input className="inp" placeholder="예: p.45~67 완료" value={editRec.newProgress} onChange={e => setEditRec(p => ({ ...p, newProgress: e.target.value }))} style={{ marginBottom: 10 }} />
              <div className="sec">공부 시간 (분)</div>
              <input className="inp" type="number" value={editRec.newMinutes} onChange={e => setEditRec(p => ({ ...p, newMinutes: e.target.value }))} style={{ marginBottom: 10 }} />
              <div className="sec">완료 여부</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button className="btn" style={{ flex: 1, border: `2px solid ${editRec.newDone ? 'var(--mint)' : 'var(--bdr)'}`, background: editRec.newDone ? 'var(--mint3)' : 'var(--sur2)', color: editRec.newDone ? '#1A7A40' : 'var(--txt2)' }} onClick={() => setEditRec(p => ({ ...p, newDone: true }))}>✅ 완료</button>
                <button className="btn" style={{ flex: 1, border: `2px solid ${!editRec.newDone ? '#FFB4B4' : 'var(--bdr)'}`, background: !editRec.newDone ? '#FFF0F0' : 'var(--sur2)', color: !editRec.newDone ? '#D04040' : 'var(--txt2)' }} onClick={() => setEditRec(p => ({ ...p, newDone: false }))}>❌ 미달성</button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-r btn-sm" onClick={handleDelRec}>🗑️ 삭제</button>
                <button className="btn btn-s" style={{ flex: 1 }} onClick={() => setEditRec(null)}>취소</button>
                <button className="btn btn-p" style={{ flex: 1 }} onClick={() => { updateRecord(editRec.id, { detail: editRec.newDetail, progress: editRec.newProgress, duration: (parseInt(editRec.newMinutes)||0)*60, done: editRec.newDone }); setEditRec(null); }}>저장</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Main stats ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="hdr"><span className="hdr-title">📊 통계</span></div>
      <div style={{ display: 'flex', borderBottom: '1.5px solid var(--bdr)', background: 'var(--bg)', flexShrink: 0 }}>
        {[['today','오늘'],['week','이번 주'],['month','이번 달']].map(([p,l]) => (
          <button key={p} onClick={() => setPeriod(p)}
            style={{ flex: 1, padding: '10px 0', fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', background: 'transparent', color: period === p ? 'var(--pk)' : 'var(--txt2)', borderBottom: `2.5px solid ${period === p ? 'var(--pk)' : 'transparent'}`, transition: 'all .15s' }}>
            {l}
          </button>
        ))}
      </div>
      <div className="scroll">
        <div className="card" style={{ background: 'linear-gradient(135deg,var(--pk3),var(--sky3))', textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--txt2)', fontWeight: 800 }}>총 공부 시간</div>
          <div style={{ fontSize: 38, fontWeight: 900, margin: '4px 0' }}>{formatDuration(total)}</div>
          <div style={{ fontSize: 12, color: 'var(--txt3)', fontWeight: 600 }}>{recs.length}회 완료</div>
        </div>

        {/* 밀린공부 */}
        {missed.length > 0 && (
          <>
            <div className="sec" style={{ color: '#C03030' }}>🔴 밀린 공부 (미달성)</div>
            {missed.map(r => {
              const s = subjects.find(x => x.id === r.subjId) || subjects[0];
              const ml = getMat(r.mat);
              return (
                <div key={r.id} className="card" style={{ borderColor: '#FFB4B4', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{s.emoji}</span>
                      <div><div style={{ fontWeight: 800, fontSize: 13 }}>{s.label} {ml.label}</div><div style={{ fontSize: 11, color: 'var(--txt2)' }}>{r.detail}</div></div>
                    </div>
                    <span className="bdg bmiss">미달성</span>
                  </div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button className="btn btn-g btn-sm" style={{ flex: 1 }} onClick={() => toast('🔄 다시 공부 세션 추가됐어요!')}>🔄 다시 공부</button>
                    <button className="btn btn-s btn-sm" onClick={() => toast('건너뜁니다')}>건너뛰기</button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* 과목별 달성률 */}
        <div className="sec">과목별 달성률 <span style={{ fontSize: 10, color: 'var(--txt2)', fontWeight: 700 }}>탭해서 상세 보기</span></div>
        {subjects.map(s => {
          const sRecs = recs.filter(r => r.subjId === s.id);
          const pct = calcAchiev(sRecs, ranges[s.id]);
          const col = pct >= 80 ? 'var(--mint)' : pct >= 50 ? 'var(--sky)' : 'var(--pk)';
          return (
            <div key={s.id} className="card card-tap" style={{ marginBottom: 8, padding: '11px 13px' }} onClick={() => openAchiev(s)}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 18, marginRight: 6 }}>{s.emoji}</span>
                <span style={{ flex: 1, fontWeight: 800, fontSize: 13 }}>{s.label}</span>
                <span style={{ fontWeight: 900, fontSize: 15, color: col }}>{pct}%</span>
                <span style={{ color: 'var(--txt3)', fontSize: 13, marginLeft: 4 }}>›</span>
              </div>
              <div className="prog-wrap"><div className="prog-fill" style={{ width: `${pct}%`, background: col }} /></div>
              <div style={{ fontSize: 11, color: 'var(--txt2)', marginTop: 4, fontWeight: 600 }}>
                {sRecs.filter(r=>r.done).length}/{sRecs.length} 세션 완료
              </div>
            </div>
          );
        })}

        {/* 주간 막대 */}
        {period !== 'today' && (
          <>
            <div className="sec">일별 공부 현황</div>
            <div className="card" style={{ padding: 12 }}>
              <div className="week-bar-wrap">
                {weekData.map((d, i) => (
                  <div key={i} className="week-bar-col">
                    <div style={{ fontSize: 9, color: d.isToday ? 'var(--pk)' : 'var(--txt3)', fontWeight: 700 }}>{d.val ? Math.round(d.val/60)+'m' : ''}</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                      <div style={{ width: '100%', borderRadius: '5px 5px 0 0', background: d.isToday ? 'var(--pk)' : 'var(--sky2)', height: `${Math.round(d.val/maxBar*60)}px`, minHeight: d.val > 0 ? 4 : 0, transition: 'height .5s ease' }} />
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: d.isToday ? 'var(--pk)' : 'var(--txt2)' }}>{d.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
