import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAyMsi5GNr_xVWlp6OmK90_NrR_LSUdFOE",
  authDomain: "pinglo-b9fa3.firebaseapp.com",
  databaseURL: "https://pinglo-b9fa3-default-rtdb.firebaseio.com",
  projectId: "pinglo-b9fa3",
  storageBucket: "pinglo-b9fa3.firebasestorage.app",
  messagingSenderId: "72066337696",
  appId: "1:72066337696:web:90c63e4a69f54debe8f2c5",
  measurementId: "G-E3LP9L50SX"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth };
