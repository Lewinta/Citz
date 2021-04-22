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
    fetchData("event", "POST", { "Content-Type": "application/json", "Accept": "application/json" }, null, JSON.stringify(event))
        .then(r => {
            $("body").empty().css({"text-align": "center"});
            $("body").append(`<div id='confirmation_step' class="confirm_appt" style="text-align: center; margin: 0 auto; display: flex; flex-flow: column wrap;" ></div>`)
            if (!r.name) {
                $("#confirmation_step").prepend(`<div>Error: ${JSON.stringify(r)}</div>`)    
                return false;
            }
            $("#confirmation_step").prepend(`
            <h1 style="text-align:center;">Confirmación de Cita</h1>
            <h3 style="text-align:center;"><b>Código de Cita: ${r.name}</b></h3>
            <p style="font-size: 13px;">Debe mostrar este documento al llegar</p>
            <div id="confirmation_qr" style="margin: 0 50%; position: relative;"></div>`)
            qrcode = new QRCode("confirmation_qr", r.name)
            // printElement(document.getElementById("confirmation_step"))
        
        })
        .catch(r => console.log(r))
}

async function getAvailability({ selected_date, responsible }) {
    const res = await fetch(`${globalObject.api.BaseUri}${globalObject.api.events}?responsible=${responsible}&date=${selected_date}`, {
        method: "GET",
        headers: {
            ...globalObject.api.baseHeaders,
            "Content-Type": "application/json"
        },
    }).then(r => {
        console.log(r)
        return r.json()
    })
    .catch(err => {
        console.error("Error de Frappe: ", err)
    })
    console.log(res)
    const dateSchedule = globalObject.branch.schedule.filter(row => row.name == globalObject.dayOfWeekNames[new Date(selected_date).getDay()])[0]
    
    
    if (!dateSchedule || !dateSchedule.is_open)
        return [];
    const busyHours = res.message
        .filter(row => {
            const from = row["starts_on"].replace(/\d{4}-\d{2}-\d{2}\s+/g, "")
            const to = row["ends_on"].replace(/\d{4}-\d{2}-\d{2}\s+/g, "")
            
            return from >= dateSchedule.opening_time && to <= dateSchedule.closing_time;
        })
        .map(row => {

            return {
                from: row["starts_on"].replace(/\d{4}-\d{2}-\d{2}\s+/g, ""),
                to: row["ends_on"].replace(/\d{4}-\d{2}-\d{2}\s+/g, "")
            }
        })
        busyHours.sort((i1, i2) => {
            if (i1.from < i2.from) return -1
            else if (i1.from == i2.from) return 0
            else return 1
        })
    console.log(busyHours)
    
    let fromTemp = dateSchedule.opening_time;
    const hoursAvailable = busyHours.map((item) => {
        if (item.from == fromTemp) return null
        
        const fromDate = new Date("01/01/1999 " + item.from);
        
        fromDate.setMinutes(fromDate.getMinutes() - 1)
        const result = {
            from: fromTemp,
            to: fromDate.toTimeString().substring(0, 8)
        }

        fromTemp = item.to

        return result;
    })
    .filter(item => item)
    hoursAvailable.sort((i1, i2) => {
        if (i1.from < i2.from) return -1
        else if (i1.from == i2.from) return 0
        else return 1
    })
    if (hoursAvailable.length == 0)
        hoursAvailable.push({ from: dateSchedule.opening_time, to: dateSchedule.closing_time })
    console.log(hoursAvailable)
    
    return hoursAvailable.map((item) => {
        const fromDate = new Date(`01/01/1999 ${item.from}`)
        const toDate = new Date(`01/01/1999 ${item.to}`)
        toDate.setMinutes(toDate.getMinutes() - globalObject.totalDuration)
        const hours = []
        while (toDate >= fromDate) {
            hours.push(fromDate.toTimeString().substring(0, 8))
            fromDate.setMinutes(fromDate.getMinutes() + 5)
        }
        return hours
    })
        .flat()
}