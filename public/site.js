
$(function () {

	function startrecording(){
        close();
        console.log('startrecording called');
        client = new BinaryClient('wss://'+location.host);
        client.on('open', function () {
            bStream = client.createStream({sampleRate: resampleRate});
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
            var bufferSize = 0; 

            recorder = context.createScriptProcessor(bufferSize, 1, 1);

            recorder.onaudioprocess = onAudio;

            audioInput.connect(recorder);

            recorder.connect(context.destination);

        }, function (e) {
        });
    }

	$("#start-rec-btn").click(function () {
        startrecording();
        });
});