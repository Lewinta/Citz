frappe.ui.form.on("Employee", {
    refresh(frm){
      frm.trigger("add_custom_buttons");
    },
    after_save(frm){
        frm.reload_doc();
    },
    add_custom_buttons(frm){
        frm.fields_dict["timeslot"].grid.add_custom_button(__('Add Schedule'), () => frm.trigger("show_schedule_prompt"));
        frm.fields_dict["timeslot"].grid.custom_buttons[__('Add Schedule')].removeClass("btn-custom");
        frm.fields_dict["timeslot"].grid.custom_buttons[__('Add Schedule')].addClass("btn-primary");
        frm.fields_dict["timeslot"].grid.add_custom_button(__('Clear Table'), () => frm.trigger("clear_table"));
        frm.fields_dict["timeslot"].grid.custom_buttons[__('Clear Table')].removeClass("btn-custom");
        frm.fields_dict["timeslot"].grid.custom_buttons[__('Clear Table')].addClass("btn-danger");
    },
    clear_table(frm){
        frm.clear_table("timeslot");
        frm.refresh_field("timeslot");
        frappe.show_alert(__("The Schedule Table has been cleared"));
    },
    show_schedule_prompt(frm){
        let d = new frappe.ui.Dialog({
            title: 'Add Schedule',
            fields: [
                {
                    label: __('Start Time'),
                    fieldname: 'from_time',
                    fieldtype: 'Time',
                    reqd: 1
                },
                {
                    
                    fieldtype: 'Column Break'
                },
                {
                    label: __('End Time'),
                    fieldname: 'to_time',
                    fieldtype: 'Time',
                    reqd: 1
                },
                {
                    fieldtype: 'Section Break'
                },
                {
                    label: __('Days'),
                    fieldname: 'days',
                    fieldtype: 'Table MultiSelect',
                    reqd: 1,
                    options: "Weekday Child",
                    default: [
                        {"day": "Monday"},
                        {"day": "Tuesday"},
                        {"day": "Wednesday"},
                        {"day": "Thursday"},
                        {"day": "Friday"},
                        {"day": "Saturday"}
                    ]
                }
                
            ],
            primary_action_label: 'Agregar',
            primary_action(values) {
                const {from_time, to_time, days} = values;
            
                days.forEach( ({day}) => {
                    
                    frm.add_child("timeslot", {day, from_time, to_time});
                })
                
                frm.refresh_field("timeslot");
                d.hide();
            }
        });
        d.show();
    }

});