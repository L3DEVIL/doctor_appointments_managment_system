const express = require('express');
const router = express.Router();
const path = require('path');

router.use(express.static(path.join(__dirname, '..' ,'react_web')));

// Handle any requests that don't match the static files (for React Router)
router.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..' ,'react_web', 'index.html'));
});

module.exports = router;