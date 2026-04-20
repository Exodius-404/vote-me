// Party Vote — neue saubere Implementierung
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-analytics.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-storage.js";

// --- Firebase-Konfiguration (ersetze durch dein Projekt) ---
const firebaseConfig = {
  apiKey: "AIzaSyBuoDfc7Uw6YCOR2OK1NLL1bX78f221uWY",
  authDomain: "vote-me-96637.firebaseapp.com",
  projectId: "vote-me-96637",
  storageBucket: "vote-me-96637.firebasestorage.app",
  messagingSenderId: "499650109945",
  appId: "1:499650109945:web:cf7db5781ab6d00266dd28",
  measurementId: "G-HNS9CFDYB3"
};

const app = initializeApp(firebaseConfig);
try{ getAnalytics(app); }catch(e){}
const db = getFirestore(app);
const storage = getStorage(app);

// Einfacher Admin-Code (Client-seitig)
const ADMIN_CODE = 'partyadmin';

// Lokaler Username-Store
function setLocalUsername(name){ localStorage.setItem('pv_username', name); }
function getLocalUsername(){ return localStorage.getItem('pv_username'); }
function clearLocalUsername(){ localStorage.removeItem('pv_username'); }

// Prüfe, ob Username schon existiert (Doc-ID = username)
async function usernameExists(username){
  const d = await getDoc(doc(db,'users',username));
  return d.exists();
}

async function uploadFile(file, path){
  const r = ref(storage,path);
  await uploadBytes(r,file);
  return await getDownloadURL(r);
}

// Page bootstrap
document.addEventListener('DOMContentLoaded', ()=>{
  if(document.getElementById('loginForm')) initLogin();
  if(document.getElementById('registerForm')) initRegister();
  if(document.getElementById('gallery')) initGallery();
  if(document.getElementById('adminLogin')) initAdmin();
});

// Login-Seite
function initLogin(){
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const username = form.username.value.trim();
    if(!username) return alert('Bitte Namen eingeben');
    if(!(await usernameExists(username))) return alert('Benutzername nicht gefunden');
    setLocalUsername(username);
    location.href = 'gallery.html';
  });
}

// Register-Seite
function initRegister(){
  const form = document.getElementById('registerForm');
  const photo = document.getElementById('photo');
  const preview = document.getElementById('preview');

  photo.addEventListener('change', ()=>{
    const f = photo.files[0];
    if(!f){ preview.style.display='none'; return; }
    preview.src = URL.createObjectURL(f); preview.style.display='block';
  });

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const username = form.username.value.trim();
    if(!username) return alert('Gib einen Namen ein');
    if(await usernameExists(username)) return alert('Dieser Name ist schon vergeben');
    const f = photo.files[0];
    if(!f) return alert('Bitte Foto wählen');
    const path = `users/${username}_${Date.now()}`;
    const url = await uploadFile(f,path);
    await setDoc(doc(db,'users',username), { username, photoUrl: url, createdAt: new Date().toISOString() });
    setLocalUsername(username);
    location.href = 'gallery.html';
  });
}

// Gallery / Voting
function initGallery(){
  const gallery = document.getElementById('gallery');
  const userBox = document.getElementById('userBox');
  const voteBtn = document.getElementById('voteBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const username = getLocalUsername();
  if(!username) return location.href = 'index.html';
  userBox.textContent = `Angemeldet: ${username}`;
  logoutBtn.addEventListener('click', ()=>{ clearLocalUsername(); location.href='index.html'; });

  let selected = null;

  (async ()=>{
    const snaps = await getDocs(collection(db,'users'));
    snaps.forEach(d=>{
      const u = d.data();
      const card = document.createElement('div'); card.className='card';
      const img = document.createElement('img'); img.src = u.photoUrl; img.alt = u.username;
      const label = document.createElement('label');
      const input = document.createElement('input'); input.type='radio'; input.name='vote'; input.value = u.username;
      input.addEventListener('change', ()=>{ selected = input.value; });
      label.appendChild(input); label.append(' '+u.username);
      card.appendChild(img); card.appendChild(label);
      gallery.appendChild(card);
    });
  })();

  voteBtn.addEventListener('click', async ()=>{
    if(!selected) return alert('Bitte zuerst ein Outfit auswählen');
    // Prüfen ob bereits gevotet
    const q = query(collection(db,'votes'), where('voterUsername','==', username));
    const already = await getDocs(q);
    if(!already.empty) return alert('Du hast bereits gevotet');
    await addDoc(collection(db,'votes'), { targetUsername: selected, voterUsername: username, createdAt: new Date().toISOString() });
    alert('Danke — Stimme abgegeben!');
  });
}

// Admin
function initAdmin(){
  const form = document.getElementById('adminLogin');
  const results = document.getElementById('results');
  const ranking = document.getElementById('ranking');
  const totalVotes = document.getElementById('totalVotes');

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const code = document.getElementById('adminCode').value.trim();
    if(code !== ADMIN_CODE) return alert('Falscher Admin-Code');
    const snaps = await getDocs(collection(db,'votes'));
    const counts = {};
    snaps.forEach(d=>{ const v=d.data(); counts[v.targetUsername] = (counts[v.targetUsername]||0)+1; });
    const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    ranking.innerHTML='';
    for(const [u,c] of entries){ const li=document.createElement('li'); li.textContent=`${u}: ${c} Stimmen`; ranking.appendChild(li); }
    totalVotes.textContent = `Gesamtstimmen: ${snaps.size}`;
    results.classList.remove('hidden');
  });
}
