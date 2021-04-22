// Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt
frappe.provide("frappe.desk");

frappe.ui.form.on("Event", {
	refresh: function (frm) {

		frm.remove_custom_button(__('Add Contacts'), __("Add Participants"));
		frm.remove_custom_button(__('Add Leads'), __("Add Participants"));
		frm.remove_custom_button(__('Add Customers'), __("Add Participants"));
		frm.remove_custom_button(__('Add Suppliers'), __("Add Participants"));
		frm.remove_custom_button(__('Add Employees'), __("Add Participants"));
		frm.remove_custom_button(__('Add Sales Partners'), __("Add Participants"));
		frm.remove_custom_button(__('Participants'))
		frm.add_custom_button(__('Add Customer'), function () {
			new frappe.desk.eventParticipants(frm, "Customer");

		})

		frm.custom_buttons[__('Add Customer')].addClass("btn-primary")

		if (frm.doc.event_participants) {
			// remove participant button
			frm.doc.event_participants.forEach(value => {
				frm.remove_custom_button(__(value.reference_docname), __("Participants"))
			})

			let hasCustomer = frm.doc.event_participants
				.findIndex(value => value.reference_doctype == "Customer")
			if (hasCustomer > -1) {
				frm.add_custom_button(__('Create Sales Order'), function () {
					
					frappe.call({
						method: "citz.citz.public_methods.make_sales_order",
						args: {
							event_name: frm.docname
						},
						callback: ({message}) => {
							if (!message) return;
							frappe.set_route("Form", message.doctype, message.name)
						}
					})
				})
				frm.remove_custom_button(__('Add Customer'));
			}
		}
	}
});
