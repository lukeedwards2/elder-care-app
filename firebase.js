// firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDcSH_D2jhtsV5vknJ7VPzCtO8ZT7Xr6ow',
  authDomain: 'caregiverapp-ffe82.firebaseapp.com',
  databaseURL: 'https://caregiverapp-ffe82-default-rtdb.firebaseio.com',
  projectId: 'caregiverapp-ffe82',
  storageBucket: 'caregiverapp-ffe82.appspot.com',
  messagingSenderId: '45311509772',
  appId: '1:45311509772:web:86e44baec6a950c8f4f529',
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
