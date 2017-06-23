

$(function () {



     startstream=document.getElementById("start-rec-btn");
     stopstream=document.getElementById("stop-rec-btn")


    var client,
        recorder,
        context,
        bStream,
        contextSampleRate = (new AudioContext()).sampleRate;
        resampleRate = contextSampleRate,
        worker = new Worker('js/worker/resampler-worker.js');

    var flag=0;
    var myvar=0;

    worker.postMessage({cmd:"init",from:contextSampleRate,to:resampleRate});  

    window.addEventListener('message', function(msg) {
        console.log(msg);
        if( msg && msg.data.event == 'startrecording' ){
            console.log('inside client startrecording');
            startstream.click();
            leadid = msg.data.leadid;
        }else if( msg && msg.data.event == 'stoprecording' ){
            console.log('inside client stoprecording');
            stopstream.click();
        }
    }, false);

    worker.addEventListener('message', function (e) {
        if (bStream && bStream.writable)
            bStream.write(convertFloat32ToInt16(e.data.buffer));
    }, false);

    function startrecording(){
        close();
        console.log('startrecording called');
        client = new BinaryClient('wss://'+location.host);
        client.on('open', function () {
            bStream = client.createStream({sampleRate: resampleRate,leadID:leadid});
        });
        if (context) {
            recorder.connect(context.destination);
            return;
        }
        var session = {
            audio: true,
            video: false
        };
        navigator.getUserMedia(session, function (stream) {
            context = new AudioContext();
            var audioInput = context.createMediaStreamSource(stream);
            var bufferSize = 0; // let implementation decide

            recorder = context.createScriptProcessor(bufferSize, 1, 1);

            recorder.onaudioprocess = onAudio;

            audioInput.connect(recorder);

            recorder.connect(context.destination);

        }, function (e) {
        });
    }

    $("#start-rec-btn").click(function () {      
        if(flag==1){
           return;
        }
        flag=0;
         startrecording();
    
        myvar=setInterval(   
        function reRec(){      
            console.log("restreaming");
            startstream.click();
        }, 50000);

        console.log(flag);

        });

    function onAudio(e) {
        var left = e.inputBuffer.getChannelData(0);

        worker.postMessage({cmd: "resample", buffer: left});

        drawBuffer(left);
    }

    function convertFloat32ToInt16(buffer) {
        var l = buffer.length;
        var buf = new Int16Array(l);
        while (l--) {
            buf[l] = Math.min(1, buffer[l]) * 0x7FFF;
        }
        return buf.buffer;
    }

    function drawBuffer(data) {
        var canvas = document.getElementById("canvas"),
            width = canvas.width,
            height = canvas.height,
            context = canvas.getContext('2d');

        context.clearRect (0, 0, width, height);
        var step = Math.ceil(data.length / width);
        var amp = height / 2;
        for (var i = 0; i < width; i++) {
            var min = 1.0;
            var max = -1.0;
            for (var j = 0; j < step; j++) {
                var datum = data[(i * step) + j];
                if (datum < min)
                    min = datum;
                if (datum > max)
                    max = datum;
            }
            context.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
        }
    }

    $("#stop-rec-btn").click(function () {
        flag=1;
        console.log("above clear interval");
        clearInterval(myvar,function(){
            console.log("interval cleared");
            flag=0;
        });
        close();
    });

    function close(){
        console.log('close');
        if(recorder)
            recorder.disconnect();
        if(client)
            client.close();
    }
    
});

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

