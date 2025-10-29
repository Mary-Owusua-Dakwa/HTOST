require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');

const studentsRouter = require('./routes/students');
const teachersRouter = require('./routes/teachers');
const authRouter = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json';
admin.initializeApp({
  credential: admin.credential.cert(require(path.resolve(serviceAccountPath))),
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
});

const db = admin.firestore();
app.locals.db = db;
app.locals.admin = admin;

// routes
app.use('/api/auth', authRouter);
app.use('/api/students', studentsRouter);
app.use('/api/teachers', teachersRouter);

// health
app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
