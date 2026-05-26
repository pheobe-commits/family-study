import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginScreen from './pages/LoginScreen';
import HomeScreen from './pages/HomeScreen';
import { StudyStartScreen, TimerScreen } from './pages/StudyScreens';
import StatsScreen from './pages/StatsScreen';
import FamilyScreen from './pages/FamilyScreen';
import CalendarScreen from './pages/CalendarScreen';
import SettingsScreen from './pages/SettingsScreen';
import ToastContainer from './components/ToastContainer';

const TAB_ICONS = { home: '🏠', stats: '📊', family: '👨‍👩‍👧', calendar: '📅', settings: '⚙️' };
const TABS = [
  { id: 'home',     label: '홈' },
  { id: 'stats',    label: '통계' },
  { id: 'family',   label: '가족' },
  { id: 'calendar', label: '캘린더' },
  { id: 'settings', label: '설정' },
];

// ── 시험 범위 설정 화면 (별도 컴포넌트로 분리 → Hook 규칙 준수) ──
function RangeScreen({ subj, onSave, onBack }) {
  const { ranges, saveRange } = useApp();
  const rf = ranges[subj.id] || {};
  const [form, setForm] = useState({
    tb: rf.tb||{}, lc: rf.lc||{}, wb: rf.wb||{}, sp: rf.sp||{}, err: rf.err||{}
  });
  const isMath = subj.id === 'da' || subj.id === 'st';
  const set = (mat, key, val) => setForm(p => ({ ...p, [mat]: { ...p[mat], [key]: val } }));
  const handleSave = async () => { await saveRange(subj.id, form); onSave(); };

  return (
    <div className="app">
      <ToastContainer />
      <div className="hdr">
        <button className="back" onClick={onBack}>←</button>
        <span className="hdr-title">{subj.emoji} {subj.label} · 시험 범위 설정</span>
      </div>
      <div className="scroll">
        {[['tb','📗','교과서',true,true,false],['lc','💻','인강',false,false,true],['wb','📝','문제집',false,true,false,true],['sp','📓','부교재',true,true,false]].map(([mid,em,lb,hasUnit,hasPage,hasLC,hasName]) => (
          <div key={mid} style={{ marginBottom: 12 }}>
            <div className="sec">{em} {lb}</div>
            <div className="card">
              {hasName && <><div style={{fontSize:11,fontWeight:800,color:'var(--txt2)',marginBottom:4}}>{lb}명</div><input className="inp" placeholder={lb+'명'} value={form[mid]?.name||''} onChange={e=>set(mid,'name',e.target.value)} style={{marginBottom:8}}/></>}
              {hasUnit && <><div style={{fontSize:11,fontWeight:800,color:'var(--txt2)',marginBottom:4}}>단원명</div><input className="inp" placeholder="단원명" value={form[mid]?.unit||''} onChange={e=>set(mid,'unit',e.target.value)} style={{marginBottom:8}}/></>}
              {hasLC && <><div style={{fontSize:11,fontWeight:800,color:'var(--txt2)',marginBottom:4}}>강의명</div><input className="inp" placeholder="강의명" value={form[mid]?.name||''} onChange={e=>set(mid,'name',e.target.value)} style={{marginBottom:8}}/><div style={{fontSize:11,fontWeight:800,color:'var(--txt2)',marginBottom:4}}>목표 회차</div><input className="inp" placeholder="15강" value={form[mid]?.num||''} onChange={e=>set(mid,'num',e.target.value)}/></>}
              {hasPage && (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <div><div style={{fontSize:11,fontWeight:800,color:'var(--txt2)',marginBottom:4}}>시작</div><input className="inp" type="number" placeholder="1" value={form[mid]?.s||''} onChange={e=>set(mid,'s',e.target.value)}/></div>
                  <div><div style={{fontSize:11,fontWeight:800,color:'var(--txt2)',marginBottom:4}}>끝</div><input className="inp" type="number" placeholder="50" value={form[mid]?.e||''} onChange={e=>set(mid,'e',e.target.value)}/></div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isMath && (
          <div style={{ marginBottom: 12 }}>
            <div className="sec">✏️ 오답노트</div>
            <div className="card"><input className="inp" placeholder="단원명 (예: 2단원 수열)" value={form.err?.unit||''} onChange={e=>set('err','unit',e.target.value)}/></div>
          </div>
        )}
        <button className="btn btn-p btn-full" onClick={handleSave}>저장하기</button>
        <button className="btn btn-s btn-full" onClick={onBack}>취소</button>
      </div>
    </div>
  );
}

function MainApp() {
  const { user, session, unread } = useApp();
  const [tab, setTab]             = useState('home');
  const [subScreen, setSubScreen] = useState(null);
  const [initMember, setInitMember] = useState(null);

  if (!user) return <LoginScreen />;
  if (session) return <TimerScreen />;

  if (subScreen?.type === 'range') {
    return (
      <RangeScreen
        subj={subScreen.subj}
        onSave={() => setSubScreen(null)}
        onBack={() => setSubScreen(null)}
      />
    );
  }

  if (subScreen?.type === 'study-start') {
    return (
      <div className="app">
        <ToastContainer />
        <StudyStartScreen
          initialSubjId={subScreen.subjId}
          onBack={() => setSubScreen(null)}
          onStarted={() => setSubScreen(null)}
        />
      </div>
    );
  }

  const goTab = (t) => { setTab(t); setInitMember(null); };

  const renderScreen = () => {
    switch (tab) {
      case 'home':
        return (
          <HomeScreen
            onStartStudy={(subjId) => setSubScreen({ type: 'study-start', subjId })}
            onMember={(m) => { setInitMember(m); setTab('family'); }}
          />
        );
      case 'stats':
        return <StatsScreen />;
      case 'family':
        return (
          <FamilyScreen
            initialMember={initMember}
            onBack={() => setInitMember(null)}
          />
        );
      case 'calendar':
        return <CalendarScreen />;
      case 'settings':
        return <SettingsScreen onOpenRange={(s) => setSubScreen({ type: 'range', subj: s })} />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <ToastContainer />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {renderScreen()}
      </div>
      <nav className="tabbar">
        {TABS.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => goTab(t.id)}>
            <div className="tab-bubble">
              <span style={{ fontSize: 21 }}>{tab === t.id ? user.emoji : TAB_ICONS[t.id]}</span>
              {t.id === 'family' && unread > 0 && <div className="tab-badge">{unread}</div>}
            </div>
            <span style={{ fontSize: 9, fontWeight: 800, marginTop: 1 }}>{t.label}</span>
            <div className="tab-dot" />
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
