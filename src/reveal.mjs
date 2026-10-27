// Exponential damping has the same response time at every frame rate.
export function damp(current, target, dt, timeConstant = .045) {
  return target + (current - target) * Math.exp(-Math.max(0, dt) / timeConstant);
}
const smooth = (x, a, b) => { const t = Math.max(0, Math.min(1, (x-a)/(b-a))); return t*t*(3-2*t); };
export function revealState(value) {
  return {
    // Move a narrow section from above the hair to below the shoulders.
    cut: 2.65 - smooth(value, 0, 34) * 4.2,
    boneCut: 2.65 - smooth(value, 38, 68) * 4.2,
    brainCut: 2.65 - smooth(value, 76, 100) * 4.2,
  };
}
