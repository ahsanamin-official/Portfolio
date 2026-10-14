(function(){
  var wrap=document.getElementById('jnWrap'); if(!wrap) return;
  var items=[].slice.call(wrap.querySelectorAll('.jn-item')), fill=document.getElementById('jnFill'), ticking=false;
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)e.target.classList.add('in-view');});},{threshold:.25});
    items.forEach(function(it){io.observe(it);});
  } else items.forEach(function(it){it.classList.add('in-view');});
  function update(){
    ticking=false;
    var r=wrap.getBoundingClientRect(), vh=window.innerHeight, mid=vh*0.55;
    fill.style.height=Math.max(0,Math.min(1,(mid-r.top)/r.height))*100+'%';
    var best=-1,bd=1e9;
    items.forEach(function(it,k){var b=it.getBoundingClientRect(),c=Math.abs((b.top+b.height/2)-mid);if(b.top<vh&&b.bottom>0&&c<bd){bd=c;best=k;}});
    items.forEach(function(it,k){it.classList.toggle('active',k===best);});
  }
  function req(){if(!ticking){ticking=true;requestAnimationFrame(update);}}
  window.addEventListener('scroll',req,{passive:true});window.addEventListener('resize',req);update();
})();
