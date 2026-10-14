(function(){
  var wrap=document.getElementById('jnWrap'); if(!wrap) return;
  var items=[].slice.call(wrap.querySelectorAll('.jn-item')), fill=document.getElementById('jnFill'), btn=document.getElementById('jnPlay');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches, timer=null, idx=-1, playing=false;
  function setActive(i){items.forEach(function(it,k){it.classList.toggle('active',k===i);if(k<=i)it.classList.add('in-view');});}
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)e.target.classList.add('in-view');});},{threshold:.25});
    items.forEach(function(it){io.observe(it);});
  } else items.forEach(function(it){it.classList.add('in-view');});
  function progress(){
    var r=wrap.getBoundingClientRect(), vh=window.innerHeight, p=(vh*0.6-r.top)/r.height;
    fill.style.height=Math.max(0,Math.min(1,p))*100+'%';
  }
  window.addEventListener('scroll',progress,{passive:true}); window.addEventListener('resize',progress); progress();
  function stop(){playing=false;clearTimeout(timer);btn.textContent=idx>=items.length-1?'↻ Replay the story':'▶ Play the story';}
  function step(){
    if(!playing) return;
    idx++;
    if(idx>=items.length){stop();return;}
    setActive(idx);
    items[idx].scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});
    timer=setTimeout(step,2600);
  }
  btn.addEventListener('click',function(){
    if(playing){stop();return;}
    if(idx>=items.length-1){idx=-1;items.forEach(function(it){it.classList.remove('in-view','active');});}
    playing=true;btn.textContent='❚❚ Pause';
    wrap.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
    timer=setTimeout(step,700);
  });
  ['wheel','touchstart'].forEach(function(ev){window.addEventListener(ev,function(){if(playing)stop();},{passive:true});});
})();
