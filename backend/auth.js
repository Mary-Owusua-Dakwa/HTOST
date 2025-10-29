const express = require('express');
const router = express.Router();

// This backend expects clients to normally use Firebase client-side auth.
// This endpoint can mint custom tokens (admins only) or verify tokens server-side.
// Example: verify token middleware
router.post('/verify', async (req, res) => {
  const idToken = req.body.idToken;
  if (!idToken) return res.status(400).json({ error: 'idToken required' });
  try {
    const decoded = await req.app.locals.admin.auth().verifyIdToken(idToken);
    return res.json({ uid: decoded.uid, email: decoded.email, role: decoded.role || null, decoded });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token', details: err.message });
  }
});

module.exports = router;
