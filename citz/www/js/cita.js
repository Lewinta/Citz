
$(function () {
    $("#send_erp").on("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // $.ajax({
        //     url: "api/resource/Event",
        //     method: "POST"
        // })
    })
})

function getEventPayload() {
    
  let startDate = new Date(globalObject.selected_date + " " + globalObject.selected_hour);
  let endDate = new Date(globalObject.selected_date + " " + globalObject.selected_hour);
  endDate.setMinutes(endDate.getMinutes() + globalObject.totalDuration) ;
  
  var event = {
    subject: $('#fname').val() + " " + $('#lname').val(),
    starts_on: `${startDate.getFullYear()}-${startDate.getMonth()+1<10 ? "0"+(startDate.getMonth()+1) : startDate.getMonth()}-${startDate.getDate()} ${globalObject.selected_hour}`,
    ends_on: `${endDate.getFullYear()}-${endDate.getMonth()+1<10 ? "0"+(endDate.getMonth()+1) : endDate.getMonth()}-${endDate.getDate()} ${endDate.toTimeString().substring(0, 8)}`,
    responsible: globalObject.responsible.name,
    branch: globalObject.branch.name,
    customer_email: $("#email").val(),
    description: dumpServices(globalObject.selected_services),
    services: JSON.stringify(globalObject.selected_services)
  };
  return event;
}
