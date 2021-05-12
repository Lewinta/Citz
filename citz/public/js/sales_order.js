erpnext.selling.SalesOrderController = erpnext.selling.SellingController.extend({
    refresh: function (doc, dt, dn) {
        const frm = this.frm;
        this._super();
        frm.clear_custom_buttons()
        if (frm.doc.docstatus == 1 && frm.doc.per_billed < 100)
            frm.add_custom_button(__('New Sales Invoice'), () => { 
                const sinv_dialog = new frappe.ui.Dialog({
                    title: 'Enter payment method',
                    fields: [
                        {
                            label: __('Tax Category'),
                            fieldtype: 'Link',
                            fieldname: 'tax_category',
                            options: 'Tax Category',
                            default: 'Consumidor Final',
                        },
                        {
                            fieldname: "payments",
                            fieldtype: "Table",
                            label: __("Payments"),
                            cannot_add_rows: false,
                            in_place_edit: true,
                            reqd: 1,
                            data: [],
                            fields: [
                                {
                                    fieldname: "mode_of_payment", 
                                    fieldtype: "Link",
                                    in_list_view: 1, 
                                    label: __("Mode of Payment"),
                                    options: "Mode of Payment", 
                                    reqd: 1
                                },
                                {
                                    fieldname: "amount", 
                                    fieldtype: "Currency",
                                    in_list_view: 1, 
                                    label: __("Amount"),
                                    options: "currency", 
                                    reqd: 1
                                }
                            ]
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
                        const total_payments = dialog_data.payments.reduce((acc, val) => acc + val.amount, 0)
                        if (total_payments !== frm.doc.grand_total) {
                            frappe.throw(`El total de pagos debe ser igual al total de la factura
                            <br />
                            <b>Total de pagos:</b> ${total_payments}
                            <br />
                            <b>Total de la factura:</b> ${frm.doc.grand_total}
                            <br />
                            Favor corregir.
                            `)
                            return false
                        }

                        sinv_dialog.hide()
                        frappe.call({
                            type: "POST",
                            method: 'citz.citz.public_methods.make_sales_invoice',
                            args: {
                                source_name: frm.docname,
                                tax_category: dialog_data.tax_category,
                                payments: dialog_data.payments,
                            },
                            freeze: true,
                            freeze_message: '',
                            callback: function (r) {
                                if (!r.exc) {
                                    const { doctype, name } = r.message;
                                    // const sinv = {...r.message}
                                    frappe.set_route("Form", doctype, name);
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
