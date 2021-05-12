var globalObject = {
    api: {
        BaseUri: "",
        baseHeaders: { "Authorization": "token a9382fe44c435f1:ade7fd03220ab5e" },
        login: "/api/method/login",
        events: "/api/method/citz.citz.public_methods.get_events",
        services: `/api/resource/Item?filters={"item_group":"Servicios"}&fields=["name","item_name","item_group", "duration", "item_category"]&order_by=item_name&limit_page_length=1000`,
        branches: `/api/method/citz.citz.public_methods.branches`,
        responsibles: `/api/method/citz.citz.public_methods.responsibles`,
        event: '/api/method/citz.citz.public_methods.event'
    },
    branch: {
        name: "castellana",
        schedule: [
            {
                day_of_week: "Monday",
                opening_time: "08:00:00",
                closing_time: "19:00:00",
                is_open: true
            },
            {
                day_of_week: "Saturday",
                opening_time: "08:00:00",
                closing_time: "19:00:00",
                is_open: false
            }
        ],
        opening_time: "08:00:00",
        closing_time: "19:00:00"
    },
    selected_services: [],
    totalDuration: 0,
    services: [],
    branches: [],
    dayOfWeekNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
}
function dumpServices(services) {
    return 'Services: \n' + services.reduce((acc, curr) => {
        return `${acc}${curr.item_name}\n`
    }, "")
}
function renderBranches(branches) {
    globalObject.branches = [...branches]
    branches.forEach((item) => {
        selectionButtons({
            container: '#branches',
            name: item.name,
            contextClass: "branch",
            dataObj: null,
            innerText: ""
        })
    })

    $(".branch").click(function (e) {
        e.stopImmediatePropagation()
        $(".branch.selected").removeClass("selected")
        $(this).addClass("selected")
        globalObject.branch = globalObject.branches.find(branch => branch.name == $(this).data('name'))
        nextStep()
    })
}
function renderServices(services) {
    globalObject.services = [...services];
    let categories = new Map()
    services.forEach((item, idx) => {
        let category = categories.get(item.item_category || item.item_group);
        if (!category) {
            title = $(`<h3>${item.item_category || item.item_group}</h3>`);
            container = $(`<div></div>`);
            category = { title, container }
            categories.set(item.item_category || item.item_group, category);
            $("#services")
                .append(title)
                .append(container);
        }
        category.container.append(`<a class="btn btn-selection service" data-name="${item.name}" data-selected="0" data-duration="${item.duration || 1}" href='#'><b class="service_name"> ${item.item_name}</b> <span style="float: right;">${item.duration || 1} minutos</span></a>`)
    })
}

function addEvents() {
    $(".btn-selection").click(function (e) {
        e.preventDefault()
        $(this).toggleClass("selected")
    })

    $(".service").click(function (e) {
        if ($(this).hasClass("selected")) {
            globalObject.totalDuration += parseInt($(this).data("duration"))
            globalObject.selected_services.push(globalObject.services.find(s => s.name == $(this).data("name")))
        }
        else {
            globalObject.totalDuration -= parseInt($(this).data("duration"))
            const service_index = globalObject.selected_services.findIndex(s => s.name == $(this).data("name")) > -1
            if (service_index) globalObject.selected_services.splice(service_index, 1)
        }
        document.getElementById("durationTotal").innerText = `Duración total: ${globalObject.totalDuration} minutos`
    })
}

async function fetchData(entity, method = "GET", headers = null, params = "", body = undefined) {
    return fetch(`${globalObject.api.BaseUri}${globalObject.api[entity]}${params ? "?" + params : ""}`, {
        method,
        headers: { ...globalObject.api.baseHeaders, ...headers },
        body,
        credentials: "omit"
    })
        .then(r => {
            if (r.status >= 400) return r.json()
            return r.json()
        })
        .then(r => r.data || r.message || r)
}
async function render() {
    $("div.content").css({ "visibility": "hidden" })

    renderServices(await fetchData("services"))
    renderBranches(await fetchData("branches"))

    addEvents()
    $("div.content").css({ "visibility": "visible" })
    $("div.spinner").css({ "display": "none" })
}

function selectionButtons({ container, name, displayName, contextClass, innerText, dataObj }) {
    let dataAttributes = ""
    if (dataObj)
        dataAttributes = Object.entries(dataObj).reduce((acc, [key, value]) => {

            return `${acc}data-${key}='${value} '`
        }, "")
    $(container).append(`<a class="btn btn-selection ${contextClass}" data-name="${name}" ${dataAttributes} href='#'><b class="${contextClass}_name">${displayName || name}</b> ${innerText}</a>`)
}
// Individual Renders

