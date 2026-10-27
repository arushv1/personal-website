const smooth = (value, min, max) => {
  const t=Math.max(0,Math.min(1,(value-min)/(max-min)));
  return t*t*(3-2*t);
};

// Shared illustrative registration for bone, vessels, cortex and their markers.
// Front/side overlays place the avatar's eyes and jaw above the atlas landmarks.
// Lift the head while smoothly extending the neck, leaving the shoulder base in
// place. Fit the generic adult cranium inside the stylized bust's shorter depth.
// Apply once to the original anatomy coordinates; never to the avatar or sources.
export function registerAnatomyPoint(x,y,z) {
  const lower=1-smooth(y,-.8,.15);
  const head=smooth(y,-1.05,-.05);
  const neckY=y<.15?.15+(y-.15)*.55:y;
  const neckZ=z*(1-.12*lower);
  return [
    x*(1-.14*lower)*(1-.08*head),
    neckY+.42*head-.10*smooth(y,.8,1.75),
    neckZ+head*(.18*(1-neckZ)+.04),
  ];
}
