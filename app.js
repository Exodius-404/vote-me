// Party Outfit Voting - Firebase-enabled frontend
// Firebase configuration (restored from backup)
const firebaseConfig = {
  apiKey: "AIzaSyBuoDfc7Uw6YCOR2OK1NLL1bX78f221uWY",
  authDomain: "vote-me-96637.firebaseapp.com",
  projectId: "vote-me-96637",
  storageBucket: "vote-me-96637.firebasestorage.app",
  messagingSenderId: "499650109945",
  appId: "1:499650109945:web:cf7db5781ab6d00266dd28",
  measurementId: "G-HNS9CFDYB3"
};

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, getDocs, updateDoc, doc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js';

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// UI refs
const tabSubmit = document.getElementById('tab-submit');
const tabBrowse = document.getElementById('tab-browse');
const tabAdmin = document.getElementById('tab-admin');
const panelSubmit = document.getElementById('panel-submit');
const panelBrowse = document.getElementById('panel-browse');
const panelAdmin = document.getElementById('panel-admin');

function show(panel){
  panelSubmit.classList.add('hidden');
  panelBrowse.classList.add('hidden');
  panelAdmin.classList.add('hidden');
  panel.classList.remove('hidden');
}

tabSubmit.onclick = ()=> show(panelSubmit);
tabBrowse.onclick = ()=> show(panelBrowse);
tabAdmin.onclick = ()=> show(panelAdmin);

// Registration / login
document.getElementById('btn-register').addEventListener('click', async ()=>{
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const file = document.getElementById('reg-file').files[0];
  const status = document.getElementById('submit-status');
  if(!name || !email || !pass || !file){ status.textContent = 'Bitte alle Felder ausfüllen und Foto wählen.'; return; }
  status.textContent = 'Registriere…';
  try{
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = cred.user.uid;
    const storageRef = ref(storage, `outfits/${uid}_${Date.now()}`);
    const bytes = await file.arrayBuffer();
    await uploadBytes(storageRef, new Uint8Array(bytes));
    const url = await getDownloadURL(storageRef);
    await addDoc(collection(db,'submissions'), { uid, name, imageUrl: url, createdAt: serverTimestamp() });
    status.textContent = 'Erfolgreich registriert und Outfit hochgeladen.';
  }catch(e){ status.textContent = 'Fehler: ' + e.message; }
});

document.getElementById('btn-login').addEventListener('click', async ()=>{
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  try{ await signInWithEmailAndPassword(auth,email,pass); alert('Angemeldet'); } catch(e){ alert('Login fehlgeschlagen: '+e.message); }
});
document.getElementById('btn-logout').addEventListener('click', async ()=>{ await signOut(auth); alert('Abgemeldet'); });

// Browse & Voting
const submissionsList = document.getElementById('submissions-list');
let submissions = [];
let votes = [];

function renderSubmissions(){
  const voteCount = votes.reduce((m,v)=>{ m[v.submissionId] = (m[v.submissionId]||0)+1; return m; },{});
  submissionsList.innerHTML = '';
  submissions.forEach(s=>{
    const card = document.createElement('div'); card.className='card';
    const img = document.createElement('img'); img.src = s.imageUrl; img.alt = s.name || '';
    const h = document.createElement('h4'); h.textContent = s.name || '';
    const cnt = document.createElement('div'); cnt.className='count'; cnt.textContent = 'Stimmen: ' + (voteCount[s.id]||0);
    const btn = document.createElement('button'); btn.textContent='Abstimmen';
    if(localStorage.getItem('voted_'+s.id)){ btn.disabled=true; btn.textContent='Schon abgestimmt'; }
    btn.addEventListener('click', async ()=>{
      if(localStorage.getItem('voted_'+s.id)) return;
      await addDoc(collection(db,'votes'), { submissionId: s.id, createdAt: serverTimestamp() });
      localStorage.setItem('voted_'+s.id,'1');
      loadVotes();
    });
    card.appendChild(img); card.appendChild(h); card.appendChild(cnt); card.appendChild(btn);
    submissionsList.appendChild(card);
  });
}

async function loadSubmissions(){
  const snap = await getDocs(query(collection(db,'submissions'), orderBy('createdAt','desc')));
  submissions = snap.docs.map(d=>({ id: d.id, ...d.data() }));
  renderSubmissions();
}

async function loadVotes(){
  const snap = await getDocs(collection(db,'votes'));
  votes = snap.docs.map(d=>({ id:d.id, ...d.data() }));
  renderSubmissions();
}

onSnapshot(collection(db,'submissions'), ()=> loadSubmissions());
onSnapshot(collection(db,'votes'), ()=> loadVotes());

// Admin: compute rankings and CSV export
document.getElementById('btn-refresh-stats').addEventListener('click', ()=> computeRankings());
async function computeRankings(){
  const snapS = await getDocs(collection(db,'submissions'));
  const snapV = await getDocs(collection(db,'votes'));
  const subs = snapS.docs.map(d=>({ id:d.id, ...d.data() }));
  const votesArr = snapV.docs.map(d=>d.data());
  const counts = {};
  votesArr.forEach(v=> counts[v.submissionId] = (counts[v.submissionId]||0)+1);
  const ranked = subs.map(s=>({ name: s.name, imageUrl: s.imageUrl, votes: counts[s.id]||0 })).sort((a,b)=>b.votes-a.votes);
  const el = document.getElementById('rankings'); el.innerHTML = '';
  ranked.forEach(r=>{ const d=document.createElement('div'); d.className='rank'; d.textContent = `${r.name} — ${r.votes} Stimmen`; el.appendChild(d); });
}

document.getElementById('btn-export-csv').addEventListener('click', async ()=>{
  const snapS = await getDocs(collection(db,'submissions'));
  const snapV = await getDocs(collection(db,'votes'));
  const subs = snapS.docs.map(d=>({ id:d.id, ...d.data() }));
  const votesArr = snapV.docs.map(d=>d.data());
  const counts = {};
  votesArr.forEach(v=> counts[v.submissionId] = (counts[v.submissionId]||0)+1);
  const rows = [['Name','ImageUrl','Votes']];
  subs.forEach(s=> rows.push([s.name, s.imageUrl, counts[s.id]||0]));
  const csv = rows.map(r=> r.map(c=> '"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'rankings.csv'; a.click();
});

// initial load
loadSubmissions(); loadVotes();
