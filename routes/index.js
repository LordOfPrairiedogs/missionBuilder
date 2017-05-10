var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    var title = "Weird Science Mission";
    res.render('index', { title: title, content: 'nuffin' });
});

module.exports = router;
