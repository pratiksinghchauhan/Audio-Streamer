var express=require('express');
var app=express();
var https=require('https');
var fs=require('fs');
var path=require('path');
var binaryServer = require('binaryjs').BinaryServer;
var wav = require('wav');
var request=require('request')
var bodyParser=require('body-parser');

var assert = require('assert');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://10.0.8.62:27017/SpeechToText';
var emitter = require('events').EventEmitter;


const record = require('node-record-lpcm16');

const Speech = require('@google-cloud/speech');

const speech = Speech();



var options = {
    key:    fs.readFileSync('ssl/wildcard_policybazaar_com.key'),
    cert:   fs.readFileSync('ssl/wildcard_policybazaar_com.crt'), 
};


var insertDocument = function( db, msg, callback) {
    db.collection('textResponse').findOne(
       /* {
             "uid" :  msg.uid,
             "leadid" : msg.leadid
        },*/ function(err, result) {
            assert.equal(err, null);
            console.log("inside fetch document ");
            console.log(result);
           /* if(result && result.leadid){
                console.log('record already exists');
                var text = result.speech;
                var newspeech = text + msg.textresponse;        
                db.collection('textResponse').updateOne(
                    { 
                        "uid" : msg.uid,
                        "leadid" : msg.leadid
                    },
                    {
                        $set: { "sp  eech": newspeech }
                    }, function(err, result) {
                    assert.equal(err, null);
                    console.log("Updated a document ");
                    callback();
                });
            }else{*/
                db.collection('textResponse').insertOne( {
                  /*  "leadid" : msg.leadid,
                    "uid" :  msg.uid,*/
                    "speech": msg,
                    ts: new Date()
                }, function(err, result) {
                    assert.equal(err, null);
                    console.log("Inserted a document");
                    callback();
                });
            });
};
    /*    });
};*/



var server=https.createServer(options,app);

var io = require('socket.io').listen(server);

server.listen(9191,function(){
  console.log("Listening at port 9191");
});

app.use(express.static(path.join(__dirname, 'public')));

var server = binaryServer({server: server});



server.on('connection', function(client){

	const encoding = 'LINEAR16';
    const sampleRateHertz = 44100;
    const languageCode = 'hi-IN';



  const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
   speechContexts: {
    phrases:["good morning","policybazaar.com","policybazaar","sir", "health","insurance","policy","right","age", "good", "morning","nineteen","ninety seven","forty","thirty eight"]
},
  },
  verbose:true,
  interimResults: true, // If you want interim results, set this to true
};


   client.on('error', console.error)
         .on('stream', function(stream) {
           console.log("Stream started");


  stream.pipe(speech.createRecognizeStream(request)
  .on('error', console.error)
  .on('data', (data) =>{ 

      console.log("data recieved")
      //client.send(data);
      
     // process.stdout.write(data.results),
     
    /*function rerec(){
           console.log("restreaming");
           stream.pipe();
       }*/

     function savemongo(){     
            MongoClient.connect( url, function(err, db) {
            assert.equal(null, err);
            insertDocument(db , data.results[0].transcript, function() {
                    db.close();
            });
       });
       
         
     }

      setInterval(savemongo, 55000); 
       

      console.log(data.results);     

if( typeof data.results[0] != 'undefined'){
       console.log(data.results[0].isFinal);  

          if(data.results[0].isFinal==true){  
            console.log("FINAL:" + data.results[0].transcript);
            fs.appendFile('results.txt',"FINAL:" + data.results[0].transcript +'\n');
            savemongo();
   
}}}));

         });
  console.log('Listening, press Ctrl+C to stop.');
	
});




