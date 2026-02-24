/**
 * Reusable countdown module.
 *
 * Markup contract:
 * - container: `.cl-countdown` (or custom selector)
 * - container attribute: `data-deadline="2026-02-28T23:59:59-08:00"`
 * - value nodes:
 *   - `[data-countdown-days]`
 *   - `[data-countdown-hours]`
 *   - `[data-countdown-minutes]`
 *   - `[data-countdown-seconds]`
 */
(() => {
  const timers = new WeakMap();

  const pad2 = (value) => String(value).padStart(2, "0");

  const readNode = (container, attr) => container.querySelector(`[${attr}]`);

  const render = (container, totalMs) => {
    const daysNode = readNode(container, "data-countdown-days");
    const hoursNode = readNode(container, "data-countdown-hours");
    const minsNode = readNode(container, "data-countdown-minutes");
    const secsNode = readNode(container, "data-countdown-seconds");
    if (!daysNode || !hoursNode || !minsNode || !secsNode) return false;

    const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    daysNode.textContent = pad2(days);
    hoursNode.textContent = pad2(hours);
    minsNode.textContent = pad2(minutes);
    secsNode.textContent = pad2(seconds);
    return true;
  };

  const mount = (container) => {
    const deadlineRaw = container.dataset.deadline;
    const deadlineMs = deadlineRaw ? new Date(deadlineRaw).getTime() : NaN;
    if (!Number.isFinite(deadlineMs)) return;

    const oldTimer = timers.get(container);
    if (oldTimer) window.clearInterval(oldTimer);

    const tick = () => {
      const remaining = deadlineMs - Date.now();
      if (remaining <= 0) {
        render(container, 0);
        container.classList.add("is-expired");
        return false;
      }
      container.classList.remove("is-expired");
      return render(container, remaining);
    };

    const alive = tick();
    if (!alive) return;

    const timer = window.setInterval(() => {
      if (!tick()) {
        window.clearInterval(timer);
        timers.delete(container);
      }
    }, 1000);

    timers.set(container, timer);
  };

  const initAll = (selector = ".cl-countdown") => {
    document.querySelectorAll(selector).forEach(mount);
  };

  window.HeeriseCountdown = {
    initAll,
    mount,
  };
})();
