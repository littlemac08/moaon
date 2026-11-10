"use client";
import {
  momentThemes,
  momentCard,
  INTRO_SECONDS,
  OUTRO_SECONDS,
} from "../lib/moment-design.mjs";
import { weekRange, weeklySeconds } from "../lib/weekly.mjs";
import { Duck } from "./components/duck";
import { YuriWater } from "./components/yuri-water";
import { YuriWander } from "./components/yuri-wander";
import { FocusAtmosphere } from "./components/focus-atmosphere";
import { CalendarGhost } from "./components/calendar-ghost";
import { ClockDisplay } from "./components/clock-display";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Plus,
  Play,
  Pause,
  BookOpen,
  Leaf,
  Flame,
  Check,
  Clock3,
  LayoutGrid,
  BarChart3,
  Film,
  X,
  Download,
  Trash2,
  ArrowUp,
  ArrowDown,
  Settings2,
  Sun,
  Headphones,
  PenLine,
  LoaderCircle,
  Maximize2,
} from "lucide-react";
type Routine = {
  id: string;
  name: string;
  minutes: number;
  icon: number;
  color: string;
};
type Log = {
  id: string;
  routineId: string;
  name: string;
  seconds: number;
  date: string;
  mode: string;
};
type Timer = { routineId: string; elapsed: number; started: number | null };
type Clip = {
  id: string;
  file: File;
  url: string;
  duration: number;
  start: number;
  end: number;
};
const initial: Routine[] = [
  { id: "read", name: "책 읽는 시간", minutes: 30, icon: 0, color: "green" },
  { id: "move", name: "가볍게 움직이기", minutes: 30, icon: 1, color: "peach" },
  { id: "mind", name: "마음에 쉼표", minutes: 10, icon: 2, color: "purple" },
];
const icons = [BookOpen, Flame, Leaf, Headphones];
const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const time = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
function weekYear(date: string) {
  const thursday = new Date(`${weekRange(date).start}T12:00:00`);
  thursday.setDate(thursday.getDate() + 3);
  return thursday.getFullYear();
}
function weeksOfYear(year: number) {
  const first = new Date(`${weekRange(`${year}-01-04`).start}T12:00:00`);
  const next = weekRange(`${year + 1}-01-04`).start;
  const result: { start: string; end: string; number: number }[] = [];
  while (dateKey(first) < next) {
    const start = dateKey(first);
    result.push({ ...weekRange(start), number: result.length + 1 });
    first.setDate(first.getDate() + 7);
  }
  return result;
}
export default function Home() {
  const [tab, setTab] = useState("today");
  const [compactHeader, setCompactHeader] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const fullscreenCloseRef = useRef<HTMLButtonElement>(null);
  const [showScrollTip, setShowScrollTip] = useState(true);
  useEffect(() => {
    const updateHeader = () => {
      const hero = document.querySelector(".page-heading");
      setCompactHeader(!!hero && hero.getBoundingClientRect().bottom <= 72);
      const lastPanel = document.getElementById(tab === "history" ? "history-detail" : "focus-timer");
      setShowScrollTip((tab === "today" || tab === "history") && !!lastPanel && lastPanel.getBoundingClientRect().top > window.innerHeight * 0.55);
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", updateHeader);
    return () => {
      window.removeEventListener("scroll", updateHeader);
      window.removeEventListener("resize", updateHeader);
    };
  }, [tab]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [tab]);
  useEffect(() => {
    if (!fullscreenOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    fullscreenCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreenOpen(false);
      if (event.key === "Tab") {
        const dialog = document.querySelector<HTMLElement>(".fullscreen-focus");
        const controls = Array.from(dialog?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") || []);
        if (!controls.length) return;
        const current = controls.indexOf(document.activeElement as HTMLButtonElement);
        if (event.shiftKey && current <= 0) { event.preventDefault(); controls[controls.length - 1].focus(); }
        else if (!event.shiftKey && (current === controls.length - 1 || current < 0)) { event.preventDefault(); controls[0].focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [fullscreenOpen]);
  function openFullscreen() {
    setFullscreenOpen(true);
  }
  function closeFullscreen() {
    setFullscreenOpen(false);
  }
  const [routines, setRoutines] = useState<Routine[]>(initial);
  const [logs, setLogs] = useState<Log[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(
    null,
  );
  const [timer, setTimer] = useState<Timer | null>(null);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [selected, setSelected] = useState(dateKey());
  const [calendarYear, setCalendarYear] = useState(() => weekYear(dateKey()));
  const [calendarView, setCalendarView] = useState<"week" | "month">("week");
  const [calendarMonth, setCalendarMonth] = useState(() => dateKey().slice(0, 7));
  const [modal, setModal] = useState<"goal" | "manual" | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [icon, setIcon] = useState(0);
  const [recordRoutine, setRecordRoutine] = useState("read");
  const [recordDate, setRecordDate] = useState(dateKey());
  const [toast, setToast] = useState("");
  const [clips, setClips] = useState<Clip[]>([]);
  const clipsRef = useRef<Clip[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingClips, setLoadingClips] = useState(false);
  const [momentTheme, setMomentTheme] = useState("sage");
  const [momentWeek, setMomentWeek] = useState(() => dateKey());
  const [designScene, setDesignScene] = useState("intro");
  const [animationTime, setAnimationTime] = useState(1.65);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewDummy, setPreviewDummy] = useState(1);
  const [previewCycle, setPreviewCycle] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("morrow-v1") || "null");
      if (data && Array.isArray(data.routines) && Array.isArray(data.logs)) {
        setRoutines(data.routines);
        setLogs(data.logs);
        setTimer(data.timer || null);
      }
    } catch {}
    setReady(true);
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(
          "morrow-v1",
          JSON.stringify({ routines, logs, timer }),
        );
      } catch {
        setToast("저장 공간이 부족합니다. 브라우저 설정을 확인해주세요.");
      }
  }, [routines, logs, timer, ready]);
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(id);
    }
  }, [toast]);
  useEffect(() => {
    clipsRef.current = clips;
  }, [clips]);
  useEffect(
    () => () => clipsRef.current.forEach((c) => URL.revokeObjectURL(c.url)),
    [],
  );
  useEffect(() => {
    if (modal) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [modal]);
  const elapsed = timer
    ? timer.elapsed +
      (timer.started ? Math.max(0, (now - timer.started) / 1000) : 0)
    : 0;
  const historyWeek = weekRange(selected);
  const weekLogs = logs.filter((l) => l.date >= historyWeek.start && l.date <= historyWeek.end);
  const total = weeklySeconds(logs, selected);
  const selectedWeek = weekRange(selected);
  const goal = routines.reduce((s, r) => s + r.minutes, 0);
  const progress = goal
    ? Math.min(100, Math.floor((total / (goal * 60)) * 100))
    : 0;
  const routineTotal = (id: string, date = selected) =>
    weeklySeconds(logs, date, id);
  const completed = routines.filter(
    (r) => routineTotal(r.id) >= r.minutes * 60,
  ).length;
  const active = routines.find((r) => r.id === timer?.routineId);
  const focus =
    active ||
    routines.find((r) => r.id === selectedMissionId) ||
    routines.find((r) => routineTotal(r.id, dateKey()) < r.minutes * 60) ||
    routines[0];
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${weekRange(dateKey(new Date(now))).start}T12:00:00`);
    d.setDate(d.getDate() + i);
    return d;
  });
  const calendarWeeks = weeksOfYear(calendarYear);
  const [monthYear, monthNumber] = calendarMonth.split("-").map(Number);
  const monthStart = (new Date(monthYear, monthNumber - 1, 1).getDay() + 6) % 7;
  const monthDays = new Date(monthYear, monthNumber, 0).getDate();
  const monthCells = Array.from({ length: Math.ceil((monthStart + monthDays) / 7) * 7 }, (_, index) => {
    const day = index - monthStart + 1;
    return day > 0 && day <= monthDays ? day : null;
  });
  function moveHistoryMonth(offset: number) {
    setCalendarMonth(dateKey(new Date(monthYear, monthNumber - 1 + offset, 1, 12)).slice(0, 7));
  }
  function moveYear(offset: number) {
    const year = calendarYear + offset;
    setCalendarYear(year);
    const first = weeksOfYear(year)[0].start;
    setSelected(year === weekYear(dateKey()) ? dateKey() : first);
  }
  function openGoal(r?: Routine) {
    setEditing(r?.id || null);
    setName(r?.name || "");
    setMinutes(String(r?.minutes || 30));
    setIcon(r?.icon || 0);
    setModal("goal");
  }
  function openManual(id?: string) {
    setRecordRoutine(id || routines[0]?.id || "");
    setMinutes("15");
    setRecordDate(selected);
    setModal("manual");
  }
  function selectMission(id: string) {
    if (timer && timer.routineId !== id) {
      setToast("현재 기록을 저장한 뒤 다른 루틴을 선택해주세요.");
      return;
    }
    setSelectedMissionId(id);
    if (window.matchMedia("(max-width: 760px)").matches)
      document
        .getElementById("focus-timer")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function start(id: string) {
    if (timer?.routineId === id && timer.started) return;
    if (timer && timer.routineId !== id) {
      setToast("진행 중인 타이머를 먼저 저장해주세요.");
      return;
    }
    setSelectedMissionId(id);
    setTimer({
      routineId: id,
      elapsed: timer?.elapsed || 0,
      started: Date.now(),
    });
    setNow(Date.now());
    if (window.matchMedia("(max-width: 760px)").matches)
      document
        .getElementById("focus-timer")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function saveTimer() {
    if (!timer || elapsed < 1) return;
    const r = routines.find((r) => r.id === timer.routineId);
    setLogs((v) => [
      {
        id: crypto.randomUUID(),
        routineId: timer.routineId,
        name: r?.name || "루틴",
        seconds: Math.floor(elapsed),
        date: dateKey(),
        mode: "타이머",
      },
      ...v,
    ]);
    setTimer(null);
    setToast("기록을 저장했어요.");
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const m = Number(minutes);
    if (!Number.isFinite(m) || m < 1 || m > (modal === "goal" ? 10080 : 1440)) {
      setToast(
        modal === "goal"
          ? "주간 목표는 1~10,080분 사이로 입력해주세요."
          : "1~1,440분 사이로 입력해주세요.",
      );
      return;
    }
    if (modal === "goal") {
      if (!name.trim()) return;
      const item = {
        id: editing || crypto.randomUUID(),
        name: name.trim(),
        minutes: m,
        icon,
        color: ["green", "peach", "purple", "blue"][icon],
      };
      setRoutines((v) =>
        editing ? v.map((r) => (r.id === editing ? item : r)) : [...v, item],
      );
      setToast(editing ? "루틴을 수정했어요." : "새로운 루틴을 만들었어요.");
    } else {
      const r = routines.find((r) => r.id === recordRoutine);
      if (!r) return;
      setLogs((v) => [
        {
          id: crypto.randomUUID(),
          routineId: r.id,
          name: r.name,
          seconds: m * 60,
          date: recordDate,
          mode: "직접 기록",
        },
        ...v,
      ]);
      setToast("루틴을 추가했어요.");
    }
    setModal(null);
  }
  async function addFiles(files: FileList | null) {
    if (!files) return;
    setLoadingClips(true);
    const added: Clip[] = [];
    try {
      if (clips.length + files.length > 12)
        throw new Error("영상은 최대 12개까지 추가할 수 있어요.");
      if (
        clips.reduce((s, c) => s + c.file.size, 0) +
          Array.from(files).reduce((s, f) => s + f.size, 0) >
        250 * 1024 * 1024
      )
        throw new Error("영상은 합계 250MB까지 추가할 수 있어요.");
      for (const file of Array.from(files)) {
        const url = URL.createObjectURL(file);
        try {
          const duration = await new Promise<number>((resolve, reject) => {
            const video = document.createElement("video");
            video.preload = "metadata";
            const timeout = setTimeout(() => {
              video.src = "";
              reject(new Error("영상 정보를 읽을 수 없어요."));
            }, 15000);
            video.onloadedmetadata = () => {
              clearTimeout(timeout);
              const d = video.duration;
              video.src = "";
              Number.isFinite(d) && d >= 0.1
                ? resolve(d)
                : reject(
                    new Error("이 영상 형식은 미리보기를 지원하지 않아요."),
                  );
            };
            video.onerror = () => {
              clearTimeout(timeout);
              video.src = "";
              reject(new Error("MP4 또는 MOV 영상을 선택해주세요."));
            };
            video.src = url;
          });
          added.push({
            id: crypto.randomUUID(),
            file,
            url,
            duration,
            start: 0,
            end: Math.min(duration, 10),
          });
        } catch (e) {
          URL.revokeObjectURL(url);
          throw e;
        }
      }
      setClips((v) => [...v, ...added]);
    } catch (e) {
      added.forEach((c) => URL.revokeObjectURL(c.url));
      setToast((e as Error).message);
    } finally {
      setLoadingClips(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  useEffect(() => {
    if (!previewPlaying) return;
    const started = performance.now();
    let frame: number;
    const tick = () => {
      const elapsed = (performance.now() - started) / 1000;
      const middleDuration = 1.8;
      if (elapsed >= INTRO_SECONDS + middleDuration + OUTRO_SECONDS) {
        setPreviewPlaying(false);
        setAnimationTime(1.65);
        setDesignScene("intro");
        setPreviewDummy(1);
        return;
      }
      if (elapsed < INTRO_SECONDS) {
        setPreviewDummy(1);
        setDesignScene("intro");
        setAnimationTime(elapsed);
      } else if (elapsed < INTRO_SECONDS + middleDuration) {
        setPreviewDummy(2);
        setDesignScene("middle");
      } else {
        setPreviewDummy(3);
        setDesignScene("outro");
        setAnimationTime(elapsed - INTRO_SECONDS - middleDuration);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [previewPlaying, previewCycle]);
  const filmWeek = weekRange(momentWeek);
  const filmSeconds = weeklySeconds(logs, momentWeek);
  const filmStats = {
    theme: momentTheme,
    percent: goal ? Math.floor((filmSeconds / (goal * 60)) * 100) : 0,
    minutes: Math.floor(filmSeconds / 60),
    goal,
    start: filmWeek.start,
    end: filmWeek.end,
  };
  const clipSeconds = clips.reduce((s, c) => s + c.end - c.start, 0);
  const exportSeconds = clipSeconds + INTRO_SECONDS + OUTRO_SECONDS;
  const invalidCuts = clips.some(
    (c) =>
      !Number.isFinite(c.start) ||
      !Number.isFinite(c.end) ||
      c.start < 0 ||
      c.end > c.duration ||
      c.end - c.start < 0.1,
  );
  async function exportVideo() {
    setBusy(true);
    try {
      const { renderVideo } = await import("../lib/browser-export");
      const blob = await renderVideo(clips, filmStats);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `moaon-${dateKey()}.mp4`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setToast("영상이 완성됐어요. 다운로드를 확인해주세요.");
    } catch (e) { setToast((e as Error).message || "영상 변환에 실패했어요."); }
    finally { setBusy(false); }
  }
  const nav = [
    { id: "today", label: "오늘", icon: LayoutGrid },
    { id: "history", label: "나의 기록", icon: BarChart3 },
    { id: "moments", label: "모먼트", icon: Film },
  ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="모아온 홈">
          <span className="brand-mark">
            <Duck size={36} />
          </span>
          모아온<span className="brand-dot">.</span>
        </a>
        <span className="sidebar-caption">MAKE TIME FOR YOURSELF</span>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              className={tab === n.id ? "nav-item active" : "nav-item"}
              aria-current={tab === n.id ? "page" : undefined}
              onClick={() => setTab(n.id)}
            >
              <n.icon size={20} />
              {n.label}
              {tab === n.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-leaf">
            <Duck size={64} />
          </div>
          <p>
            작은 오늘을 모아,
            <br />
            더 나은 나로.
          </p>
          <span>AT YOUR OWN PACE.</span>
        </div>
        <div className="profile">
          <div>나</div>
          <section>
            <strong>목표를 향해 달리는 중</strong>
            <small>로컬 데모 · 이 기기에 저장</small>
          </section>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span>작은 실천이 만드는 변화</span>
          <div className="local-pill">
            <span />
            이 기기에 저장
          </div>
        </header>
        <div className={`compact-today-header ${compactHeader ? "is-visible" : ""}`} aria-hidden="true">
          <span>{tab === "history" ? "꾸준함이 남긴 기록" : tab === "moments" ? "나의 시간을 한 편으로" : "오늘의 몰입을 모아"}<span className="compact-header-dot">.</span></span>
          <img src="/yuri-app-mark.svg" alt="" />
        </div>
        <div className="page-content">
          <div className={`page-heading ${"duck-hero"}`}>
            <div>
              <div className="eyebrow">
                {tab === "today"
                  ? "오늘"
                  : tab === "history"
                    ? "기록"
                    : "모먼트"}
              </div>
              <h1>
                {tab === "today"
                  ? "오늘의 몰입을 모아"
                  : tab === "history"
                    ? "꾸준함이 남긴 기록"
                    : "나의 시간을 한 편으로"}
                <span className="heading-dot">.</span>
              </h1>
              <p>
                {tab === "today"
                  ? "나만의 속도로, 오늘을 채워보세요."
                  : tab === "history"
                    ? "차곡차곡 쌓아온 시간을 돌아보세요."
                    : "소중한 순간을 나만의 영상으로 남겨요."}
              </p>
            </div>
            {(tab === "today" || tab === "history" || tab === "moments") && (
              <div className="hero-mascot">
                <span className="hero-sticker">YOU GOT THIS!</span>
                <img
                  src="/yuri-app-mark.svg"
                  alt="물결을 품은 유령 캐릭터 유리"
                />
                <span className="hero-spark">✦</span>
                <span className="hero-trail">GO! GO!</span>
              </div>
            )}
            <span className="date-label">
              <Sun size={18} />
              {new Date(now).toLocaleDateString("ko-KR", {
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </span>
          </div>
          {tab === "today" && (
            <>
              <div className="week-strip" aria-label="이번 주 날짜">
                <div className="week-days">
                  {days.map((d) => {
                    const key = dateKey(d);
                    const done = logs.some((l) => l.date === key);
                    return (
                      <button
                        key={key}
                        className={`day ${selected === key ? "selected" : ""} ${key === dateKey() ? "is-today" : ""} ${key < dateKey() ? "is-past" : ""} ${done ? "has-record" : ""}`}
                        disabled={key > dateKey()}
                        onClick={() => setSelected(key)}
                        aria-label={`${d.getMonth() + 1}월 ${d.getDate()}일${key === dateKey() ? ", 오늘" : ""}${done ? ", 기록 있음" : ""}`}
                        aria-current={key === dateKey() ? "date" : undefined}
                        aria-pressed={selected === key}
                      >
                        <span>
                          {d.toLocaleDateString("ko-KR", { weekday: "short" })}
                        </span>
                        <span className="day-number">
                          {done && (
                            <svg className="day-ghost" viewBox="0 0 100 100" aria-hidden="true">
                              <path d="M24 44C24 39 23 36 24 31C25 17 35 10 50 10C65 10 75 17 76 31C77 36 76 39 76 44C76 49 81 42 84 39C90 33 96 39 91 46C88 52 80 56 79 62C78 69 83 77 80 82C77 88 71 83 67 82C62 80 59 89 50 89C41 89 38 80 33 82C29 83 23 88 20 82C17 77 22 69 21 62C20 56 12 52 9 46C4 39 10 33 16 39C19 42 24 49 24 44Z" />
                            </svg>
                          )}
                          <strong>{d.getDate()}</strong>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="dashboard">
                <div className="main-column">
                  <section className="summary-card" aria-labelledby="weekly-summary-title">
                    <div className="summary-copy">
                      <span className="eyebrow">
                        주간 목표 ·{" "}
                        {selectedWeek.start.slice(5).replace("-", "/")} –{" "}
                        {selectedWeek.end.slice(5).replace("-", "/")}
                      </span>
                      <h2 id="weekly-summary-title">이번 주의 집중 시간</h2>
                      <div className="big-number">
                        {Math.floor(total / 60)}
                        <span>분</span>
                        <small> / {goal}분</small>
                      </div>
                      <p>
                        {total > 0
                          ? "이번 주에 기록한 시간이에요."
                          : "아직 기록이 없어요. 오늘부터 시작해볼까요?"}
                      </p>
                      <div className="summary-chips">
                        <span>
                          <Check size={14} />
                          {completed} / {routines.length} 루틴 완료
                        </span>
                        <span>
                          <Clock3 size={14} />
                          주간 목표 {goal}분
                        </span>
                      </div>
                    </div>
                    <div
                      className="progress-ring"
                      role="img"
                      aria-label={`주간 목표 달성률 ${progress}%`}
                      style={
                        { "--progress": `${progress}%` } as React.CSSProperties
                      }
                    >
                      <YuriWater progress={progress} className="progress-yuri" appIcon outlined />
                      <div className={`progress-value ${progress >= 100 ? "is-full" : ""}`}>
                        <span>{progress}<small>%</small></span>
                        <p>주간 달성률</p>
                      </div>
                    </div>
                  </section>
                  <section className="routine-section">
                    <div className="section-heading">
                      <h2>
                        나의 루틴 <span>{routines.length}</span>
                      </h2>
                      <button
                        className="text-button"
                        onClick={() => openGoal()}
                      >
                        <Plus size={17} />
                        루틴 추가
                      </button>
                    </div>
                    <p className="mission-select-hint">
                      루틴을 선택하고 타이머를 시작하세요.
                    </p>
                    <div className="routine-list">
                      {routines.map((r) => {
                        const Icon = icons[r.icon] || Leaf;
                        const seconds = routineTotal(r.id);
                        const done = seconds >= r.minutes * 60;
                        const isFocused = focus?.id === r.id;
                        const isActive = active?.id === r.id;
                        return (
                          <article
                            className={`routine-row ${isFocused ? "mission-selected" : ""} ${isActive && !timer?.started ? "mission-paused" : ""}`}
                            key={r.id}
                            aria-label={`${r.name}${isFocused ? (isActive ? (timer?.started ? ", 집중 중" : ", 잠시 쉬는 중") : ", 선택한 루틴") : ""}`}
                          >
                            <button
                              type="button"
                              className="mission-select-hit"
                              aria-label={`${r.name} 루틴 선택`}
                              aria-pressed={isFocused}
                              onClick={() => selectMission(r.id)}
                            />
                            <div className={`routine-icon ${r.color}`}>
                              <Icon size={22} />
                            </div>
                            <div className="routine-info">
                              {isFocused && (
                                <div
                                  className={`mission-status ${isActive && timer?.started ? "is-running" : ""}`}
                                >
                                  <span />
                                  {isActive
                                    ? timer?.started
                                      ? "집중 중"
                                      : "잠시 쉬는 중"
                                    : "선택한 루틴"}
                                  {isActive && <strong>{time(elapsed)}</strong>}
                                </div>
                              )}
                              <h3>
                                {r.name}
                                {done && <Check size={14} />}
                              </h3>
                              <span>
                                매주 {r.minutes}분 <i />{" "}
                                {Math.floor(seconds / 60)}분 주간 기록
                              </span>
                              <div className="small-track">
                                <i
                                  style={{
                                    width: `${Math.min(100, (seconds / (r.minutes * 60)) * 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <button
                              className="icon-button muted"
                              aria-label={`${r.name} 수정`}
                              onClick={() => openGoal(r)}
                            >
                              <Settings2 size={17} />
                            </button>
                          </article>
                        );
                      })}
                      {!routines.length && (
                        <div className="empty">
                          <Leaf />
                          <p>나만의 첫 루틴을 만들어보세요.</p>
                          <button
                            className="primary"
                            onClick={() => openGoal()}
                          >
                            루틴 만들기
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      className="manual-button"
                      onClick={() => openManual()}
                      disabled={!routines.length}
                    >
                      <PenLine size={17} />
                      이미 실천했다면, 직접 기록하기
                      <ArrowRight size={16} />
                    </button>
                  </section>
                </div>
                <div className="side-column">
                  <section className="focus-card" id="focus-timer">
                    <FocusAtmosphere />
                    <button className="focus-fullscreen-button" type="button" onClick={openFullscreen} aria-label="전체화면 열기">
                      <Maximize2 size={19} />
                    </button>
                    <div
                      className={`focus-mission ${timer && !timer.started ? "paused" : ""}`}
                    >
                      <span className="focus-mission-label">
                        <span />
                        {active
                          ? timer?.started
                            ? "집중 중"
                            : "일시정지"
                          : "선택한 루틴"}
                      </span>
                      <h2 aria-live="polite">
                        {focus?.name || "먼저 루틴을 만들어주세요"}
                      </h2>
                      {focus && (
                        <span className="focus-mission-goal">
                          주간 목표 {focus.minutes}분 ·{" "}
                          {Math.floor(routineTotal(focus.id, dateKey()) / 60)}분
                          기록
                        </span>
                      )}
                    </div>
                    <YuriWander progress={progress} className="timer-stage" enabled={!fullscreenOpen} />
                    <div className="timer-face" role="timer" aria-label={`집중 시간 ${time(elapsed)}`}>
                      <ClockDisplay value={time(elapsed)} />
                    </div>
                    <div className="timer-actions">
                      <button
                        className="focus-start"
                        disabled={!focus}
                        onClick={() =>
                          timer?.started
                            ? setTimer({ ...timer, elapsed, started: null })
                            : focus && start(focus.id)
                        }
                      >
                        {timer?.started ? (
                          <Pause size={17} fill="currentColor" />
                        ) : (
                          <Play size={17} fill="currentColor" />
                        )}
                        {timer?.started
                          ? "잠시 쉬기"
                          : timer
                            ? "이어서 집중하기"
                            : "타이머 시작"}
                      </button>
                      {timer && (
                        <button
                          className="save-timer"
                          disabled={elapsed < 1}
                          onClick={saveTimer}
                        >
                          <Check size={17} />
                          기록 저장
                        </button>
                      )}
                    </div>
                    <span className="focus-footnote">
                      {active
                        ? "다른 루틴을 선택하려면 현재 기록을 저장하세요."
                        : focus ? "준비되면 타이머를 시작하세요." : "첫 번째 루틴을 만들어보세요."}
                    </span>
                  </section>
                </div>
              </div>
              <div className="closing-note">
                <span />
                작은 오늘을 모아, 더 나은 나로.
                <span />
              </div>
            </>
          )}
          {tab === "history" && (
            <div className="history-layout">
              <section className="card calendar-card">
                <div className="calendar-header">
                  <div><span className="eyebrow">나의 기록</span><h2>한 주씩 채워가는 목표</h2></div>
                  <button className="calendar-today" onClick={() => { setCalendarYear(weekYear(dateKey())); setCalendarMonth(dateKey().slice(0, 7)); setSelected(dateKey()); }}>이번 주</button>
                </div>
                <div className="calendar-view-switch" role="group" aria-label="달력 보기 방식">
                  <button type="button" aria-pressed={calendarView === "week"} onClick={() => setCalendarView("week")}>주간 보기</button>
                  <button type="button" aria-pressed={calendarView === "month"} onClick={() => setCalendarView("month")}>월간 보기</button>
                </div>
                {calendarView === "week" ? <>
                <div className="calendar-month-bar">
                  <button className="icon-button" aria-label="이전 해" onClick={() => moveYear(-1)}><ChevronLeft size={20} /></button>
                  <h3 aria-live="polite">{calendarYear}년</h3>
                  <button className="icon-button" aria-label="다음 해" disabled={calendarYear >= weekYear(dateKey())} onClick={() => moveYear(1)}><ChevronRight size={20} /></button>
                </div>
                <div className="weekly-calendar-grid" aria-label={`${calendarYear}년 주간 달성률`}>
                  {calendarWeeks.map((week) => {
                    const seconds = weeklySeconds(logs, week.start);
                    const percentage = goal > 0 ? Math.floor(seconds / (goal * 60) * 100) : 0;
                    const future = week.start > dateKey();
                    const isSelected = week.start === historyWeek.start;
                    return <button key={week.start} className={`weekly-calendar-week ${isSelected ? "selected" : ""} ${week.end < dateKey() ? "is-past" : ""}`} disabled={future} aria-pressed={isSelected} aria-current={week.start === weekRange(dateKey()).start ? "date" : undefined} aria-label={`${week.number}주차, ${week.start}부터 ${week.end}, ${future ? "예정" : goal ? `주간 목표 ${percentage}% 달성, ${Math.floor(seconds / 60)}분 기록` : "설정된 목표 없음"}`} onClick={() => setSelected(week.start > dateKey() ? dateKey() : week.start)}>
                      <span className="weekly-ghost"><CalendarGhost progress={percentage} /><span>{week.number}</span></span>
                    </button>;
                  })}
                </div>
                <p className="weekly-calendar-hint">유령 하나는 한 주 · 색이 찰수록 목표에 가까워져요</p>
                </> : <>
                  <div className="calendar-month-bar">
                    <button className="icon-button" aria-label="이전 달" onClick={() => moveHistoryMonth(-1)}><ChevronLeft size={20} /></button>
                    <h3 aria-live="polite">{monthYear}년 {monthNumber}월</h3>
                    <button className="icon-button" aria-label="다음 달" disabled={calendarMonth >= dateKey().slice(0, 7)} onClick={() => moveHistoryMonth(1)}><ChevronRight size={20} /></button>
                  </div>
                  <div className="calendar-weekdays" aria-hidden="true">{["월", "화", "수", "목", "금", "토", "일"].map(day => <span key={day}>{day}</span>)}</div>
                  <div className="calendar-grid">
                    {monthCells.map((day, index) => {
                      if (day === null) return <span key={`blank-${index}`} />;
                      const key = `${calendarMonth}-${String(day).padStart(2, "0")}`;
                      const future = key > dateKey();
                      const percentage = goal ? Math.floor(weeklySeconds(logs, key, undefined, true) / (goal * 60) * 100) : 0;
                      return <button key={key} className={`calendar-day ${selected === key ? "selected" : ""} ${key < dateKey() ? "is-past" : ""}`} disabled={future} aria-pressed={selected === key} aria-label={`${monthNumber}월 ${day}일, ${future ? "예정" : `주간 목표 ${percentage}% 달성`}`} onClick={() => { setSelected(key); setCalendarYear(weekYear(key)); }}>
                        <span className="calendar-date-row"><CalendarGhost progress={logs.some(log => log.date === key) ? percentage : 0} /><span className="calendar-date">{day}</span></span>
                      </button>;
                    })}
                  </div>
                </>}
              </section>
              <section className="card history-detail" id="history-detail">
                <div className="section-heading">
                  <h2>
                    {Number(historyWeek.start.slice(5, 7))}.{historyWeek.start.slice(8)} – {Number(historyWeek.end.slice(5, 7))}.{historyWeek.end.slice(8)} 기록
                  </h2>
                  <input
                    aria-label="기록 날짜"
                    type="date"
                    value={selected}
                    max={dateKey()}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelected(e.target.value);
                        setCalendarYear(weekYear(e.target.value));
                        setCalendarMonth(e.target.value.slice(0, 7));
                      }
                    }}
                  />
                </div>
                {weekLogs.length ? (
                  weekLogs.map((l) => (
                    <div className="log-row" key={l.id}>
                      <div className="routine-icon green">
                        <Check size={20} />
                      </div>
                      <div>
                        <h3>{l.name}</h3>
                        <span>
                          {l.mode} · {l.date}
                        </span>
                      </div>
                      <strong>
                        {Math.floor(l.seconds / 60)}분{" "}
                        {l.seconds % 60 ? `${l.seconds % 60}초` : ""}
                      </strong>
                      <button
                        className="icon-button"
                        aria-label={`${l.name} 기록 삭제`}
                        onClick={() => {
                          if (confirm("이 기록을 삭제할까요?"))
                            setLogs((v) => v.filter((x) => x.id !== l.id));
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty">
                    <BookOpen size={32} />
                    <h3>아직 비어 있는 한 주</h3>
                    <p>작은 실천 하나로 이번 주를 채워보세요.</p>
                    <button
                      className="primary"
                      disabled={!routines.length}
                      onClick={() => openManual()}
                    >
                      시간 기록하기
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}
          {tab === "moments" && (
            <div className="moments-layout">
              <div className="moments-main">
                <section className="upload-zone">
                  <div className="moment-art" aria-hidden="true">
                    <div className="moment-art-frame moment-art-frame-back" />
                    <div className="moment-art-frame moment-art-frame-front"><img src="/yuri-line.svg" alt="" /></div>
                    <span className="moment-art-play"><Play size={13} fill="currentColor" /></span>
                  </div>
                  <span className="eyebrow">영상 모으기</span>
                  <h2>오늘의 장면을 모아보세요.</h2>
                  <p>
                    일상의 작은 순간을 모아
                    <br />
                    나만의 짧은 영상으로 남겨요.
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="video/*"
                    multiple
                    hidden
                    onChange={(e) => addFiles(e.target.files)}
                  />
                  <button
                    className="primary"
                    disabled={busy || loadingClips}
                    onClick={() => fileRef.current?.click()}
                  >
                    {loadingClips ? (
                      <LoaderCircle className="spin" size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                    영상 추가하기
                  </button>
                  <small>최대 12개 · 합계 250MB · MP4 / MOV 권장</small>
                </section>
                <section className="card moment-design">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">영상 디자인</span>
                      <h2>모아온의 시그니처</h2>
                    </div>
                    <span className="format-tag">시작 3초 + 종료 2초</span>
                  </div>
                  <p className="subtle">
                    한 주의 성취와 유리의 실루엣으로, 나다운 영상을 완성해요.
                  </p>
                  <div className="design-controls">
                    <label>
                      기록을 담을 주
                      <input
                        type="date"
                        max={dateKey()}
                        value={momentWeek}
                        disabled={busy}
                        onChange={(e) => {
                          if (e.target.value) setMomentWeek(e.target.value);
                        }}
                      />
                    </label>
                    <span>
                      {filmWeek.start.slice(5).replace("-", ".")} –{" "}
                      {filmWeek.end.slice(5).replace("-", ".")}
                      <strong>
                        {filmStats.percent}% 달성 · {filmStats.minutes}분
                      </strong>
                    </span>
                  </div>
                  <div className="theme-picker">
                    {momentThemes.map((t) => (
                      <button
                        key={t.id}
                        disabled={busy}
                        aria-pressed={momentTheme === t.id}
                        onClick={() => setMomentTheme(t.id)}
                        className={momentTheme === t.id ? "selected" : ""}
                      >
                        <i
                          style={{ background: t.bg, borderColor: t.accent }}
                        />
                        <strong>{t.name}</strong>
                        <small>{t.description}</small>
                      </button>
                    ))}
                  </div>
                  <div className="design-stage">
                    {previewPlaying ? (
                      <div className={`design-dummy design-dummy-${previewDummy}`} aria-label={`미리보기 임시 장면 ${previewDummy}`}>
                        <span className="dummy-orb" /><span className="dummy-shape" />
                        <small>임시 장면 {previewDummy}</small>
                      </div>
                    ) : clips.length > 0 ? <video className="design-footage" key={designScene + previewCycle} src={clips[designScene === "intro" ? 0 : clips.length - 1].url} autoPlay muted playsInline loop onLoadedMetadata={(event) => { const c = clips[designScene === "intro" ? 0 : clips.length - 1]; event.currentTarget.currentTime = c.start; }} onTimeUpdate={(event) => { const c = clips[designScene === "intro" ? 0 : clips.length - 1]; if (event.currentTarget.currentTime >= c.end) event.currentTarget.currentTime = c.start; }} /> : <div className="design-demo-light"><span>영상 추가 시 내 영상 위에 적용됩니다</span></div>}
                    {designScene !== "middle" && <img
                      key={`${designScene}-${previewCycle}-${previewPlaying}`}
                      className="motion-overlay"
                      src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(momentCard({ ...filmStats, kind: designScene, time: animationTime }))}`}
                      alt={designScene === "intro" ? `시작 장면: 주간 달성률 ${filmStats.percent}%, ${filmStats.minutes}분` : "종료 장면: 모아온. 작은 오늘을 모아, 더 나은 나로."}
                    />}
                    <span className="scene-badge">
                      {designScene === "intro" ? "OPENING · 3s" : designScene === "outro" ? "ENDING · 2s" : "임시 장면 2"}
                    </span>
                  </div>
                  <div className="scene-controls">
                    <button
                      className={designScene === "intro" ? "selected" : ""}
                      onClick={() => {
                        setPreviewPlaying(false);
                        setAnimationTime(1.65);
                        setDesignScene("intro");
                      }}
                    >
                      시작 장면
                    </button>
                    <button
                      className={designScene === "outro" ? "selected" : ""}
                      onClick={() => {
                        setPreviewPlaying(false);
                        setAnimationTime(1);
                        setDesignScene("outro");
                      }}
                    >
                      종료 장면
                    </button>
                    <button
                      onClick={() => {
                        setPreviewPlaying(true);
                        setPreviewCycle((v) => v + 1);
                      }}
                    >
                      <Play size={13} />{" "}
                      {previewPlaying ? "재생 중" : "앞뒤 미리보기"}
                    </button>
                  </div>
                  <p className="design-note">
                    앞뒤 미리보기는 임시 장면 3개로 전환 흐름을 보여줘요. 실제 영상에는 선택한 컷이 적용됩니다.
                  </p>
                </section>
                {clips.length > 0 && (
                  <section className="card clip-list">
                    <div className="section-heading">
                      <h2>
                        나의 컷 <span>{clips.length}</span>
                      </h2>
                      <span className="subtle">순서와 구간을 조절하세요</span>
                    </div>
                    {clips.map((c, i) => (
                      <div className="clip" key={c.id}>
                        <div className="clip-head">
                          <span className="clip-index">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <button
                            className="clip-name"
                            onClick={() => setPreview(c.id)}
                          >
                            {c.file.name}
                          </button>
                          <button
                            className="icon-button"
                            aria-label={`${i + 1}번 컷 위로`}
                            disabled={!i || busy}
                            onClick={() =>
                              setClips((v) => {
                                const a = [...v];
                                [a[i - 1], a[i]] = [a[i], a[i - 1]];
                                return a;
                              })
                            }
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            className="icon-button"
                            aria-label={`${i + 1}번 컷 아래로`}
                            disabled={i === clips.length - 1 || busy}
                            onClick={() =>
                              setClips((v) => {
                                const a = [...v];
                                [a[i + 1], a[i]] = [a[i], a[i + 1]];
                                return a;
                              })
                            }
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            className="icon-button"
                            aria-label={`${i + 1}번 컷 삭제`}
                            disabled={busy}
                            onClick={() => {
                              URL.revokeObjectURL(c.url);
                              setClips((v) => v.filter((x) => x.id !== c.id));
                              if (preview === c.id) setPreview(null);
                            }}
                          >
                            <X size={17} />
                          </button>
                        </div>
                        <div className="clip-controls">
                          <label>
                            시작 (초)
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              max={c.duration}
                              value={c.start}
                              disabled={busy}
                              onChange={(e) =>
                                setClips((v) =>
                                  v.map((x) =>
                                    x.id === c.id
                                      ? { ...x, start: Number(e.target.value) }
                                      : x,
                                  ),
                                )
                              }
                            />
                          </label>
                          <span>→</span>
                          <label>
                            끝 (초)
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              max={c.duration}
                              value={c.end}
                              disabled={busy}
                              onChange={(e) =>
                                setClips((v) =>
                                  v.map((x) =>
                                    x.id === c.id
                                      ? { ...x, end: Number(e.target.value) }
                                      : x,
                                  ),
                                )
                              }
                            />
                          </label>
                          <small>
                            원본 {c.duration.toFixed(1)}초<br />
                            선택 {(c.end - c.start).toFixed(1)}초
                          </small>
                        </div>
                        {preview === c.id && (
                          <video
                            key={c.url}
                            controls
                            src={`${c.url}#t=${c.start},${c.end}`}
                            className="clip-preview"
                          />
                        )}
                      </div>
                    ))}
                  </section>
                )}
              </div>
              <aside className="export-panel card">
                <div className="section-heading">
                  <h2>내보내기</h2>
                  <span className="format-tag">MP4</span>
                </div>
                <div className="export-count">
                  {exportSeconds.toFixed(1)}
                  <small> / 60초</small>
                </div>
                <div
                  className={`export-track ${exportSeconds > 60 ? "over" : ""}`}
                >
                  <i
                    style={{
                      width: `${Math.min(100, (exportSeconds / 60) * 100)}%`,
                    }}
                  />
                </div>
                <p className="subtle">
                  {exportSeconds > 60
                    ? "브랜드 장면 5초 포함 최대 60초예요. 원본 컷을 55초 이하로 줄여주세요."
                    : invalidCuts
                      ? "각 컷의 시작과 끝 구간을 확인해주세요."
                      : `원본 ${clipSeconds.toFixed(1)}초 + 시작·종료 5초`}
                </p>
                <div className="export-spec">
                  <span>
                    디자인
                    <strong>
                      {momentThemes.find((t) => t.id === momentTheme)?.name} ·
                      앞뒤 5초
                    </strong>
                  </span>
                  <span>
                    화면 비율<strong>9:16 세로 영상</strong>
                  </span>
                  <span>
                    해상도<strong>720 × 1280</strong>
                  </span>
                  <span>
                    오디오<strong>원본 소리 유지</strong>
                  </span>
                  <span>
                    영상 보관<strong>기기에서만 처리</strong>
                  </span>
                </div>
                <button
                  className="primary export-button"
                  onClick={exportVideo}
                  disabled={
                    !clips.length ||
                    busy ||
                    loadingClips ||
                    exportSeconds > 60 ||
                    invalidCuts
                  }
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={18} />
                  ) : (
                    <Download size={18} />
                  )}
                  {busy ? "영상을 연결하고 있어요…" : "영상 만들고 다운로드"}
                </button>
                <p className="privacy-note">
                  <Leaf size={15} />
                  영상은 이 기기에서 처리되며 서버로 전송되지 않아요. 변환하는 동안 이 화면을 열어두세요.
                </p>
              </aside>
            </div>
          )}
        </div>
        <footer>
          <span>
            모아온<span className="brand-dot">.</span>
          </span>
          <small>작은 오늘을 모아</small>
          <span className="footer-right"></span>
        </footer>
      </main>
      {fullscreenOpen && (
        <div className="fullscreen-focus" role="dialog" aria-modal="true" aria-label="전체화면 집중 모드">
          <FocusAtmosphere />
          <div className="fullscreen-focus-top">
            <span className="fullscreen-brand">moaon<span className="fullscreen-brand-dot">.</span></span>
            <button ref={fullscreenCloseRef} type="button" className="fullscreen-close" onClick={closeFullscreen} aria-label="전체화면 닫기"><X size={22} /></button>
          </div>
          <div className="fullscreen-focus-heading">
            <span>{active ? timer?.started ? "집중 중" : "일시정지" : "선택한 루틴"}</span>
            <h2>{focus?.name || "먼저 루틴을 만들어주세요"}</h2>
          </div>
          <div className="fullscreen-clock" role="timer" aria-label={`집중 시간 ${time(elapsed)}`}>
            <ClockDisplay value={time(elapsed)} />
          </div>
          <YuriWander progress={progress} className="fullscreen-yuri-stage" />
          <div className="fullscreen-actions">
            <button className="fullscreen-start" disabled={!focus} onClick={() => timer?.started ? setTimer({ ...timer, elapsed, started: null }) : focus && start(focus.id)}>
              {timer?.started ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              {timer?.started ? "잠시 쉬기" : timer ? "이어서 집중하기" : "타이머 시작"}
            </button>
            {timer && <button className="fullscreen-save" disabled={elapsed < 1} onClick={saveTimer}><Check size={18} /> 기록 저장</button>}
          </div>
        </div>
      )}
      {(tab === "today" || tab === "history") && !modal && (
        <div className={`scroll-tip ${showScrollTip ? "is-visible" : ""}`} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
            <path d="M7 7l5 5 5-5M7 12l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      <nav className="mobile-nav">
        {nav.map((n) => (
          <button
            className={tab === n.id ? "active" : ""}
            aria-current={tab === n.id ? "page" : undefined}
            key={n.id}
            onClick={() => setTab(n.id)}
          >
            <n.icon size={21} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
      <dialog
        ref={dialogRef}
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModal(null);
        }}
      >
        <div className="modal">
          <div className="section-heading">
            <h2>
              {modal === "goal"
                ? editing
                  ? "루틴 수정"
                  : "새로운 작은 약속"
                : "실천한 시간 기록"}
            </h2>
            <button
              className="icon-button"
              aria-label="닫기"
              onClick={() => setModal(null)}
            >
              <X size={22} />
            </button>
          </div>
          <p className="subtle">
            {modal === "goal"
              ? "월요일부터 일요일까지, 한 주에 실천할 시간을 정해요."
              : "타이머를 켜지 않았어도 괜찮아요."}
          </p>
          <form onSubmit={submit}>
            {modal === "goal" ? (
              <>
                <label>
                  어떤 루틴을 만들까요?
                  <input
                    autoFocus
                    required
                    maxLength={40}
                    placeholder="예: 아침 스트레칭"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label>루틴 아이콘</label>
                <div className="icon-picker">
                  {icons.map((Icon, i) => (
                    <button
                      type="button"
                      aria-label={["독서", "운동", "마음챙김", "음악"][i]}
                      aria-pressed={icon === i}
                      className={icon === i ? "selected" : ""}
                      key={i}
                      onClick={() => setIcon(i)}
                    >
                      <Icon size={23} />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <label>
                  어떤 루틴을 했나요?
                  <select
                    value={recordRoutine}
                    onChange={(e) => setRecordRoutine(e.target.value)}
                    required
                  >
                    {routines.map((r) => (
                      <option value={r.id} key={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  기록할 날짜
                  <input
                    type="date"
                    required
                    max={dateKey()}
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                  />
                </label>
              </>
            )}
            <label>
              {modal === "goal" ? "주간 목표 시간 (분)" : "실천한 시간 (분)"}
              <input
                type="number"
                min="1"
                max={modal === "goal" ? 10080 : 1440}
                step="1"
                required
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </label>
            <div className="minute-presets">
              {(modal === "goal" ? [30, 60, 120, 180] : [10, 15, 30, 60]).map(
                (m) => (
                  <button
                    type="button"
                    onClick={() => setMinutes(String(m))}
                    key={m}
                    className={Number(minutes) === m ? "selected" : ""}
                  >
                    {m}분
                  </button>
                ),
              )}
            </div>
            <button className="primary" type="submit">
              <Check size={18} />
              {modal === "goal" ? "루틴 저장하기" : "기록 저장하기"}
            </button>
            {editing && modal === "goal" && (
              <button
                type="button"
                className="delete-button"
                onClick={() => {
                  if (timer?.routineId === editing) {
                    setToast("타이머를 먼저 저장해주세요.");
                    return;
                  }
                  if (
                    confirm("이 루틴을 삭제할까요? 이전 기록은 유지됩니다.")
                  ) {
                    setRoutines((v) => v.filter((r) => r.id !== editing));
                    setModal(null);
                  }
                }}
              >
                이 루틴 삭제
              </button>
            )}
          </form>
        </div>
      </dialog>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
