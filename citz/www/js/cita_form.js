// Get Services: http://dev-tbb.tzcode.tech/api/resource/Item?filters={"item_group":%20"Servicios"}


function getFormJson(form) {
    let array = $(form).serializeArray()
    let obj = {};
    for (let item of array) {
        obj[item.name] = item[value];
    }

    return obj;
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
                            if (result) {
                                globalObject.userData = {};
                                globalObject.userData['first_name'] = $("#fname").val();
                                globalObject.userData['last_name'] = $("#lname").val();
                                globalObject.userData['phone'] = $("#phone").val();
                                globalObject.userData['email'] = $("#email").val();
                            }
                            renderConfirmationStep()
                            break;

                    }
                    if (result)
                    {

                        $(".current-step").css({ "color": "black" }).html(getStep(next).title)
                    }
                    else {
                        $(".current-step").css({ "color": "red" }).html(getStep(current).title)
                    }
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
