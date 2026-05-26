import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DEFAULT_SUBJECTS, getMats } from '../utils/constants';

export default function SettingsScreen({ onOpenRange }) {
  const { user, isAdmin, family, subjects, saveSubjects, logout, toast } = useApp();
  const [showAddSubj, setShowAddSubj]   = useState(false);
  const [showEditSubj, setShowEditSubj] = useState(false);
  const [editSubjIdx, setEditSubjIdx]   = useState(-1);
  const [newSubjName, setNewSubjName]   = useState('');
  const [editSubjName, setEditSubjName] = useState('');

  const handleAddSubj = async () => {
    if (!newSubjName.trim()) return toast('과목명을 입력해주세요!');
    const colors = ['#FFD4B4','#D4B4FF','#B4F0C8','#B4D4FF','#FFB4E8'];
    const bgs    = ['#FFF8F0','#F8F0FF','#F0FFF5','#F0F6FF','#FFF0FA'];
    const emojis = ['📚','✏️','📓','📋','📌'];
    const i = subjects.length % 5;
    const newS = { id: 'c_' + Date.now(), label: newSubjName.trim(), emoji: emojis[i], color: colors[i], bg: bgs[i] };
    await saveSubjects([...subjects, newS]);
    setNewSubjName(''); setShowAddSubj(false);
    toast('✅ ' + newS.label + ' 과목 추가됐어요!');
  };

  const handleSaveSubj = async () => {
    if (!editSubjName.trim()) return;
    const updated = subjects.map((s, i) => i === editSubjIdx ? { ...s, label: editSubjName.trim() } : s);
    await saveSubjects(updated);
    setShowEditSubj(false);
    toast('✅ 과목 수정됐어요!');
  };

  const handleDelSubj = async () => {
    const updated = subjects.filter((_, i) => i !== editSubjIdx);
    await saveSubjects(updated);
    setShowEditSubj(false);
    toast('🗑️ 과목 삭제됐어요');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="hdr"><span className="hdr-title">⚙️ 설정</span></div>
      <div className="scroll">
        {/* 프로필 */}
        <div className="card" style={{ textAlign: 'center', padding: 24, marginBottom: 12 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>{user?.emoji}</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>{user?.name}</div>
          {isAdmin && <div style={{ marginTop: 4 }}><span className="crown">👑 관리자</span></div>}
          <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 6, fontWeight: 600 }}>우리가족 공부방</div>
        </div>

        {/* 가족 코드 */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="sec">가족 코드</div>
          <div style={{ textAlign: 'center', fontSize: 32, fontWeight: 900, letterSpacing: '.3em', padding: 14, background: 'var(--pk3)', borderRadius: 12, color: 'var(--txt)', border: '1.5px solid var(--bdr)' }}>
            {user?.familyId}
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt2)', textAlign: 'center', marginTop: 8, fontWeight: 600 }}>이 코드를 가족에게 공유해서 함께 공부해요 🏠</div>
        </div>

        {/* 과목별 시험 범위 설정 (모든 가족 가능) */}
        <div style={{ marginBottom: 12 }}>
          <div className="sec">📋 과목별 시험 범위 설정</div>
          {subjects.map(s => (
            <div key={s.id} className="card card-tap" onClick={() => onOpenRange(s)}
              style={{ border: `1.5px solid ${s.color}`, background: s.bg, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{s.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--txt2)', fontWeight: 600 }}>탭해서 범위 입력</div>
              </div>
              <span style={{ color: 'var(--txt3)', fontSize: 16 }}>›</span>
            </div>
          ))}
        </div>

        {/* 과목 관리 (모든 가족 가능) */}
        <div style={{ marginBottom: 12 }}>
          <div className="sec">과목 관리</div>
          {subjects.map((s, i) => (
            <div key={s.id} style={{ background: 'var(--sur2)', borderRadius: 10, padding: '9px 12px', marginBottom: 7, border: '1.5px solid var(--bdr)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{s.emoji}</span>
              <span style={{ flex: 1, fontWeight: 800, fontSize: 13 }}>{s.label}</span>
              <button className="btn btn-s btn-sm" onClick={() => { setEditSubjIdx(i); setEditSubjName(s.label); setShowEditSubj(true); }}>✏️</button>
              <button className="btn btn-r btn-sm" onClick={() => { setEditSubjIdx(i); handleDelSubj(); }}>🗑️</button>
            </div>
          ))}
          <button className="btn btn-s btn-full" onClick={() => setShowAddSubj(true)}>+ 과목 추가하기</button>
        </div>

        {/* 관리자 전용 메뉴 */}
        {isAdmin && (
          <div className="card" style={{ marginBottom: 12, border: '1.5px solid var(--pk2)' }}>
            <div className="sec" style={{ color: 'var(--pk)' }}>👑 관리자 전용</div>
            <button className="btn btn-s btn-full btn-sm" onClick={() => toast('📊 통계 내보내기 기능은 실제 앱에서!')}>📊 가족 전체 통계 내보내기</button>
            <button className="btn btn-s btn-full btn-sm" style={{ marginBottom: 0 }} onClick={() => toast('🔔 알림 설정 기능은 실제 앱에서!')}>🔔 알림 설정</button>
          </div>
        )}

        <button className="btn btn-r btn-full" onClick={logout}>👋 로그아웃</button>
      </div>

      {/* 과목 추가 시트 */}
      {showAddSubj && (
        <div className="ov show" onClick={() => setShowAddSubj(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="hdl" />
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 12 }}>✏️ 과목 추가</div>
            <div className="sec">과목명</div>
            <input className="inp" placeholder="예: 도덕, 음악, 미술" value={newSubjName} onChange={e => setNewSubjName(e.target.value)} maxLength={10} style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-s" style={{ flex: 1 }} onClick={() => setShowAddSubj(false)}>취소</button>
              <button className="btn btn-p" style={{ flex: 1 }} onClick={handleAddSubj}>추가</button>
            </div>
          </div>
        </div>
      )}

      {/* 과목 수정 시트 */}
      {showEditSubj && (
        <div className="ov show" onClick={() => setShowEditSubj(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="hdl" />
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 12 }}>✏️ 과목 수정</div>
            <div className="sec">과목명</div>
            <input className="inp" value={editSubjName} onChange={e => setEditSubjName(e.target.value)} maxLength={10} style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-r btn-sm" onClick={handleDelSubj}>삭제</button>
              <button className="btn btn-s" style={{ flex: 1 }} onClick={() => setShowEditSubj(false)}>취소</button>
              <button className="btn btn-p" style={{ flex: 1 }} onClick={handleSaveSubj}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
