# 브라우저 데모와 main 관리

## 현재 동작

- 기준 소스는 `littlemac08/moaon`의 `main`입니다. 변경은 `develop`에서 검증한 뒤 `main`으로 반영합니다.
- 루틴·기록·타이머는 같은 브라우저의 `localStorage`, `morrow-v1` 키를 계속 사용합니다. DB·인증·루틴 API는 계획 문서일 뿐 구현하지 않았습니다.
- UI의 영상 내보내기는 브라우저 FFmpeg WASM을 사용합니다. 영상 원본은 서버로 업로드하지 않습니다. FFmpeg 도구 파일만 같은 사이트에서 내려받습니다.
- 기존 Node `/api/export` 소스와 Docker 실행 경로는 향후 자체 서버용으로 보존합니다. 현재 UI는 이 API를 호출하지 않습니다.
- 홈 화면 추가용 manifest와 아이콘, iOS 날짜 입력 레이아웃을 보존합니다. 오프라인 동작이나 기기 간 동기화는 제공하지 않습니다.

## 소스 업데이트와 검증

```bash
git switch main
git pull --ff-only origin main
npm ci
npm run typecheck
node scripts/check-weekly.mjs
npm run check:browser
npm run build:sites
npm run check:sites
```

`build:sites`는 원본을 수정하지 않는 임시 디렉터리에 앱을 복사하고, 서버 전용 `app/api`를 제외한 정적 출력을 `out/`에 만듭니다. FFmpeg core 파일은 `package-lock.json`에 잠긴 npm 패키지로부터 생성합니다. 바이너리를 별도로 다운로드하거나 수작업으로 맞출 필요가 없습니다. 생성 파일·빌드 디렉터리는 Git에서 제외합니다. 설치용 PWA manifest·아이콘과 iOS 날짜 입력 보완은 기존 Sites v4에서 가져온 소스입니다.

Node 서버는 `npm run build` 후 `npm start`, 또는 `docker compose up -d --build`로 실행합니다. Node 빌드에도 같은 브라우저 UI가 사용되며, 기존 API 회귀 테스트는 `node scripts/check-export.mjs`로 실행합니다. 공개 API 운영 전에는 계획 문서의 인증·용량·작업 제한을 구현해야 합니다.

## 기존 Sites 반영

현재 공개 주소: https://moaon-routine-demo.wkdaudfo4.chatgpt.site

GitHub와 Sites 저장소는 별개입니다. **git pull만으로 공개 사이트가 자동 배포되지는 않습니다.** GitHub Actions는 테스트만 실행하며 Sites 자동 배포를 설정하지 않았습니다.

1. 기존 Sites 프로젝트 `appgprj_6aeb008bb4048191a7c79f82d7ba23fb`의 소스를 지원되는 Sites 절차로 엽니다. 새 사이트를 만들지 않습니다.
2. 배포할 `main`의 정확한 SHA를 확인하고 GitHub 소스를 가져옵니다. 기존 Site의 `.openai/hosting.json` ID와 static `out` 설정, 공개 범위를 유지합니다.
3. 위 검증을 실행합니다. `.openai/source-provenance.json`에 실제 GitHub SHA와 저장소를 배포 기록으로 남깁니다.
4. 지원되는 Sites source helper로 소스 push와 패키징을 완료한 뒤 버전을 저장·배포합니다. `commit_sha`는 GitHub SHA가 아니라 그 Sites 저장소의 실제 push된 SHA입니다.
5. 배포 성공과 같은 URL을 확인합니다. 배포 오류가 있으면 기존 라이브 버전을 유지하고 원인을 확인합니다.

같은 주소를 유지하면 해당 브라우저의 `morrow-v1` 데이터는 그대로 남습니다. 브라우저 데이터 삭제, 다른 브라우저, 새 도메인으로의 이전은 별개입니다. 자체 서버 이전 시 기존 기록을 옮기는 절차를 별도로 준비해야 하며 자동 이전을 가정하지 않습니다.
