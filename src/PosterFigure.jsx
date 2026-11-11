import {useEffect,useRef,useState} from 'react';
import {ArrowsOut,ArrowUpRight,Minus,Plus,X} from '@phosphor-icons/react';

const levels=[1,1.5,2,3,4,6,8];
// A poster preview that opens a zoomable viewer. Panning is native scrolling
// (wheel, touch, keyboard), plus mouse drag; state stays local to the entry.
export function PosterFigure({poster,title}) {
  const dialog=useRef(null),stage=useRef(null),drag=useRef(null),[open,setOpen]=useState(false),[level,setLevel]=useState(0),[width,setWidth]=useState(0);
  // Stop zooming once the image would be drawn well beyond its real pixels.
  const maxLevel=Math.max(0,levels.findLastIndex(scale=>scale===1||!width||width*scale<=poster.width*1.3));
  useEffect(()=>{
    const el=dialog.current;
    if(open&&!el.open){el.showModal();stage.current?.focus({preventScroll:true});}
    else if(!open&&el.open)el.close();
    if(!open)return;
    const measure=()=>setWidth(stage.current?.clientWidth||0);
    measure();const observer=new ResizeObserver(measure);observer.observe(el);
    return()=>observer.disconnect();
  },[open]);
  function zoom(next){
    const el=stage.current,x=(el.scrollLeft+el.clientWidth/2)/el.scrollWidth,y=(el.scrollTop+el.clientHeight/2)/el.scrollHeight;
    setLevel(next);
    // Keep the same part of the poster centered after the image resizes.
    requestAnimationFrame(()=>{el.scrollLeft=x*el.scrollWidth-el.clientWidth/2;el.scrollTop=y*el.scrollHeight-el.clientHeight/2;});
  }
  function pointerDown(event){
    if(event.pointerType!=='mouse'||event.button!==0)return;
    drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,left:stage.current.scrollLeft,top:stage.current.scrollTop};
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerMove(event){
    const start=drag.current;if(start?.id!==event.pointerId)return;
    stage.current.scrollLeft=start.left-(event.clientX-start.x);stage.current.scrollTop=start.top-(event.clientY-start.y);
  }
  function keyDown(event){
    if(event.key==='+'||event.key==='='){event.preventDefault();if(level<maxLevel)zoom(level+1);}
    if(event.key==='-'){event.preventDefault();if(level>0)zoom(level-1);}
  }
  const close=()=>{setOpen(false);setLevel(0);};
  return <figure className="entry-poster">
    <button className="poster-open" onClick={()=>setOpen(true)} aria-label={`Open the poster viewer: ${title}`}>
      <img src={poster.preview||poster.src} alt={poster.alt} width={poster.width} height={poster.height} loading="lazy" decoding="async"/>
      <span className="poster-enlarge" aria-hidden="true"><ArrowsOut size={13}/>View poster</span>
    </button>
    {poster.caption&&<figcaption>{poster.caption}</figcaption>}
    <dialog ref={dialog} className="poster-dialog" aria-label={`Poster: ${title}`} onCancel={close} onClose={close} onClick={event=>{if(event.target===dialog.current)close();}}>
      {open&&<>
        <div className="poster-toolbar">
          <span aria-live="polite">{Math.round(levels[level]*100)}%</span>
          <button aria-label="Zoom out" disabled={level===0} onClick={()=>zoom(level-1)}><Minus size={17}/></button>
          <button aria-label="Zoom in" disabled={level>=maxLevel} onClick={()=>zoom(level+1)}><Plus size={17}/></button>
          <a href={poster.src} target="_blank" rel="noreferrer">Full image<ArrowUpRight size={13}/></a>
          <button className="poster-close" aria-label="Close poster" onClick={close}><X size={20}/></button>
        </div>
        <div ref={stage} className="poster-stage" data-zoomed={level>0} tabIndex={0} role="region" aria-label="Poster. Scroll or drag to pan; plus and minus zoom." onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onKeyDown={keyDown}>
          <img src={poster.src} alt={poster.alt} width={poster.width} height={poster.height} style={{width:levels[level]*100+'%'}} draggable={false}/>
        </div>
      </>}
    </dialog>
  </figure>;
}
