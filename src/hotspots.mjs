const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

// Keep compact labels in two close gutters beside the head. They clear the
// feature dots without returning to the wide, full-view label rails.
export function layoutHotspots(points,width,height) {
  if(!points.length)return {};
  const margin=8,gap=4,labelHeight=44;
  const groups={left:points.filter(p=>p.side==='left'),right:points.filter(p=>p.side==='right')};
  const maxWidth=side=>Math.max(0,...groups[side].map(p=>p.width));
  const xs=points.map(p=>p.x).sort((a,b)=>a-b);
  const split=clamp(xs[Math.floor(xs.length/2)],maxWidth('left')+margin*2,width-maxWidth('right')-margin*2);
  const clearance=clamp(width*.2,62,106);
  const leftEdge=clamp(Math.min(Math.min(...points.map(p=>p.x))-26,split-clearance),maxWidth('left')+margin,split-gap);
  const rightEdge=clamp(Math.max(Math.max(...points.map(p=>p.x))+26,split+clearance),split+gap,width-maxWidth('right')-margin);
  const result={};
  for(const [side,group] of Object.entries(groups)){
    const sorted=[...group].sort((a,b)=>a.y-b.y||a.id.localeCompare(b.id));
    const placed=[];
    for(const point of sorted){
      const preferredX=side==='left'?leftEdge-point.width:rightEdge;
      const x=clamp(preferredX,margin,width-point.width-margin);
      const desiredY=clamp(point.y-labelHeight/2,margin,height-labelHeight-margin);
      const y=Math.max(desiredY,placed.length?placed.at(-1).y+labelHeight+gap:margin);
      placed.push({...point,x,y});
    }
    for(let i=placed.length-1;i>=0;i--){
      placed[i].y=Math.min(placed[i].y,i===placed.length-1?height-labelHeight-margin:placed[i+1].y-labelHeight-gap);
      result[placed[i].id]={x:placed[i].x,y:placed[i].y,width:placed[i].width,height:labelHeight};
    }
  }
  return result;
}
