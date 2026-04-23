// Simple client debts manager using localStorage
(function(){
  const LS_KEY = 'bodega_deudas_clients_v1';
  const API_BASE = 'http://localhost:3000';
  let useApi = false;

  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

  async function detectApi(){
    try{
      const res = await fetch(API_BASE + '/deudas', { method: 'GET' });
      useApi = res.ok;
    }catch(e){ useApi = false; }
  }

  function loadLocal(){
    try{ return JSON.parse(localStorage.getItem(LS_KEY)) || []; }catch(e){ return []; }
  }
  function saveLocal(data){ localStorage.setItem(LS_KEY, JSON.stringify(data)); }

  // API helpers
  async function apiGetClients(){ const r = await fetch(API_BASE + '/deudas'); return r.ok ? await r.json() : []; }
  async function apiAddClient(c){ const r = await fetch(API_BASE + '/deudas', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(c) }); return r.ok ? await r.json() : null; }
  async function apiUpdateClient(id, patch){ const r = await fetch(API_BASE + '/deudas/' + id, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(patch) }); return r.ok ? await r.json() : null; }
  async function apiDeleteClient(id){ await fetch(API_BASE + '/deudas/' + id, { method: 'DELETE' }); }
  async function apiAddProduct(id, product){ const r = await fetch(API_BASE + '/deudas/' + id + '/products', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(product) }); return r.ok ? await r.json() : null; }
  async function apiDeleteProduct(id, index){ const r = await fetch(API_BASE + '/deudas/' + id + '/products/' + index, { method: 'DELETE' }); return r.ok ? await r.json() : null; }

  let clients = [];
  let selectedId = null;

  const els = {
    clientForm: document.getElementById('client-form'),
    nameInput: document.getElementById('client-name'),
    phoneInput: document.getElementById('client-phone'),
    clientsList: document.getElementById('clients-list'),
    detailTitle: document.getElementById('detail-title'),
    clientDetail: document.getElementById('client-detail'),
    detailName: document.getElementById('detail-name'),
    detailPhone: document.getElementById('detail-phone'),
    productForm: document.getElementById('product-form'),
    productName: document.getElementById('product-name'),
    productAmount: document.getElementById('product-amount'),
    productsList: document.getElementById('products-list'),
    totalAmount: document.getElementById('total-amount')
  };

  function renderClients(){
    els.clientsList.innerHTML = '';
    clients.forEach(c => {
      const li = document.createElement('li');
      li.dataset.id = c.id;

      const left = document.createElement('div');
      left.innerHTML = `<div class=\"client-name\">${escapeHtml(c.name)}</div><div class=\"client-phone\">${escapeHtml(c.phone||'')}</div>`;

      const right = document.createElement('div');
      right.textContent = totalFor(c) + ' Bs';
      if(totalFor(c) > 20000) right.style.color = '#ff6b6b';

      const actions = document.createElement('div');
      actions.style.marginLeft = '0.6rem';

      const btnOpen = document.createElement('button'); btnOpen.textContent = 'Ver';
      btnOpen.addEventListener('click', (ev)=>{ ev.stopPropagation(); selectClient(c.id); });

      const btnEdit = document.createElement('button'); btnEdit.textContent = 'Editar';
      btnEdit.addEventListener('click', (ev)=>{ ev.stopPropagation(); startEditClient(c.id); });

      const btnDel = document.createElement('button'); btnDel.textContent = 'Eliminar';
      btnDel.addEventListener('click', async (ev)=>{ ev.stopPropagation(); if(!confirm('Eliminar cliente?')) return; await deleteClient(c.id); });

      actions.appendChild(btnOpen);
      actions.appendChild(btnEdit);
      actions.appendChild(btnDel);

      const container = document.createElement('div');
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'space-between';

      const leftWrap = document.createElement('div'); leftWrap.appendChild(left);
      const rightWrap = document.createElement('div'); rightWrap.style.display = 'flex'; rightWrap.style.alignItems = 'center'; rightWrap.appendChild(right); rightWrap.appendChild(actions);

      li.appendChild(leftWrap);
      li.appendChild(rightWrap);

      li.addEventListener('click', ()=> selectClient(c.id));
      els.clientsList.appendChild(li);
    });
  }

  function totalFor(client){
    return (client.products||[]).reduce((s,p)=> s + Number(p.amount||0), 0);
  }

  function selectClient(id){
    selectedId = id;
    const c = clients.find(x=>x.id===id);
    if(!c) return;
    els.detailTitle.textContent = 'Detalle de deuda';
    els.clientDetail.classList.remove('hidden');
    els.detailName.textContent = c.name;
    els.detailPhone.textContent = c.phone || '';
    renderProducts(c);
  }

  function renderProducts(c){
    els.productsList.innerHTML = '';
    (c.products||[]).forEach((p, idx)=>{
      const li = document.createElement('li');
      const left = document.createElement('span'); left.textContent = p.name;
      const right = document.createElement('span'); right.textContent = (Number(p.amount)||0) + ' Bs';
      const del = document.createElement('button'); del.textContent = 'Eliminar';
      del.addEventListener('click', async (ev)=>{ ev.stopPropagation(); if(!confirm('Eliminar producto?')) return; await deleteProduct(idx); });
      li.appendChild(left); li.appendChild(right); li.appendChild(del);
      els.productsList.appendChild(li);
    });
    const total = totalFor(c);
    els.totalAmount.textContent = total;
    if(total > 20000) els.totalAmount.classList.add('total-high'); else els.totalAmount.classList.remove('total-high');
    renderClients();
  }

  function addClient(name, phone){
    const c = { id: uid(), name: name.trim(), phone: phone.trim(), products: [] };
    (async ()=>{
      if(useApi){
        const created = await apiAddClient(c);
        if(created) clients.unshift(created);
      } else {
        clients.unshift(c); saveLocal(clients);
      }
      renderClients(); selectClient(c.id);
    })();
  }

  function addProductToSelected(name, amount){
    if(!selectedId) return;
    const c = clients.find(x=>x.id===selectedId);
    if(!c) return;
    (async ()=>{
      if(useApi){
        const updated = await apiAddProduct(selectedId, { name: name.trim(), amount: Number(amount) });
        if(updated){
          const idx = clients.findIndex(x=>x.id===selectedId); if(idx!==-1) clients[idx]=updated;
          renderProducts(updated);
        }
      } else {
        c.products.push({ name: name.trim(), amount: Number(amount) });
        saveLocal(clients);
        renderProducts(c);
      }
    })();
  }

  function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[ch]); }

  // client/product actions: delete, edit
  async function deleteClient(id){
    if(useApi){ await apiDeleteClient(id); clients = clients.filter(x=>x.id!==id); saveLocal(clients); els.clientDetail.classList.add('hidden'); renderClients(); }
    else { clients = clients.filter(x=>x.id!==id); saveLocal(clients); els.clientDetail.classList.add('hidden'); renderClients(); }
  }

  async function deleteProduct(index){
    if(!selectedId) return;
    if(useApi){ const updated = await apiDeleteProduct(selectedId, index); if(updated){ const idx = clients.findIndex(x=>x.id===selectedId); if(idx!==-1) clients[idx]=updated; renderProducts(updated); } }
    else { const c = clients.find(x=>x.id===selectedId); if(!c) return; c.products.splice(index,1); saveLocal(clients); renderProducts(c); }
  }

  function startEditClient(id){
    const c = clients.find(x=>x.id===id); if(!c) return;
    const newName = prompt('Nombre:', c.name); if(newName===null) return;
    const newPhone = prompt('Teléfono:', c.phone||'');
    (async ()=>{
      if(useApi){ const updated = await apiUpdateClient(id, { name: newName, phone: newPhone }); if(updated){ const i=clients.findIndex(x=>x.id===id); clients[i]=updated; renderClients(); selectClient(id); } }
      else { const i=clients.findIndex(x=>x.id===id); clients[i].name=newName; clients[i].phone=newPhone; saveLocal(clients); renderClients(); selectClient(id); }
    })();
  }

  // events
  els.clientForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = els.nameInput.value;
    const phone = els.phoneInput.value;
    if(!name.trim()) return;
    addClient(name, phone);
    els.nameInput.value = '';
    els.phoneInput.value = '';
  });

  els.productForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const pname = els.productName.value;
    const pamount = parseFloat(els.productAmount.value) || 0;
    if(!pname.trim()) return;
    addProductToSelected(pname, pamount);
    els.productName.value = '';
    els.productAmount.value = '';
  });

  // initial render / init
  (async ()=>{
    await detectApi();
    if(useApi){ clients = await apiGetClients(); }
    else { clients = loadLocal(); }
    renderClients();
    if(clients.length) selectClient(clients[0].id);
  })();

})();
