const express = require('express');
const fs = require('fs');
const path = require('path');
const routes = require('./routes');

const app = express();
const port = Number(process.env.PORT || 3000);
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(routes);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
