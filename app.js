var express = require('express');
var app = express();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var index = require('./routes/index');
var users = require('./routes/users');
var build = require('./routes/build');

var MG = require('missionGenerator');
var mg = new MG();
mg.loadDictionary('../../public/files/majestic12.json');
// mg.loadDictionary('../../public/files/spycraft.json');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/build', build);
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

var listener = http.listen(80, function () {
    console.log('Example app listening ' + listener.address().port);
});
io = io.listen(listener);

io.sockets.on("connection", function (socket) {
    /*Associating the callback function to be executed when client visits the page and
     websocket connection is made */

    var message_to_client = {
        data: "Connection with the server established"
    }
    socket.send(JSON.stringify(message_to_client));
    /*sending data to the client , this triggers a message event at the client side */
    console.log('Socket.io Connection with the client established');
    socket.on("message", function (data) {
        /*This event is triggered at the server side when client sends the data using socket.send() method */
        console.log("...in message");
        data = mg.run(data, 0, mg.run)
        console.log(data);
        /*Printing the data */
        var ack_to_client = {
            data: mg.run(data, 0, mg.run)
        }
        socket.send(JSON.stringify(ack_to_client));
        /*Sending the Acknowledgement back to the client , this will trigger "message" event on the clients side*/
    });
    socket.on("addToGroup", function (data) {
        /*This event is triggered at the server side when client sends the data using socket.send() method */
        var jsonData = JSON.parse(data);
        console.log("...in addToGroup");
        var group = jsonData.groupName;
        var entryList = jsonData.entryList;
        console.log("group: " + group);
        console.log("entryList: " + entryList);
        mg.addToGroup(group, entryList, true);

        /*Printing the data */
        var ack_to_client = {
            dict: mg.masterDictionary,
            data: 'ack'
        }
        socket.send(JSON.stringify(ack_to_client));
        /*Sending the Acknowledgement back to the client , this will trigger "message" event on the clients side*/
    });

});

module.exports = app;
