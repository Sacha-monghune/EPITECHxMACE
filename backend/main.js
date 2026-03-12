const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = Number(process.env.PORT || 3000);
const routes = require('./routes');

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
)

const frontDirCandidates = [
  '/front',
  path.join(__dirname, '..', 'front'),
];

const frontDir = frontDirCandidates.find((candidate) => fs.existsSync(candidate));

if (frontDir) {
  app.use(express.static(frontDir));

  app.get('/', (req, res) => {
    res.sendFile(path.join(frontDir, 'index.html'));
  });
}

app.use(routes);

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})