const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Relmonition API is running' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
