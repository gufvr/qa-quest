import { selectHomeInsight } from "./home-insights.js";

export function delayUntilLocalMidnight(date) {
  const next = new Date(date.getTime());
  next.setHours(24, 0, 0, 0);
  return Math.max(1, next.getTime() - date.getTime() + 50);
}

export function createHomeInsightController({
  getState,
  render,
  canRender = () => true,
  now = () => new Date(),
  win = window,
  doc = document,
}) {
  const events = new AbortController();
  const options = { signal: events.signal };
  let timer;
  let lastId;
  let suspended = false;
  let destroyed = false;

  function stopTimer() {
    win.clearTimeout(timer);
    timer = undefined;
  }

  function schedule(date) {
    stopTimer();
    if (!destroyed && !suspended && !doc.hidden) {
      timer = win.setTimeout(refresh, delayUntilLocalMidnight(date));
    }
  }

  function update(state, recommendation) {
    if (destroyed) return;
    const date = now();
    const insight = selectHomeInsight(state, { date, recommendation });
    if (insight.id !== lastId && canRender()) {
      render(insight);
      lastId = insight.id;
    }
    schedule(date);
  }

  function refresh() {
    if (destroyed || suspended || doc.hidden) return;
    update(getState());
  }

  win.addEventListener("focus", refresh, options);
  win.addEventListener(
    "pageshow",
    () => {
      suspended = false;
      refresh();
    },
    options,
  );
  win.addEventListener(
    "pagehide",
    () => {
      suspended = true;
      stopTimer();
    },
    options,
  );
  doc.addEventListener(
    "visibilitychange",
    () => {
      if (doc.hidden) stopTimer();
      else refresh();
    },
    options,
  );

  return {
    update,
    refresh,
    destroy() {
      destroyed = true;
      stopTimer();
      events.abort();
    },
  };
}
