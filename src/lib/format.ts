/** Human-friendly time + countdown helpers. */

export function formatNightDate(epoch: number): string {
  const d = new Date(epoch);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatClock(epoch: number): string {
  return new Date(epoch).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export type Countdown = {
  done: boolean;
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
};

export function countdownTo(target: number, now: number): Countdown {
  const diff = Math.max(0, target - now);
  const done = diff <= 0;
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const label = done
    ? 'Unlocked'
    : hours > 0
      ? `${hours}h ${pad(minutes)}m`
      : `${pad(minutes)}:${pad(seconds)}`;

  return { done, hours, minutes, seconds, label };
}

/** Next occurrence of `hour:minute` strictly in the future. Used for the 10 AM reveal. */
export function nextTimeAt(hour: number, minute: number, now: number): number {
  const d = new Date(now);
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= now) {
    d.setDate(d.getDate() + 1);
  }
  return d.getTime();
}
