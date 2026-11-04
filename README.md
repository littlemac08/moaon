# 모아온 — 작은 오늘을 모아, 더 나은 나로

모바일 중심 루틴 관리 로컬 데모. React 19 + Next.js 15 App Router + TypeScript.

## 개발 브랜치 운영

- `develop`: 개발과 테스트를 진행하는 브랜치입니다. 변경 사항은 이 브랜치에서 검증합니다.
- `main`: 운영 반영용 브랜치입니다. `develop`에서 검증한 변경 사항을 PR로 병합해 반영합니다.
- 기능 작업은 필요에 따라 `develop`에서 별도 브랜치를 만들고, 검증 후 `develop`으로 병합합니다.

## 실행 및 최신 소스 반영

```bash
git switch main
git pull --ff-only origin main
npm ci
npm run dev
```

Node.js 22 이상을 권장합니다. 브라우저에서 http://localhost:3000 에 접속합니다. `predev`와 `prebuild`는 설치된 FFmpeg 패키지에서 브라우저 도구 파일을 준비합니다. 영상은 이 브라우저에서 처리하며 서버에 업로드하지 않습니다.

정적 배포: `npm run build:sites` 후 `out/`를 제공합니다. Node 서버: `npm run build` 후 `npm start`. Docker: `docker compose up -d --build` (기본 127.0.0.1:3000). 모두 UI의 영상 처리는 브라우저가 기본입니다. 기존 `/api/export`는 Node 빌드에만 보존합니다.

