var express = require('express');
var router = express.Router();

var MG = require('missionGenerator');
var mg = new MG();
mg.loadDictionary('../../public/files/majestic12.json');
mg.loadDictionary('../../public/files/spycraft.json');

/* GET home page. */
router.get('/', function(req, res, next) {
    var title = mg.run('[WEIRD_SCIENCE_MISSION] [MAIN]');


    res.render('index', { title: title });
});

module.exports = router;
