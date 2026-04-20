// Minimal skeleton app.js — insert your Firebase config and implement features.
console.log('vote-me-clean loaded');

// Placeholder: when Firebase config is added, initialize app and wire UI.
const submitBtn = document.getElementById('submit');
const gallery = document.getElementById('gallery');

submitBtn.addEventListener('click', ()=>{
  const uname = document.getElementById('username').value.trim();
  const photo = document.getElementById('photo').files[0];
  if(!uname) return alert('Bitte Nutzernamen eingeben');
  if(!photo) return alert('Bitte Foto auswählen');
  alert('Danke — Füge Firebase-Logik in app.js hinzu, um Datei hochzuladen.');
});

// Small helper to render placeholder items
function renderPlaceholder(){
  gallery.innerHTML = '<div class="placeholder">Keine Einträge</div>';
}
renderPlaceholder();
