import {useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight} from '@phosphor-icons/react';

// Photo state stays local so browsing images never updates the 3D scene.
export function EntryPhotos({photos,title}) {
  const track=useRef(null),[active,setActive]=useState(0);
  if(!photos?.length)return null;
  function move(index){
    track.current.scrollTo({left:index*track.current.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  function onKeyDown(event){
    if(event.target!==event.currentTarget)return;
    const index={ArrowLeft:Math.max(0,active-1),ArrowRight:Math.min(photos.length-1,active+1),Home:0,End:photos.length-1}[event.key];
    if(index===undefined)return;
    event.preventDefault();event.stopPropagation();move(index);
  }
  return <div className="entry-photos" role="group" aria-label={`${title} photos`}>
    <div className="photo-track" ref={track} role="region" tabIndex={photos.length>1?0:undefined} aria-label={`${title} photo gallery`} onKeyDown={onKeyDown} onScroll={event=>setActive(Math.max(0,Math.min(photos.length-1,Math.round(event.currentTarget.scrollLeft/event.currentTarget.clientWidth))))}>
      {photos.map(photo=><figure className="entry-photo" key={photo.src}>
        <a className="photo-frame" href={photo.src} target="_blank" rel="noreferrer" aria-label={`Open full-size photo: ${photo.alt} (new tab)`}><img src={photo.src} alt={photo.alt} loading="lazy" decoding="async"/><span className="photo-enlarge" aria-hidden="true">View full size <ArrowUpRight size={12}/></span></a>
        {photo.caption&&<figcaption>{photo.caption}</figcaption>}
      </figure>)}
    </div>
    {photos.length>1&&<div className="photo-toolbar">
      <button aria-label={`Previous ${title} photo`} disabled={active===0} onClick={()=>move(active-1)}><ArrowLeft size={15}/>Previous</button>
      <span aria-live="polite" aria-atomic="true">{active+1} / {photos.length}</span>
      <button aria-label={`Next ${title} photo`} disabled={active===photos.length-1} onClick={()=>move(active+1)}>Next<ArrowRight size={15}/></button>
    </div>}
  </div>;
}
