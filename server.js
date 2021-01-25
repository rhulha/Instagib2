const express = require("express");
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));
app.use(express.static("scripts"));
app.use(express.static('css'));
app.use(express.static('lib'));

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/public/index.html");
});


const listener = app.listen(8080, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
