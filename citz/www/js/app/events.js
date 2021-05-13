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
            $("body").empty().css({ "text-align": "center" });
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
            $("#confirmation_step").append(`<br/><button class="btn btn-primary"  style="text-align: center; margin: 0 auto; width: 50%" id="new_appointment">Hacer otra cita</button>`)
            $("#new_appointment").click(() => window.location.replace("/cita"))
            // printElement(document.getElementById("confirmation_step"))

        })
        .catch(r => console.log(r))
}

function ToFrappeDateStringFormat(date) {
    return `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}`
}
async function getAvailability({ selected_date, responsible }) {

    const sortHours = (i1, i2) => {
        if (i1.from < i2.from) return -1
        else if (i1.from == i2.from) return 0
        else return 1
    }

    const ff_selected_date = ToFrappeDateStringFormat(new Date(globalObject.selected_date))
    const message = await fetchData(
        "events",
        "GET",
        { "Content-Type": "application/json" },
        `responsible=${responsible}&date=${ff_selected_date}`
    )

    const dateSchedule = globalObject.branch.schedule.filter(row => row.name == globalObject.dayOfWeekNames[new Date(selected_date).getDay()])[0]
    const responsibleSchedule = globalObject.responsible.schedule.filter(row => row.day == globalObject.dayOfWeekNames[new Date(selected_date).getDay()])
    console.log(responsibleSchedule)
    if (!dateSchedule || !dateSchedule.is_open)
        return [];

    const busyHours = message
        .map(row => {
            const spot = {
                from: row["starts_on"].replace(/\d{4}-\d{2}-\d{2}\s+/g, ""),
                to: row["ends_on"].replace(/\d{4}-\d{2}-\d{2}\s+/g, "")
            }
            return spot
        })
        .filter(row => {
            return row.from >= dateSchedule.opening_time &&
                row.to <= dateSchedule.closing_time
        })

    busyHours.sort(sortHours)
    let fromTemp = dateSchedule.opening_time;

    let hoursAvailable = busyHours.map(item => {
        // if this is also a busy hour return null
        if (item.from === fromTemp) {
            fromTemp = item.to
            return null
        }

        const fromDate = new Date("01/01/1999 " + item.from);

        fromDate.setMinutes(fromDate.getMinutes() - 1)
        const spot = {
            from: fromTemp,
            to: fromDate.toTimeString().substring(0, 8)
        }

        fromTemp = item.to
        return spot;
    })
        .filter(item => item)

    if (fromTemp < dateSchedule.closing_time)
        hoursAvailable.push({
            from: fromTemp,
            to: dateSchedule.closing_time
        })

    hoursAvailable.sort(sortHours)
    if (hoursAvailable.length == 0)
        hoursAvailable.push({ from: dateSchedule.opening_time, to: dateSchedule.closing_time })
    
    let hours = hoursAvailable.map((item) => {
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
    if (responsibleSchedule && responsibleSchedule.length > 0) {
        hours = hours.filter(from_time => {
            const toDate = new Date(`01/01/1999 ${from_time}`)
            toDate.setMinutes(toDate.getMinutes() + globalObject.totalDuration)
            const to_time = toDate.toTimeString().substring(0, 8)
            return responsibleSchedule.some(schedule => 
                schedule.from_time <= from_time && schedule.to_time >= from_time
                && 
                schedule.from_time <= to_time && schedule.to_time >= to_time
            )   
        })
    }
    return hours
}