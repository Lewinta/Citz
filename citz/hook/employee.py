import frappe

def on_update(doc, method):
    sales_partner = frappe.new_doc("Sales Partner")
    sales_partner.partner_name = doc.employee_name
    sales_partner.commission_rate = 12.00
    sales_partner.partner_type = "Agent"
    sales_partner.insert(ignore_mandatory=True)
    