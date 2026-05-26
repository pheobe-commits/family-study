import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AVATARS } from '../utils/constants';

export default function LoginScreen() {
  const { login, toast } = useApp();
  const [step, setStep]   = useState('welcome');
  const [emoji, setEmoji] = useState('🐱');
  const [name, setName]   = useState('');
  const [code, setCode]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return toast('이름을 입력해주세요!');
    setLoading(true);
    try { await login(emoji, name.trim(), 'create'); }
    catch (e) { toast('오류: ' + e.message); }
    finally { setLoading(false); }
  };

  const handleJoin = async () => {
    if (!name.trim()) return toast('이름을 입력해주세요!');
    if (code.length !== 3) return toast('3자리 코드를 입력해주세요!');
    setLoading(true);
    try { await login(emoji, name.trim(), 'join', code); }
    catch (e) { toast(e.message); }
    finally { setLoading(false); }
  };

  if (step === 'welcome') return (
    <div className="login-wrap">
      <div style={{ fontSize: 64, marginBottom: 10 }}>📚</div>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--txt)', marginBottom: 4 }}>우리가족 공부방</h1>
      <p style={{ color: 'var(--txt2)', fontSize: 14, fontWeight: 700, marginBottom: 36 }}>가족과 함께 공부해요 ✨</p>
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn btn-p btn-full" style={{ padding: '14px' }} onClick={() => setStep('create')}>🏠 새 가족방 만들기</button>
        <button className="btn btn-s btn-full" style={{ padding: '14px' }} onClick={() => setStep('join')}>🔑 가족방 참여하기</button>
      </div>
      <p style={{ color: 'var(--txt3)', fontSize: 11, fontWeight: 700, marginTop: 28 }}>이름 "엄마" 로 가입 시 관리자 권한 👑</p>
    </div>
  );

  const isJoin = step === 'join';
  return (
    <div className="login-wrap" style={{ justifyContent: 'flex-start', paddingTop: 32 }}>
      <button className="back" onClick={() => setStep('welcome')} style={{ marginBottom: 20, alignSelf: 'flex-start' }}>←</button>
      <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>{isJoin ? '🔑 가족방 참여' : '🏠 새 가족방 만들기'}</h2>
      <p style={{ color: 'var(--txt2)', fontSize: 13, fontWeight: 700, marginBottom: 24 }}>{isJoin ? '초대코드로 가족방에 입장해요' : '새로운 가족방을 시작해요'}</p>

      <div style={{ width: '100%', marginBottom: 16 }}>
        <div className="sec">내 캐릭터 선택</div>
        <div className="emoji-grid">
          {AVATARS.map(e => (
            <div key={e} className={`emoji-opt ${emoji === e ? 'sel' : ''}`} onClick={() => setEmoji(e)}>{e}</div>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', marginBottom: 14 }}>
        <div className="sec">이름</div>
        <input className="inp" placeholder="이름을 입력해주세요" value={name} onChange={e => setName(e.target.value)} maxLength={10} />
      </div>

      {isJoin && (
        <div style={{ width: '100%', marginBottom: 14 }}>
          <div className="sec">가족 코드 (3자리)</div>
          <input className="inp" placeholder="A3K" value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={3}
            style={{ textAlign: 'center', fontSize: 24, fontWeight: 900, letterSpacing: '.3em' }} />
        </div>
      )}

      <button className="btn btn-p btn-full" style={{ width: '100%', padding: '14px', marginTop: 8 }}
        onClick={isJoin ? handleJoin : handleCreate} disabled={loading}>
        {loading ? '⏳ 처리 중...' : isJoin ? '🚀 참여하기' : '✨ 만들기'}
      </button>
    </div>
  );
}
