  document.getElementById('tbDate').textContent = new Date().toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});
  document.getElementById('footerYear').textContent = new Date().getFullYear();

  /* ---------- SCROLL-REVEAL ANIMATIONS (home sections) ---------- */
  (function(){
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const blocks = document.querySelectorAll('.reveal-block');
    if(reduceMotion || !('IntersectionObserver' in window)){
      blocks.forEach(b=>b.classList.add('in-view'));
      return;
    }
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.2, rootMargin:'0px 0px -40px 0px'});
    blocks.forEach(b=>io.observe(b));
  })();

  /* Reads a tile/card's photo URL whether it has already been lazy-loaded
     (inline background-image) or is still waiting (data-bg attribute). */
  function getTileBgUrl(el){
    if(!el) return '';
    if(el.style.backgroundImage){
      const m = /url\((['"]?)(.*?)\1\)/.exec(el.style.backgroundImage);
      if(m && m[2]) return m[2];
    }
    return el.getAttribute('data-bg') || '';
  }

  /* ---------- LAZY-LOAD TILE / CARD BACKGROUND IMAGES ---------- */
  /* Project tiles and grid cards store their photo in data-bg instead of an
     inline background-image, so the browser doesn't fetch 40+ full-size
     photos the moment a section becomes visible. Each tile's image is
     requested only once it's about to scroll into view. */
  (function(){
    function loadTile(el){
      const url = el.getAttribute('data-bg');
      if(!url) return;
      el.style.backgroundImage = "url('" + url + "')";
      el.removeAttribute('data-bg');
    }
    const tiles = document.querySelectorAll('[data-bg]');
    if(!('IntersectionObserver' in window)){
      tiles.forEach(loadTile);
      return;
    }
    const bgIo = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          loadTile(entry.target);
          bgIo.unobserve(entry.target);
        }
      });
    }, {rootMargin:'300px 0px'});
    tiles.forEach(t=>bgIo.observe(t));

    // Sections start hidden (display:none) and only get laid out once a
    // tab is opened, so re-check any tiles that are still waiting whenever
    // the visible section changes.
    document.addEventListener('sheet:activated', function(){
      document.querySelectorAll('[data-bg]').forEach(t=>bgIo.observe(t));
    });
  })();


  (function(){
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const supportsIO = 'IntersectionObserver' in window;

    let io = null;
    if(!reduceMotion && supportsIO){
      io = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      }, {threshold:0.12, rootMargin:'0px 0px -40px 0px'});
    }

    function markAndObserve(el){
      if(!el || el.classList.contains('fx-reveal')) return;
      el.classList.add('fx-reveal');
      if(reduceMotion || !io){ el.classList.add('in-view'); return; }
      io.observe(el);
    }

    function scan(root){
      root = root || document;
      // Hero content (Home page above-the-fold) — hero-panel handles its own
      // enter animation when the slider switches, so it's excluded here.
      root.querySelectorAll('.hero-inner > *:not(.hero-panel)').forEach(markAndObserve);
      // Top-level content blocks inside every section
      root.querySelectorAll('.sheet .wrap > *').forEach(markAndObserve);
      // Individual cards anywhere on the site
      root.querySelectorAll('.card').forEach(markAndObserve);
      // Individual stat tiles in "By The Numbers"
      root.querySelectorAll('.stat-item').forEach(markAndObserve);
    }

    scan();

    // Re-scan whenever new content is added (new cards, new tabs, imported site, GitHub sync, etc.)
    const mo = new MutationObserver((mutations)=>{
      mutations.forEach(m=>{
        m.addedNodes.forEach(node=>{
          if(node.nodeType !== 1) return;
          scan(node.parentElement || document);
        });
      });
    });
    mo.observe(document.body, {childList:true, subtree:true});

    window.__rescanReveal = scan;
  })();

  /* ---------- STAT COUNT-UP (home "By The Numbers") ---------- */
  (function(){
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const counters = document.querySelectorAll('.stat-count');
    if(!counters.length) return;

    function animateCounter(el){
      const target = parseInt(el.getAttribute('data-target'), 10) || 0;
      if(reduceMotion || target === 0){ el.textContent = target; return; }
      const duration = 1200;
      const start = performance.now();
      function tick(now){
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.textContent = Math.round(eased * target);
        if(progress < 1){ requestAnimationFrame(tick); } else { el.textContent = target; }
      }
      requestAnimationFrame(tick);
    }

    const statsGrid = document.getElementById('statsGrid');
    if(!statsGrid || !('IntersectionObserver' in window)){
      counters.forEach(animateCounter);
      return;
    }
    const statsIo = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          counters.forEach(animateCounter);
          statsIo.unobserve(entry.target);
        }
      });
    }, {threshold:0.35});
    statsIo.observe(statsGrid);
  })();

  /* ---------- BACK TO TOP ---------- */
  function scrollToTop(){
    window.scrollTo({top:0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  }
  (function(){
    const btn = document.getElementById('backToTop');
    window.addEventListener('scroll', function(){
      if(window.scrollY > 360){ btn.classList.add('show'); } else { btn.classList.remove('show'); }
    }, {passive:true});
  })();

  function setActive(id, opts){
    opts = opts || {};
    if(!document.getElementById(id)) return;
    if(id !== 'project-detail') restoreDetailCard();
    if(id !== 'experience-detail') restoreExperienceDetailCard();
    const current = document.querySelector('.sheet.active');
    const sec = document.getElementById(id);
    const tabs = document.querySelectorAll('.sheet-tab[data-target="'+id+'"]');
    const toggleBtn = document.getElementById('sidebarToggleBtn');

    function activateNow(){
      document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('active'));
      document.querySelectorAll('.sheet-tab').forEach(t=>t.classList.remove('active'));
      sec.classList.add('active');
      let inSidebar = false;
      tabs.forEach(t=>{
        t.classList.add('active');
        if(t.closest('#moreSidebar') || t.closest('#moreDropdownPanel')) inSidebar = true;
      });
      if(toggleBtn) toggleBtn.classList.toggle('has-active', inSidebar);
      const footerHomeLink = document.getElementById('footerHomeLink');
      if(footerHomeLink) footerHomeLink.style.display = (id === 'home') ? 'none' : '';
      window.scrollTo({top:0, behavior:'auto'});
      requestAnimationFrame(()=> sec.classList.add('sheet-in'));
      document.dispatchEvent(new CustomEvent('sheet:activated', {detail:{id:id}}));
    }

    if(current && current !== sec && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      current.classList.remove('sheet-in');
      current.classList.add('sheet-out');
      setTimeout(()=>{ current.classList.remove('sheet-out'); activateNow(); }, 140);
    } else {
      activateNow();
    }

    // Detail pages (project-detail / experience-detail) manage their own,
    // more specific URL + breadcrumb further down — skip the generic
    // section-level handling for those two here.
    if(id !== 'project-detail' && id !== 'experience-detail'){
      if(!opts.skipHistory) pushRoute('#'+id, {type:'section', id:id});
      updateBreadcrumb({type:'section', id:id});
    }
  }

  /* ---------- URL ROUTING (browser back/forward + shareable/bookmarkable links) ---------- */
  const SECTION_LABELS = {
    home:'Home', about:'About', experience:'Experience', projects:'Projects',
    skills:'Skills', leadership:'Leadership', contact:'Contact Us'
  };
  let isRouting = false; // true while we're reacting to a popstate, so we don't re-push history

  function pushRoute(hash, state){
    if(isRouting) return;
    if(location.hash === hash){
      history.replaceState(state, '', hash);
    } else {
      history.pushState(state, '', hash);
    }
  }

  function routeFromHash(){
    const raw = location.hash.replace(/^#/, '');
    if(!raw) return {type:'section', id:'home'};
    const parts = raw.split('/');
    if(parts[0] === 'projects' && parts[1]) return {type:'project', pid: decodeURIComponent(parts[1])};
    if(parts[0] === 'experience' && parts[1]) return {type:'experience', eid: decodeURIComponent(parts[1])};
    if(document.getElementById(parts[0])) return {type:'section', id:parts[0]};
    return {type:'section', id:'home'};
  }

  function applyRoute(route){
    isRouting = true;
    try{
      if(route.type === 'project'){
        const exists = document.querySelector('#projectsGrid .card[data-pid="'+route.pid+'"]')
          || document.querySelector('#projectDetailBody .card[data-pid="'+route.pid+'"]');
        if(exists){
          openProjectDetail(route.pid, {skipHistory:true});
        } else {
          setActive('home', {skipHistory:true});
          history.replaceState({type:'section', id:'home'}, '', '#home');
        }
      } else if(route.type === 'experience'){
        const exists = document.querySelector('#experienceGrid .card[data-eid="'+route.eid+'"]')
          || document.querySelector('#experienceDetailBody .card[data-eid="'+route.eid+'"]');
        if(exists){
          openExperienceDetail(route.eid, {skipHistory:true});
        } else {
          setActive('home', {skipHistory:true});
          history.replaceState({type:'section', id:'home'}, '', '#home');
        }
      } else {
        setActive(route.id, {skipHistory:true});
      }
    } finally {
      isRouting = false;
    }
  }

  window.addEventListener('popstate', function(){
    applyRoute(routeFromHash());
  });

  document.addEventListener('DOMContentLoaded', function(){
    if(location.hash){
      applyRoute(routeFromHash());
    } else {
      history.replaceState({type:'section', id:'home'}, '', location.pathname + location.search + '#home');
      updateBreadcrumb({type:'section', id:'home'});
    }
  });

  /* ---------- BREADCRUMBS (Home > Section > Item — shown on every page) ---------- */
  function updateBreadcrumb(route){
    const el = document.getElementById('breadcrumbInner');
    if(!el) return;
    const crumbs = [];
    if(route.type === 'project'){
      crumbs.push({label:'Home', id:'home'});
      crumbs.push({label:'Projects', id:'projects'});
      crumbs.push({label:route.title || 'Project', current:true});
    } else if(route.type === 'experience'){
      crumbs.push({label:'Home', id:'home'});
      crumbs.push({label:'Experience', id:'experience'});
      crumbs.push({label:route.title || 'Experience', current:true});
    } else if(route.id === 'home'){
      // No breadcrumb on the home page — a lone "Home" label here was
      // redundant and non-interactive, so we just hide the bar instead.
    } else {
      crumbs.push({label:'Home', id:'home'});
      crumbs.push({label:SECTION_LABELS[route.id] || route.id, current:true});
    }

    const bar = document.getElementById('breadcrumbBar');
    if(bar) bar.style.display = crumbs.length ? '' : 'none';

    el.innerHTML = '';
    crumbs.forEach((c, i)=>{
      if(i > 0){
        const sep = document.createElement('span');
        sep.className = 'crumb-sep';
        sep.setAttribute('aria-hidden', 'true');
        sep.textContent = '\u203a';
        el.appendChild(sep);
      }
      if(c.current){
        const cur = document.createElement('span');
        cur.className = 'crumb-current';
        cur.setAttribute('aria-current', 'page');
        cur.textContent = c.label;
        el.appendChild(cur);
      } else {
        const link = document.createElement('button');
        link.type = 'button';
        link.className = 'crumb-link';
        link.textContent = c.label;
        link.addEventListener('click', function(){ setActive(c.id); });
        el.appendChild(link);
      }
    });
  }

  /* ---------- SIDEBAR (secondary sections: Experience / Skills / Leadership) ---------- */
  function openSidebar(){
    document.body.classList.add('sidebar-open');
    document.getElementById('moreSidebar').setAttribute('aria-hidden', 'false');
    document.getElementById('sidebarToggleBtn').setAttribute('aria-expanded', 'true');
  }
  function closeSidebar(){
    document.body.classList.remove('sidebar-open');
    document.getElementById('moreSidebar').setAttribute('aria-hidden', 'true');
    document.getElementById('sidebarToggleBtn').setAttribute('aria-expanded', 'false');
  }
  function toggleSidebar(){
    if(document.body.classList.contains('sidebar-open')) closeSidebar(); else openSidebar();
  }

  /* ---------- MORE — HOVER DROPDOWN (desktop) ---------- */
  function positionMoreDropdown(){
    const panel = document.getElementById('moreDropdownPanel');
    const btn = document.getElementById('sidebarToggleBtn');
    const nav = document.getElementById('sheetNav');
    if(!panel || !btn || !nav) return;
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    panel.style.top = navRect.bottom + 'px';
    let left = btnRect.left;
    const maxLeft = window.innerWidth - panel.offsetWidth - 8;
    if(left > maxLeft) left = Math.max(8, maxLeft);
    panel.style.left = left + 'px';
  }
  function toggleMoreMenu(){
    toggleSidebar();
  }
  function closeMoreMenu(){
    const wrap = document.getElementById('moreDropdownWrap');
    if(wrap) wrap.classList.remove('dropdown-open');
  }
  (function(){
    const wrap = document.getElementById('moreDropdownWrap');
    if(!wrap) return;
  })();
  document.addEventListener('click', function(e){
    const wrap = document.getElementById('moreDropdownWrap');
    if(wrap && wrap.classList.contains('dropdown-open') && !wrap.contains(e.target)){
      closeMoreMenu();
    }
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeMoreMenu();
  });

  const EDIT_PIN = '1544';

  function toggleEdit(){
    document.body.classList.toggle('edit-mode');
    const editing = document.body.classList.contains('edit-mode');
    document.querySelectorAll('[contenteditable]').forEach(el=>el.setAttribute('contenteditable', editing ? 'true' : 'false'));
    document.getElementById('editToggle').textContent = editing ? '✓ Done Editing' : '✎ Edit Site';
    if(!editing) document.getElementById('richToolbar').classList.remove('show');
    if(editing){ loadGhConfig(); ghWatch.start(); } else { ghWatch.stop(); }
  }

  /* ---------- PIN-GATED EDIT MODE ---------- */
  function requestEditMode(){
    if(document.body.classList.contains('edit-mode')){ toggleEdit(); return; }
    openPinModal();
  }
  function openPinModal(){
    const modal = document.getElementById('pinModal');
    const input = document.getElementById('pinInput');
    document.getElementById('pinError').textContent = '';
    input.value = '';
    modal.style.display = 'flex';
    setTimeout(()=>input.focus(), 30);
  }
  function closePinModal(){ document.getElementById('pinModal').style.display = 'none'; }
  function submitPin(){
    const input = document.getElementById('pinInput');
    if(input.value.trim() === EDIT_PIN){
      closePinModal();
      if(!document.body.classList.contains('edit-mode')) toggleEdit();
    } else {
      const modal = document.getElementById('pinModal');
      document.getElementById('pinError').textContent = 'Incorrect PIN — try again.';
      modal.classList.remove('shake'); void modal.offsetWidth; modal.classList.add('shake');
      input.value = ''; input.focus();
    }
  }

  function setVar(name, val){ document.documentElement.style.setProperty(name, val); }

  /* ---------- GITHUB SYNC ---------- */
  const GH_CONFIG_KEY = 'ghSyncConfig';
  let ghToken = null;
  let ghAutoSave = true;
  let ghSaveTimer = null;
  let ghSaving = false;

  function loadGhConfig(){
    try{
      const saved = JSON.parse(localStorage.getItem(GH_CONFIG_KEY) || 'null');
      if(saved){
        const o = document.getElementById('ghOwner'), r = document.getElementById('ghRepo'),
              b = document.getElementById('ghBranch'), p = document.getElementById('ghPath');
        if(o && !o.value) o.value = saved.owner || '';
        if(r && !r.value) r.value = saved.repo || '';
        if(b) b.value = saved.branch || 'main';
        if(p) p.value = saved.path || 'index.html';
      }
    }catch(e){}
    try{
      const t = sessionStorage.getItem('ghToken');
      if(t){ ghToken = t; setGhStatus('Connected — token active in this tab', 'connected'); }
    }catch(e){}
  }

  function saveGhConfig(){
    const cfg = {
      owner: (document.getElementById('ghOwner').value || '').trim(),
      repo: (document.getElementById('ghRepo').value || '').trim(),
      branch: (document.getElementById('ghBranch').value || '').trim() || 'main',
      path: (document.getElementById('ghPath').value || '').trim() || 'index.html'
    };
    localStorage.setItem(GH_CONFIG_KEY, JSON.stringify(cfg));
    return cfg;
  }

  function setGhStatus(msg, kind){
    const el = document.getElementById('ghStatus');
    if(!el) return;
    el.textContent = msg;
    el.className = 'gh-status' + (kind ? ' ' + kind : '');
    el.scrollIntoView({block:'nearest', behavior:'smooth'});
  }

  async function connectGitHub(){
    const tokenInput = document.getElementById('ghTokenInput');
    const token = (tokenInput.value || '').trim();
    if(!token){ setGhStatus('Paste a personal access token first.', 'error'); return; }
    const cfg = saveGhConfig();
    if(!cfg.owner || !cfg.repo){ setGhStatus('Add repo owner and name first.', 'error'); return; }

    const btn = document.getElementById('ghConnectBtn');
    const originalLabel = btn ? btn.textContent : null;
    if(btn){ btn.disabled = true; btn.textContent = 'Checking…'; }
    setGhStatus('Checking token and repo access…', 'saving');

    try{
      const res = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}`, {
        headers:{ 'Authorization':`Bearer ${token}`, 'Accept':'application/vnd.github+json' }
      });
      if(res.status === 401 || res.status === 403){
        setGhStatus('Token rejected — check it\'s valid and not expired.', 'error');
        return;
      }
      if(res.status === 404){
        setGhStatus('Repo not found — check owner/repo spelling and token access.', 'error');
        return;
      }
      if(!res.ok){
        setGhStatus('GitHub returned an error (' + res.status + '). Try again.', 'error');
        return;
      }
      const repoData = await res.json();
      if(repoData.permissions && repoData.permissions.push === false){
        setGhStatus('Connected, but this token has read-only access — saves will fail.', 'error');
      } else {
        setGhStatus('Connected to ' + cfg.owner + '/' + cfg.repo + ' ✓', 'connected');
      }
      ghToken = token;
      try{ sessionStorage.setItem('ghToken', token); }catch(e){}
      tokenInput.value = '';
    }catch(err){
      console.error(err);
      setGhStatus('Network error — could not reach GitHub. Check your connection.', 'error');
    }finally{
      if(btn){ btn.disabled = false; btn.textContent = originalLabel; }
    }
  }

  function disconnectGitHub(){
    ghToken = null;
    try{ sessionStorage.removeItem('ghToken'); }catch(e){}
    setGhStatus('Not connected');
  }

  function utf8ToBase64(str){
    return btoa(unescape(encodeURIComponent(str)));
  }

  async function getFileSha(cfg){
    const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(cfg.path)}?ref=${encodeURIComponent(cfg.branch)}`;
    const res = await fetch(url, {
      headers:{ 'Authorization':`Bearer ${ghToken}`, 'Accept':'application/vnd.github+json' }
    });
    if(res.status === 404) return null;
    if(!res.ok){
      const errText = await res.text();
      let ghMsg = '';
      try{ ghMsg = JSON.parse(errText).message || ''; }catch(e){ ghMsg = errText; }
      throw new Error('Could not read current file (' + res.status + (ghMsg ? ': ' + ghMsg : '') + ')');
    }
    const data = await res.json();
    return data.sha;
  }

  async function pushToGitHub(commitMessage){
    if(!ghToken){ setGhStatus('Not connected — paste a token and click Connect.', 'error'); return; }
    const cfg = saveGhConfig();
    if(!cfg.owner || !cfg.repo){ setGhStatus('Add repo owner and name first.', 'error'); return; }
    if(ghSaving) return;
    ghSaving = true;
    setGhStatus('Saving to GitHub…', 'saving');
    try{
      // Build the snapshot from a detached clone so saving never touches the
      // live page you're editing (previously this called setActive() on the
      // real DOM, which the auto-save watcher then saw as a new edit and
      // queued another save — an infinite jump-to-Home loop).
      const clone = document.documentElement.cloneNode(true);
      clone.querySelectorAll('[contenteditable]').forEach(el=>el.setAttribute('contenteditable', 'false'));
      clone.classList.remove('edit-mode');
      clone.querySelectorAll('.sheet').forEach(s=>s.classList.remove('active','sheet-in','sheet-out'));
      clone.querySelectorAll('.sheet-tab').forEach(t=>t.classList.remove('active'));
      const firstTab = clone.querySelector('.sheet-tab');
      if(firstTab){
        const targetId = firstTab.getAttribute('data-target');
        const homeSheet = clone.querySelector('#' + targetId);
        if(homeSheet) homeSheet.classList.add('active');
        firstTab.classList.add('active');
      }
      const html = '<!DOCTYPE html>\n' + clone.outerHTML;
      const sha = await getFileSha(cfg);
      const body = {
        message: commitMessage || 'Update portfolio via site editor',
        content: utf8ToBase64(html),
        branch: cfg.branch
      };
      if(sha) body.sha = sha;
      const putUrl = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(cfg.path)}`;
      const res = await fetch(putUrl, {
        method:'PUT',
        headers:{
          'Authorization':`Bearer ${ghToken}`,
          'Accept':'application/vnd.github+json',
          'Content-Type':'application/json'
        },
        body: JSON.stringify(body)
      });
      if(!res.ok){
        const errText = await res.text();
        let ghMsg = '';
        try{ ghMsg = JSON.parse(errText).message || ''; }catch(e){ ghMsg = errText; }
        throw new Error(res.status + (ghMsg ? ': ' + ghMsg : ''));
      }
      setGhStatus('Saved to GitHub ✓ ' + new Date().toLocaleTimeString(), 'connected');
    }catch(err){
      console.error(err);
      setGhStatus('Save failed — ' + (err && err.message ? err.message : 'check token/repo/branch settings.'), 'error');
    }finally{
      ghSaving = false;
    }
  }

  function queueGitHubSave(){
    if(!ghAutoSave || !ghToken) return;
    clearTimeout(ghSaveTimer);
    ghSaveTimer = setTimeout(()=>pushToGitHub('Auto-save from site editor'), 2500);
  }

  /* Watches the page for edits while in edit mode and queues a GitHub save. */
  const ghWatch = (function(){
    let observer = null;
    let armTimer = null;
    let armed = false;
    function start(){
      armed = false;
      clearTimeout(armTimer);
      if(!observer){
        observer = new MutationObserver(()=>{ if(armed) queueGitHubSave(); });
      }
      observer.observe(document.documentElement, {
        childList:true, subtree:true, attributes:true, characterData:true
      });
      // Ignore the burst of attribute changes toggleEdit() itself causes.
      armTimer = setTimeout(()=>{ armed = true; }, 600);
    }
    function stop(){
      armed = false;
      clearTimeout(armTimer);
      clearTimeout(ghSaveTimer);
      if(observer) observer.disconnect();
    }
    return { start, stop };
  })();

  /* ---------- PROJECT FILTERS ---------- */
  /* ---------- PROJECT DETAIL PAGE ---------- */
  let currentDetailPid = null;
  let detailPlaceholder = null;

  function restoreDetailCard(){
    if(!currentDetailPid) return;
    const holder = document.getElementById('projectDetailBody');
    const card = holder ? holder.querySelector('.card[data-pid="'+currentDetailPid+'"]') : null;
    if(card && detailPlaceholder && detailPlaceholder.parentNode){
      detailPlaceholder.parentNode.replaceChild(card, detailPlaceholder);
    }
    currentDetailPid = null;
    detailPlaceholder = null;
  }

  function openProjectDetail(pid, opts){
    opts = opts || {};
    const card = document.querySelector('#projectsGrid .card[data-pid="'+pid+'"]')
      || document.querySelector('#projectDetailBody .card[data-pid="'+pid+'"]');
    if(!card) return;
    restoreDetailCard();
    const holder = document.getElementById('projectDetailBody');
    detailPlaceholder = document.createElement('div');
    detailPlaceholder.setAttribute('data-pid-placeholder', pid);
    detailPlaceholder.style.display = 'none';
    card.parentNode.insertBefore(detailPlaceholder, card);
    holder.innerHTML = '';
    holder.appendChild(card);
    currentDetailPid = pid;
    buildSimilarProjects(pid, card.getAttribute('data-cat') || '');
    setActive('project-detail', {skipHistory:true});
    if(!opts.skipHistory) pushRoute('#projects/'+encodeURIComponent(pid), {type:'project', pid:pid});
    const titleEl = card.querySelector('h3');
    updateBreadcrumb({type:'project', pid:pid, title: titleEl ? titleEl.textContent.trim() : 'Project'});
  }

  function backToProjects(){
    restoreDetailCard();
    setActive('projects');
  }

  function buildSimilarProjects(pid, catStr){
    const cats = catStr.split(' ').filter(Boolean);
    const grid = document.getElementById('similarProjectsGrid');
    if(!grid) return;
    grid.innerHTML = '';
    const allCards = Array.from(document.querySelectorAll('#projectsGrid .card[data-pid], #projectDetailBody .card[data-pid]'));
    const others = allCards.filter(c => c.getAttribute('data-pid') !== pid);
    let matches = others.filter(c => (c.getAttribute('data-cat') || '').split(' ').some(cc => cats.includes(cc)));
    if(matches.length === 0) matches = others;
    for(let i = matches.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [matches[i], matches[j]] = [matches[j], matches[i]];
    }
    matches = matches.slice(0, 4);
    matches.forEach(c => {
      const titleEl = c.querySelector('h3');
      const metaEl = c.querySelector('.meta');
      const imgEl = c.querySelector('.media-slot img');
      const coverEl = c.querySelector('.card-cover');
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'project-tile';
      if(imgEl && imgEl.src){
        tile.setAttribute('data-bg', imgEl.src);
      } else {
        const bg = getTileBgUrl(coverEl);
        if(bg) tile.setAttribute('data-bg', bg);
      }
      const title = titleEl ? titleEl.textContent : 'Project';
      const meta = metaEl ? metaEl.textContent : '';
      tile.innerHTML = '<span class="pt-overlay"></span><span class="pt-text"><span class="pt-title">'+title+'</span><span class="pt-sub">'+meta+'</span></span>';
      tile.onclick = function(){ openProjectDetail(c.getAttribute('data-pid')); };
      grid.appendChild(tile);
    });
    const section = document.getElementById('similarProjectsSection');
    if(section) section.style.display = matches.length ? '' : 'none';
  }

  let currentDetailEid = null;
  let detailPlaceholderExp = null;

  function restoreExperienceDetailCard(){
    if(!currentDetailEid) return;
    const holder = document.getElementById('experienceDetailBody');
    const card = holder ? holder.querySelector('.card[data-eid="'+currentDetailEid+'"]') : null;
    if(card && detailPlaceholderExp && detailPlaceholderExp.parentNode){
      detailPlaceholderExp.parentNode.replaceChild(card, detailPlaceholderExp);
    }
    currentDetailEid = null;
    detailPlaceholderExp = null;
  }

  function openExperienceDetail(eid, opts){
    opts = opts || {};
    const card = document.querySelector('#experienceGrid .card[data-eid="'+eid+'"]')
      || document.querySelector('#experienceDetailBody .card[data-eid="'+eid+'"]');
    if(!card) return;
    restoreExperienceDetailCard();
    const holder = document.getElementById('experienceDetailBody');
    detailPlaceholderExp = document.createElement('div');
    detailPlaceholderExp.setAttribute('data-eid-placeholder', eid);
    detailPlaceholderExp.style.display = 'none';
    card.parentNode.insertBefore(detailPlaceholderExp, card);
    holder.innerHTML = '';
    holder.appendChild(card);
    currentDetailEid = eid;
    buildSimilarExperience(eid);
    setActive('experience-detail', {skipHistory:true});
    if(!opts.skipHistory) pushRoute('#experience/'+encodeURIComponent(eid), {type:'experience', eid:eid});
    const titleEl = card.querySelector('h3');
    updateBreadcrumb({type:'experience', eid:eid, title: titleEl ? titleEl.textContent.trim() : 'Experience'});
  }

  function backToExperience(){
    restoreExperienceDetailCard();
    setActive('experience');
  }

  function buildSimilarExperience(eid){
    const grid = document.getElementById('similarExperienceGrid');
    if(!grid) return;
    grid.innerHTML = '';
    const allCards = Array.from(document.querySelectorAll('#experienceGrid .card[data-eid], #experienceDetailBody .card[data-eid]'));
    let others = allCards.filter(c => c.getAttribute('data-eid') !== eid);
    for(let i = others.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }
    others = others.slice(0, 4);
    others.forEach(c => {
      const titleEl = c.querySelector('h3');
      const metaEl = c.querySelector('.org') || c.querySelector('.meta');
      const coverEl = c.querySelector('.card-cover');
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'project-tile';
      if(coverEl && coverEl.style.backgroundImage) tile.style.backgroundImage = coverEl.style.backgroundImage;
      const title = titleEl ? titleEl.textContent : 'Experience';
      const meta = metaEl ? metaEl.textContent : '';
      tile.innerHTML = '<span class="pt-overlay"></span><span class="pt-text"><span class="pt-title">'+title+'</span><span class="pt-sub">'+meta+'</span></span>';
      tile.onclick = function(){ openExperienceDetail(c.getAttribute('data-eid')); };
      grid.appendChild(tile);
    });
    const section = document.getElementById('similarExperienceSection');
    if(section) section.style.display = others.length ? '' : 'none';
  }

  function setProjectFilter(cat, btn){
    document.querySelectorAll('#projectFilterBar .filter-chip').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('#projectsGrid .card').forEach(card=>{
      if(cat === 'all'){ card.classList.remove('filtered-out'); return; }
      const cats = (card.getAttribute('data-cat') || '').split(' ');
      card.classList.toggle('filtered-out', !cats.includes(cat));
    });
  }

  /* ---------- SITE SEARCH (with content highlighting) ---------- */
  let activeMarks = [];
  let lastSearchResults = [];

  function escapeRegex(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function clearSearchHighlights(){
    activeMarks.forEach(mark=>{
      const parent = mark.parentNode;
      if(!parent) return;
      while(mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parent.normalize();
    });
    activeMarks = [];
  }

  function highlightMatches(query){
    clearSearchHighlights();
    if(!query) return;
    const regex = new RegExp(escapeRegex(query), 'gi');
    document.querySelectorAll('.sheet').forEach(sheet=>{
      const walker = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT, {
        acceptNode(node){
          const val = node.nodeValue;
          if(!val || !val.trim()) return NodeFilter.FILTER_REJECT;
          const parentTag = node.parentNode.nodeName;
          if(parentTag === 'SCRIPT' || parentTag === 'STYLE' || parentTag === 'MARK') return NodeFilter.FILTER_REJECT;
          regex.lastIndex = 0;
          return regex.test(val) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      const nodes = [];
      let n;
      while(n = walker.nextNode()) nodes.push(n);
      nodes.forEach(node=>{
        regex.lastIndex = 0;
        const text = node.nodeValue;
        const frag = document.createDocumentFragment();
        let lastIdx = 0, m;
        while((m = regex.exec(text)) !== null){
          if(m.index > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)));
          const mark = document.createElement('mark');
          mark.className = 'search-hit';
          mark.textContent = m[0];
          frag.appendChild(mark);
          activeMarks.push(mark);
          lastIdx = m.index + m[0].length;
          if(m[0].length === 0) regex.lastIndex++;
        }
        if(lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
        node.parentNode.replaceChild(frag, node);
      });
    });
  }

  function positionSearchResults(wrap){
    if(!wrap) wrap = document.querySelector('.search-widget');
    const box = wrap ? wrap.querySelector('.search-results') : null;
    if(!wrap || !box) return;
    const rect = wrap.getBoundingClientRect();
    const width = Math.max(rect.width, 260);
    let left = rect.left;
    if(left + width > window.innerWidth - 12) left = window.innerWidth - width - 12;
    if(left < 12) left = 12;
    box.style.left = left + 'px';
    box.style.top = (rect.bottom + 6) + 'px';
    box.style.width = width + 'px';
  }
  window.addEventListener('resize', function(){
    document.querySelectorAll('.search-widget').forEach(function(w){
      if(w.querySelector('.search-results.show')) positionSearchResults(w);
    });
  });

  function closeAllSearchResults(except){
    document.querySelectorAll('.search-results.show').forEach(function(box){
      if(box !== except) box.classList.remove('show');
    });
  }

  function runSiteSearch(query, inputEl){
    const wrap = inputEl ? inputEl.closest('.search-widget') : document.querySelector('.search-widget');
    if(!wrap) return;
    const box = wrap.querySelector('.search-results');
    const trimmed = query.trim();
    if(trimmed.length < 2){
      clearSearchHighlights();
      lastSearchResults = [];
      box.classList.remove('show'); box.innerHTML='';
      return;
    }
    highlightMatches(trimmed);

    const seen = new Set();
    const results = [];
    activeMarks.forEach(mark=>{
      const block = mark.closest('h2, h3, h4, p, li, .role, .org, .meta, .tb-cell, figcaption');
      if(!block || seen.has(block)) return;
      const sheet = block.closest('.sheet');
      if(!sheet) return;
      seen.add(block);
      const heading = sheet.querySelector('h2');
      const sectionName = heading ? heading.textContent.trim() : sheet.id;
      results.push({sheetId: sheet.id, section: sectionName, block, text: block.textContent.trim()});
    });
    lastSearchResults = results;

    if(results.length === 0){
      box.innerHTML = '<div class="no-results">No matches found.</div>';
    } else {
      box.innerHTML = results.slice(0,12).map((r,i)=>{
        const snippet = r.text.length > 90 ? r.text.slice(0,90)+'…' : r.text;
        return '<a href="#" data-result-index="'+i+'"><b>'+r.section+'</b>'+snippet+'</a>';
      }).join('');
      box.querySelectorAll('a[data-result-index]').forEach(a=>{
        a.addEventListener('click', function(e){
          e.preventDefault();
          const idx = parseInt(a.getAttribute('data-result-index'), 10);
          goToSearchResult(lastSearchResults[idx], box);
        });
      });
    }
    positionSearchResults(wrap);
    closeAllSearchResults(box);
    box.classList.add('show');
  }

  function goToSearchResult(r, box){
    if(!r) return;
    if(!box) box = document.querySelector('.search-results.show');
    if(box) box.classList.remove('show');
    const alreadyOnSheet = document.getElementById(r.sheetId).classList.contains('active');
    setActive(r.sheetId);
    if(document.body.classList.contains('sidebar-open')) closeSidebar();
    const jump = () => {
      r.block.scrollIntoView({behavior:'smooth', block:'center'});
      r.block.classList.remove('search-focus'); void r.block.offsetWidth;
      r.block.classList.add('search-focus');
      setTimeout(()=> r.block.classList.remove('search-focus'), 1700);
    };
    setTimeout(jump, alreadyOnSheet ? 30 : 220);
  }

  function openSidebarSearch(){
    openSidebar();
    setTimeout(()=>{
      const inp = document.getElementById('sidebarSearchInput');
      if(inp) inp.focus();
    }, 240);
  }

  document.addEventListener('click', function(e){
    if(!e.target.closest('.search-widget')) closeAllSearchResults();
  });

  /* ---------- CONTACT FORM ---------- */
  function sendContactForm(e){
    e.preventDefault();
    const name = document.getElementById('cfName').value.trim();
    const org = document.getElementById('cfOrg').value.trim();
    const email = document.getElementById('cfEmail').value.trim();
    const message = document.getElementById('cfMessage').value.trim();
    const subject = 'Portfolio enquiry from ' + name;
    const bodyLines = [
      'Name: ' + name,
      org ? 'Organisation: ' + org : '',
      'Email: ' + email,
      '',
      message
    ].filter(Boolean);
    const mailto = 'mailto:ahsanamin798@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(bodyLines.join('\n'));
    window.location.href = mailto;
    const note = document.getElementById('cfSentNote');
    note.style.display = 'block';
    return false;
  }

  /* ---------- WALLPAPER ---------- */
  function handleWallpaperFile(e){
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => applyWallpaper(reader.result);
    reader.readAsDataURL(file);
  }
  function setWallpaperUrl(url){
    url = (url || '').trim();
    if(!url) return;
    applyWallpaper(url);
  }
  function applyWallpaper(src){
    const home = document.getElementById('home');
    home.style.backgroundImage = 'url(' + src + ')';
    home.classList.add('has-wallpaper');
  }
  function clearWallpaper(){
    const home = document.getElementById('home');
    home.style.backgroundImage = '';
    home.classList.remove('has-wallpaper');
  }

  /* ---------- RICH TEXT TOOLBAR ---------- */
  const SYSTEM_FONTS = [
    'Space Grotesk','IBM Plex Sans','IBM Plex Mono',
    'Arial','Helvetica','Verdana','Tahoma','Trebuchet MS','Segoe UI',
    'Calibri','Georgia','Garamond','Times New Roman','Cambria',
    'Courier New','Consolas','Roboto','Noto Sans','Impact','Comic Sans MS'
  ];
  (function(){
    const sel = document.getElementById('rtFontName');
    SYSTEM_FONTS.forEach(f=>{
      const o = document.createElement('option');
      o.value = f; o.textContent = f; o.style.fontFamily = f;
      sel.appendChild(o);
    });
  })();

  (function(){
    const toolbar = document.getElementById('richToolbar');
    let activeEl = null;
    let lastRange = null;

    function saveSelection(){
      const sel = window.getSelection();
      if(sel && sel.rangeCount > 0) lastRange = sel.getRangeAt(0).cloneRange();
    }
    function restoreSelection(){
      if(!lastRange) return;
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(lastRange);
    }
    document.addEventListener('selectionchange', function(){
      const el = document.activeElement;
      if(el && el.getAttribute && el.getAttribute('contenteditable') === 'true') saveSelection();
    });

    function showToolbarFor(el){
      activeEl = el;
      positionToolbar(el);
      toolbar.classList.add('show');
    }
    document.addEventListener('focusin', function(e){
      if(document.body.classList.contains('edit-mode') && e.target.getAttribute && e.target.getAttribute('contenteditable') === 'true'){
        showToolbarFor(e.target);
      }
    });
    // Only hide the toolbar when the user actually clicks somewhere that is
    // neither the toolbar itself nor an editable field — a stray click on a
    // select/color-input inside the toolbar (or on the editable text again)
    // never dismisses it.
    document.addEventListener('mousedown', function(e){
      if(!document.body.classList.contains('edit-mode')) return;
      const insideToolbar = toolbar.contains(e.target);
      const insideEditable = e.target.closest && e.target.closest('[contenteditable="true"]');
      if(!insideToolbar && !insideEditable){
        toolbar.classList.remove('show');
        activeEl = null;
      }
    });
    function positionToolbar(el){
      const rect = el.getBoundingClientRect();
      const tbRect = toolbar.getBoundingClientRect();
      const tbW = tbRect.width || 260;
      const tbH = tbRect.height || 80;
      let top = rect.top - tbH - 8;
      if(top < 8) top = Math.min(rect.bottom + 8, window.innerHeight - tbH - 8);
      let left = Math.min(window.innerWidth - tbW - 8, Math.max(8, rect.left));
      toolbar.style.top = Math.max(8, top) + 'px';
      toolbar.style.left = left + 'px';
    }
    window.addEventListener('scroll', ()=>{ if(activeEl && toolbar.classList.contains('show')) positionToolbar(activeEl); }, true);
    window.addEventListener('resize', ()=>{ if(activeEl && toolbar.classList.contains('show')) positionToolbar(activeEl); });

    window.applyFontName = function(name){
      restoreSelection();
      if(activeEl) activeEl.focus();
      document.execCommand('fontName', false, name);
    };
    window.applyFontSize = function(px){
      restoreSelection();
      if(activeEl) activeEl.focus();
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('fontSize', false, '7');
      (activeEl || document).querySelectorAll('font[size="7"]').forEach(function(el){
        el.removeAttribute('size');
        el.style.fontSize = px + 'px';
      });
    };
    window.setVAlign = function(pos){
      restoreSelection();
      const target = activeEl || (document.activeElement && document.activeElement.closest('[contenteditable="true"]'));
      if(!target) return;
      target.style.display = 'flex';
      target.style.flexDirection = 'column';
      target.style.justifyContent = pos;
    };
  })();

  document.querySelector('.sheet.active') && document.querySelector('.sheet.active').classList.add('sheet-in');

  let cardCounter = 0;
  function addCard(containerId, kind){
    cardCounter++;
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = kind === 'skill'
      ? '<button class="del-btn" onclick="this.closest(\'.card\').remove()">✕</button><h4 contenteditable="true">New Skill Group</h4><p contenteditable="true">Describe this skill area…</p>'
      : '<button class="del-btn" onclick="this.closest(\'.card\').remove()">✕</button><h3 contenteditable="true">New Entry — click to rename</h3><span class="org" contenteditable="true">Organisation</span><span class="meta" contenteditable="true">Date range · Location</span><ul contenteditable="true"><li>Describe this entry…</li></ul><div class="media-slot"></div><button class="media-btn" onclick="openMediaModal(this,\'image\')">+ Photo</button><button class="media-btn" onclick="openMediaModal(this,\'video\')">+ Video</button><button class="media-btn" onclick="openMediaModal(this,\'link\')">+ Link</button>';
    const addBtn = container.querySelector('.add-btn');
    if(addBtn) container.insertBefore(div, addBtn); else container.appendChild(div);
  }

  let currentSlot = null;
  let currentType = null;
  let pendingImageData = null;
  let pendingVideoData = null;

  function openMediaModal(btn, type){
    currentSlot = btn.closest('.card, footer .wrap').querySelector('.media-slot');
    currentType = type;
    pendingImageData = null; pendingVideoData = null;
    document.getElementById('imgFileInput').value = '';
    document.getElementById('imgUrlInput').value = '';
    document.getElementById('imgCaptionInput').value = '';
    document.getElementById('videoUrlInput').value = '';
    document.getElementById('videoFileInput').value = '';
    document.getElementById('linkTitleInput').value = '';
    document.getElementById('linkUrlInput').value = '';
    document.getElementById('linkNoteInput').value = '';
    document.querySelectorAll('.modal-pane').forEach(p=>p.classList.remove('active'));
    document.getElementById('pane-'+type).classList.add('active');
    document.getElementById('modalTitle').textContent =
      type === 'image' ? 'ADD PHOTO' : type === 'video' ? 'ADD VIDEO' : 'ADD LINK';
    document.getElementById('mediaModal').style.display = 'flex';
  }
  function closeMediaModal(){ document.getElementById('mediaModal').style.display = 'none'; }

  function handleImageFile(e){
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => { pendingImageData = reader.result; };
    reader.readAsDataURL(file);
  }
  function handleVideoFile(e){
    const file = e.target.files[0];
    if(!file) return;
    if(file.size > 15 * 1024 * 1024){
      if(!confirm('This video is over 15MB and will make the exported file quite large. Continue anyway?')) { e.target.value=''; return; }
    }
    const reader = new FileReader();
    reader.onload = () => { pendingVideoData = reader.result; };
    reader.readAsDataURL(file);
  }

  function convertVideoUrl(url){
    let m = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]{6,})/);
    if(m) return { type:'embed', src:'https://www.youtube.com/embed/'+m[1] };
    m = url.match(/vimeo\.com\/(\d+)/);
    if(m) return { type:'embed', src:'https://player.vimeo.com/video/'+m[1] };
    if(/\.mp4($|\?)/i.test(url)) return { type:'file', src:url };
    return { type:'embed', src:url };
  }

  function insertMedia(){
    if(!currentSlot) return;

    if(currentType === 'image'){
      const url = document.getElementById('imgUrlInput').value.trim();
      const caption = document.getElementById('imgCaptionInput').value.trim();
      const src = pendingImageData || url;
      if(!src){ alert('Choose a file or paste an image URL first.'); return; }
      let gallery = currentSlot.querySelector('.gallery');
      if(!gallery){ gallery = document.createElement('div'); gallery.className='gallery'; currentSlot.appendChild(gallery); }
      const fig = document.createElement('figure');
      const img = document.createElement('img');
      img.src = src; img.alt = caption || 'photo';
      img.onclick = () => openLightbox(src);
      fig.appendChild(img);
      if(caption){ const cap = document.createElement('figcaption'); cap.textContent = caption; fig.appendChild(cap); }
      gallery.appendChild(fig);
    }

    else if(currentType === 'video'){
      const url = document.getElementById('videoUrlInput').value.trim();
      const wrap = document.createElement('div');
      wrap.className = 'video-embed';
      if(pendingVideoData){
        const v = document.createElement('video');
        v.src = pendingVideoData; v.controls = true;
        wrap.appendChild(v);
      } else if(url){
        const info = convertVideoUrl(url);
        if(info.type === 'file'){
          const v = document.createElement('video'); v.src = info.src; v.controls = true; wrap.appendChild(v);
        } else {
          const f = document.createElement('iframe'); f.src = info.src; f.setAttribute('allowfullscreen',''); f.setAttribute('loading','lazy'); wrap.appendChild(f);
        }
      } else { alert('Paste a video link or upload a file first.'); return; }
      currentSlot.appendChild(wrap);
    }

    else if(currentType === 'link'){
      const title = document.getElementById('linkTitleInput').value.trim();
      const url = document.getElementById('linkUrlInput').value.trim();
      const note = document.getElementById('linkNoteInput').value.trim();
      if(!title || !url){ alert('Add a title and a URL.'); return; }
      let domain = url;
      try{ domain = new URL(url).hostname.replace('www.',''); }catch(e){}
      const a = document.createElement('a');
      a.className = 'resource-card'; a.href = url; a.target = '_blank'; a.rel = 'noopener';
      a.innerHTML = '<span class="rc-icon">↗</span><span class="rc-text"><span class="rc-title">'+title+'</span><span class="rc-domain">'+domain+(note?' · '+note:'')+'</span></span>';
      currentSlot.appendChild(a);
    }

    closeMediaModal();
  }

  function openLightbox(src){
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightbox').style.display = 'flex';
  }
  function closeLightbox(){ document.getElementById('lightbox').style.display = 'none'; }

  /* ---------- GLOBAL KEYBOARD CONTROLS ---------- */
  (function(){
    let pinBuffer = '';
    let pinBufferTimer = null;

    function isTypingContext(el){
      if(!el) return false;
      const tag = el.tagName;
      if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if(el.isContentEditable) return true;
      return false;
    }

    function anyModalOpen(){
      return document.getElementById('pinModal').style.display === 'flex'
        || document.getElementById('mediaModal').style.display === 'flex'
        || document.getElementById('lightbox').style.display === 'flex'
        || document.body.classList.contains('sidebar-open');
    }

    document.addEventListener('keydown', function(e){
      const typing = isTypingContext(e.target);

      // Escape: close whatever is open, in priority order
      if(e.key === 'Escape'){
        if(document.getElementById('pinModal').style.display === 'flex'){ closePinModal(); return; }
        if(document.getElementById('mediaModal').style.display === 'flex'){ closeMediaModal(); return; }
        if(document.getElementById('lightbox').style.display === 'flex'){ closeLightbox(); return; }
        if(document.body.classList.contains('sidebar-open')){ closeSidebar(); return; }
        const openResults = document.querySelector('.search-results.show');
        if(openResults){ openResults.classList.remove('show'); return; }
        const focusedSearch = document.activeElement && document.activeElement.closest && document.activeElement.closest('.search-widget') ? document.activeElement : null;
        if(focusedSearch && focusedSearch.value){ focusedSearch.value=''; runSiteSearch('', focusedSearch); }
        if(typing && e.target.blur) e.target.blur();
        return;
      }

      if(typing || anyModalOpen()) return;

      // "/" focuses the site search box, like most search UIs
      if(e.key === '/'){
        e.preventDefault();
        openSidebarSearch();
        return;
      }

      // Left / Right arrows move between pages (tabs)
      if(e.key === 'ArrowRight' || e.key === 'ArrowLeft'){
        const tabs = Array.from(document.querySelectorAll('.sheet-tab'));
        const activeIdx = tabs.findIndex(t=>t.classList.contains('active'));
        if(activeIdx === -1) return;
        e.preventDefault();
        const nextIdx = e.key === 'ArrowRight'
          ? Math.min(activeIdx+1, tabs.length-1)
          : Math.max(activeIdx-1, 0);
        if(nextIdx !== activeIdx) setActive(tabs[nextIdx].getAttribute('data-target'));
        return;
      }

      // Digit keys: silently buffer the last 4 presses. Typing 1544 anywhere
      // on the site (outside of a text field) unlocks editing — a keyboard
      // shortcut for the PIN, no need to open the dialog first.
      if(/^[0-9]$/.test(e.key)){
        pinBuffer = (pinBuffer + e.key).slice(-4);
        clearTimeout(pinBufferTimer);
        pinBufferTimer = setTimeout(()=>{ pinBuffer=''; }, 2000);
        if(pinBuffer === EDIT_PIN){
          pinBuffer = '';
          if(document.getElementById('pinModal').style.display === 'flex'){
            document.getElementById('pinInput').value = EDIT_PIN;
            submitPin();
          } else if(!document.body.classList.contains('edit-mode')){
            toggleEdit();
          }
        }
      }
    });
  })();

  let tabCounter = 7;
  function addTab(){
    const name = prompt('New page name (e.g. "Certifications")');
    if(!name) return;
    tabCounter++;
    const sheetNo = 'S-' + String(tabCounter).padStart(2,'0');
    const id = 'page' + tabCounter;

    const btn = document.createElement('button');
    btn.className = 'sheet-tab';
    btn.setAttribute('data-target', id);
    btn.onclick = function(){ setActive(id); };
    btn.innerHTML = '<span class="label" contenteditable="false">'+name+'</span><span class="tab-del" onclick="event.stopPropagation();delTab(this)">✕</span>';
    document.getElementById('sidebarInner').appendChild(btn);

    const sec = document.createElement('section');
    sec.className = 'sheet';
    sec.id = id;
    sec.setAttribute('data-sheet', sheetNo);
    sec.innerHTML = '<div class="wrap"><div class="eyebrow" contenteditable="true">Custom Page</div><h2 contenteditable="true">'+name+'</h2><div class="card"><button class="del-btn" onclick="this.closest(\'.card\').remove()">✕</button><p contenteditable="true">Click to add your content here…</p><div class="media-slot"></div><button class="media-btn" onclick="openMediaModal(this,\'image\')">+ Photo</button><button class="media-btn" onclick="openMediaModal(this,\'video\')">+ Video</button><button class="media-btn" onclick="openMediaModal(this,\'link\')">+ Link</button></div><button class="add-btn" onclick="addCard(\''+id+'-wrap\', \'exp\')">+ Add card</button></div>';
    document.getElementById('contact').insertAdjacentElement('beforebegin', sec);
    setActive(id);
  }
  function delTab(x){
    const tabs = document.querySelectorAll('.sheet-tab');
    if(tabs.length <= 1) return;
    const btn = x.closest('.sheet-tab');
    const target = btn.getAttribute('data-target');
    const wasActive = btn.classList.contains('active');
    document.getElementById(target).remove();
    btn.remove();
    if(wasActive){ const first = document.querySelector('.sheet-tab'); if(first) setActive(first.getAttribute('data-target')); }
  }

  function exportSite(){
    const wasEditing = document.body.classList.contains('edit-mode');
    if(wasEditing) toggleEdit();
    const first = document.querySelector('.sheet-tab');
    if(first) setActive(first.getAttribute('data-target'));
    const html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    const blob = new Blob([html], {type:'text/html'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'portfolio.html';
    a.click();
    if(wasEditing) toggleEdit();
  }
  function importSite(e){
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(){ document.open(); document.write(reader.result); document.close(); };
    reader.readAsText(file);
  }

  /* ---------- DRAGGABLE EDIT PANEL ---------- */
  (function(){
    const panel = document.getElementById('editPanel');
    const handle = document.getElementById('editPanelHandle');
    let dragging = false, offsetX = 0, offsetY = 0;

    function clamp(left, top){
      const rect = panel.getBoundingClientRect();
      const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
      const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
      return { left: Math.min(Math.max(8, left), maxLeft), top: Math.min(Math.max(8, top), maxTop) };
    }

    handle.addEventListener('pointerdown', function(e){
      dragging = true;
      panel.classList.add('dragging');
      const rect = panel.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      panel.style.left = rect.left + 'px';
      panel.style.top = rect.top + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    handle.addEventListener('pointermove', function(e){
      if(!dragging) return;
      const pos = clamp(e.clientX - offsetX, e.clientY - offsetY);
      panel.style.left = pos.left + 'px';
      panel.style.top = pos.top + 'px';
    });
    function stopDrag(e){
      if(!dragging) return;
      dragging = false;
      panel.classList.remove('dragging');
      try{
        localStorage.setItem('editPanelPos', JSON.stringify({left: panel.style.left, top: panel.style.top}));
      }catch(err){}
    }
    handle.addEventListener('pointerup', stopDrag);
    handle.addEventListener('pointercancel', stopDrag);

    window.addEventListener('resize', function(){
      if(panel.style.left && panel.style.top){
        const pos = clamp(parseFloat(panel.style.left), parseFloat(panel.style.top));
        panel.style.left = pos.left + 'px';
        panel.style.top = pos.top + 'px';
      }
    });

    try{
      const saved = JSON.parse(localStorage.getItem('editPanelPos'));
      if(saved && saved.left && saved.top){
        panel.style.left = saved.left;
        panel.style.top = saved.top;
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        requestAnimationFrame(function(){
          const pos = clamp(parseFloat(panel.style.left), parseFloat(panel.style.top));
          panel.style.left = pos.left + 'px';
          panel.style.top = pos.top + 'px';
        });
      }
    }catch(err){}

    window.resetEditPanelPos = function(e){
      if(e) e.stopPropagation();
      panel.style.left = '';
      panel.style.top = '';
      panel.style.right = '';
      panel.style.bottom = '';
      try{ localStorage.removeItem('editPanelPos'); }catch(err){}
    };
  })();

  /* ---------- EXPORT PROFILE AS PDF ---------- */
  async function exportProfilePDF(){
    if(typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined'){
      alert('PDF export needs an internet connection the first time (it loads a couple of small helper libraries). Please check your connection and try again.');
      return;
    }
    const btn = document.getElementById('pdfExportBtn');
    const originalLabel = btn.textContent;
    btn.textContent = '⏳ Preparing PDF…';
    btn.disabled = true;

    const wasEditing = document.body.classList.contains('edit-mode');
    if(wasEditing) toggleEdit();
    const prevActiveId = document.querySelector('.sheet.active') ? document.querySelector('.sheet.active').id : null;

    document.body.classList.add('pdf-export-mode');
    document.querySelectorAll('.sheet').forEach(s => s.classList.remove('active', 'sheet-in'));

    try{
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const usableW = pageW - margin * 2;
      const usablePageHpx = (pageH - margin * 2);

      const sheets = Array.from(document.querySelectorAll('.sheet'));
      let firstPage = true;

      for(const sheet of sheets){
        sheet.classList.add('active', 'sheet-in');
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        const cs = getComputedStyle(sheet);
        let bg = cs.backgroundColor;
        if(!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent'){
          bg = getComputedStyle(document.body).backgroundColor || '#F7F5EF';
        }

        const canvas = await html2canvas(sheet, {
          scale: 2,
          useCORS: true,
          backgroundColor: bg,
          windowWidth: sheet.scrollWidth
        });

        sheet.classList.remove('active', 'sheet-in');

        const imgW = usableW;
        const pxPerPt = canvas.width / imgW;
        const pageSlicePx = usablePageHpx * pxPerPt;
        let sourceY = 0;

        while(sourceY < canvas.height){
          if(!firstPage) pdf.addPage();
          firstPage = false;

          const sliceHeightPx = Math.min(pageSlicePx, canvas.height - sourceY);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceHeightPx;
          const ctx = sliceCanvas.getContext('2d');
          ctx.drawImage(canvas, 0, sourceY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

          const sliceImgH = sliceHeightPx / pxPerPt;
          pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', margin, margin, imgW, sliceImgH);

          sourceY += sliceHeightPx;
        }
      }

      pdf.save('Muhammad-Ahsan-Amin-Profile.pdf');
    } catch(err){
      console.error(err);
      alert('Sorry, the PDF export ran into a problem (this can happen with images loaded from other websites). Try replacing pasted image URLs with uploaded photos, then export again.');
    } finally {
      document.body.classList.remove('pdf-export-mode');
      if(prevActiveId) setActive(prevActiveId);
      if(wasEditing) toggleEdit();
      btn.textContent = originalLabel;
      btn.disabled = false;
    }
  }

  /* Restore any saved GitHub sync settings / session token on page load. */
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', loadGhConfig);
  } else {
    loadGhConfig();
  }

  /* ---------- HOME HERO SLIDER (Welcome / Who I Am / What I Do) ---------- */
  (function(){
    const visual = document.getElementById('heroVisual');
    if(!visual) return;

    const slides = Array.from(visual.querySelectorAll('.hero-slide'));
    const panels = Array.from(visual.querySelectorAll('.hero-panel'));
    const dots   = Array.from(visual.querySelectorAll('.hero-dot'));
    const total  = slides.length;
    if(!total) return;

    const AUTOPLAY_MS = 3000;
    let current = 0;
    let timer = null;

    function goTo(index){
      index = ((index % total) + total) % total; // wrap both directions
      if(index === current) return;
      slides[current] && slides[current].classList.remove('active');
      panels[current] && panels[current].classList.remove('active');
      dots[current] && (dots[current].classList.remove('active'), dots[current].setAttribute('aria-selected','false'));

      current = index;

      slides[current] && slides[current].classList.add('active');
      panels[current] && panels[current].classList.add('active');
      dots[current] && (dots[current].classList.add('active'), dots[current].setAttribute('aria-selected','true'));
    }

    function next(){ goTo(current + 1); }

    function startAutoplay(){
      stopAutoplay();
      timer = setInterval(next, AUTOPLAY_MS);
    }
    function stopAutoplay(){
      if(timer){ clearInterval(timer); timer = null; }
    }
    function restartAutoplay(){ startAutoplay(); }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => { goTo(i); restartAutoplay(); });
    });

    // Swipe left/right to change slides on touch devices.
    let touchStartX = null;
    visual.addEventListener('touchstart', e=>{ touchStartX = e.touches[0].clientX; }, {passive:true});
    visual.addEventListener('touchend', e=>{
      if(touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if(Math.abs(dx) > 40){ goTo(current + (dx < 0 ? 1 : -1)); restartAutoplay(); }
      touchStartX = null;
    });

    // Pause while the user is interacting with this slide, resume after.
    visual.addEventListener('mouseenter', stopAutoplay);
    visual.addEventListener('mouseleave', startAutoplay);
    visual.addEventListener('focusin', stopAutoplay);
    visual.addEventListener('focusout', startAutoplay);

    // Don't burn through slides while the tab is in the background.
    document.addEventListener('visibilitychange', () => {
      if(document.hidden) stopAutoplay();
      else startAutoplay();
    });

    startAutoplay();
  })();

/* ---------- PLAY STORE STYLE HORIZONTAL PROJECT ROWS ---------- */
function psScroll(btn, dir){
  const wrap = btn.closest('.ps-row-wrap');
  const row = wrap ? wrap.querySelector('.ps-row') : null;
  if(!row) return;
  const amount = Math.max(row.clientWidth * 0.8, 200);
  row.scrollBy({ left: dir * amount, behavior: 'smooth' });
}

function updatePsRowArrows(row){
  const wrap = row.closest('.ps-row-wrap');
  if(!wrap) return;
  const prev = wrap.querySelector('.ps-prev');
  const next = wrap.querySelector('.ps-next');
  const overflows = row.scrollWidth > row.clientWidth + 4;
  if(prev) prev.style.display = (overflows && row.scrollLeft > 4) ? 'flex' : 'none';
  if(next) next.style.display = (overflows && (row.scrollLeft + row.clientWidth < row.scrollWidth - 4)) ? 'flex' : 'none';
}

function enablePsDrag(row){
  let isDown = false, moved = false, startX = 0, startScroll = 0;
  row.addEventListener('mousedown', e=>{
    isDown = true; moved = false; row.classList.add('ps-dragging');
    startX = e.pageX; startScroll = row.scrollLeft;
  });
  window.addEventListener('mouseup', ()=>{ isDown = false; row.classList.remove('ps-dragging'); });
  row.addEventListener('mouseleave', ()=>{ isDown = false; row.classList.remove('ps-dragging'); });
  row.addEventListener('mousemove', e=>{
    if(!isDown) return;
    e.preventDefault();
    const dx = e.pageX - startX;
    if(Math.abs(dx) > 3) moved = true;
    row.scrollLeft = startScroll - dx;
  });
  row.addEventListener('click', e=>{
    if(moved){ e.preventDefault(); e.stopPropagation(); moved = false; }
  }, true);
}

(function initPsRows(){
  const rows = Array.from(document.querySelectorAll('.ps-row'));
  if(!rows.length) return;
  rows.forEach(row=>{
    updatePsRowArrows(row);
    enablePsDrag(row);
    row.addEventListener('scroll', ()=>updatePsRowArrows(row));
    if('ResizeObserver' in window){
      new ResizeObserver(()=>updatePsRowArrows(row)).observe(row);
    }
  });
  let resizeTimer;
  window.addEventListener('resize', ()=>{
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(()=>rows.forEach(updatePsRowArrows), 120);
  });
})();

/* ===================== Section image-loading overlay ===================== *
 * If a section's images take longer than 2s to load, show a centered
 * "Loading {Section} / Please Wait..." spinner instead of a blank/broken
 * layout. Each section is only checked once per page load (cached after
 * its images finish loading, so switching back is instant).
 * ============================================================================ */
(function(){
  const loadedSections = new Set();

  function getSectionLabel(id){
    const tab = document.querySelector('.sheet-tab[data-target="'+id+'"] .label');
    if(tab && tab.textContent.trim()) return tab.textContent.trim();
    return id.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function collectImageUrls(sec){
    const urls = new Set();
    sec.querySelectorAll('[style*="background-image"]').forEach(el=>{
      const bg = el.style.backgroundImage || '';
      const m = bg.match(/url\((['"]?)(.*?)\1\)/);
      if(m && m[2]) urls.add(m[2]);
    });
    sec.querySelectorAll('img[src]').forEach(img=>{
      if(img.src) urls.add(img.src);
    });
    return Array.from(urls);
  }

  function showLoader(sec, label){
    let ov = sec.querySelector(':scope > .section-loader');
    if(!ov){
      ov = document.createElement('div');
      ov.className = 'section-loader';
      ov.innerHTML = '<div class="sl-spinner"></div><div class="sl-text"><b>Loading '+label+'</b>Please Wait…</div>';
      sec.prepend(ov);
    }
    requestAnimationFrame(()=> ov.classList.add('show'));
  }

  function hideLoader(sec){
    const ov = sec.querySelector(':scope > .section-loader');
    if(ov){
      ov.classList.remove('show');
      setTimeout(()=>{ if(ov.parentNode) ov.remove(); }, 260);
    }
  }

  function handleSection(id){
    if(loadedSections.has(id)) return;
    const sec = document.getElementById(id);
    if(!sec) return;
    const urls = collectImageUrls(sec);
    if(!urls.length){ loadedSections.add(id); return; }

    let remaining = urls.length;
    let done = false;
    const label = getSectionLabel(id);

    const timer = setTimeout(()=>{
      if(!done) showLoader(sec, label);
    }, 2000);

    function checkDone(){
      remaining--;
      if(remaining <= 0 && !done){
        done = true;
        clearTimeout(timer);
        hideLoader(sec);
        loadedSections.add(id);
      }
    }

    urls.forEach(url=>{
      const img = new Image();
      img.onload = checkDone;
      img.onerror = checkDone;
      img.src = url;
    });
  }

  document.addEventListener('sheet:activated', e=>{
    if(e.detail && e.detail.id) handleSection(e.detail.id);
  });

  document.addEventListener('DOMContentLoaded', ()=>{
    const active = document.querySelector('.sheet.active');
    if(active) handleSection(active.id);
  });
})();

/* ===================== AI Portfolio Assistant ===================== *
 * Lightweight, fully client-side Q&A assistant. It builds a small
 * knowledge base straight from the page's own content (About, Experience,
 * Projects, Skills, Leadership, Home stats) so it always reflects whatever
 * is currently on the site, then answers questions by matching keywords
 * against that content. When nothing relevant is found, it offers to email
 * Ahsan directly or open the contact form to request a meeting.
 * ==================================================================== */
(function(){
  const CONTACT_EMAIL = 'ahsanamin798@gmail.com';
  const STOPWORDS = new Set(['the','and','for','are','you','your','have','has','had','with','this','that',
    'what','whats',"what's",'how','who','can','could','would','tell','me','about','does','did','was','were',
    'from','into','their','they','them','a','an','of','to','in','on','is','it','do','does','did','please',
    'i','my','mine','we','our','us','any','some','all','more','info','information','know','like','want',
    'hi','hello','hey','thanks','thank']);

  // Slang / synonym map: alternate phrasings people actually type -> canonical
  // words that are likely to appear in the portfolio content. This lets the
  // assistant understand casual, indirect, or slangy questions instead of
  // requiring exact keyword matches.
  const SYNONYMS = {
    'job':'experience','jobs':'experience','gig':'experience','gigs':'experience',
    'work':'experience','worked':'experience','working':'experience','career':'experience',
    'employer':'experience','employers':'experience','company':'experience','companies':'experience',
    'role':'experience','roles':'experience','position':'experience','positions':'experience',
    'internship':'experience','intern':'experience',
    'coding':'skills','code':'skills','programming':'skills','languages':'skills',
    'tech':'skills','techstack':'skills','stack':'skills','tools':'skills','toolkit':'skills',
    'abilities':'skills','strengths':'skills','proficient':'skills','proficiency':'skills',
    'expertise':'skills','skilled':'skills','knows':'skills','knowhow':'skills',
    'project':'projects','projects':'projects','built':'projects','build':'projects',
    'made':'projects','created':'projects','portfolio':'projects','app':'projects','apps':'projects',
    'website':'projects','application':'projects',
    'school':'education','college':'education','university':'education','degree':'education',
    'study':'education','studied':'education','studies':'education','educated':'education',
    'lead':'leadership','led':'leadership','leading':'leadership','manage':'leadership',
    'managed':'leadership','management':'leadership','team':'leadership','volunteer':'leadership',
    'club':'leadership','society':'leadership','organization':'leadership','president':'leadership',
    'bio':'about','background':'about','summary':'about','intro':'about','introduction':'about',
    'himself':'about','person':'about',
    'contact':'contact','email':'contact','reach':'contact','hire':'contact','hiring':'contact',
    'reachout':'contact','connect':'contact',
    'ml':'machine','ai':'artificial','dev':'developer','devs':'developer',
    'frontend':'front','backend':'back','fullstack':'full'
  };

  // Cheap Levenshtein distance for typo/fuzzy tolerance on short words.
  function levenshtein(a,b){
    if(a===b) return 0;
    const al=a.length, bl=b.length;
    if(!al) return bl; if(!bl) return al;
    let prev = new Array(bl+1); for(let j=0;j<=bl;j++) prev[j]=j;
    for(let i=1;i<=al;i++){
      const cur=[i];
      for(let j=1;j<=bl;j++){
        cur[j] = a[i-1]===b[j-1] ? prev[j-1] : 1+Math.min(prev[j-1],prev[j],cur[j-1]);
      }
      prev = cur;
    }
    return prev[bl];
  }

  // Light stemmer: strips common suffixes so "building"/"built"/"builds"
  // loosely line up with "build".
  function stem(w){
    return w.replace(/(ing|edly|ies|ied|ers|er|ed|es|s)$/,'');
  }

  function expandWord(w){
    const out = new Set([w, stem(w)]);
    if(SYNONYMS[w]) out.add(SYNONYMS[w]);
    if(SYNONYMS[stem(w)]) out.add(SYNONYMS[stem(w)]);
    return out;
  }

  function tokenize(str){
    return (str||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/)
      .filter(w=>w.length>2 && !STOPWORDS.has(w));
  }

  function sectionLabel(id){
    const tab = document.querySelector('.sheet-tab[data-target="'+id+'"] .label');
    if(tab && tab.textContent.trim()) return tab.textContent.trim();
    return id.charAt(0).toUpperCase()+id.slice(1);
  }

  /* Build a small knowledge base by grouping meaningful text nodes from
     each major section into bite-size chunks. */
  function buildKnowledgeBase(){
    const ids = ['home','about','experience','skills','projects','leadership'];
    const chunks = [];
    ids.forEach(id=>{
      const sec = document.getElementById(id);
      if(!sec) return;
      const label = sectionLabel(id);
      const nodes = sec.querySelectorAll('h1,h2,h3,h4,p,li,.stat-cap,.ps-title,.ps-sub,.chip,.tb-cell,.exp-role,.exp-org,.role,.lede');
      let group = [];
      let groupLen = 0;
      function flush(){
        const text = group.join(' — ').trim();
        if(text.length > 12) chunks.push({section:id, label, text});
        group = []; groupLen = 0;
      }
      nodes.forEach(el=>{
        const t = el.textContent.replace(/\s+/g,' ').trim();
        if(!t || t.length<2) return;
        group.push(t);
        groupLen += t.length;
        if(groupLen > 260) flush();
      });
      flush();
    });
    return chunks;
  }

  let KB = [];

  // Explicit "which section is this question about" detection — separate
  // from the looser SYNONYMS map used for in-text scoring. Keyed only to
  // real navigable section ids so we can jump the user there.
  const SECTION_INTENT = {
    about: ['about','bio','background','summary','intro','introduction','who'],
    experience: ['experience','job','jobs','work','worked','working','career','employer','employers',
      'company','companies','role','roles','position','positions','internship','intern','history'],
    skills: ['skill','skills','coding','code','programming','language','languages','tech','stack',
      'tool','tools','toolkit','ability','abilities','strength','strengths','proficient','proficiency','expertise'],
    projects: ['project','projects','built','build','made','create','created','app','apps',
      'website','application','portfolio'],
    leadership: ['leadership','lead','led','leading','manage','managed','management','team',
      'volunteer','club','society','organization','president'],
    home: ['home','overview','stats','summary'],
    contact: ['contact','email','reach','hire','hiring','connect']
  };

  // Which query words point at which section, using the same stemming used
  // for the rest of matching so "worked"/"working"/"work" all agree.
  function detectSectionIntent(qWords){
    const votes = {};
    qWords.forEach(qw=>{
      const qs = stem(qw);
      Object.keys(SECTION_INTENT).forEach(sec=>{
        SECTION_INTENT[sec].forEach(kw=>{
          if(qw === kw || qs === stem(kw)) votes[sec] = (votes[sec]||0) + 1;
        });
      });
    });
    let bestSec = null, bestVotes = 0;
    Object.keys(votes).forEach(sec=>{
      if(votes[sec] > bestVotes){ bestVotes = votes[sec]; bestSec = sec; }
    });
    return bestSec;
  }

  // Score one query word against one chunk word, allowing exact match,
  // stemmed match, substring match, and small-typo (fuzzy) match.
  function wordSimilarity(qw, w){
    if(qw === w) return 1;
    const qs = stem(qw), ws = stem(w);
    if(qs === ws) return 0.9;
    if(w.length > 3 && qw.length > 3 && (w.includes(qw) || qw.includes(w))) return 0.7;
    // Fuzzy: tolerate 1 typo on short words, 2 on longer ones.
    if(qw.length > 3 && w.length > 3){
      const maxDist = Math.min(qw.length, w.length) >= 7 ? 2 : 1;
      if(levenshtein(qw, w) <= maxDist) return 0.6;
    }
    return 0;
  }

  function scoreChunk(queryExpansions, chunkWordsSet){
    let score = 0;
    queryExpansions.forEach(expandedSet=>{
      let best = 0;
      expandedSet.forEach(qw=>{
        chunkWordsSet.forEach(w=>{
          const sim = wordSimilarity(qw, w);
          if(sim > best) best = sim;
        });
      });
      score += best;
    });
    return score;
  }

  function bestChunkIn(chunks, queryExpansions){
    let best = null, bestScore = 0;
    chunks.forEach(chunk=>{
      if(!chunk._wordSet) chunk._wordSet = new Set(tokenize(chunk.text));
      const s = scoreChunk(queryExpansions, chunk._wordSet);
      if(s > bestScore){ bestScore = s; best = chunk; }
    });
    return {chunk:best, score:bestScore};
  }

  function findAnswer(query){
    const qWords = tokenize(query);
    if(!qWords.length) return null;
    const queryExpansions = qWords.map(expandWord);
    const intentSection = detectSectionIntent(qWords);

    // If the question clearly points at one section (e.g. "experience" vs
    // "projects"), search only within that section first so the two never
    // collapse into the same answer.
    if(intentSection){
      const sectionChunks = KB.filter(c=>c.section===intentSection);
      if(sectionChunks.length){
        const {chunk, score} = bestChunkIn(sectionChunks, queryExpansions);
        if(chunk && score >= 0.4) return chunk;
        // Nothing scored inside the section — still send them there rather
        // than a generic fallback, using the section's lead chunk.
        if(sectionChunks[0]) return sectionChunks[0];
      }
    }

    const {chunk, score} = bestChunkIn(KB, queryExpansions);
    const threshold = Math.max(0.6, qWords.length * 0.35);
    return (chunk && score >= threshold) ? chunk : null;
  }

  /* ---------- UI wiring ---------- */
  const widget   = document.getElementById('aiChatWidget');
  const launcher = document.getElementById('aiChatLauncher');
  const panel    = document.getElementById('aiChatPanel');
  const closeBtn = document.getElementById('aiChatClose');
  const body     = document.getElementById('aiChatBody');
  const form     = document.getElementById('aiChatForm');
  const input    = document.getElementById('aiChatInput');
  if(!widget || !launcher || !panel || !form || !input) return;

  function scrollBody(){ body.scrollTop = body.scrollHeight; }

  function addMessage(text, who, actionsHtml){
    const div = document.createElement('div');
    div.className = 'ai-msg ' + (who === 'user' ? 'ai-msg-user' : 'ai-msg-bot');
    div.innerHTML = (who === 'user' ? '' : '<span class="ai-msg-tag">Assistant</span>') + escapeHtml(text);
    if(actionsHtml){
      const act = document.createElement('div');
      act.className = 'ai-chat-actions';
      act.innerHTML = actionsHtml;
      div.appendChild(act);
    }
    body.appendChild(div);
    scrollBody();
    return div;
  }

  function escapeHtml(str){
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function mailtoLink(subject, message){
    return 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(message);
  }

  function openContactWithQuestion(question){
    closeChat();
    setActive('contact');
    setTimeout(()=>{
      const msg = document.getElementById('cfMessage');
      if(msg){
        msg.value = question ? ('Re: ' + question) : '';
        msg.focus();
      }
    }, 260);
  }

  // Expose a couple of handlers used by inline onclick in generated buttons.
  window.__aiChatEmail = function(question){
    window.location.href = mailtoLink('Question from portfolio chat', question || 'Hi Ahsan, I had a question after browsing your portfolio:');
  };
  window.__aiChatMeeting = function(question){
    window.location.href = mailtoLink('Meeting request', 'Hi Ahsan, I\'d like to set up a short meeting to discuss: ' + (question || ''));
  };
  window.__aiChatOpenContact = function(question){
    openContactWithQuestion(question);
  };
  window.__aiChatGoTo = function(sectionId){
    closeChat();
    if(typeof setActive === 'function') setActive(sectionId);
    else window.location.hash = sectionId;
  };

  function fallbackActions(question){
    const q = escapeHtml(question).replace(/'/g,"\\'").replace(/"/g,'&quot;');
    return '<button type="button" onclick="__aiChatEmail(\''+q+'\')">✉ Email Ahsan</button>'+
           '<button type="button" onclick="__aiChatMeeting(\''+q+'\')">📅 Request a meeting</button>'+
           '<button type="button" onclick="__aiChatOpenContact(\''+q+'\')">Open contact form</button>';
  }

  function goToActions(sectionId, label){
    return '<button type="button" onclick="__aiChatGoTo(\''+sectionId+'\')">→ Go to '+escapeHtml(label)+'</button>';
  }

  const GREETING_RE = /^(hi|hello|hey|yo|sup|good (morning|afternoon|evening))[\s!.,]*$/i;
  const WHO_RE = /who (are|r) (you|u)|what (are|is) (you|this)/i;
  const CONTACT_RE = /\b(contact|email|hire|hiring|reach ?out|get in touch)\b/i;

  function respond(question){
    if(GREETING_RE.test(question.trim())){
      addMessage('Hey! Ask me about Ahsan\'s projects, tools, experience or education — I\'ll pull the answer straight from this portfolio.', 'bot');
      return;
    }
    if(WHO_RE.test(question)){
      addMessage('I\'m a small built-in assistant that answers questions using the content of this portfolio. For anything I can\'t cover, I\'ll help you contact Ahsan directly.', 'bot');
      return;
    }
    if(CONTACT_RE.test(question)){
      addMessage('You can reach Ahsan directly here:', 'bot', fallbackActions(question));
      return;
    }
    const match = findAnswer(question);
    if(match){
      addMessage(match.text, 'bot', goToActions(match.section, match.label));
    } else {
      addMessage('I couldn\'t find specifics on that in the portfolio. Want to reach out directly?', 'bot', fallbackActions(question));
    }
  }

  function openChat(){
    widget.classList.add('open');
    launcher.setAttribute('aria-expanded','true');
    panel.setAttribute('aria-hidden','false');
    if(!KB.length) KB = buildKnowledgeBase();
    setTimeout(()=> input.focus(), 150);
  }
  function closeChat(){
    widget.classList.remove('open');
    launcher.setAttribute('aria-expanded','false');
    panel.setAttribute('aria-hidden','true');
  }
  function toggleChat(){
    widget.classList.contains('open') ? closeChat() : openChat();
  }

  launcher.addEventListener('click', toggleChat);
  if(closeBtn) closeBtn.addEventListener('click', closeChat);
  document.addEventListener('keydown', e=>{
    if(e.key === 'Escape' && widget.classList.contains('open')) closeChat();
  });
  document.addEventListener('click', e=>{
    if(widget.classList.contains('open') && !widget.contains(e.target)) closeChat();
  });

  form.addEventListener('submit', e=>{
    e.preventDefault();
    const q = input.value.trim();
    if(!q) return;
    addMessage(q, 'user');
    input.value = '';
    setTimeout(()=> respond(q), 220);
  });

  // Rebuild the knowledge base if the site owner edits content in edit mode.
  document.addEventListener('sheet:activated', ()=>{ KB = buildKnowledgeBase(); });
})();
