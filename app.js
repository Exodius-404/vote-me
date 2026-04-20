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

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js';
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, getDocs, updateDoc, doc } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-storage.js';
// analytics removed to avoid extra REST calls when project config is missing

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);


document.addEventListener('DOMContentLoaded', ()=>{
  // Pages
  const loginPage = document.getElementById('login-page');
  const registerPage = document.getElementById('register-page');
  const votingPage = document.getElementById('voting-page');
  const adminPage = document.getElementById('admin-page');

  function showPage(page){
    [loginPage, registerPage, votingPage, adminPage].forEach(p=>p.classList.add('hidden'));
    page.classList.remove('hidden');
  }

  // Navigation links between login/register
  document.getElementById('link-to-register').addEventListener('click', (e)=>{ e.preventDefault(); showPage(registerPage); });
  document.getElementById('link-to-login').addEventListener('click', (e)=>{ e.preventDefault(); showPage(loginPage); });

  // Local session helpers
  function setSession(userId, username){ localStorage.setItem('vm_userId', userId); localStorage.setItem('vm_username', username); }
  function clearSession(){ localStorage.removeItem('vm_userId'); localStorage.removeItem('vm_username'); }
  function getSession(){ return { userId: localStorage.getItem('vm_userId'), username: localStorage.getItem('vm_username') }; }

  // Login by username
  document.getElementById('btn-login-username').addEventListener('click', async ()=>{
    const username = document.getElementById('login-username').value.trim();
    if(!username){ alert('Bitte Nutzernamen eingeben'); return; }
    const q = query(collection(db,'users'), where('username','==',username));
    const snap = await getDocs(q);
    if(snap.empty){ alert('Nutzername nicht gefunden'); return; }
    const userDoc = snap.docs[0];
    setSession(userDoc.id, username);
    showVotingForUser();
  });

  // Register: unique username + upload photo + create submission
  document.getElementById('btn-register').addEventListener('click', async ()=>{
    const username = document.getElementById('reg-username').value.trim();
    const file = document.getElementById('reg-file').files[0];
    const status = document.getElementById('register-status');
    if(!username || !file){ status.textContent = 'Bitte Namen und Foto angeben.'; return; }
    status.textContent = 'Prüfe Namen…';
    const q = query(collection(db,'users'), where('username','==',username));
    const snap = await getDocs(q);
    if(!snap.empty){ status.textContent = 'Dieser Name ist bereits vergeben.'; return; }
    status.textContent = 'Erstelle Account…';
    try{
      const userRef = await addDoc(collection(db,'users'), { username, createdAt: serverTimestamp() });
      const userId = userRef.id;
      // upload image
      const storageRef = ref(storage, `outfits/${userId}_${Date.now()}`);
      const bytes = await file.arrayBuffer();
      await uploadBytes(storageRef, new Uint8Array(bytes));
      const url = await getDownloadURL(storageRef);
      // create submission
      await addDoc(collection(db,'submissions'), { userId, username, imageUrl: url, createdAt: serverTimestamp() });
      setSession(userId, username);
      status.textContent = 'Registrierung erfolgreich.';
      showVotingForUser();
    }catch(e){ status.textContent = 'Fehler: '+e.message; }
  });

  // Logout
  document.getElementById('btn-logout').addEventListener('click', ()=>{ clearSession(); showPage(loginPage); });

  // Voting logic
  const submissionsList = document.getElementById('submissions-list');
  let submissions = [];
  let currentSelection = null;

  async function fetchUserVote(userId){
    const q = query(collection(db,'votes'), where('voterId','==',userId));
    const snap = await getDocs(q);
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  }

  function renderVoting(userId){
    submissionsList.innerHTML = '';
    submissions.forEach(s=>{
      const card = document.createElement('div'); card.className='card submission-card';
      const label = document.createElement('label'); label.className='submission-label';
      const radio = document.createElement('input'); radio.type='radio'; radio.name='vote'; radio.value = s.id;
      radio.addEventListener('change', ()=> currentSelection = s.id);
      const img = document.createElement('img'); img.src = s.imageUrl; img.alt = s.username || s.name || 'Outfit';
      const h = document.createElement('div'); h.textContent = s.username || '';
      label.appendChild(radio); label.appendChild(img); label.appendChild(h);
      card.appendChild(label);
      submissionsList.appendChild(card);
    });
  }

  // Use polling instead of onSnapshot to avoid long-lived webchannel streams
  async function pollSubmissions(){
    try{
      const snap = await getDocs(query(collection(db,'submissions'), orderBy('createdAt','desc')));
      submissions = snap.docs.map(d=>({ id: d.id, ...d.data() }));
      const sess = getSession();
      if(sess.userId) renderVoting(sess.userId);
    }catch(e){
      console.warn('pollSubmissions error:', e);
    }
  }
  // initial poll and regular interval
  pollSubmissions();
  const _pollInterval = setInterval(pollSubmissions, 5000);

  // Submit vote button
  document.getElementById('btn-submit-vote').addEventListener('click', async ()=>{
    const sess = getSession();
    if(!sess.userId){ alert('Bitte zuerst anmelden.'); showPage(loginPage); return; }
    if(!currentSelection){ alert('Bitte ein Foto auswählen.'); return; }
    // check existing vote by this user
    const q = query(collection(db,'votes'), where('voterId','==',sess.userId));
    const snap = await getDocs(q);
    if(snap.empty){
      await addDoc(collection(db,'votes'), { voterId: sess.userId, submissionId: currentSelection, createdAt: serverTimestamp() });
      alert('Stimme abgegeben');
    } else {
      const voteDoc = snap.docs[0];
      await updateDoc(doc(db,'votes',voteDoc.id), { submissionId: currentSelection, createdAt: serverTimestamp() });
      alert('Stimme aktualisiert');
    }
  });

  // Show voting page with current user
  async function showVotingForUser(){
    const sess = getSession();
    if(!sess.userId){ showPage(loginPage); return; }
    document.getElementById('current-user').textContent = 'Angemeldet als: ' + sess.username;
    showPage(votingPage);
    // pre-select existing vote
    const userVote = await fetchUserVote(sess.userId);
    if(userVote) currentSelection = userVote.submissionId;
    renderVoting(sess.userId);
  }

  // initial
  const sess = getSession();
  if(sess.userId) showVotingForUser(); else showPage(loginPage);
});

// Show voting page with current user
async function showVotingForUser(){
  const sess = getSession();
  if(!sess.userId){ showPage(loginPage); return; }
  document.getElementById('current-user').textContent = 'Angemeldet als: ' + sess.username;
  showPage(votingPage);
  // pre-select existing vote
  const userVote = await fetchUserVote(sess.userId);
  if(userVote) currentSelection = userVote.submissionId;
  renderVoting(sess.userId);
}

// initial
const sess = getSession();
if(sess.userId) showVotingForUser(); else showPage(loginPage);
