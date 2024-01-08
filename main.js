const audioContext = new AudioContext();

async function submit() {
    audioContext.resume();
    const formData = new FormData(document.getElementById("oldspice"));
    for (const entry of formData.entries()) {
        console.log(entry)
    }
    const form = Object.fromEntries(formData);
    console.log(form);

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
}