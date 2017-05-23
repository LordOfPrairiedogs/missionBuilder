var express = require('express');
var router = express.Router();
var MG = require('missionGenerator');
var mg = new MG();
mg.loadDictionary('../../public/files/majestic12.json');
mg.loadDictionary('../../public/files/spycraft.json');

var dict = mg.masterDictionary;

/* GET home page. */
router.get('/', function(req, res, next) {
    var title = "TEST";
    res.render('build', { title: title, dictionary: dict });
});

module.exports = router;
