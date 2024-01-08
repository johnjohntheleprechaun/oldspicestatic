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
    exportAudio(finalBuff);
}

async function exportAudio(buff) {
    const blob = bufferToWave(buff);
    console.log(blob);

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voicemail.wav";
    a.click();

    URL.revokeObjectURL(url);
}

function bufferToWave(buff) {
    const length = buff.length * buff.numberOfChannels * 4; // length * channels * 4 bytes (32 bits-per-chunk)
    const buffer = new ArrayBuffer(length + 44);
    const view = new DataView(buffer);
    pos = 0;
    view.setUint32(pos, 0x46464952, true); pos += 4; // "RIFF"
    view.setUint32(pos, length + 44 - 8, true); pos += 4; // file length = buffer length + header length - "RIFF" tag
    view.setUint32(pos, 0x45564157, true); pos += 4; // "WAVE"

    // FMT CHUNK
    view.setUint32(pos, 0x20746d66, true); pos += 4; // "fmt "
    view.setUint32(pos, 16, true); pos += 4; // chunk size
    view.setUint16(pos, 1, true); pos += 2; // uncompressed
    view.setUint16(pos, 2, true); pos += 2; // channels
    view.setUint32(pos, buff.sampleRate, true); pos += 4; // sample rate
    view.setUint32(pos, buff.sampleRate * 2 * buff.numberOfChannels, true); pos += 4; // bytes per second
    view.setUint16(pos, buff.numberOfChannels * 4, true); pos += 2; // data block size (channels * 32bits)
    view.setUint16(pos, 32, true); pos += 2; // bits per sample

    // DATA CHUNK
    view.setUint32(pos, 0x61746164, true); pos += 4; // "data"
    view.setUint32(pos, length, true); pos += 4; // audio data length
    console.log(pos == 44);
    console.log(length + pos == buffer.byteLength);

    // write data
    const channels = [];
    for (let i = 0; i < buff.numberOfChannels; i++) {
        channels.push(buff.getChannelData(i));
    }
    console.log(channels);
    console.log(channels[0].length * 4 + channels[1].length * 4);
    console.log(buffer.byteLength);
    console.log(buffer.byteLength - (channels[0].length * 4 + channels[1].length * 4));
    console.log(length/8, channels[0].length)
    let dataPos = 0;
    while (dataPos < length / (channels.length * 4)) {
        for (let i = 0; i < channels.length; i++) {
            let sample = channels[i][dataPos];
            let rounded = Math.round(sample * 0x7FFFFFFF);
            if (pos >= length + 44) {
                console.log("fuck");
                console.log(pos, buffer.byteLength);
                console.log(dataPos, channels[i].length);
                console.log(sample);
            }
            view.setInt32(pos, rounded, true);
            pos += 4;
        }
        dataPos++;
    }
    console.log(buffer);

    return new Blob([buffer], { type: "audio/wav" });
}