import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getDDay } from '../utils/constants';

const WDAYS = ['일','월','화','수','목','금','토'];

export default function CalendarScreen() {
  const { exams, addExam, updateExam, deleteExam, getRecordsByPeriod: getRecs, plans, savePlan } = useApp();
  const [viewDate, setViewDate] = useState(new Date());
  const [heatmap, setHeatmap]   = useState({});

  // 날짜 클릭 시트 (공부계획 + 시험 통합)
  const [daySheet, setDaySheet]   = useState(null); // { date: 'YYYY-MM-DD', d: number }
  const [planText, setPlanText]   = useState('');

  // 시험 추가/수정 모달
  const [showExamForm, setShowExamForm] = useState(false);
  const [editExam, setEditExam]         = useState(null);
  const [examForm, setExamForm]         = useState({ subject: '', date: '', memo: '' });

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    getRecs('month').then(recs => {
      const map = {};
      recs.forEach(r => { map[r.date] = (map[r.date]||0) + (r.duration||0); });
      setHeatmap(map);
    });
  }, [year, month]);

  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMon = new Date(year, month+1, 0).getDate();
  const maxStudy  = Math.max(...Object.values(heatmap), 1);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMon; d++) cells.push(d);

  const dateStr   = (d) => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const examsOn   = (ds) => exams.filter(e => e.date === ds);
  const planOn    = (ds) => plans[ds];
  const heatAlpha = (ds) => {
    const v = heatmap[ds] || 0;
    if (!v) return 0;
    return 0.18 + (v / maxStudy) * 0.72;
  };

  // 날짜 셀 클릭 → 하루 시트 오픈
  const openDaySheet = (d) => {
    const ds = dateStr(d);
    setDaySheet({ date: ds, d });
    setPlanText(plans[ds]?.content || '');
    setShowExamForm(false);
  };

  const closeDaySheet = () => { setDaySheet(null); setShowExamForm(false); };

  const handleSavePlan = async () => {
    if (!daySheet) return;
    await savePlan(daySheet.date, planText);
    setDaySheet(null);
  };

  // 시험 폼 열기
  const openExamAdd = (date) => {
    setExamForm({ subject: '', date: date || today, memo: '' });
    setEditExam(null);
    setShowExamForm(true);
  };
  const openExamEdit = (exam) => {
    setExamForm({ subject: exam.subject, date: exam.date, memo: exam.memo||'' });
    setEditExam(exam);
    setShowExamForm(true);
  };
  const handleSaveExam = async () => {
    if (!examForm.subject.trim() || !examForm.date) return;
    if (editExam) await updateExam(editExam.id, examForm);
    else await addExam(examForm);
    setShowExamForm(false);
  };

  const upcoming = exams.filter(e => getDDay(e.date) >= 0).slice(0, 5);

  // 날짜 레이블: "5월 20일 (화)"
  const dayLabel = (ds) => {
    if (!ds) return '';
    const [y, m, d] = ds.split('-').map(Number);
    const dt = new Date(y, m-1, d);
    return `${m}월 ${d}일 (${WDAYS[dt.getDay()]})`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="hdr">
        <span className="hdr-title">📅 캘린더</span>
        <button className="btn btn-p btn-sm" onClick={() => openExamAdd(today)}>+ 시험추가</button>
      </div>
      <div className="scroll">

        {/* D-Day 목록 */}
        {upcoming.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div className="sec">다가오는 시험</div>
            {upcoming.map(exam => {
              const dd = getDDay(exam.date);
              return (
                <div key={exam.id} className="card card-tap" onClick={() => openExamEdit(exam)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', marginBottom: 8 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: dd===0?'#FFB4B4':dd<=3?'#FFD4B4':'var(--sky2)', display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <div style={{ fontSize:11, fontWeight:800, color: dd===0?'#C03040':dd<=3?'#904020':'#2060A0' }}>{dd===0?'D':'D-'}</div>
                    <div style={{ fontSize:16, fontWeight:900, color: dd===0?'#C03040':dd<=3?'#904020':'#2060A0', lineHeight:1 }}>{dd===0?'DAY':dd}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight:800, fontSize:15 }}>{exam.subject}</div>
                    <div style={{ fontSize:11, color:'var(--txt2)', fontWeight:600 }}>{exam.date}{exam.memo && ` · ${exam.memo}`}</div>
                  </div>
                  <span style={{ color:'var(--txt3)', fontSize:14 }}>›</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 달력 ── */}
        <div className="card" style={{ marginBottom: 12, padding: '12px 10px' }}>
          {/* 헤더 */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, padding:'0 2px' }}>
            <button className="btn btn-s btn-sm" onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1))}>‹</button>
            <span style={{ fontWeight:800, fontSize:15 }}>{year}년 {month+1}월</span>
            <button className="btn btn-s btn-sm" onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1))}>›</button>
          </div>

          {/* 요일 헤더 */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:3 }}>
            {WDAYS.map((d,i) => (
              <div key={d} style={{ textAlign:'center', fontSize:9, fontWeight:800, padding:'2px 0', color: i===0?'var(--pk)':i===6?'var(--sky)':'var(--txt3)' }}>{d}</div>
            ))}
          </div>

          {/* 날짜 셀 */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
            {cells.map((d, idx) => {
              if (!d) return <div key={idx} />;
              const ds      = dateStr(d);
              const eList   = examsOn(ds);
              const plan    = planOn(ds);
              const isT     = ds === today;
              const isSun   = idx % 7 === 0;
              const isSat   = idx % 7 === 6;
              const alpha   = heatAlpha(ds);
              const hasPlan = !!plan;

              return (
                <div key={ds} onClick={() => openDaySheet(d)}
                  style={{
                    minHeight: 52,
                    display:'flex', flexDirection:'column', alignItems:'center',
                    borderRadius: 8,
                    background: eList.length ? 'rgba(255,180,180,.28)'
                               : hasPlan     ? 'rgba(168,230,168,.35)'
                               : alpha > 0   ? `rgba(126,184,247,${alpha.toFixed(2)})`
                               : 'transparent',
                    border: isT ? '2px solid var(--pk)' : '2px solid transparent',
                    cursor: 'pointer',
                    padding: '4px 2px 3px',
                  }}>
                  <span style={{ fontSize:11, fontWeight:isT?900:700,
                    color: eList.length?'#C03040': isSun?'var(--pk)': isSat?'var(--sky)':'var(--txt)' }}>
                    {d}
                  </span>
                  {eList.length > 0 && (
                    <div style={{ width:4, height:4, borderRadius:'50%', background:'#FF6080', marginTop:1, flexShrink:0 }} />
                  )}
                  {hasPlan && (
                    <div style={{
                      fontSize: 7.5, fontWeight: 700,
                      color: '#2a7a2a',
                      lineHeight: 1.3,
                      marginTop: 2,
                      width: '100%',
                      textAlign: 'center',
                      padding: '0 1px',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      wordBreak: 'break-all',
                    }}>
                      {plan.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 범례 */}
          <div style={{ display:'flex', gap:10, marginTop:10, justifyContent:'flex-end', alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:8,height:8,borderRadius:'50%',background:'#FF6080' }}/><span style={{ fontSize:9,color:'var(--txt2)',fontWeight:700 }}>시험</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:10,height:10,borderRadius:3,background:'rgba(168,230,168,.6)' }}/><span style={{ fontSize:9,color:'var(--txt2)',fontWeight:700 }}>계획</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:3 }}>
              {[.2,.5,.9].map(a=><div key={a} style={{ width:10,height:10,borderRadius:3,background:`rgba(126,184,247,${a})` }} />)}
              <span style={{ fontSize:9,color:'var(--txt2)',fontWeight:700 }}>공부량</span>
            </div>
          </div>
        </div>

        {/* 전체 시험 목록 */}
        <div className="sec">전체 시험 일정</div>
        {exams.length === 0 ? (
          <div className="card" style={{ textAlign:'center', padding:20, color:'var(--txt3)', fontWeight:700 }}>시험 일정을 추가해보세요 📝</div>
        ) : exams.map(exam => {
          const dd = getDDay(exam.date);
          const past = dd < 0;
          return (
            <div key={exam.id} className="card card-tap" onClick={() => openExamEdit(exam)}
              style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, opacity: past?0.5:1 }}>
              <span style={{ fontSize:22 }}>📝</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:14 }}>{exam.subject}</div>
                <div style={{ fontSize:11, color:'var(--txt2)', fontWeight:600 }}>{exam.date}{exam.memo && ` · ${exam.memo}`}</div>
              </div>
              <div style={{ padding:'3px 10px', borderRadius:12, fontWeight:800, fontSize:12, background: past?'#F0F0F0':dd<=3?'#FFD4B4':'var(--sky2)', color: past?'#AAA':dd<=3?'#904020':'#2060A0' }}>
                {past?'종료':dd===0?'D-DAY':`D-${dd}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 하루 공부계획 시트 ── */}
      {daySheet && !showExamForm && (
        <div className="ov show" onClick={closeDaySheet}>
          <div className="sheet" onClick={e=>e.stopPropagation()} style={{ paddingBottom: 20 }}>
            <div className="hdl" />

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight:900, fontSize:16 }}>
                  {daySheet.date === today ? '📌 오늘 ' : '📅 '}{dayLabel(daySheet.date)}
                </div>
                {examsOn(daySheet.date).map(e => (
                  <div key={e.id} style={{ fontSize:11, color:'#C03040', fontWeight:700, marginTop:2 }}>
                    🔴 {e.subject}{e.memo ? ` · ${e.memo}` : ''}
                  </div>
                ))}
              </div>
              <button className="btn btn-s btn-sm" style={{ fontSize:11 }}
                onClick={() => openExamAdd(daySheet.date)}>
                + 시험
              </button>
            </div>

            <div className="sec" style={{ marginBottom: 6 }}>📝 공부 계획</div>
            <textarea
              className="inp"
              placeholder={"예) 국어 3시간, 수학 2시간, 수행준비\n자유롭게 적어보세요!"}
              value={planText}
              onChange={e => setPlanText(e.target.value)}
              rows={4}
              style={{
                marginBottom: 14, resize: 'none', fontFamily: 'inherit',
                lineHeight: 1.6, fontSize: 14,
              }}
            />

            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-s" style={{ flex:1 }} onClick={closeDaySheet}>취소</button>
              <button className="btn btn-p" style={{ flex:2 }} onClick={handleSavePlan}>
                {plans[daySheet.date] ? '수정하기' : '저장하기'}
              </button>
            </div>

            {plans[daySheet.date] && (
              <button className="btn btn-r" style={{ width:'100%', marginTop:8, fontSize:13 }}
                onClick={async () => { await savePlan(daySheet.date, ''); setDaySheet(null); }}>
                계획 삭제
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 시험 추가/수정 폼 ── */}
      {showExamForm && (
        <div className="ov show" onClick={() => setShowExamForm(false)}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <div className="hdl" />
            <div style={{ fontWeight:900, fontSize:16, marginBottom:12 }}>{editExam ? '✏️ 시험 수정' : '📅 시험 추가'}</div>
            <div className="sec">과목명</div>
            <input className="inp" placeholder="예: 수학 중간고사" value={examForm.subject} onChange={e=>setExamForm(p=>({...p,subject:e.target.value}))} style={{ marginBottom:10 }} />
            <div className="sec">날짜</div>
            <input className="inp" type="date" value={examForm.date} onChange={e=>setExamForm(p=>({...p,date:e.target.value}))} style={{ marginBottom:10 }} />
            <div className="sec">메모 (선택)</div>
            <input className="inp" placeholder="예: 3단원까지, 서술형 포함" value={examForm.memo} onChange={e=>setExamForm(p=>({...p,memo:e.target.value}))} maxLength={50} style={{ marginBottom:16 }} />
            <div style={{ display:'flex', gap:8 }}>
              {editExam && <button className="btn btn-r btn-sm" onClick={()=>{deleteExam(editExam.id);setShowExamForm(false);}}>삭제</button>}
              <button className="btn btn-s" style={{ flex:1 }} onClick={()=>setShowExamForm(false)}>취소</button>
              <button className="btn btn-p" style={{ flex:1 }} onClick={handleSaveExam} disabled={!examForm.subject.trim()||!examForm.date}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
