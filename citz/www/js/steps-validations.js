// validations
function branchValidation() {
    return document.getElementsByClassName("branch selected").length > 0
}
function serviceValidation() {
    return document.getElementsByClassName("service selected").length > 0
}
function responsibleValidation() {
    return document.getElementsByClassName("responsible selected").length > 0
}

function dateValidation() {
    return globalObject.selected_date && globalObject.selected_hour
}

function userDataValidation() {
    let value = true;

    function validateEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
      }
        var email = ($('#email').val());
        var fname = ($('#fname').val());
        var lname = ($('#lname').val());
        var phone = ($('#phone').val());

        if (!validateEmail(email)){
            alert ("Su dirección de correo no es valida")
            return false;
        }
        if (!email){
            alert("Necesita llenar los campos necesarios");
            return false;
        }
        if (!fname){
            alert("Necesita llenar el campo de 'Nombre'");
            return false;
        }
        if (!lname){
            alert("Necesita llenar el campo de 'Apellido'");
            return false;
        }
        if (!phone){
            alert("Necesita llenar los campos necesarios");
            return false;
        }
    return true;
}

