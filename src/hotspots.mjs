import {sections} from './content/portfolio.mjs';
// Keep the navigation labels stable while the 3D anchors move underneath them.
export function calloutPosition(section,width,height) {
  const count=sections.filter(item=>item.callout.side===section.callout.side).length;
  const labelWidth=Math.min(142,Math.max(104,width*.23));
  const top=36,bottom=Math.max(top,height-80);
  return {x:section.callout.side==='left'?8:width-labelWidth-8,y:top+(bottom-top)*section.callout.rank/Math.max(1,count-1),width:labelWidth};
}
