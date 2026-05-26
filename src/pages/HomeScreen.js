import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDuration, getDDay } from '../utils/constants';

export default function HomeScreen({ onStartStudy, onMember }) {
  const { user, members, records, subjects, exams, saveMotto, isAdmin } = useApp();
  const [editMotto, setEditMotto] = useState(false);
  const [mottoInput, setMottoInput] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const myRecs = records.filter(r => r.userId === user?.id);
  const myTotal = myRecs.reduce((s, r) => s + (r.duration || 0), 0);

  const upcoming = exams.filter(e => getDDay(e.date) >= 0).slice(0, 3);

  const myMember = members.find(m => m.id === user?.id);
  const motto = (myMember?.mottoDate === today) ? myMember?.motto : '';

  const handleSaveMotto = async () => {
    await saveMotto(mottoInput.trim());
    setEditMotto(false);
  };

  return (
    <div className="scroll">
      {/* 헤더 배너 */}
      <div style={{ background: 'linear-gradient(135deg,#FFB4B4,#D4B4FF,#B4D4FF)', borderRadius: 18, padding: 18, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -8, right: -8, fontSize: 72, opacity: .18 }}>{user?.emoji}</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', textShadow: '0 2px 8px rgba(100,40,70,.2)' }}>
          안녕, {user?.emoji} {user?.name}!{isAdmin && ' 👑'}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', marginTop: 3, fontWeight: 700 }}>
          {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
        {/* 다짐 */}
        <div style={{ marginTop: 12 }}>
          {editMotto ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={mottoInput} onChange={e => setMottoInput(e.target.value)} maxLength={40}
                placeholder="오늘의 다짐..."
                style={{ flex: 1, padding: '7px 11px', borderRadius: 9, border: '2px solid rgba(255,255,255,.6)', background: 'rgba(255,255,255,.25)', color: '#fff', fontSize: 12, fontWeight: 700, outline: 'none', fontFamily: 'Nunito' }} />
              <button onClick={handleSaveMotto} style={{ padding: '6px 12px', borderRadius: 9, border: 'none', background: 'rgba(255,255,255,.3)', color: '#fff', fontFamily: 'Nunito', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>저장</button>
              <button onClick={() => setEditMotto(false)} style={{ padding: '6px 10px', borderRadius: 9, border: 'none', background: 'rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer', fontFamily: 'Nunito' }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              onClick={() => { setMottoInput(motto || ''); setEditMotto(true); }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,.9)', fontWeight: 700, fontStyle: motto ? 'normal' : 'italic' }}>
                {motto || '오늘의 다짐을 입력해요 ✨'}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>✏️</span>
            </div>
          )}
        </div>
      </div>

      {/* D-Day */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div className="sec">📅 다가오는 시험</div>
          {upcoming.map(exam => {
            const dd = getDDay(exam.date);
            return (
              <div key={exam.id} className="card" style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{exam.subject}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt2)', fontWeight: 600 }}>{exam.date}{exam.memo && ` · ${exam.memo}`}</div>
                </div>
                <div style={{ padding: '5px 14px', borderRadius: 20, background: dd === 0 ? '#FFB4B4' : dd <= 3 ? '#FFD4B4' : 'var(--sky2)', color: dd === 0 ? '#C03040' : dd <= 3 ? '#904020' : '#2060A0', fontWeight: 900, fontSize: 15 }}>
                  {dd === 0 ? 'D-DAY' : `D-${dd}`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 오늘 내 공부 */}
      <div style={{ marginBottom: 12 }}>
        <div className="sec">오늘 내 공부</div>
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--txt)' }}>{formatDuration(myTotal)}</span>
            <span style={{ fontSize: 12, color: 'var(--txt2)', fontWeight: 700 }}>{myRecs.length}회 완료</span>
          </div>
          {myRecs.length === 0 ? (
            <p style={{ color: 'var(--txt3)', fontSize: 13, fontWeight: 700 }}>아직 공부 기록이 없어요 💪</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {myRecs.map(r => {
                const s = subjects.find(x => x.id === r.subjId) || subjects[0];
                return (
                  <span key={r.id} style={{ background: s.bg, color: s.color, border: `1.5px solid ${s.color}`, borderRadius: 20, padding: '2px 9px', fontSize: 12, fontWeight: 800 }}>
                    {s.emoji} {s.label} {formatDuration(r.duration)}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 과목 바로시작 */}
      <div style={{ marginBottom: 12 }}>
        <div className="sec">과목 바로시작</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
          {subjects.map(s => (
            <button key={s.id} onClick={() => onStartStudy(s.id)}
              style={{ background: s.bg, border: `1.5px solid ${s.color}`, borderRadius: 12, padding: '12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all .15s' }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(.96)'}
              onMouseUp={e => e.currentTarget.style.transform = ''}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(.96)'}
              onTouchEnd={e => setTimeout(() => { if (e.currentTarget) e.currentTarget.style.transform = ''; }, 150)}>
              <span style={{ fontSize: 22 }}>{s.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--txt)' }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 가족 현황 */}
      <div>
        <div className="sec">우리 가족 오늘</div>
        {members.map(m => {
          const mRecs = records.filter(r => r.userId === m.id);
          const mTotal = mRecs.reduce((s, r) => s + (r.duration || 0), 0);
          const mMotto = m.mottoDate === today ? m.motto : '';
          return (
            <div key={m.id} className="card card-tap" onClick={() => onMember(m)} style={{ padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#FFE0F0,#E0E8FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{m.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{m.name}{m.id === user?.id ? ' (나)' : ''}{m.name === '엄마' ? ' 👑' : ''}</div>
                {mMotto && <div style={{ fontSize: 11, color: 'var(--txt2)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>💬 {mMotto}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 900, fontSize: 15, color: mTotal > 0 ? 'var(--pk)' : 'var(--txt3)' }}>{formatDuration(mTotal)}</div>
                <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700 }}>{mRecs.length}회 ›</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
