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

// Smooth, global transfer between whole model views; no spatial wipe.
// The final view renders vessels and cortex together with normal 3D occlusion.
export function layerBlend(value) {
  let from,to,weight;
  if(value<34){from=0;to=1;weight=smooth(value,4,32);}
  else if(value<68){from=1;to=2;weight=smooth(value,38,68);}
  else {from=2;to=3;weight=smooth(value,76,98);}
  if(weight===0)return {from,to:from,weight:0};
  if(weight===1)return {from:to,to,weight:0};
  return {from,to,weight};
}

// Density is the preview's default. Both accepted earlier effects remain usable
// as explicit comparisons; deployment of this branch is preview-only.
export function revealMode(search='') {
  const mode=new URLSearchParams(search).get('reveal');
  return ['section','blend'].includes(mode)?mode:'density';
}
