# 로아 숙제 (Lost Ark Homework)

로스트아크 공식 오픈 API를 연동해 **전투정보실 조회**, **원정대 일괄 표시**, **일일/주간 숙제 체크**, **계산기**를 제공하는 Next.js 웹앱입니다.

## 기능

- **캐릭터 조회**: 캐릭터명으로 같은 원정대(계정)의 보유 캐릭터를 아이템 레벨 순으로 일괄 조회
- **전투정보실 상세**: 프로필(아이템 레벨·전투/원정대 레벨·특성)과 장비 정보 표시
- **숙제 체크**: 캐릭터별 일일/주간 숙제 + 원정대 공통 숙제. 브라우저(localStorage)에 저장되며
  매일 06시 / 수요일 06시(한국 서버 기준)에 **자동 초기화**
- **계산기**: 재련 기댓값(장인의 기운 천장 반영), 골드↔크리스탈↔현금 환산

## API 키 발급 및 설정

1. [로스트아크 개발자 포털](https://developer-lostark.game.onstove.com)에 접속해 로그인
2. **API Keys** 메뉴에서 토큰을 발급
3. 프로젝트 루트에 `.env.local` 파일을 만들고 토큰을 입력합니다:

   ```bash
   cp .env.local.example .env.local
   ```

   ```env
   LOSTARK_API_KEY=발급받은_토큰_전체
   ```

> API 키는 서버(Next.js API 라우트)에서만 사용되며 브라우저에 노출되지 않습니다.

## 실행

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 실행
```

## 기술 스택

- Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4
- 데이터 저장: 브라우저 localStorage (로그인/DB 불필요)

## 커스터마이징

- 숙제 항목: `lib/tasks.ts` 에서 일일/주간/원정대 숙제를 자유롭게 추가·수정
- 리셋 기준: `lib/reset.ts` (기본값: 일일 06시, 주간 수요일 06시)

## 폴더 구조

```
app/
  page.tsx                 # 캐릭터 조회 + 원정대 목록
  character/[name]/        # 전투정보실 상세 (서버 컴포넌트)
  homework/                # 숙제 체크 (localStorage)
  calculator/              # 계산기
  api/
    armory/[name]/         # 전투정보실 API 프록시
    siblings/[name]/       # 원정대 API 프록시
lib/
  lostark.ts               # 오픈 API 호출 헬퍼 (서버 전용)
  tasks.ts                 # 숙제 항목 정의
  reset.ts                 # 일일/주간 리셋 계산
```

---

데이터 출처: 로스트아크 공식 오픈 API · 비공식 팬 프로젝트