async function renderResponsibles(responsibles) {
    responsibles = await fetchData("responsibles", "GET", null, `branch=${globalObject.branch.name}`)
    $("#responsibles").empty()
    responsibles.forEach((item) => {
        $("#responsibles").append(`<a class="btn btn-selection responsible" data-name="${item.name}" data-selected="0" href='#'><b class="responsible_name">${item.first_name} ${item.last_name}</b></a>`)
    })
    $(".responsible").click(function (e) {
        e.preventDefault()
        e.stopImmediatePropagation()
        $(".responsible.selected").removeClass("selected")
        $(this).addClass("selected")
        const previous = globalObject.responsible;
        globalObject.responsible = responsibles.find((item) => item.name == $(this).data("name"))

        if (JSON.stringify(globalObject.responsible) !== JSON.stringify(previous)){
            $("#hourpicker .hour-button").remove()
        }

        nextStep()
    })
}

function renderDateSection() {
    var unavailableDates = ["9-4-2021", "14-4-2021", "17-4-2021"];

    function unavailable(date) {
        dmy = date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();
        if ($.inArray(dmy, unavailableDates) == -1) {
            return [true, ""];
        } else {
            return [false, "", "Unavailable"];
        }
    }
    if (!$("#datepicker").hasClass("hasDatepicker")) {
        $("#datepicker").datepicker({
            minDate: 0,
            // beforeShowDay: unavailable,
            onSelect: async function (dateText, instance) {
                $("#hourpicker .hour-button").remove()
                globalObject.selected_date = `${(instance.selectedMonth + 1) < 10 ? "0" + (instance.selectedMonth + 1): instance.selectedMonth}/${instance.selectedDay}/${instance.selectedYear}`
                const hours = await getAvailability({
                    selected_date: globalObject.selected_date,
                    responsible: globalObject.responsible.name
                })
                for (let hour of hours) {
                    const hour_element = $(`<li class="hour-button"><a data-value='${hour}' href='javascript:void(0);'>${new Date('01/01/1999 '+hour).toLocaleTimeString('en-US', { hour: "2-digit", minute: '2-digit' })}</a></li>`);
                    if (hour < "13:00:00") {
                        $("ul.morning").append(hour_element)
                    }
                    else if (hour < "17:00:00") {
                        $("ul.afternoon").append(hour_element)
                    }
                    else {
                        $("ul.evening").append(hour_element)
                    }
                    // $("#hourpicker").append(`<div class="hour-button" data-value="${hour}" >${new Date(`2000-01-01 ${hour}`).toLocaleTimeString()}</div>`)
                }

                $("li.hour-button a").click(function (e) {
                    e.preventDefault()
                    globalObject.selected_hour = $(this).data("value")
                    nextStep()
                })
            }
        });
    }
}

function renderUserDataSection() {

}

function renderConfirmationStep() {
    const confirmationUl = $(`<ul id="confirm_ul"></ul>`)
    const LiArray = [
        {
            handler: () => {
                const li = $("<li></li>")
                li.append("<label>Servicios:</label>")
                const span = $("<span></span>")

                const innerUl = $("<ul></ul>")

                globalObject.selected_services.forEach(item => {
                    innerUl.append(`<li>${item.item_name} - ${item.duration} Minutos</li>`)
                })
                span.append(innerUl)
                li.append(span)
                return li;
            }
        },
        {
            label: "Proveedor:",
            value: `${globalObject.responsible.first_name} ${globalObject.responsible.last_name}`
        },
        {
            label: "Fecha y Hora:",
            value: `${new Date(globalObject.selected_date + " " + globalObject.selected_hour).toLocaleString()}`
        },
        {
            handler: () => {

                const li = $("<li></li>")
                li.append("<label>Tus Datos:</label>")
                const span = $("<span></span>")
                span.append(`<ul></ul>`)
                    .append(`<li>${globalObject.userData.first_name + " " + globalObject.userData.last_name}</li>`)
                    .append(`<li>${globalObject.userData.phone}</li>`)
                    .append(`<li>${globalObject.userData.email}</li>`)
                li.append(span)
                return li;
            }
        }
    ];
    for (let block of LiArray) {
        if (block.handler) {
            confirmationUl.append(block.handler())
        }
        else {
            const li = $("<li></li>");
            li.append(`<label>${block.label}</label>`)
            li.append(`<span>${block.value}</span>`)
            confirmationUl.append(li)
        }
    }

    $("#confirmation_step").prepend(confirmationUl)
    $("#confirm_btn").click(confirmationButton)
}


function printElement(e) {
    var ifr = document.createElement('iframe');
    ifr.style = 'height: 0px; width: 0px; position: absolute'
    document.body.appendChild(ifr);

    $(e).clone().appendTo(ifr.contentDocument.body);
    ifr.contentWindow.print();

    ifr.parentElement.removeChild(ifr);
}