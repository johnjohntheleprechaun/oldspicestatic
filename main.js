const audioContext = new AudioContext();

async function submit() {
    audioContext.resume();
    const formData = new FormData(document.getElementById("oldspice"));
    for (const entry of formData.entries()) {
        console.log(entry)
    }
    const form = Object.fromEntries(formData);
    console.log(form);

    // DOWNLOAD FILES AND LOAD AUDIO BUFFERS

    // download greeting
    const hello = await fetch("snippets/hello.mp3")
        .then(resp => resp.arrayBuffer())
        .then(buff => audioContext.decodeAudioData(buff));
    
    const man = await fetch("snippets/man.mp3")
        .then(resp => resp.arrayBuffer())
        .then(buff => audioContext.decodeAudioData(buff));
    
    const message = await fetch("snippets/message.mp3")
    .then(resp => resp.arrayBuffer())
    .then(buff => audioContext.decodeAudioData(buff));

    // download required numbers
    const numbers = {};
    if (!isFinite(form.number)) { // verify input
        window.alert("Uh oh! That phone number has non-number characters!");
        return;
    }
    for (const char of form.number) {
        const filename = "snippets/" + char + ".mp3";
        if (!(char in numbers)) {
            numbers[char] = await fetch(filename)
                .then(resp => resp.arrayBuffer())
                .then(buff => audioContext.decodeAudioData(buff));
        }
    }
    console.log(numbers);

    // Download the reason snippet
    let filename = "snippets/" + form.reason + ".mp3"
    const reason = await fetch(filename)
        .then(resp => resp.arrayBuffer())
        .then(buff => audioContext.decodeAudioData(buff));
    console.log(reason);

    // Download extra snippet
    filename = "snippets/" + form.extra + ".mp3"
    const extra = await fetch(filename)
        .then(resp => resp.arrayBuffer())
        .then(buff => audioContext.decodeAudioData(buff));
    console.log(extra);

    // Download the jingle
    let jingle;
    if (form.beeps) {
        filename = "snippets/doodo.mp3"
        jingle = await fetch(filename)
            .then(resp => resp.arrayBuffer())
            .then(buff => audioContext.decodeAudioData(buff));
    }
    console.log(jingle);


    // COMBINE AUDIO BUFFERS

    // get final length of buffer
    let finalLength = 0;
    finalLength += hello.length;
    // add numbers
    for (const num of form.number) {
        finalLength += numbers[num].length;
    }
    finalLength += man.length;
    finalLength += reason.length;
    finalLength += message.length;
    finalLength += extra.length;
    finalLength += jingle ? jingle.length : 0;

    // combine the buffers
    const finalBuff = audioContext.createBuffer(2, finalLength, 48000);
    let consumedLength = 0;
    
    // add hello
    finalBuff.copyToChannel(hello.getChannelData(0), 0, consumedLength);
    finalBuff.copyToChannel(hello.getChannelData(1), 1, consumedLength);
    consumedLength += hello.length;

    // add numbers
    for (num of form.number) {
        finalBuff.copyToChannel(numbers[num].getChannelData(0), 0, consumedLength);
        finalBuff.copyToChannel(numbers[num].getChannelData(1), 1, consumedLength);
        consumedLength += numbers[num].length;
    }
    
    // add man
    finalBuff.copyToChannel(man.getChannelData(0), 0, consumedLength);
    finalBuff.copyToChannel(man.getChannelData(1), 1, consumedLength);
    consumedLength += man.length;

    // add reason
    finalBuff.copyToChannel(reason.getChannelData(0), 0, consumedLength);
    finalBuff.copyToChannel(reason.getChannelData(1), 1, consumedLength);
    consumedLength += reason.length;

    // add leave a message
    finalBuff.copyToChannel(message.getChannelData(0), 0, consumedLength);
    finalBuff.copyToChannel(message.getChannelData(1), 1, consumedLength);
    consumedLength += message.length;

    // add extra
    finalBuff.copyToChannel(extra.getChannelData(0), 0, consumedLength);
    finalBuff.copyToChannel(extra.getChannelData(1), 1, consumedLength);
    consumedLength += extra.length;

    if (jingle) {
        // add jingle
        finalBuff.copyToChannel(jingle.getChannelData(0), 0, consumedLength);
        finalBuff.copyToChannel(jingle.getChannelData(1), 1, consumedLength);
        consumedLength += jingle.length;
    }

    // play the final sound
    const output = new AudioBufferSourceNode(audioContext, { buffer: finalBuff });
    output.connect(audioContext.destination);
    output.start();
}