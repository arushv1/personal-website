// Scan-viewer readouts and hover-preview camera maths. Kept free of Three.js
// and the DOM so they can be regression-tested with plain Node.
import {layerStops,layerIndex} from './intro.mjs';

const opposite={L:'R',R:'L',A:'P',P:'A'};
// The avatar faces +Z, so its left side is +X. `theta` is the camera's angle
// around the vertical axis (0 = in front). Like a radiology viewer, a frontal
// view shows the subject's left on the right-hand edge of the screen.
export function orientationLabels(theta){
  const quarter=((Math.round(theta/(Math.PI/2))%4)+4)%4;
  const right=['L','P','R','A'][quarter];
  return {left:opposite[right],right};
}

export function toSpherical(position,target){
  const x=position[0]-target[0],y=position[1]-target[1],z=position[2]-target[2];
  const radius=Math.hypot(x,y,z)||1;
  return {radius,theta:Math.atan2(x,z),phi:Math.acos(Math.max(-1,Math.min(1,y/radius)))};
}
export function fromSpherical({radius,theta,phi},target){
  const flat=radius*Math.sin(phi);
  return [target[0]+flat*Math.sin(theta),target[1]+radius*Math.cos(phi),target[2]+flat*Math.cos(theta)];
}

const signed=(degrees,width)=>(degrees<0?'-':'+')+String(Math.abs(degrees)).padStart(width,'0')+'°';
// Every value is derived from the live scene; nothing imitates patient data.
export function scanReadout({reveal,position,target,baseRadius,view,preview}){
  const {radius,theta,phi}=toSpherical(position,target);
  const azimuth=Math.round(theta*180/Math.PI),elevation=Math.round(90-phi*180/Math.PI);
  return {
    layer:'LAYER · '+layerStops[layerIndex(reveal)].name,
    image:'IM '+String(Math.round(Math.max(0,Math.min(100,reveal)))).padStart(3,'0')+' / 100',
    zoom:'ZOOM '+(baseRadius/radius).toFixed(2)+'×',
    angle:'AZ '+signed(azimuth,3)+'  EL '+signed(elevation,2),
    view:(preview?'PREVIEW · ':'VIEW · ')+(preview||view),
    ...orientationLabels(theta),
  };
}

const shortest=angle=>Math.atan2(Math.sin(angle),Math.cos(angle));
const limit=(value,max)=>Math.max(-max,Math.min(max,value));
// A hover "peek": a small, bounded move from the current pose toward a
// section's preset view. It never reaches the preset; selecting does that.
export function peekPose(from,to,{amount=.2,maxTheta=.17,maxPhi=.09,push=.04,maxTarget=.12,minRadius=2.5}={}){
  const a=toSpherical(from.position,from.target),b=toSpherical(to.position,to.target);
  const offset=to.target.map((value,i)=>(value-from.target[i])*amount);
  const length=Math.hypot(...offset),scale=length>maxTarget?maxTarget/length:1;
  const target=from.target.map((value,i)=>value+offset[i]*scale);
  const pose={
    radius:Math.max(Math.min(a.radius,minRadius),a.radius*(1-push)),
    theta:a.theta+limit(shortest(b.theta-a.theta)*amount,maxTheta),
    phi:a.phi+limit((b.phi-a.phi)*amount,maxPhi),
  };
  return {position:fromSpherical(pose,target),target};
}
