import frappe

def validate(doc, method):
    days_order = {
        "Monday": 1,
        "Tuesday": 2,
        "Wednesday": 3,
        "Thursday": 4,
        "Friday": 5,
        "Saturday": 6,
        "Sunday": 7,
    }
    doc.timeslot.sort(key=lambda x: (days_order[x.day], x.from_time), reverse=False)
    
    for i, item in enumerate(doc.timeslot, start=1):
        item.idx = i

def on_update(doc, method):
    sales_partner = frappe.new_doc("Sales Partner")
    sales_partner.partner_name = doc.employee_name
    sales_partner.commission_rate = 12.00
    sales_partner.partner_type = "Agent"
    sales_partner.insert(ignore_mandatory=True)