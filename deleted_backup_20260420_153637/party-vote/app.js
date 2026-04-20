// zentraler App-Controller für Party Vote
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-analytics.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-storage.js";

// ----- Firebase-Konfiguration (vom Nutzer bereitgestellt) -----
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

// Admin-Code (einfacher Client-seitiger Schutz; für Partys akzeptabel)
export const ADMIN_CODE = 'partyadmin';

// Helfer
function setLocalUsername(name){ localStorage.setItem('pv_username', name); }
function getLocalUsername(){ return localStorage.getItem('pv_username'); }
function logoutLocal(){ localStorage.removeItem('pv_username'); location.href = 'index.html'; }

async function usernameExists(username){
  const d = await getDoc(doc(db,'users',username));
  return d.exists();
}

async function uploadImageFile(file, path){
  const r = ref(storage, path);
  const snap = await uploadBytes(r, file);
  const url = await getDownloadURL(r);
  return url;
}

// Page specific logic
document.addEventListener('DOMContentLoaded', ()=>{
  if(document.getElementById('loginForm')) attachLogin();
  if(document.getElementById('registerForm')) attachRegister();
  if(document.getElementById('gallery')) attachGallery();
  if(document.getElementById('adminLogin')) attachAdmin();
});

// Login
function attachLogin(){
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const username = form.username.value.trim();
    if(!username) return alert('Bitte Namen eingeben');
    const exists = await usernameExists(username);
    if(!exists) return alert('Benutzername nicht gefunden');
    setLocalUsername(username);
    location.href = 'gallery.html';
  });
}

// Register
function attachRegister(){
  const form = document.getElementById('registerForm');
  const photo = document.getElementById('photo');
  const preview = document.getElementById('preview');

  photo.addEventListener('change', ()=>{
    const f = photo.files[0];
    if(!f) return preview.style.display='none';
    preview.src = URL.createObjectURL(f); preview.style.display='block';
  });

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const username = form.username.value.trim();
    if(!username) return alert('Gib einen Namen ein');
    if(await usernameExists(username)) return alert('Dieser Name ist schon vergeben');
    if(!photo.files[0]) return alert('Bitte Foto auswählen');
    const file = photo.files[0];
    const path = `users/${username}_${Date.now()}`;
    const url = await uploadImageFile(file, path);
    await setDoc(doc(db,'users',username), { username, photoUrl: url, createdAt: new Date().toISOString() });
    setLocalUsername(username);
    location.href = 'gallery.html';
  });
}

// Gallery / Voting
function attachGallery(){
  const gallery = document.getElementById('gallery');
  const userBox = document.getElementById('userBox');
  const voteBtn = document.getElementById('voteBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const username = getLocalUsername();
  if(!username) return location.href = 'index.html';
  userBox.textContent = `Angemeldet: ${username}`;

  logoutBtn.addEventListener('click', ()=>{ logoutLocal(); });

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
      label.appendChild(input);
      label.append(' '+u.username);
      card.appendChild(img); card.appendChild(label);
      gallery.appendChild(card);
    });
  })();

  voteBtn.addEventListener('click', async ()=>{
    if(!selected) return alert('Bitte zuerst ein Outfit auswählen');
    // prüfen ob schon gevotet
    const q = query(collection(db,'votes'), where('voterUsername','==', username));
    const already = await getDocs(q);
    if(!already.empty) return alert('Du hast bereits gevotet');
    await addDoc(collection(db,'votes'), { targetUsername: selected, voterUsername: username, createdAt: new Date().toISOString() });
    alert('Danke — Stimme abgegeben!');
  });
}

// Admin
function attachAdmin(){
  const form = document.getElementById('adminLogin');
  const results = document.getElementById('results');
  const ranking = document.getElementById('ranking');
  const totalVotes = document.getElementById('totalVotes');

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const code = document.getElementById('adminCode').value.trim();
    if(code !== ADMIN_CODE) return alert('Falscher Admin-Code');
    // lade Stimmen
    const snaps = await getDocs(collection(db,'votes'));
    const counts = {};
    snaps.forEach(d=>{ const v=d.data(); counts[v.targetUsername] = (counts[v.targetUsername]||0)+1; });
    const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    ranking.innerHTML='';
    for(const [username, cnt] of entries){
      const li = document.createElement('li');
      li.textContent = `${username}: ${cnt} Stimmen`;
      ranking.appendChild(li);
    }
    totalVotes.textContent = `Gesamtstimmen: ${snaps.size}`;
    results.style.display = 'block';
  });
}
