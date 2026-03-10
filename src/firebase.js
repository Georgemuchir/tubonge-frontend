import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDNbCS6-aB9M80VDlOHSctni4QczCUIK-Y",
  authDomain: "pinglo-staging.firebaseapp.com",
  projectId: "pinglo-staging",
  storageBucket: "pinglo-staging.firebasestorage.app",
  messagingSenderId: "410654652593",
  appId: "1:410654652593:web:3af8961cbaef4db5324a90",
  measurementId: "G-FS4EE059V3"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
