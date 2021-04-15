function addCustomEvents() {

    $(".arrow-right").click(function (e) {
        $("#wizard").steps("next")
    })
       
    $(".arrow-left").click(function (e) {
        $("#wizard").steps("previous")
    })
}

function getStep(stepIndex) {
    return $("#wizard").steps("getStep", stepIndex)
}

function nextStep() {
    $("#wizard").steps("next")
}

function confirmationButton() {
    const event = getEventPayload();
    fetchData("event", "POST", {"Content-Type": "application/json", "Accept": "application/json"}, null, JSON.stringify(event))
    .then(r => console.log(r))
    .catch(r => console.log(r))
}