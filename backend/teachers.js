const express = require('express');
const router = express.Router();

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) return res.status(401).json({ error: 'Missing Authorization header' });
  const idToken = match[1];
  try {
    req.user = await req.app.locals.admin.auth().verifyIdToken(idToken);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const snap = await req.app.locals.db.collection('teachers').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const payload = { name: req.body.name, email: req.body.email, createdAt: req.app.locals.admin.firestore.FieldValue.serverTimestamp() };
  const docRef = await req.app.locals.db.collection('teachers').add(payload);
  res.json({ id: docRef.id, ...payload });
});

module.exports = router;
