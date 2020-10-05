const express = require("express");
const bodyParser = require("body-parser");

const multer = require("multer");

const upload = multer();

const app = express();

//Set the public folder
app.use(express.static("./ui/public"));

//app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(upload.array());

//Require the Router
const getData = require("./ui/getdata.js");
const saveData = require("./ui/savedata.js");

app.use("/getdata", getData);
app.use("/savedata", saveData);

app.listen(3000);
