var express = require("express");
var router = express.Router();
var fs = require("fs");

//Routes will go here
router.get("/", function (req, res) {
  res.sendFile(__dirname + "/public/html/index.html");
  // res.json(input);
});

router.get("/:env/:childLoc/:id", function (req, res) {
  //var fileName = __dirname + "/../resources/" + req.params.id + ".json";
  var fileName = "";
  if (req.params.childLoc == "base") {
    fileName = `${__dirname}/../resources/envs/${req.params.env}/${req.params.id}.json`;
  } else {
    fileName = `${__dirname}/../resources/envs/${req.params.env}/${req.params.childLoc}/${req.params.id}.json`;
  }
  var fileData = "";
  var flag = true;
  try {
    fileData = fs.readFileSync(fileName, "utf-8");
    console.log("FileName Requested for Reading: " + fileName);
    //console.log ("Data: "+fileData);
    res.json(fileData);
    if (fileData == null || fileData == "") {
      flag = false;
    }
  } catch (e) {
    flag = false;
  }

  if (flag == false) {
    res.status(404);
    res.json({ message: "Not Found: " + fileName });
  }
});

module.exports = router;
