var express = require('express');
var router = express.Router();

var MG = require('missionGenerator');
var mg = new MG();
mg.loadDictionary('../../public/files/majestic12.json');
mg.loadDictionary('../../public/files/spycraft.json');

/* GET home page. */
router.get('/', function(req, res, next) {
    var content = mg.run('[NAME.natgb]');
    var title = "Weird Science Mission";
    res.render('index', { title: title, content: content });
});

module.exports = router;
