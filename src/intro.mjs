// Scroll-driven opening. Page progress (0..1) maps onto the same 0..100 reveal
// value the "Look within" slider uses, so both always describe one state.
export const layerStops=[
  {value:0,name:'You'},
  {value:34,name:'Bone'},
  {value:72,name:'Vessels'},
  {value:100,name:'Within'},
];
const stops=layerStops.map(stop=>stop.value);
const clamp01=value=>Math.max(0,Math.min(1,value));
const ease=t=>t*t*(3-2*t);

// Which named layer a reveal value belongs to (shared by the slider label,
// the opening captions and the scan overlay).
export function layerIndex(reveal){return reveal<17?0:reveal<53?1:reveal<86?2:3;}

// Each layer rests around its stop (`hold` of a segment on either side), so its
// caption can be read before the next transfer begins.
export function introReveal(progress,hold=.16){
  const p=clamp01(progress)*(stops.length-1);
  const index=Math.min(stops.length-2,Math.floor(p));
  const t=clamp01((p-index-hold)/(1-2*hold));
  return stops[index]+(stops[index+1]-stops[index])*ease(t);
}

// Inverse of introReveal, used when the slider or a layer button moves the page.
export function introProgressFor(reveal,hold=.16){
  const value=Math.max(0,Math.min(100,reveal));
  const exact=stops.indexOf(value);
  if(exact>=0)return exact/(stops.length-1);
  const index=stops.findIndex((stop,i)=>i<stops.length-1&&value<stops[i+1]);
  const y=(value-stops[index])/(stops[index+1]-stops[index]);
  const t=.5-Math.sin(Math.asin(1-2*y)/3); // inverse smoothstep
  return (index+hold+t*(1-2*hold))/(stops.length-1);
}

// One caption per internal layer. Each line names the sections that open from
// that structure in the atlas; edit the wording here.
export const introCaptions=[
  {layer:'Bone',title:'Structure',text:'Education, courses and the milestones that hold everything up.'},
  {layer:'Vessels',title:'Flow',text:'Experience: research and engineering, carried into practice.'},
  {layer:'Within',title:'Ideas',text:'Projects and publications, where curiosity becomes something built.'},
];
