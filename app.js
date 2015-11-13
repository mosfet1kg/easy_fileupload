var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    path = require('path'),
    request = require('request'),
    MongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID,
    engine = require('ejs-mate'),
    siofu = require("socketio-file-upload"),
    ss = require('socket.io-stream'),
    fs = require('fs');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// use ejs-locals for all ejs templates:
app.engine('ejs', engine);
app.set('views',__dirname + '/views');
app.set('view engine', 'ejs'); // so you can render('index')

// use file upload via socketio
app.use(siofu.router);

process.title="nodejs_gcc_search";

var port = 55555;
for(var i=2; i<process.argv.length -1; i++){
    if( ( process.argv[i] == '-p' || process.argv[i] =='--port' ) && !isNaN(process.argv[i+1]) ){
        port = process.argv[i+1];
        break;
    }
}

var server = app.listen(port, function(){
    console.log('This server is running on the port ' + this.address().port );
});


var io = require('socket.io').listen(server);

app.use( express.static( path.join(__dirname, 'public') ));


//아래는 websocket을 통한 파일 업로드
io.sockets.on('connection', function (socket) {
    var uploader = new siofu();
    uploader.dir = path.join(__dirname, 'public', 'upload');
    uploader.listen(socket);

    // Do something when a file is saved:
    uploader.on("saved", function(event){
        console.log(event.file);
        event.file.clientDetail.path = event.file.base + path.extname(event.file.name);
    });

    // Error handler:
    uploader.on("error", function(event){
        console.log("Error from uploader", event);
    });

});

