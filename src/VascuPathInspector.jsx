import {useEffect,useId,useRef,useState} from 'react';
import {ArrowSquareOut,ArrowsClockwise,Crosshair,Minus,Plus} from '@phosphor-icons/react';
import {vascupathFigures} from './content/vascupath.mjs';
import './vascupath-inspector.css';

const figures=Object.fromEntries(vascupathFigures.map(figure=>[figure.id,figure]));
const initialView=figure=>({scale:1,x:0,y:0,u:figure?.initialRegion?.u??.52,v:figure?.initialRegion?.v??.59});
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function VascuPathInspector(){
 const id=useId(),viewport=useRef(null),drag=useRef(null);
 const [selected,setSelected]=useState('predictions'),[views,setViews]=useState(()=>Object.fromEntries(vascupathFigures.map(figure=>[figure.viewGroup||figure.id,initialView(figure)])));
 const [size,setSize]=useState({width:0,height:0,pixelRatio:1}),[loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false);
 const figure=figures[selected],group=figure.viewGroup||selected,view=views[group]||initialView(figure);
 const pixelSnap=value=>Math.round(value*size.pixelRatio)/size.pixelRatio;
 const baseWidth=Math.max(1,pixelSnap(Math.min(size.width,size.height*figure.width/figure.height,figure.width)));
 const baseHeight=baseWidth*figure.height/figure.width;
 const imageWidth=pixelSnap(baseWidth*view.scale),imageHeight=imageWidth*figure.height/figure.width;
 const maxX=Math.max(0,(imageWidth-size.width)/2),maxY=Math.max(0,(imageHeight-size.height)/2);
 const panX=clamp(view.x,-maxX,maxX),panY=clamp(view.y,-maxY,maxY);
 const left=pixelSnap((size.width-imageWidth)/2+panX),top=pixelSnap((size.height-imageHeight)/2+panY);
 const point={x:left+view.u*imageWidth,y:top+view.v*imageHeight};

 useEffect(()=>{
  const node=viewport.current;
  const resize=()=>{const box=node.getBoundingClientRect();setSize({width:box.width,height:box.height,pixelRatio:Math.max(1,window.devicePixelRatio||1)});};
  resize();const observer=new ResizeObserver(resize);observer.observe(node);window.addEventListener('resize',resize);
  return()=>{observer.disconnect();window.removeEventListener('resize',resize);};
 },[]);
 function update(change){setViews(previous=>({...previous,[group]:typeof change==='function'?change(previous[group]||initialView(figure)):{...(previous[group]||initialView(figure)),...change}}));}
 function choose(key){if(key===selected)return;drag.current=null;setSelected(key);setLoaded(false);setFailed(false);}
 function reset(){update(initialView(figure));}
 function zoom(factor){
  update(current=>{
   const scale=clamp(Number((current.scale*factor).toFixed(3)),1,6);
   const xLimit=Math.max(0,(baseWidth*scale-size.width)/2),yLimit=Math.max(0,(baseHeight*scale-size.height)/2);
   return {...current,scale,x:clamp(panX*scale/current.scale,-xLimit,xLimit),y:clamp(panY*scale/current.scale,-yLimit,yLimit)};
  });
 }
 function pick(event){
  const rect=viewport.current.getBoundingClientRect();
  const u=(event.clientX-rect.left-left)/imageWidth,v=(event.clientY-rect.top-top)/imageHeight;
  if(u>=0&&u<=1&&v>=0&&v<=1)update({u,v});
 }
 function pointerDown(event){
  if(event.button!==0)return;
  viewport.current.focus({preventScroll:true});pick(event);
  if(view.scale<=1)return;
  event.preventDefault();drag.current={id:event.pointerId,startX:event.clientX,startY:event.clientY,x:panX,y:panY};
  event.currentTarget.setPointerCapture(event.pointerId);
 }
 function pointerMove(event){
  if(drag.current?.id===event.pointerId){
   const current=drag.current;
   update({x:clamp(current.x+event.clientX-current.startX,-maxX,maxX),y:clamp(current.y+event.clientY-current.startY,-maxY,maxY)});
  }else if(event.pointerType!=='touch')pick(event);
 }
 function pointerEnd(event){if(drag.current?.id===event.pointerId)drag.current=null;}
 function keyDown(event){
  if(event.key==='+'||event.key==='='){event.preventDefault();zoom(1.35);}
  else if(event.key==='-'){event.preventDefault();zoom(1/1.35);}
  else if(event.key==='Home'){event.preventDefault();reset();}
  else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
   event.preventDefault();const x=event.key==='ArrowLeft'?-.05:event.key==='ArrowRight'?.05:0,y=event.key==='ArrowUp'?-.05:event.key==='ArrowDown'?.05:0;
   const u=clamp(view.u+x,0,1),v=clamp(view.v+y,0,1),positionX=left+u*imageWidth,positionY=top+v*imageHeight;
   const moveX=positionX<24?24-positionX:positionX>size.width-24?size.width-24-positionX:0;
   const moveY=positionY<24?24-positionY:positionY>size.height-24?size.height-24-positionY:0;
   update({u,v,x:clamp(panX+moveX,-maxX,maxX),y:clamp(panY+moveY,-maxY,maxY)});
  }
 }
 const magnifierWidth=pixelSnap(baseWidth*3),magnifierHeight=magnifierWidth*figure.height/figure.width;
 return <section className="vascu-inspector" aria-label="VascuPath research slide inspector">
  <div className="vascu-image-tabs" role="group" aria-label="Research image views">
   {Object.entries(figures).map(([key,item])=><button key={key} type="button" aria-pressed={selected===key} onClick={()=>choose(key)}>{item.label}</button>)}
  </div>
  <div ref={viewport} className={`vascu-image-viewport${view.scale>1?' is-zoomed':''}`} role="region" tabIndex={0} aria-label={`${figure.label} research image viewer`} aria-describedby={id+'-hint'} style={{touchAction:view.scale>1?'none':'pan-y'}} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd} onKeyDown={keyDown}>
   <img className="vascu-source-image" src={figure.src} width={figure.width} height={figure.height} alt={figure.alt} draggable={false} decoding="async" onLoad={()=>setLoaded(true)} onError={()=>{setFailed(true);setLoaded(false);}} style={{width:imageWidth,height:imageHeight,left,top}}/>
   {loaded&&<Crosshair className="vascu-region-target" size={30} weight="light" aria-hidden="true" style={{left:point.x,top:point.y}}/>}
   {!loaded&&!failed&&<span className="vascu-image-status" role="status">Loading research image…</span>}
   {failed&&<span className="vascu-image-status" role="alert">The figure could not load. <a href={figure.src} target="_blank" rel="noreferrer">Open the source image</a>.</span>}
  </div>
  <p className="vascu-image-caption">{figure.caption}</p>
  {figure.legend?.length>0&&<ul className="vascu-class-legend" aria-label="Tile prediction classes">{figure.legend.map(item=><li key={item.label}><span className="vascu-class-key" style={{background:item.color}}/>{item.label}</li>)}</ul>}
  <div className="vascu-image-toolbar">
   <div className="vascu-image-zoom" role="group" aria-label="Image zoom controls">
    <button type="button" disabled={view.scale<=1} onClick={()=>zoom(1/1.35)}><Minus size={17}/><span>Zoom out</span></button>
    <button type="button" disabled={view.scale>=6} onClick={()=>zoom(1.35)}><Plus size={17}/><span>Zoom in</span></button>
    <button type="button" onClick={reset}><ArrowsClockwise size={17}/><span>Reset image</span></button>
   </div>
   <a href={figure.src} target="_blank" rel="noreferrer" title={`Original source: ${figure.width} × ${figure.height} pixels`} aria-label={`Open full ${figure.label.toLowerCase()} figure in a new tab`}><ArrowSquareOut size={17}/><span>Open full figure</span></a>
  </div>
  <p id={id+'-hint'} className="vascu-image-hint">Select a region · Zoom in, then drag to pan.<span className="vascu-sr-only"> With the image focused, use + / − to zoom, arrow keys to select a region, and Home to reset.</span></p>
  <div className="vascu-region-detail">
   <div className="vascu-magnifier" role="img" aria-label={`Three-times display magnification of the selected ${figure.label.toLowerCase()} image region`}>
    <img src={figure.src} alt="" aria-hidden="true" draggable={false} decoding="async" style={{width:magnifierWidth,height:magnifierHeight,left:`calc(50% - ${pixelSnap(view.u*magnifierWidth)}px)`,top:`calc(50% - ${pixelSnap(view.v*magnifierHeight)}px)`}}/>
   </div>
   <div><p className="vascu-detail-title">Selected region <span>· 3× view</span></p><p>Move across the image or use the arrow keys to inspect a region.</p><p className="vascu-figure-source">From the VascuPath research presentation.</p></div>
  </div>
  <span className="vascu-sr-only" aria-live="polite" aria-atomic="true">{figure.label} image. Zoom {Math.round(view.scale*100)} percent.</span>
 </section>;
}
