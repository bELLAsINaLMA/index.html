// sketchpro.js
function initSketchPro(container) {
  (function(){
    let pages = JSON.parse(localStorage.getItem('sketchProPages')) || [{title:'Página 1', elements:[]}];
    let currentPage = parseInt(localStorage.getItem('sketchProCurrent')) || 0;
    let selectedEl = null;
    let headerData = JSON.parse(localStorage.getItem('sketchProHeader')) || {title:'SketchPro', subtitle:'Subtítulo interactivo'};
    let nightMode = JSON.parse(localStorage.getItem('sketchProNight')) || false;

    // Crear el área principal
    container.innerHTML = `
      <div id="sketchbook">
        <div class="toolbar">
          <div class="menuButton" id="menuBtn">
            <div></div><div></div><div></div>
          </div>
          <div class="menuPanel" id="menuPanel">
            <select id="pageSelect"></select>
            <button id="addPage">+ Página</button>
            <button id="addText">+ Texto</button>
            <input type="file" id="imgUpload" accept="image/*">
            <button id="deleteEl">Borrar</button>
            <button id="saveSketchbook">Guardar</button>
            <button id="exportPDF">Exportar PDF</button>
          </div>
        </div>
        <div id="pageArea"></div>
      </div>
      <button id="darkModeBtn">🌙</button>
    `;

    const pageArea = container.querySelector('#pageArea');
    const pageSelect = container.querySelector('#pageSelect');
    const menuBtn = container.querySelector('#menuBtn');
    const menuPanel = container.querySelector('#menuPanel');
    const darkModeBtn = container.querySelector('#darkModeBtn');

    function uid(){return 'id'+Math.random().toString(36).substr(2,9)}

    function applyMode(){
      if(nightMode){
        container.classList.add('night');
        pageArea.classList.add('night');
        document.querySelectorAll('.textElement').forEach(el=>el.classList.add('night'));
        darkModeBtn.textContent='☀️';
      } else {
        container.classList.remove('night');
        pageArea.classList.remove('night');
        document.querySelectorAll('.textElement').forEach(el=>el.classList.remove('night'));
        darkModeBtn.textContent='🌙';
      }
    }

    function saveState(){
      pages.forEach(p=>p.elements.forEach(el=>{
        if(el.type==='text'){
          const domEl = container.querySelector(`.element[data-id='${el.id}']`);
          if(domEl) el.content = domEl.innerHTML;
        } else if(el.type==='image'){
          const domEl = container.querySelector(`.element[data-id='${el.id}'] img`);
          if(domEl) el.width = domEl.offsetWidth;
        }
      }));
      localStorage.setItem('sketchProPages', JSON.stringify(pages));
      localStorage.setItem('sketchProCurrent', currentPage);
      localStorage.setItem('sketchProHeader', JSON.stringify(headerData));
      localStorage.setItem('sketchProNight', JSON.stringify(nightMode));
      alert('SketchPro guardado ✅');
    }

    function renderPagesDropdown(){
      pageSelect.innerHTML='';
      pages.forEach((p,i)=>{
        const opt = document.createElement('option');
        opt.value=i;
        opt.text = p.title;
        pageSelect.appendChild(opt);
      });
      pageSelect.value=currentPage;
    }

    function render(){
      pageArea.innerHTML='';
      const p = pages[currentPage];
      p.elements.forEach(el=>{
        const wrapper = document.createElement('div');
        wrapper.className='element '+(el.type==='text'?'textElement':'imageElement');
        if(nightMode && el.type==='text') wrapper.classList.add('night');
        wrapper.dataset.id=el.id;
        wrapper.style.left=el.left+'px';
        wrapper.style.top=el.top+'px';
        wrapper.style.position='absolute';
        wrapper.style.cursor='move';
        if(el.type==='text'){ wrapper.contentEditable=true; wrapper.innerHTML=el.content; }
        else if(el.type==='image'){
          const img=document.createElement('img');
          img.src=el.src; img.style.width=(el.width||240)+'px'; wrapper.appendChild(img);
          const handle=document.createElement('div'); handle.className='resizeHandle'; wrapper.appendChild(handle);
          attachImageResize(wrapper,img,handle,el);
        }
        attachDrag(wrapper,el);
        wrapper.addEventListener('click',e=>{ e.stopPropagation(); selectElement(wrapper); });
        pageArea.appendChild(wrapper);
      });
    }

    function attachDrag(wrapper,el){
      let dragging=false,ox=0,oy=0;
      wrapper.addEventListener('pointerdown',e=>{ dragging=true; ox=e.clientX-wrapper.getBoundingClientRect().left; oy=e.clientY-wrapper.getBoundingClientRect().top; });
      window.addEventListener('pointermove',e=>{ if(!dragging) return; const rect=wrapper.parentElement.getBoundingClientRect(); wrapper.style.left=(e.clientX-rect.left-ox)+'px'; wrapper.style.top=(e.clientY-rect.top-oy)+'px'; });
      window.addEventListener('pointerup',()=>{ if(dragging){ dragging=false; el.left=parseInt(wrapper.style.left); el.top=parseInt(wrapper.style.top); }});
    }

    function attachImageResize(wrapper,img,handle,el){
      let resizing=false,startW=0,startX=0;
      handle.addEventListener('pointerdown',e=>{ resizing=true; startW=img.offsetWidth; startX=e.clientX; });
      window.addEventListener('pointermove',e=>{ if(!resizing) return; img.style.width=Math.max(40,startW+(e.clientX-startX))+'px'; });
      window.addEventListener('pointerup',()=>{ if(resizing){ resizing=false; el.width=img.offsetWidth; }});
    }

    function selectElement(el){
      if(selectedEl) selectedEl.classList.remove('selected');
      selectedEl=el;
      el.classList.add('selected');
    }

    document.body.addEventListener('click',()=>{ if(selectedEl){ selectedEl.classList.remove('selected'); selectedEl=null; }});
    menuBtn.addEventListener('click',e=>{ e.stopPropagation(); menuPanel.classList.toggle('open'); });
    document.body.addEventListener('click',()=>{ menuPanel.classList.remove('open'); });

    container.querySelector('#addText').addEventListener('click',()=>{ pages[currentPage].elements.push({id:uid(),type:'text',left:20,top:20,content:'<p>Texto</p>'}); render(); });
    container.querySelector('#imgUpload').addEventListener('change',e=>{
      const f=e.target.files[0]; if(!f) return;
      const reader=new FileReader();
      reader.onload=()=>{ pages[currentPage].elements.push({id:uid(),type:'image',left:20,top:20,src:reader.result,width:240}); render(); };
      reader.readAsDataURL(f);
    });
    container.querySelector('#deleteEl').addEventListener('click',()=>{ if(selectedEl){ const id=selectedEl.dataset.id; pages[currentPage].elements=pages[currentPage].elements.filter(el=>el.id!==id); selectedEl=null; render(); }});
    container.querySelector('#saveSketchbook').addEventListener('click',saveState);
    container.querySelector('#exportPDF').addEventListener('click',()=>{
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = ()=> html2pdf().set({margin:0.2, filename:'pagina.pdf', image:{type:'jpeg',quality:0.98}, html2canvas:{scale:2}, jsPDF:{unit:'in', format:'a4', orientation:'portrait'}}).from(pageArea).save();
      document.body.appendChild(script);
    });

    container.querySelector('#addPage').addEventListener('click',()=>{
      const newTitle='Página '+(pages.length+1);
      pages.push({title:newTitle,elements:[]});
      currentPage=pages.length-1;
      renderPagesDropdown();
      render();
    });

    pageSelect.addEventListener('change',()=>{ currentPage=parseInt(pageSelect.value); render(); });

    darkModeBtn.addEventListener('click',()=>{ nightMode=!nightMode; localStorage.setItem('sketchProNight',JSON.stringify(nightMode)); applyMode(); });

    applyMode();
    renderPagesDropdown();
    render();
  })();
}
