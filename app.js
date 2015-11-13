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

app.post('/enroll_supply', function(req, res){
    var obj = JSON.parse(req.body.msg);

    request({
            method: 'POST',
            url: 'http://localhost:3500/supply_info/documents',
            headers: {
                'content-type': 'application/json'
            },
            json: obj

        },
        function (err, httpResponse, body) {
            console.log(err);
            console.log(body);
            //console.log(body);
            res.send(body);
        }
    );
});

app.post('/enroll_demand', function(req, res){
    var obj = req.body;

    if( typeof obj.attachments != 'undefined')
        obj.attachments = JSON.parse(obj.attachments);
    //delete obj.attachments;

    for(var idx in obj){
        if(obj[idx] === 'true') obj[idx] = true;

        if( idx.indexOf(".") != -1){
            var sub_array = idx.split(".");
            var tar = obj;

            for(var i in sub_array ){
                if(tar[sub_array[i]] === undefined){
                    tar[sub_array[i]] = {};
                }

                if( i == sub_array.length-1 )
                    tar[sub_array[i]] = obj[idx];
                else
                    tar = tar[sub_array[i]];
            }

            tar = obj[idx];
            delete(obj[idx]);
        }
    }

    request({
            method: 'POST',
            url: 'http://localhost:3500/demand_info/documents',
            headers: {
                'content-type': 'application/json'

            },
            json: obj

        },
        function (err, httpResponse, body) {
            console.log(err);
            console.log(body);
            //console.log(body);
            res.send(body);
        }
    );


});


app.post('/supply_info', function(req ,res){

    request({
            method: 'POST',
            url: 'http://localhost:9200/supply_info/_search',
            json: JSON.parse(req.body.msg)
        },
        function (err, httpResponse, body) {
            //console.log(err);
            //console.log(body);
            res.send(body);
        }
    );


});

app.post('/demand_info', function(req ,res){

    request({
            method: 'POST',
            url: 'http://localhost:9200/demand_info/_search',
            json: JSON.parse(req.body.msg)
        },
        function (err, httpResponse, body) {
            //console.log(err);
            //console.log(body);
            res.send(body);
        }
    );


});

app.get('/getTech/:type/:id',function(req,res,next){
    var id = req.params.id,         //mongodb ID
        type = req.params.type;  //supply, demand, matching, business

    if( type == 'matching' || type == 'supply'){
        request({
                method: 'GET',
                url: 'http://localhost:3500/supply_info/documents/'+id,
                headers: {
                    'content-type': 'application/json'
                }
            },
            function (err, httpResponse, body) {
                //console.log(body);
                if(err) res.send({"err":err});
                else
                    res.render('detail_supply', JSON.parse(body) );
            }
        );
    }else if( type == 'demand' ){
        console.log('test');
        request({
                method: 'GET',
                url: 'http://localhost:3500/demand_info/documents/'+id,
                headers: {
                    'content-type': 'application/json'
                }
            },
            function (err, httpResponse, body) {
                //console.log(body);
                if(err) res.send({"err":err});
                else
                    res.render('detail_demand', JSON.parse(body) );
            }
        );

    }



});


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

