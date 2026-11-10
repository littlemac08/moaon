import { CalendarGhost } from "../components/calendar-ghost";

export default function CalendarPreview() {
  return (
    <main className="calendar-preview">
      <div className="calendar-preview-heading"><span>모아온</span><a href="/">돌아가기</a></div>
      <div className="calendar-preview-intro"><span>미리보기</span><h1>기록이 쌓이는 달력</h1><p>실제 기록과 관계없는 예시입니다.</p></div>
      <section className="calendar-preview-card" aria-label="유령 달력 예시">
        <div className="calendar-preview-month">2026년 11월</div>
        <div className="calendar-preview-grid calendar-preview-weekdays">{["월", "화", "수", "목", "금", "토", "일"].map(day => <span key={day}>{day}</span>)}</div>
        <div className="calendar-preview-grid">
          {Array.from({ length: 42 }, (_, index) => {
            const day = index - 5;
            if (day < 1 || day > 30) return <span key={index} />;
            const progress = day === 10 ? 50 : day === 14 ? 100 : null;
            return <span className={`calendar-preview-day ${day > 14 ? "is-future" : ""}`} key={index}>
              <span className={`calendar-date-row ${day === 10 ? "preview-selected" : ""}`}>
                <CalendarGhost progress={progress ?? 0} />
                <span className="calendar-date">{day}</span>
              </span>
            </span>;
          })}
        </div>
      </section>
      <div className="calendar-preview-key"><span><b>10일</b> 주간 목표 50%</span><span><b>14일</b> 주간 목표 100%</span></div>
    </main>
  );
}
