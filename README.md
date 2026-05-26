# 우리가족 공부방 📚 v2.0

## 기능 요약
- 캐릭터(이모지) + 이름으로 간편 가입 (이름 "엄마" = 관리자 👑)
- 3자리 가족 코드로 그룹 만들기/참여
- **기본 과목 8개** 자동생성: 국어 📖 수학 📐 대수 🔢 확통 📈 영어 🌍 과학 🔬 사회 🗺️ 한국사 🏛️
- **모든 가족**이 과목 추가/수정/삭제 가능
- 교재 종류: 📗교과서 💻인강 📝문제집 📓부교재 ✏️오답노트(대수/확통만)
- 타이머 + 일시정지 + 완료/미달성 처리
- 통계 (일/주/월) + 과목별 달성률 + **기록 수정**
- 시험 범위 설정 → 달성률 자동 계산
- **모든 가족**이 시험 범위 설정 가능
- 시험 캘린더 + D-Day + 공부 히트맵
- 가족 응원 메시지 (빠른 이모지 + 텍스트)
- 귀여운 탭바 (선택된 탭에 내 캐릭터 표시)
- 5초마다 실시간 동기화 (Firebase)

## 배포 방법

### 1단계: Firebase 키 입력
`src/firebase.js` 에서 `apiKey` 와 `appId` 의 `...` 부분을
Firebase Console → 프로젝트 설정 → 내 앱 에서 복사해서 붙여넣기

### 2단계: Firestore 보안 규칙
Firebase Console → Firestore → 규칙 탭 → `firestore.rules` 내용 붙여넣기 → 게시

### 3단계: GitHub 업로드
```bash
cd family-study
git init
git add .
git commit -m "✨ 우리가족 공부방 v2"
git branch -M main
git remote add origin https://github.com/내아이디/family-study.git
git push -f origin main
```

### 4단계: Vercel 배포
1. vercel.com 로그인
2. New Project → GitHub 저장소 선택
3. Framework: Create React App (자동 감지)
4. Deploy 클릭 → 완료!

### 5단계: 폰에 앱으로 설치
- **아이폰**: Safari → 공유 버튼 → 홈 화면에 추가
- **안드로이드**: Chrome → 메뉴(⋮) → 앱 설치

## 로컬 개발
```bash
npm install
npm start
```