현재 Sites 데모는 [같은 공개 주소](https://moaon-routine-demo.wkdaudfo4.chatgpt.site)를 유지합니다. GitHub main 업데이트와 Sites 배포는 별도 단계이며 자동 동기화가 아닙니다. [소스 동기화·검증·배포 절차](docs/sites-maintenance.md)를 따릅니다. DB·루틴 API는 [향후 계획](docs/database-api-plan.md)만 있으며 현재 연결하지 않습니다.

## 기능

- **오늘**: 루틴 추가·수정·삭제, 주간 목표 시간 (월요일~일요일), 최근 7일 선택, 달성률.
- **타이머**: 시작·일시정지·재개·저장. 실제 경과 시간을 사용해 새로고침과 백그라운드 전환 후에도 이어집니다. 한 번에 한 루틴 측정. 저장한 날짜에 기록됩니다.
- **직접 기록**: 루틴, 날짜, 분 단위 시간을 선택해 기록.
- **나의 기록**: 월간 캘린더에서 날짜별 주간 누적 목표 달성률을 도넛으로 표시 (100% = 도넛 하나), 이전/다음 달 탐색, 날짜별 기록과 삭제. 각 날짜는 월요일부터 해당 날짜까지의 누적 시간을 현재 루틴의 주간 목표 시간 합계로 나눠 계산하며, 100% 초과 시 도넛은 완성 상태로 유지하고 실제 퍼센트를 표시합니다.
- **모먼트**: 최대 12개 영상, 합계 250MB. 각 컷의 시작·끝 초 설정, 순서 변경, 원본 미리보기, 원본 컷 총 55초 이하 연결. 시작 3초·종료 2초를 포함해 최대 60초.
- **브랜드 디자인**: 버밀리온·차콜·페이퍼 3가지 테마. 선택한 주의 달성률·집중 시간·목표·기간이 담긴 3초 오프닝과 모아온 브랜드의 2초 엔딩을 자동 삽입합니다. 장면은 부드럽게 나타나고 사라집니다. 디자인은 앞뒤 장면에 적용되며, 원본 컷은 그대로 유지합니다. 브라우저의 앞뒤 미리보기와 MP4는 같은 SVG 디자인을 사용합니다. 카드 구간은 무음입니다.
- **내보내기**: 세로 720×1280 / 30fps / H.264 + AAC MP4. 가로 영상은 비율을 유지해 여백을 넣고, 원본 소리를 보존합니다. 무음 컷은 무음 트랙을 추가합니다. 원본 촬영 프레임에 따라 수십 ms 정도 길이 오차가 있을 수 있습니다.

## 향후 DB 및 API 계획

계정별 데이터 저장, API, 이관 및 영상 처리 운영 계획은 [DB 구성 및 API 전환 계획](docs/database-api-plan.md)을 참고하세요. 현재는 계획 단계입니다.

## 저장과 한계

루틴·기록·진행 중 타이머는 `localStorage`의 `morrow-v1` 키에 저장됩니다. 로그인·클라우드 동기화 없이 사용하는 단일 사용자 데모입니다. 브라우저 데이터 삭제 시 기록도 삭제됩니다. 기존 목표 시간 숫자는 그대로 주간 목표로 적용합니다. 기본으로 제안하는 루틴 3개가 있으며 기록은 처음에 비어 있습니다.

영상은 선택·편집·내보내기 모두 브라우저 메모리에서 처리합니다. FFmpeg WebAssembly 도구만 같은 사이트에서 내려받으며 영상은 업로드하지 않습니다. 작업 완료·실패 시 FFmpeg Worker를 종료하고 임시 변환 메모리와 도구 Blob URL을 해제합니다. 편집 컷은 다시 내보내기할 수 있도록 현재 화면에 유지됩니다. 다운로드한 MP4는 사용자의 다운로드 폴더에 남습니다.

MP4/MOV 권장. 원본을 재생할 수 있는 코덱은 브라우저에 따라 다릅니다. 특히 긴 영상이나 큰 파일은 휴대폰의 메모리·발열·브라우저 제한에 영향을 받습니다. 변환 중 화면을 열어두세요. 홈 화면 추가용 manifest와 아이콘을 제공하며 오프라인 동작은 보장하지 않습니다.

기존 Node 영상 API는 자체 서버 이행을 위한 별도 경로로 보존합니다. UI에서는 사용하지 않습니다. 인터넷에 API를 공개하기 전에 인증, 요청·용량 제한, 작업 큐와 강제 종료 후 정리가 필요합니다.

폰트는 시스템 폰트와 Noto Sans KR를 사용합니다. Google Fonts 연결이 안 되어도 시스템 폰트로 동작합니다.

## 검증

```bash
npm run typecheck
npm run check:browser
npm run build:sites
npm run check:sites
npm run build
npm audit
# dev/start 서버 실행 후:
node scripts/check-export.mjs
```

실제 FFmpeg 테스트는 소리 있는 세로 영상 + 무음 가로 영상을 생성해 연결합니다. 출력 코덱·크기·길이, 60초 초과 거부, 잘못된 영상 처리와 임시 파일 정리를 확인합니다.

## 구성

- `app/page.tsx`: 루틴·타이머·히스토리·영상 편집 React UI
- `app/globals.css`: 데스크톱/모바일 반응형 디자인
- `lib/browser-export.ts`: 현재 UI의 브라우저 영상 변환
- `app/api/export/route.ts`: 보존한 Node 전용 영상 변환 API
- `scripts/build-sites.mjs`: 원본 API를 보존하는 정적 빌드

## 브랜드 콘셉트

앱 이름은 **모아온(MOAON)**. 꾸준히 모아온 시간과 순간을 뜻하며, 루틴과 모먼트를 함께 표현합니다. 마스코트 이름은 **유리**(유령오리의 준말)입니다. 앱 이름 모아온과 구분합니다. 브랜드 문구는 “작은 오늘을 모아, 더 나은 나로.”입니다.

**작은 한 걸음도, 신나는 전진.** 유리는 목표를 향해 달리는 친구이자 응원단입니다. 하얀 유령 몸, 노란 오리 부리, 코랄 볼, 하늘색 운동 헤어밴드가 특징입니다. 말투는 다정하고 발랄하게: “목표 향해, 꽥진!”, “오늘도 한 걸음, 잘했꽥!”.

- 버터 옐로 `#FFD65A`: 목표·행동 버튼·달성의 기쁨
- 스카이 블루 `#88C7F4`: 집중·성장·진행률
- 피치 코랄 `#FF8E83`: 모먼트·포인트 장식
- 크림 `#FFFDF5`: 편안한 배경
- 딥 네이비 `#263C56`: 글자와 캐릭터 표정
- 둥근 Jua 제목, Noto Sans KR 본문, 둥근 카드와 스티커 형태. 캐릭터는 가볍게 떠오르며 움직이고 모션 줄이기 설정을 존중합니다.
- 홈·캘린더·영상 편집·내보내기·모달·모바일 탐색에 동일한 시스템 적용. 기존 기록과 저장 키는 유지합니다.

### 캐릭터 원본과 제작

`public/duck-ghost.png` — 내장 imagegen으로 생성한 투명 PNG. `lib/duck-asset.mjs`는 동일 캐릭터를 영상 카드에 삽입하기 위한 최적화본입니다. `lib/duck-mark.mjs`는 작은 아이콘용 벡터 심벌입니다.

사용한 최종 프롬프트:

> Use case: stylized-concept. Asset type: transparent hero mascot PNG for a cheerful Korean weekly-goal app named 오리유령. Create ONE adorable energetic duck ghost mascot, full body, isolated on genuinely transparent background. A soft white marshmallow ghost with a fluttering scalloped ghost tail instead of legs, a distinctive big sunny yellow-orange duck bill, two tiny dark navy oval eyes, rosy coral cheeks, small flipper arms. Wearing a small sky-blue athletic headband with two fluttering ribbons. Flying/running eagerly toward the right in a dynamic happy determined pose with one flipper raised. Three small yellow and sky-blue star/speed accents around it. Premium friendly soft 3D clay toy illustration, matte smooth texture, rounded chubby proportions, gentle shaded white body still clearly readable, crisp silhouette. Front three-quarter view. Subject fills 80% of square frame with ample clearance, no cropping. Color palette butter yellow #FFD65A, sky blue #88C7F4, coral #FF8E83, white, dark navy #263C56. Bright upbeat and encouraging, not scary. No ground, no background, no text, no lettering, no watermark. Keep duck ghost unmistakable (ghost bottom, orange duck bill), not an ordinary duck.


## 최신 디자인 업데이트 — Editorial Vermilion

사용자 제공 천 유령 레퍼런스를 기반으로 유리를 재해석했습니다. 앱 이름은 모아온, 마스코트는 유리로 유지합니다. 크림 `#F7F4EF`와 차콜 `#352E2C`에 와인 `#6F2926`, 버밀리온 `#BB493B`을 사용합니다. 둥근 장난감/스티커 스타일을 덜고 얇은 테두리·절제된 타이포·여백 중심으로 변경했습니다.

최신 원본: `public/yuri-editorial.png`. 내장 imagegen 사용. 작은 UI 심벌: `public/yuri-icon.svg`. 영상 디자인은 `lib/yuri-asset.mjs`의 동일 캐릭터를 사용합니다. 이전 캐릭터 파일은 보관하며 현재 UI는 새 캐릭터를 표시합니다.

최종 생성 프롬프트: Use the attached image as STYLE AND SILHOUETTE REFERENCE, not a collage to reproduce. Create ONE refined 2D mascot for MOAON, named Yuri, a ghost duck. A floating soft ivory bedsheet ghost with a high rounded dome, two small solid charcoal oval eyes, draped cloth folds and a flowing scalloped hem, like the top-right and bottom-right ghosts in the reference. Add only a very small muted warm terracotta duck bill below its eyes as a subtle nod to the existing duck identity. One cloth wing gently extends outward, slight tilt in a calm forward-gliding pose. Thin confident charcoal contour lines and just 3 elegant tapered fold strokes, editorial vintage ink illustration with clean flat cream fill. Add one tiny deep vermilion cloth tab at its side as subtle brand accent. Premium sophisticated understated character, friendly but not babyish. No 3D, no headband, no blush, no sparkles, no large smile, no stickers, no text. One full-body centered character at 75% of the image area with generous transparent margins. Genuinely transparent background, no paper texture or ground, no other objects. Palette ivory #F7F1E7, charcoal #342C2B, vermilion #BF3E32. Preserve the classic sheet-ghost visual language of the supplied reference.

### Yuri / Motion Diary 업데이트
캐릭터는 천의 주름을 없앤 독립적인 라인 드로잉으로 변경했습니다. 비대칭 꼬리, 작은 부리, 앞으로 떠가는 실루엣을 사용하며 `lib/duck-mark.mjs`와 `public/yuri-line.svg`에서 관리합니다.
모먼트는 첫/마지막 컷을 반복 재생하는 3초/2초 장면에 반투명 그라데이션을 합성합니다. 캐릭터 선 그리기, 숫자 카운트업, 진행 바, 순차 등장과 페이드아웃을 30fps로 렌더링합니다. 특정 카메라 브랜드의 로고는 사용하지 않습니다. 루비/모노/앰버 필름 톤과 작은 레드 포인트를 사용합니다. 브랜드 구간은 무음이고 본편 오디오는 유지됩니다. 브라우저 미리보기는 동일 SVG 타임라인을 사용하며 서버 출력에는 필름 색보정이 추가됩니다.
