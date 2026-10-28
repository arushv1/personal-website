import {memo,useEffect,useRef,useState} from 'react';
import {ArrowDown,ArrowUp,ArrowUpRight,ArrowRight} from '@phosphor-icons/react';
import {EntryPhotos} from './EntryPhotos';

export const SectionReader=memo(function SectionReader({section,onExplore}) {
  const reader=useRef(null),entries=useRef({}),[active,setActive]=useState(()=>section.items.some(i=>i.id===location.hash.slice(1))?location.hash.slice(1):section.items[0]?.id);
  const activeIndex=Math.max(0,section.items.findIndex(i=>i.id===active));
  function jump(id,behavior){
    const entry=entries.current[id];if(!entry)return;
    setActive(id);
    const container=reader.current;
    container.scrollTo({top:container.scrollTop+entry.getBoundingClientRect().top-container.getBoundingClientRect().top,behavior:behavior||(matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth')});
  }
  useEffect(()=>{
    const observer=new IntersectionObserver(()=>{
      const bounds=reader.current.getBoundingClientRect();
      const first=section.items.find(item=>{const rect=entries.current[item.id]?.getBoundingClientRect();return rect&&rect.bottom>bounds.top+20&&rect.top<bounds.bottom;});
      if(first)setActive(first.id);
    },{root:reader.current,threshold:[0,.1,.25,.5,.75,1]});
    Object.values(entries.current).forEach(entry=>observer.observe(entry));
    return()=>observer.disconnect();
  },[section]);
  useEffect(()=>{
    const restore=()=>{const id=location.hash.slice(1);if(section.items.some(i=>i.id===id))jump(id,'instant');};
    const frame=requestAnimationFrame(restore);window.addEventListener('hashchange',restore);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('hashchange',restore);};
  },[section]);
  function select(event,id){
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();history.replaceState(null,'',location.pathname+location.search+'#'+id);jump(id);
  }
  if(!section.items.length)return <div className="section-empty"><span className="eyebrow">ROOM FOR MORE</span><h2>{section.empty||'More to come.'}</h2><p>This part of the atlas will grow with the next chapter.</p></div>;
  return <div className="section-browser">
    <nav className="item-index" aria-label={`${section.label} items`}>
      <span className="index-heading">IN THIS SECTION</span>
      {section.items.map((item,index)=><a key={item.id} href={'#'+item.id} aria-current={active===item.id?'true':undefined} title={item.title} onClick={event=>select(event,item.id)}><span className="item-number">{String(index+1).padStart(2,'0')}</span><span>{item.navTitle||item.title}</span></a>)}
    </nav>
    <div className="reader-column">
      <div className="reader-toolbar"><span aria-live="polite" aria-atomic="true">{String(activeIndex+1).padStart(2,'0')} <span className="muted">/ {String(section.items.length).padStart(2,'0')}</span></span><div><button aria-label={`Previous ${section.label} item`} disabled={activeIndex===0} onClick={()=>jump(section.items[activeIndex-1].id)}><ArrowUp size={17}/></button><button aria-label={`Next ${section.label} item`} disabled={activeIndex===section.items.length-1} onClick={()=>jump(section.items[activeIndex+1].id)}><ArrowDown size={17}/></button></div></div>
      <div ref={reader} className="item-reader" tabIndex={0} role="region" aria-label={`${section.label} entries`}>
        {section.items.map(item=><section id={item.id} key={item.id} ref={el=>{if(el)entries.current[item.id]=el;else delete entries.current[item.id];}} className="portfolio-entry" aria-labelledby={item.id+'-title'}>
          {item.period&&<p className="entry-period">{item.period}</p>}<h2 id={item.id+'-title'}>{item.title}</h2>{item.subtitle&&<p className="entry-subtitle">{item.subtitle}</p>}
          <p className="entry-summary">{item.summary}</p>
          {item.experience&&onExplore&&<button className="experience-link" onClick={()=>onExplore(item.experience)}>Explore brain slice<ArrowRight size={17}/></button>}
          <EntryPhotos photos={item.photos} title={item.title}/>
          {item.tags?.length>0&&<ul className="entry-tags" aria-label="Topics and tools">{item.tags.map(tag=><li key={tag}>{tag}</li>)}</ul>}
          {item.body?.map(text=><p key={text} className="entry-body">{text}</p>)}
          {item.facts?.length>0&&<dl className="entry-facts">{item.facts.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
          {item.highlights?.length>0&&<ul className="entry-highlights">{item.highlights.map(text=><li key={text}>{text}</li>)}</ul>}
          {item.links?.length>0&&<div className="entry-links">{item.links.map(link=><a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight size={16}/></a>)}</div>}
        </section>)}
      </div>
      {section.items.length>1&&<p className="reader-hint">Scroll to continue <ArrowDown size={13}/></p>}
    </div>
  </div>;
});
