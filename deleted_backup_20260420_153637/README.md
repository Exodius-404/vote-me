Party Outfit Voting — Clean starter

This is a minimal, clean skeleton for the Party Outfit Voting frontend.

How to use

- Add your Firebase `firebaseConfig` to `app.js` and implement upload/vote logic.
- Initialize a git repository, add a remote, and push to GitHub.
- In GitHub Pages settings enable Pages from `main` branch and `/docs` folder or publish root.

Firestore & deployment notes

- Development Firestore rules are included in `firestore.rules`. They are permissive to allow the
	username-only flow without Firebase Authentication. These rules are NOT secure for production.
	To deploy rules, use the Firebase CLI:

```bash
npm i -g firebase-tools
firebase login
firebase init firestore   # choose your project and provide the firestore.rules file
firebase deploy --only firestore:rules
```

- GitHub Pages: the repo is already pushed to `origin/main`. In the repository Settings → Pages,
	set the source to `main` / `root` (or `/docs` if you prefer). After a push the site will publish.

Next recommended steps

- Replace permissive Firestore rules with authentication-based rules (use Firebase Auth).
- Optionally enable Firebase Authentication and change the client to sign in users (more secure).


Files

- `index.html` — entry
- `style.css` — styles
- `app.js` — client logic (placeholder)
- `.nojekyll` — ensures Pages serves static files
