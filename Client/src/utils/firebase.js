import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "mencia-e8af3.firebaseapp.com",
  projectId: "mencia-e8af3",
  storageBucket: "mencia-e8af3.firebasestorage.app",
  messagingSenderId: "585549335500",
  appId: "1:585549335500:web:c4d673349170143a51eb69"
};

// Initialize Firebase safely (avoid duplicate app error during Vite HMR)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export { auth, provider };


