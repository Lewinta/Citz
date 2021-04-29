function create_custom_quick_entry() {

    const standard_quick_entry = frappe.ui.form.make_quick_entry;
    const custom_quick_entry = (doctype, after_insert, init_callback, doc) => {
        return standard_quick_entry(doctype, after_insert, init_callback, doc)
            .then((quick_entry) => {
                if (!cur_page.page.id.includes('Event')) {
                    return;
                }
                const searchDialog = cur_dialog;
                cur_dialog = quick_entry.dialog;
                const saveBtn = cur_dialog.buttons[0].children[2];
                const newSaveBtn = saveBtn.cloneNode(true);
                newSaveBtn.addEventListener('click', function () {
                    fetch("/api/resource/Customer", {
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Frappe-CSRF-Token': frappe.csrf_token,
                            'Authorization': 'token a9382fe44c435f1:ade7fd03220ab5e'
                        },
                        credentials: "omit",
                        body: JSON.stringify({ customer_name: cur_dialog.doc.customer_name })
                    })
                        .then(r => r.json())
                        .then((response) => {
                            const addParticipantEvent = new CustomEvent('addParticipant', {
                                detail: {
                                    name: response.data.name
                                }
                            })
                            window.dispatchEvent(addParticipantEvent);

                            cur_dialog.cancel();
                            searchDialog.cancel();
                            frappe.ui.form.make_quick_entry = standard_quick_entry;
                        })
                        .catch(err => {
                            console.log(err)
                            frappe.msgprint(err.statusText)
                            frappe.ui.form.make_quick_entry = standard_quick_entry;
                        })
                })
                saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            })
    }
    frappe.ui.form.make_quick_entry = custom_quick_entry;
}

create_custom_quick_entry()