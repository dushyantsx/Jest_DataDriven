var express = require("express");
var router = express.Router();
var fs = require("fs");

//Routes will go here
router.post("/", function (req, res) {
  console.log("In save general: ");
  res.status(404);
  res.json({ message: "Operation Not Allowed." });
});

router.post("/:env/:childLoc/:id", function (req, res) {
  //var fileName = __dirname + "/../resources/" + req.params.id + ".json";
  var fileName = "";
  if (req.params.childLoc == "base") {
    fileName = `${__dirname}/../resources/envs/${req.params.env}/${req.params.id}.json`;
  } else {
    fileName = `${__dirname}/../resources/envs/${req.params.env}/${req.params.childLoc}/${req.params.id}.json`;
  }
  console.log("Filename in which data to be saved:" + fileName);
  var fileData = JSON.stringify(req.body, null, 2);
  var flag = true;
  try {
    fs.writeFileSync(fileName, fileData);
    res.json({ message: "Save Succesful." });
  } catch (e) {
    res.status(404);
    res.json({ message: "Save Failed." });
  }
});

module.exports = router;
