const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: './uploads/' }); // simple local temp

// Middleware: require a valid Firebase ID token (passed in Authorization: Bearer <token>)
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) return res.status(401).json({ error: 'Missing Authorization header' });
  const idToken = match[1];
  try {
    const decoded = await req.app.locals.admin.auth().verifyIdToken(idToken);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// List students (admin/teacher allowed)
router.get('/', requireAuth, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const snap = await db.collection('students').orderBy('createdAt', 'desc').get();
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create student (admin only)
router.post('/', requireAuth, async (req, res) => {
  const db = req.app.locals.db;
  // simple role-check: ensure claim 'role' is 'admin'
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const payload = {
      name: req.body.name,
      email: req.body.email,
      classId: req.body.classId || null,
      createdAt: req.app.locals.admin.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await db.collection('students').add(payload);
    res.json({ id: docRef.id, ...payload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload student photo
router.post('/:id/photo', requireAuth, upload.single('photo'), async (req, res) => {
  const admin = req.app.locals.admin;
  const bucket = admin.storage().bucket();
  const filePath = req.file.path;
  const destName = `students/${req.params.id}-${Date.now()}-${req.file.originalname}`;

  try {
    await bucket.upload(filePath, { destination: destName });
    const file = bucket.file(destName);
    const [url] = await file.getSignedUrl({ action: 'read', expires: '03-01-2500' });
    await req.app.locals.db.collection('students').doc(req.params.id).update({ photoURL: url });
    res.json({ photoURL: url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single student
router.get('/:id', requireAuth, async (req, res) => {
  const doc = await req.app.locals.db.collection('students').doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: 'Not found' });
  res.json({ id: doc.id, ...doc.data() });
});

// Update & delete
router.put('/:id', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  await req.app.locals.db.collection('students').doc(req.params.id).update(req.body);
  res.json({ ok: true });
});
router.delete('/:id', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  await req.app.locals.db.collection('students').doc(req.params.id).delete();
  res.json({ ok: true });
});

module.exports = router;
