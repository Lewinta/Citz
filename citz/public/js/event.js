// Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt
frappe.provide("frappe.desk");

frappe.ui.form.on("Event", {
	setup: function(frm) {
		window.addEventListener('addParticipant', (event) => {
			const payload = event.detail;
			frm.add_child('event_participants', {
				reference_doctype: 'Customer',
				reference_docname: payload.name
			})
			frm.save();
			frm.refresh_fields();
		})
	},
	refresh: function (frm) {

		frm.remove_custom_button(__('Add Contacts'), __("Add Participants"));
		frm.remove_custom_button(__('Add Leads'), __("Add Participants"));
		frm.remove_custom_button(__('Add Customers'), __("Add Participants"));
		frm.remove_custom_button(__('Add Suppliers'), __("Add Participants"));
		frm.remove_custom_button(__('Add Employees'), __("Add Participants"));
		frm.remove_custom_button(__('Add Sales Partners'), __("Add Participants"));
		frm.remove_custom_button(__('Participants'))
		frm.add_custom_button(__('Add Customer'), function () {
			new customEventParticipants(frm, "Customer");
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


frappe.ui.form.LinkSelector = frappe.ui.form.LinkSelector.extend({
	make: function() {
		this._super() 
		const me = this
		this.dialog.get_input("txt").on("keyup", function () {
			me.start = 0;
			me.search();
		});
	}
});

class customEventParticipants {
	constructor(frm, doctype) {
		this.frm = frm;
		this.doctype = doctype;
		this.make();
	}

	make() {
		let me = this;

		let table = me.frm.get_field("event_participants").grid;
		me.current_link_selector = new frappe.ui.form.LinkSelector({
			doctype: me.doctype,
			dynamic_link_field: "reference_doctype",
			dynamic_link_reference: me.doctype,
			fieldname: "reference_docname",
			target: table,
			txt: ""
		});
	}
};
