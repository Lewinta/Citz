// Get Services: http://dev-tbb.tzcode.tech/api/resource/Item?filters={"item_group":%20"Servicios"}


function getFormJson(form) {
    let array = $(form).serializeArray()
    let obj = {};
    for (let item of array) {
        obj[item.name] = item[value];
    }

    return obj;
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

    // const res = { "data": [{ "starts_on": "2021-04-10 09:00:00", "ends_on": "2021-04-10 11:00:00" }, { "starts_on": "2021-04-10 16:00:00", "ends_on": "2021-04-10 17:00:00" }, { "starts_on": "2021-04-10 17:00:00", "ends_on": "2021-04-10 19:00:00" }] }
    const dateSchedule = globalObject.branch.schedule.find(row => (row.name || row.day_of_week) == globalObject.dayOfWeekNames[new Date(selected_date).getDay()])
    if (!dateSchedule || !dateSchedule.is_open)
        return [];
    const busyHours = (res.data || res.message)
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

    let fromTemp = dateSchedule.opening_time;
    const hoursAvailable = busyHours.map((item) => {
        if (item.from == fromTemp) return null
        const fromDate = new Date("01-01-1999 " + item.from);
        fromDate.setMinutes(fromDate.getMinutes() - 1)
        const result = {
            from: fromTemp,
            to: fromDate.toTimeString().substring(0, 8)
        }

        fromTemp = item.to

        return result;
    })
        .filter(item => !!item)
    if (hoursAvailable.length == 0)
        hoursAvailable.push({ from: dateSchedule.opening_time, to: dateSchedule.closing_time })
    return hoursAvailable.map((item) => {
        const fromDate = new Date(`01-01-1999 ${item.from}`)
        const toDate = new Date(`01-01-1999 ${item.to}`)
        toDate.setMinutes(toDate.getMinutes() - globalObject.totalDuration)
        const hours = []
        while (toDate > fromDate) {
            hours.push(fromDate.toTimeString().substring(0, 8))
            fromDate.setMinutes(fromDate.getMinutes() + 5)
        }
        return hours
    })
        .flat()
}

// setup
$(function () {
    // rendering
    render()
        .then(() => {
            // third party components
            $("#wizard").steps({
                headerTag: "h2",
                bodyTag: "section",
                transitionEffect: "slideLeft",
                stepsOrientation: "vertical",
                onInit: function () {
                    $(".current-step").html($("#wizard").steps("getCurrentStep").title)
                },
                onStepChanging: function (event, current, next) {

                    if (next < current) {
                        $(".current-step").css({ "color": "black" }).html(getStep(next).title)
                        return true
                    }
                    let result = false;
                    switch (next) {
                        case 1:
                            result = branchValidation()
                            break;
                        case 2: //step 1
                            result = serviceValidation()
                            renderResponsibles()
                            break;
                        case 3:
                            result = responsibleValidation()
                            renderDateSection()
                            break;
                        case 4:
                            result = dateValidation()
                            renderUserDataSection()
                            break;
                        case 5:
                            result = userDataValidation()
                            renderConfirmationStep()
                            break;

                    }
                    if (result)
                        $(".current-step").css({ "color": "black" }).html(getStep(next).title)
                    else
                        $(".current-step").css({ "color": "red" }).html(getStep(current).title)
                    return result;

                }
            });

            $("#services").accordion({
                collapsible: true,
                animate: 0,
                heightStyle: "content"
            });

            addCustomEvents()
        })
        .catch(console.log)
});
