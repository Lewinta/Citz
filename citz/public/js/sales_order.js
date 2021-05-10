erpnext.selling.SalesOrderController = erpnext.selling.SellingController.extend({
    refresh: function (doc, dt, dn) {
        const frm = this.frm;
        console.log(dt)
        this._super();
        frm.clear_custom_buttons()
        if (frm.doc.docstatus == 1 && frm.doc.per_billed < 100)
            frm.add_custom_button(__('New Sales Invoice'), () => {
            const sinv_dialog = new frappe.ui.Dialog({
                title: 'Enter payment method',
                fields: [
                    {
                        label: 'Mode of Payment',
                        fieldtype: 'Link',
                        fieldname: 'mode_of_payment',
                        options: 'Mode of Payment'
                    },
                    {
                        label: 'Tax Category',
                        fieldtype: 'Link',
                        fieldname: 'tax_category',
                        options: 'Tax Category'
                    }
                ],
                primary_action_label: 'Create',
                primary_action: async (dialog_data) => {
                    // let mode_of_payment = await frappe.db.get_doc('Mode of Payment', dialog_data.mode_of_payment)
                    // if (!mode_of_payment.accounts.some(account => account.company === frm.doc.company )) {
                    //     frappe.msgprint(__(`Not default account for company: ${frm.doc.company}`), __('Error creating Sales Invoice'))
                    //     return null
                    // }
                    // console.log(mode_of_payment)
                    sinv_dialog.hide()
                    frappe.call({
                        type: "POST",
                        method: 'citz.citz.public_methods.make_sales_invoice',
                        args: {
                            source_name: frm.docname,
                            tax_category: dialog_data.tax_category,
                            mode_of_payment: dialog_data.mode_of_payment,
                        },
                        freeze: true,
                        freeze_message: '',
                        callback: function (r) {
                            if (!r.exc) {
                                // console.log(r.message)
                                // const sinv = {...r.message}
                                frappe.set_route("Form", sinv.doctype, sinv.name);
                            }
                        }
                    })
                }
            })
            sinv_dialog.show();
            })
    }
})

$.extend(cur_frm.cscript, new erpnext.selling.SalesOrderController({ frm: cur_frm }));
