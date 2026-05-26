import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection, doc, setDoc, getDoc, updateDoc, addDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { todayKey, generateCode, DEFAULT_SUBJECTS } from '../utils/constants';

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser]           = useState(() => { try { return JSON.parse(localStorage.getItem('fs_user')); } catch { return null; } });
  const [family, setFamily]       = useState(null);
  const [members, setMembers]     = useState([]);
  const [records, setRecords]     = useState([]);
  const [subjects, setSubjects]   = useState(() => { try { return JSON.parse(localStorage.getItem('fs_subjects')) || DEFAULT_SUBJECTS; } catch { return DEFAULT_SUBJECTS; } });
  const [ranges, setRanges]       = useState({});
  const [exams, setExams]         = useState([]);
  const [cheers, setCheers]       = useState([]);
  const [unread, setUnread]       = useState(0);
  const [session, setSession]     = useState(() => { try { return JSON.parse(localStorage.getItem('fs_session')); } catch { return null; } });
  const [toasts, setToasts]       = useState([]);
  const [plans, setPlans]         = useState({});   // date(YYYY-MM-DD) -> { id, content }
  const isAdmin = user?.name === '엄마';

  useEffect(() => {
    if (user) localStorage.setItem('fs_user', JSON.stringify(user));
    else localStorage.removeItem('fs_user');
  }, [user]);

  useEffect(() => {
    if (session) localStorage.setItem('fs_session', JSON.stringify(session));
    else localStorage.removeItem('fs_session');
  }, [session]);

  useEffect(() => {
    localStorage.setItem('fs_subjects', JSON.stringify(subjects));
  }, [subjects]);

  const toast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);

  useEffect(() => {
    if (!user?.familyId) return;
    const fid = user.familyId;
    const unsubs = [];

    unsubs.push(onSnapshot(doc(db, 'families', fid), snap => {
      if (snap.exists()) {
        const d = snap.data();
        setFamily({ id: snap.id, ...d });
        if (d.subjects) setSubjects(d.subjects);
        if (d.ranges) setRanges(d.ranges);
      }
    }));

    unsubs.push(onSnapshot(query(collection(db, 'users'), where('familyId', '==', fid)), snap => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }));

    unsubs.push(onSnapshot(
      query(collection(db, 'records'), where('familyId', '==', fid), where('date', '==', todayKey())),
      snap => setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    ));

    unsubs.push(onSnapshot(query(collection(db, 'exams'), where('familyId', '==', fid)), snap => {
      setExams(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.date.localeCompare(b.date)));
    }));

    // 공부 계획 리스너 (내 계획만)
    if (user.id) {
      unsubs.push(onSnapshot(
        query(collection(db, 'studyPlans'), where('familyId', '==', fid), where('userId', '==', user.id)),
        snap => {
          const map = {};
          snap.docs.forEach(d => { map[d.data().date] = { id: d.id, ...d.data() }; });
          setPlans(map);
        }
      ));
    }

    if (user.id) {
      unsubs.push(onSnapshot(
        query(collection(db, 'cheers'), where('toId', '==', user.id)),
        snap => {
          const items = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => {
              const at = a.createdAt?.toMillis?.() || 0;
              const bt = b.createdAt?.toMillis?.() || 0;
              return bt - at;
            })
            .slice(0, 50);
          setCheers(items);
          const u = items.filter(c => !c.read).length;
          setUnread(u);
          if (u > 0) {
            const newest = items.find(c => !c.read);
            if (newest) toast(`💌 ${newest.fromName}님의 응원이 도착했어요!`, 'cheer');
          }
        }
      ));
    }

    return () => unsubs.forEach(u => u());
  }, [user?.familyId, user?.id]);

  // ── Auth ──
  const login = async (emoji, name, action, code) => {
    const userId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (action === 'create') {
      const famCode = generateCode();
      await setDoc(doc(db, 'families', famCode), {
        code: famCode, ownerName: name, createdAt: serverTimestamp(),
        subjects: DEFAULT_SUBJECTS, ranges: {},
      });
      const userData = { id: userId, emoji, name, familyId: famCode, createdAt: serverTimestamp() };
      await setDoc(doc(db, 'users', userId), userData);
      setUser({ id: userId, emoji, name, familyId: famCode });
      toast(`🎉 가족방이 만들어졌어요! 코드: ${famCode}`);
      return { ok: true, code: famCode };
    } else {
      const famRef = doc(db, 'families', code.toUpperCase());
      const snap = await getDoc(famRef);
      if (!snap.exists()) throw new Error('가족 코드를 찾을 수 없어요');
      const userData = { id: userId, emoji, name, familyId: code.toUpperCase(), createdAt: serverTimestamp() };
      await setDoc(doc(db, 'users', userId), userData);
      setUser({ id: userId, emoji, name, familyId: code.toUpperCase() });
      toast('🏠 가족방에 참여했어요!');
      return { ok: true };
    }
  };

  const logout = () => {
    setUser(null); setFamily(null); setMembers([]); setRecords([]);
    setExams([]); setCheers([]); setSession(null); setPlans({});
    localStorage.clear();
  };

  const saveSubjects = async (newSubjs) => {
    setSubjects(newSubjs);
    if (user?.familyId) await updateDoc(doc(db, 'families', user.familyId), { subjects: newSubjs });
  };

  const saveRange = async (subjId, range) => {
    const newRanges = { ...ranges, [subjId]: range };
    setRanges(newRanges);
    if (user?.familyId) await updateDoc(doc(db, 'families', user.familyId), { ranges: newRanges });
    toast('📋 시험 범위 저장됐어요!');
  };

  const startStudy = (subjId, mat, detail, fields = {}) => {
    setSession({
      id: Date.now().toString(),
      userId: user.id, userName: user.name, userEmoji: user.emoji,
      familyId: user.familyId, subjId, mat, detail,
      pageS: fields.s || null,
      pageE: fields.e || null,
      lectureNum: fields.num || null,
      startMs: Date.now(), pausedMs: 0, pauseStart: null, paused: false, date: todayKey()
    });
  };

  const pauseStudy  = () => setSession(s => s ? { ...s, paused: true, pauseStart: Date.now() } : s);
  const resumeStudy = () => setSession(s => {
    if (!s || !s.paused) return s;
    return { ...s, paused: false, pausedMs: (s.pausedMs || 0) + Date.now() - s.pauseStart, pauseStart: null };
  });

  const getElapsed = useCallback(() => {
    if (!session) return 0;
    const now = Date.now();
    let paused = session.pausedMs || 0;
    if (session.paused && session.pauseStart) paused += now - session.pauseStart;
    return Math.floor((now - session.startMs - paused) / 1000);
  }, [session]);

  const finishStudy = async (progress, done) => {
    if (!session) return;
    const elapsed = getElapsed();
    const rec = {
      userId: user.id, userName: user.name, userEmoji: user.emoji,
      familyId: user.familyId, subjId: session.subjId, mat: session.mat,
      detail: session.detail || '', progress: progress || '',
      duration: elapsed, done: done !== false,
      pageS: session.pageS || null,
      pageE: session.pageE || null,
      lectureNum: session.lectureNum || null,
      startMs: session.startMs, date: session.date, createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'records'), rec);
    setSession(null);
    toast(done !== false ? `✅ ${Math.floor(elapsed/60)}분 공부 완료!` : '😅 미달성으로 저장됐어요');
  };

  const getRecordsByPeriod = useCallback(async (period, uid) => {
    const targetId = uid || user?.id;
    if (!targetId || !user?.familyId) return [];
    const today = new Date();
    let startDate;
    if (period === 'week') { startDate = new Date(today); startDate.setDate(today.getDate() - 6); }
    else if (period === 'month') { startDate = new Date(today.getFullYear(), today.getMonth(), 1); }
    else { startDate = today; }
    const startKey = startDate.toISOString().split('T')[0];
    const q = query(collection(db, 'records'), where('familyId', '==', user.familyId), where('userId', '==', targetId), where('date', '>=', startKey));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }, [user]);

  const getAllRecords = useCallback(async (uid) => {
    const targetId = uid || user?.id;
    if (!targetId || !user?.familyId) return [];
    const q = query(collection(db, 'records'), where('familyId', '==', user.familyId), where('userId', '==', targetId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }, [user]);

  const updateRecord = async (id, updates) => {
    await updateDoc(doc(db, 'records', id), updates);
    toast('✅ 기록이 수정됐어요! 달성률이 업데이트됩니다');
  };
  const deleteRecord = async (id) => { await deleteDoc(doc(db, 'records', id)); toast('🗑️ 기록 삭제됐어요'); };

  const saveMotto = async (text) => {
    const today = todayKey();
    await updateDoc(doc(db, 'users', user.id), { motto: text, mottoDate: today });
    setUser(p => ({ ...p, motto: text, mottoDate: today }));
  };

  // ── Exams ──
  const addExam    = async (d) => { await addDoc(collection(db, 'exams'), { ...d, familyId: user.familyId, createdAt: serverTimestamp() }); toast('📅 시험 일정 추가!'); };
  const updateExam = async (id, d) => { await updateDoc(doc(db, 'exams', id), d); toast('✅ 시험 수정됐어요!'); };
  const deleteExam = async (id) => { await deleteDoc(doc(db, 'exams', id)); toast('🗑️ 시험 삭제됐어요'); };

  // ── Study Plans ──
  const savePlan = useCallback(async (date, content) => {
    if (!user?.familyId || !user?.id) return;
    const existing = plans[date];
    if (existing) {
      if (!content.trim()) {
        await deleteDoc(doc(db, 'studyPlans', existing.id));
        toast('🗑️ 공부 계획 삭제됐어요');
      } else {
        await updateDoc(doc(db, 'studyPlans', existing.id), { content: content.trim(), updatedAt: serverTimestamp() });
        toast('✅ 공부 계획 저장됐어요!');
      }
    } else if (content.trim()) {
      await addDoc(collection(db, 'studyPlans'), {
        familyId: user.familyId, userId: user.id,
        date, content: content.trim(), createdAt: serverTimestamp(),
      });
      toast('📝 공부 계획 추가됐어요!');
    }
  }, [user, plans]);

  // ── Cheers ──
  const sendCheer = async (toId, toName, message) => {
    await addDoc(collection(db, 'cheers'), { fromId: user.id, fromName: user.name, fromEmoji: user.emoji, toId, toName, message, familyId: user.familyId, read: false, createdAt: serverTimestamp() });
    toast('💌 응원을 보냈어요!');
  };
  const markCheersRead = async () => {
    const unreadItems = cheers.filter(c => !c.read);
    await Promise.all(unreadItems.map(c => updateDoc(doc(db, 'cheers', c.id), { read: true })));
    setUnread(0);
  };

  return (
    <Ctx.Provider value={{
      user, isAdmin, family, members, records, subjects, ranges, exams, cheers, unread, session, toasts, plans,
      login, logout, saveSubjects, saveRange, startStudy, pauseStudy, resumeStudy, getElapsed, finishStudy,
      getRecordsByPeriod, getAllRecords, updateRecord, deleteRecord,
      saveMotto, addExam, updateExam, deleteExam, savePlan, sendCheer, markCheersRead, toast,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
