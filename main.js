const express = require('express');
const qrcode = require('qrcode-terminal');
const figlet = require('figlet');
const colors = require('colors');
const path = require('path');
const cors = require('cors');
const app = express();
const port = "9595";
const haki = "ibserver";
const host = `http://127.0.1:${port}`;
app.use(cors());
app.use(express.static('./server'));

app.get('/u', (req, res) => {
app.use(express.static(path.join(__dirname, 'u')));
res.sendFile(path.join(__dirname, 'u','index.html'));
})

app.listen(port, () => {
figlet.text(haki, {font: 'Small'}, (err, data) =>{
if (err){
console.log(err);
}
console.log(data.bold.yellow);

qrcode.generate(host, {small: true }, function (qrcode) {
console.log(qrcode)
})


console.log("GET".bold.yellow,"http://localhost:9595".bold.green)
console.log("GET".bold.yellow,"http://localhost:9595/admin".bold.red)
console.log("GET".bold.yellow,"http://localhost:9595/".bold.green + "u".bold.magenta)
})
})
