frappe.ui.form.on("Sales Invoice", { 
    onload: function(frm) {
        frm.fields_dict.naming_series.df.hidden = 1;
        frm.refresh_fields();
    }
})