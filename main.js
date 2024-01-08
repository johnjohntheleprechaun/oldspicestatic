function submit() {
    const formData = new FormData(document.getElementById("oldspice"));
    for (const entry of formData.entries()) {
        console.log(entry)
    }
    const form = Object.fromEntries(formData);
    console.log(form);
}