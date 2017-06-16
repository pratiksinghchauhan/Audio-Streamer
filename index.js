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

var transcript;


const record = require('node-record-lpcm16');

const Speech = require('@google-cloud/speech');

const speech = Speech();


var options = {
    key:    fs.readFileSync('ssl/wildcard_policybazaar_com.key'),
    cert:   fs.readFileSync('ssl/wildcard_policybazaar_com.crt'), 
};


var insertDocument = function( db, msg, callback) {
                db.collection('textResponse').insertOne( {
                    "speech": msg['speech'],
                    "leadid":msg['leadID'],
                    ts: new Date()
                })
            };




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
         .on('stream', function(stream,obj) {
           console.log("Stream started");
           console.log(obj['leadID']);

           leadID=obj['leadID']




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
if( typeof data.results[0] != 'undefined'){
       transcript=data.results[0].transcript;
}
      
      //console.log(data.results);     

if( typeof data.results[0] != 'undefined'){
       console.log(data.results[0].isFinal);  

          if(data.results[0].isFinal==true){  
            console.log("FINAL:" + data.results[0].transcript);
            fs.appendFile('results.txt',"FINAL:" + data.results[0].transcript +'\n');
            savemongo(data.results[0].transcript);  
}}}
));

         });
    
    function savemongo(trans){     
         if( typeof trans != 'undefined'){
            MongoClient.connect( url, function(err, db) {
            console.log(trans);
            console.log('save mongo');
            msg={
                "speech":trans,
                "leadID":leadID
            }    
            insertDocument(db ,msg , function() {
                    db.close();
            });
            })}
        else
          console.log("savemongo called but nothing to insert");         
     }

    client.on('close',function(){
          console.log("connection closed from client side");
          savemongo(transcript);
      });
 

  console.log('Listening, press Ctrl+C to stop.');
	
});




