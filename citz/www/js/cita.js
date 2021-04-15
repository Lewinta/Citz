
$(function () {
    $("#send_erp").on("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        alert("Submit");
        // $.ajax({
        //     url: "api/resource/Event",
        //     method: "POST"
        // })
    })
})

function getEventPayload() {
    
  let endDate = new Date(globalObject.selected_date + " " + globalObject.selected_hour);
  endDate.setMinutes(endDate.getMinutes() + globalObject.totalDuration) ;
  
  var event = {
    subject: $('#fname').val() + " " + $('#lname').val(),
    starts_on: globalObject.selected_date + " " + globalObject.selected_hour,
    ends_on: `${globalObject.selected_date} ${endDate.toTimeString().substring(0, 8)}`,
    responsible: globalObject.responsible.name,
    branch: globalObject.branch.name,
    description: dumpServices(globalObject.selected_services)
  };
  return event;
}
