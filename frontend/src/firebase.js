import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBvfiiNlq3HLJKGx8vEUoJjURBdjJ-BdCY",
  authDomain: "traveltrove-c09a0.firebaseapp.com",
  projectId: "traveltrove-c09a0",
  storageBucket: "traveltrove-c09a0.appspot.com", 
  messagingSenderId: "423030981358",
  appId: "1:423030981358:web:798ec9a40ce13ccf9669ff"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);