const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

// Place small labels beside their projected dots. Resolve vertical collisions
// locally, rather than reserving wide rails along the edges of the viewer.
export function layoutHotspots(points,width,height) {
  if(!points.length)return {};
  const margin=8,gap=4,labelHeight=44;
  const groups={left:points.filter(p=>p.side==='left'),right:points.filter(p=>p.side==='right')};
  const maxWidth=side=>Math.max(0,...groups[side].map(p=>p.width));
  const xs=points.map(p=>p.x).sort((a,b)=>a-b);
  const split=clamp(xs[Math.floor(xs.length/2)],maxWidth('left')+margin*2,width-maxWidth('right')-margin*2);
  const result={};
  for(const [side,group] of Object.entries(groups)){
    const sorted=[...group].sort((a,b)=>a.y-b.y||a.id.localeCompare(b.id));
    const placed=[];
    for(const point of sorted){
      const preferredX=side==='left'?Math.min(point.x-point.width-12,split-point.width-gap):Math.max(point.x+12,split+gap);
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
