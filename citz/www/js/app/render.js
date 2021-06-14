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
        return acc + curr.item_name + '\n'
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
function renderServices() {
    globalObject.services.sort((current, next) => {
        if (current.item_category > next.item_category) return 1
        if (current.item_category < next.item_category) return -1
        return 0
    })

    globalObject.services.forEach(item => {
        const container = $("<div></div>")
        container.append(`
        <a class="btn btn-selection service" 
            data-name="${item.name}" 
            data-item-name="${item.item_name}"
            data-selected="0" 
            data-duration="${item.duration || 1}" 
            href='#'
            style="display: flex;"
            >
                <b  class="service_name"
                    style="display: flex; flex-direction: column; padding-left: 7px;"
                > 
                    <span> ${item.item_name} </span>
                    <span style="font-size:11px; color: gray;">
                        ${item.item_category || item.item_group}
                    </span>
                    <span id='${item.name}' class='norender'>
                        <input
                            pattern="[0-9]*"
                            min=1
                            style="width:30%; border-radius: 8px;" 
                            class='service_quantity' 
                            name='cantidad' 
                            data-name='${item.name}' 
                            type='number' 
                        /> 
                        <span style="font-size:9px; color: gray;"> Aquí puede variar la cantidad </span> 
                    </span>                
                </b> 
                <span style="margin-left: auto;">${item.duration || 1} minutos </span>
        </a>`)

        $(".service_quantity").on('click', (e) => {
            e.stopImmediatePropagation()
        })
        $(".service_quantity").on('change', (e) => {
            e.stopImmediatePropagation()
            const { name: item_name } = e.target.dataset
            const service = globalObject.selected_services.find(s => s.name == item_name)
            const serviceDuration = parseInt($(`a[data-name='${service.name}']`).data("duration"))
            globalObject.totalDuration -= (serviceDuration * service.quantity)
            service.quantity = parseFloat(e.target.value)
            globalObject.totalDuration += (serviceDuration * service.quantity)
            document.getElementById("durationTotal").innerText = `Duración total: ${globalObject.totalDuration} minutos`
        })
        $("#services").append(container)
    })
    const searchInput = $("<input class='form-control' type='text' name='service-search' id='service-search' value='' placeholder='Buscar...' />")
    searchInput.on('keyup', function (e) {
        const _this = $(this)
        $('#services').find('a.btn-selection').each((idx, tag) => {
            if (tag.innerText.toLowerCase().includes(_this.val().toLowerCase()) || !_this.val()) {
                $(tag).removeClass('norender')
            }
            else {
                $(tag).addClass('norender')
            }
        })
    })

    $("#services").prepend(searchInput)

}

function addEvents() {
    $(".btn-selection").click(function (e) {
        e.preventDefault()
        $(this).toggleClass("selected")
    })

    $(".service").click(function (e) {
        if ($(this).hasClass("selected")) {
            const service = { ...globalObject.services.find(s => s.name == $(this).data("name")) }
            const quantitySpan = $(`#${$(this).data('name')}`)
            quantitySpan.removeClass('norender')
            const quantityInput = quantitySpan.find('input')[0]

            if (quantityInput.value) {
                service.quantity = quantityInput.value
            }
            else {
                service.quantity = 1
                quantityInput.value = 1
            }

            globalObject.selected_services.push(service)
            globalObject.totalDuration += (parseInt($(this).data("duration")) * service.quantity)
        }
        else {
            $(`#${$(this).data('name')}`).addClass('norender')
            const service_index = globalObject.selected_services.findIndex(s => s.name == $(this).data("name"))
            const service = globalObject.selected_services[service_index]
            globalObject.totalDuration -= (parseInt($(this).data("duration")) * service.quantity)
            if (service_index > -1) globalObject.selected_services.splice(service_index, 1)
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

    globalObject.services = [...(await fetchData("services"))];
    renderServices()

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

        if (JSON.stringify(globalObject.responsible) !== JSON.stringify(previous)) {
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
                $("#hourpicker").css({"background-color": "white"})
                $("#hourpicker ul").css({"display": "block"})
                $("#hourpicker .hour-button").remove()
                $("#hourpicker > .no-time-spot-message").remove()
                globalObject.selected_date = `${(instance.selectedMonth + 1) < 10 ? "0" + (instance.selectedMonth + 1) : instance.selectedMonth}/${instance.selectedDay}/${instance.selectedYear}`
                const hours = await getAvailability({
                    selected_date: globalObject.selected_date,
                    responsible: globalObject.responsible.name
                })
                if (hours.length > 0) {
                    for (let hour of hours) {
                        const hour_element = $(`<li class="hour-button"><a data-value='${hour}' href='javascript:void(0);'>${new Date('01/01/1999 ' + hour).toLocaleTimeString('en-US', { hour: "2-digit", minute: '2-digit' })}</a></li>`);
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
                        $('.hour-selected').removeClass('hour-selected')
                        $(this).addClass('hour-selected')
                        globalObject.selected_hour = $(this).data("value")
                        nextStep()
                    })
                }
                else {
                    $("#hourpicker").css({ "background-color": "lightgray" })
                    $("#hourpicker ul").css({"display": "none"})
                    $("#hourpicker").prepend("<div class='no-time-spot-message'>No hay horarios disponibles para este día.</div>")
                }



            }
        });
    }
}

function renderUserDataSection() {

}

function renderConfirmationStep() {
    $("#confirm_ul").remove()
    $("#confirm_btn").off()
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