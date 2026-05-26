import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDuration, formatTimeAgo, getMat, QUICK_CHEERS } from '../utils/constants';

export default function FamilyScreen({ initialMember, onBack }) {
  const { user, isAdmin, members, records, subjects, cheers, unread, markCheersRead, sendCheer, updateRecord, deleteRecord, toast } = useApp();
  const [view, setView]         = useState(initialMember ? 'detail' : 'list');
  const [selMember, setSelMember] = useState(initialMember || null);
  const [showCheers, setShowCheers] = useState(false);
  const [showCheerSend, setShowCheerSend] = useState(false);
  const [cheerMsg, setCheerMsg] = useState('');
  const [editRec, setEditRec]   = useState(null);
  const today = new Date().toISOString().split('T')[0];

  const openMember = (m) => { setSelMember(m); setView('detail'); };
  const openCheerBox = () => { setShowCheers(true); markCheersRead(); };

  const handleSendCheer = async (msg) => {
    if (!selMember) return;
    await sendCheer(selMember.id, selMember.name, msg);
    setShowCheerSend(false); setCheerMsg('');
  };

  const handleSaveRec = async () => {
    if (!editRec) return;
    await updateRecord(editRec.id, { detail: editRec.newDetail, progress: editRec.newProgress, duration: (parseInt(editRec.newMinutes)||0)*60, done: editRec.newDone });
    setEditRec(null);
  };
  const handleDelRec = async () => {
    if (!editRec) return;
    await deleteRecord(editRec.id);
    setEditRec(null);
  };

  // ── Member Detail ──
  if (view === 'detail' && selMember) {
    const isMe = selMember.id === user?.id;
    const canEdit = isAdmin || isMe;
    const mRecs = records.filter(r => r.userId === selMember.id);
    const total = mRecs.reduce((s, r) => s + (r.duration||0), 0);
    const mMotto = selMember.mottoDate === today ? selMember.motto : '';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div className="hdr">
          <button className="back" onClick={() => { setView('list'); if (onBack) onBack(); }}>←</button>
          <span className="hdr-title">{selMember.emoji} {selMember.name}</span>
          {selMember.name === '엄마' && <span className="crown">👑</span>}
        </div>
        <div className="scroll">
          <div className="card" style={{ textAlign: 'center', padding: 22, marginBottom: 12 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>{selMember.emoji}</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{selMember.name}{isMe ? ' (나)' : ''}</div>
            {mMotto && <div style={{ fontSize: 13, color: 'var(--txt2)', marginTop: 4, fontWeight: 600 }}>💬 {mMotto}</div>}
            <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--pk)', marginTop: 10 }}>{formatDuration(total)}</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', fontWeight: 700 }}>오늘 총 공부</div>
          </div>

          <div className="sec">
            오늘 공부 기록
            {canEdit && <span style={{ fontSize: 10, color: 'var(--pk)', fontWeight: 700, marginLeft: 6 }}>{isAdmin && !isMe ? '👑 관리자 수정 가능' : '✏️ 수정 가능'}</span>}
            {!canEdit && <span style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700, marginLeft: 6 }}>(보기만 가능)</span>}
          </div>

          {mRecs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 20, color: 'var(--txt3)', fontWeight: 700 }}>아직 공부 기록이 없어요 📭</div>
          ) : mRecs.map(r => {
            const s = subjects.find(x => x.id === r.subjId) || subjects[0];
            const ml = getMat(r.mat);
            return (
              <div key={r.id} className="card" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: canEdit ? 8 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 22 }}>{s.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{s.label} · {ml.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--txt2)' }}>{r.detail}{r.progress ? ` → ${r.progress}` : ''}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`bdg ${r.done ? 'bdone' : 'bmiss'}`}>{r.done ? '완료' : '미달성'}</span>
                    <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>{formatDuration(r.duration)}</div>
                  </div>
                </div>
                {canEdit && (
                  <div className="edit-row">
                    <button className="btn btn-s btn-sm" style={{ flex: 1 }}
                      onClick={() => setEditRec({ ...r, newDetail: r.detail||'', newProgress: r.progress||'', newMinutes: Math.floor(r.duration/60), newDone: r.done })}>
                      ✏️ 수정
                    </button>
                    <button className="btn btn-r btn-sm" onClick={() => deleteRecord(r.id)}>삭제</button>
                  </div>
                )}
              </div>
            );
          })}

          {!isMe && (
            <button className="btn btn-p btn-full" style={{ marginTop: 4 }} onClick={() => setShowCheerSend(true)}>
              💌 {selMember.name}에게 응원 보내기
            </button>
          )}
        </div>

        {/* 기록 수정 시트 */}
        {editRec && (
          <div className="ov show" onClick={() => setEditRec(null)}>
            <div className="sheet" onClick={e => e.stopPropagation()}>
              <div className="hdl" />
              <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 4 }}>✏️ 기록 수정{isAdmin && !isMe ? ' (관리자)' : ''}</div>
              <div className="sec">진도 내용</div>
              <input className="inp" value={editRec.newDetail} onChange={e=>setEditRec(p=>({...p,newDetail:e.target.value}))} style={{ marginBottom: 10 }} />
              <div className="sec">완료 진도</div>
              <input className="inp" placeholder="예: p.45~67 완료" value={editRec.newProgress} onChange={e=>setEditRec(p=>({...p,newProgress:e.target.value}))} style={{ marginBottom: 10 }} />
              <div className="sec">공부 시간 (분)</div>
              <input className="inp" type="number" value={editRec.newMinutes} onChange={e=>setEditRec(p=>({...p,newMinutes:e.target.value}))} style={{ marginBottom: 10 }} />
              <div className="sec">완료 여부</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button className="btn" style={{ flex:1, border:`2px solid ${editRec.newDone?'var(--mint)':'var(--bdr)'}`, background:editRec.newDone?'var(--mint3)':'var(--sur2)', color:editRec.newDone?'#1A7A40':'var(--txt2)' }} onClick={()=>setEditRec(p=>({...p,newDone:true}))}>✅ 완료</button>
                <button className="btn" style={{ flex:1, border:`2px solid ${!editRec.newDone?'#FFB4B4':'var(--bdr)'}`, background:!editRec.newDone?'#FFF0F0':'var(--sur2)', color:!editRec.newDone?'#D04040':'var(--txt2)' }} onClick={()=>setEditRec(p=>({...p,newDone:false}))}>❌ 미달성</button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-r btn-sm" onClick={handleDelRec}>🗑️ 삭제</button>
                <button className="btn btn-s" style={{ flex: 1 }} onClick={()=>setEditRec(null)}>취소</button>
                <button className="btn btn-p" style={{ flex: 1 }} onClick={handleSaveRec}>저장</button>
              </div>
            </div>
          </div>
        )}

        {/* 응원 보내기 */}
        {showCheerSend && (
          <div className="ov show" onClick={()=>setShowCheerSend(false)}>
            <div className="sheet" onClick={e=>e.stopPropagation()}>
              <div className="hdl" />
              <div style={{ fontSize: 16, fontWeight: 900, textAlign: 'center', marginBottom: 12 }}>💌 {selMember.name}에게 응원</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
                {QUICK_CHEERS.map(e => (
                  <button key={e} onClick={()=>handleSendCheer(e)} style={{ width:44,height:44,fontSize:22,borderRadius:10,border:'1.5px solid var(--bdr)',background:'var(--sur)',cursor:'pointer' }}>{e}</button>
                ))}
              </div>
              <input className="inp" placeholder="응원 메시지 (50자)" maxLength={50} value={cheerMsg} onChange={e=>setCheerMsg(e.target.value)} style={{ marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-s" style={{ flex:1 }} onClick={()=>setShowCheerSend(false)}>취소</button>
                <button className="btn btn-p" style={{ flex:1 }} onClick={()=>handleSendCheer(cheerMsg)} disabled={!cheerMsg.trim()}>보내기</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Family list ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="hdr">
        <span className="hdr-title">👨‍👩‍👧‍👦 가족</span>
        <button className="btn btn-s btn-sm" onClick={openCheerBox} style={{ position: 'relative' }}>
          💌 응원함
          {unread > 0 && <span style={{ position:'absolute', top:-4, right:-4, background:'var(--pk)', color:'#fff', borderRadius:9, fontSize:9, fontWeight:900, minWidth:15, height:15, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px', border:'1.5px solid #fff' }}>{unread}</span>}
        </button>
      </div>
      <div className="scroll">
        {members.map(m => {
          const mRecs = records.filter(r => r.userId === m.id);
          const total = mRecs.reduce((s,r) => s+(r.duration||0), 0);
          const isMe  = m.id === user?.id;
          return (
            <div key={m.id} className="card card-tap" onClick={()=>openMember(m)} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#FFE0F0,#E0E8FF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>{m.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight:800, fontSize:15 }}>{m.name}{isMe?' (나)':''}{m.name==='엄마'?' 👑':''}</div>
                  <div style={{ fontSize:11, color:'var(--txt2)', fontWeight:600, marginTop:1 }}>💬 {m.motto || '오늘도 화이팅!'}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontWeight:900, fontSize:16, color:'var(--pk)' }}>{formatDuration(total)}</div>
                  <div style={{ fontSize:10, color:'var(--txt3)' }}>›</div>
                </div>
              </div>
              {mRecs.map(r => {
                const s  = subjects.find(x=>x.id===r.subjId)||subjects[0];
                const ml = getMat(r.mat);
                return (
                  <div key={r.id} style={{ background:'var(--sur2)', borderRadius:9, padding:'7px 10px', display:'flex', alignItems:'center', gap:8, marginBottom:4, border:'1px solid var(--bdr)' }}>
                    <span style={{ fontSize:15 }}>{s.emoji}</span>
                    <span style={{ flex:1, fontWeight:700, fontSize:12 }}>{s.label} · {ml.label}</span>
                    <span style={{ fontSize:11, color:'var(--txt2)' }}>{r.detail}</span>
                    <span className={`bdg ${r.done?'bdone':'bmiss'}`}>{r.done?'완료':'미달성'}</span>
                  </div>
                );
              })}
              {!isMe && <button className="btn btn-s btn-sm btn-full" style={{ marginTop:6 }} onClick={e=>{e.stopPropagation();setSelMember(m);setShowCheerSend(true);}}>💌 응원하기</button>}
            </div>
          );
        })}
      </div>

      {/* 응원함 */}
      {showCheers && (
        <div className="ov show" onClick={()=>setShowCheers(false)}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <div className="hdl" />
            <div style={{ fontWeight:900, fontSize:16, marginBottom:12 }}>💌 받은 응원함</div>
            {cheers.length === 0 ? (
              <div style={{ textAlign:'center', padding:24, color:'var(--txt3)', fontWeight:700 }}>아직 받은 응원이 없어요</div>
            ) : cheers.map(c => (
              <div key={c.id} style={{ background: c.read ? 'var(--sur2)' : '#FFF0F5', borderRadius:12, padding:'11px 13px', border:`1.5px solid ${c.read ? 'var(--bdr)' : 'var(--pk2)'}`, marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontWeight:800, fontSize:13 }}>{c.fromEmoji} {c.fromName}</span>
                  <span style={{ fontSize:11, color:'var(--txt3)', fontWeight:600 }}>{formatTimeAgo(c.createdAt)}</span>
                </div>
                <div style={{ fontSize:20, fontWeight:700 }}>{c.message}</div>
              </div>
            ))}
            <button className="btn btn-s btn-full" onClick={()=>setShowCheers(false)}>닫기</button>
          </div>
        </div>
      )}

      {showCheerSend && selMember && (
        <div className="ov show" onClick={()=>setShowCheerSend(false)}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <div className="hdl" />
            <div style={{ fontSize:16, fontWeight:900, textAlign:'center', marginBottom:12 }}>💌 {selMember.name}에게 응원</div>
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:12 }}>
              {QUICK_CHEERS.map(e=><button key={e} onClick={()=>handleSendCheer(e)} style={{ width:44,height:44,fontSize:22,borderRadius:10,border:'1.5px solid var(--bdr)',background:'var(--sur)',cursor:'pointer' }}>{e}</button>)}
            </div>
            <input className="inp" placeholder="응원 메시지 (50자)" maxLength={50} value={cheerMsg} onChange={e=>setCheerMsg(e.target.value)} style={{ marginBottom:10 }} />
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-s" style={{ flex:1 }} onClick={()=>setShowCheerSend(false)}>취소</button>
              <button className="btn btn-p" style={{ flex:1 }} onClick={()=>handleSendCheer(cheerMsg)} disabled={!cheerMsg.trim()}>보내기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
