import frappe

@frappe.whitelist(allow_guest= True)
def get_events(date, responsible):
    return frappe.db.sql("""
        SELECT
        starts_on,
        ends_on
        FROM `tabEvent`
        WHERE 
        DATE(starts_on) = DATE(%(date)s)
            AND 
        responsible = %(responsible)s
    """, {"date": date, "responsible": responsible}, as_dict = 1)

@frappe.whitelist()
def branches():
    branches = frappe.db.sql("SELECT name FROM `tabBranch`", as_dict=1)
    for branch in branches: 
        branch['schedule'] = frappe.db.sql("SELECT day_of_week as name, DATE_FORMAT(opening_time, '%%H:%%i:%%S') as opening_time, DATE_FORMAT(closing_time, '%%H:%%i:%%S') as closing_time, is_open FROM `tabBranch Schedule` WHERE parent = %(parent)s", {"parent": "castellana"}, as_dict=1)
    return branches

@frappe.whitelist()
def get_branch_schedule(branch):
    return frappe.db.sql("""
        SELECT 
        day_of_week,
        opening_time,
        closing_time,
        is_open
        FROM `tabBranch Schedule`
        WHERE parent = %(branch)s
    """, {'branch': branch}, as_dict=1)

@frappe.whitelist()
def event(subject, responsible, starts_on, ends_on, description, branch):
    newEvent = frappe.get_doc({
        'doctype': 'Event', 
        'subject': subject,
        'responsible': responsible,
        'starts_on': starts_on,
        'ends_on': ends_on,
        'description': description,
        'branch': branch,
        'send_reminder': 0,
        'event_type': 'Public'   
    })
    newEvent.save(ignore_permissions=True)
    newEvent.reload()
    return newEvent

@frappe.whitelist()
def new_customer():
    customer = frappe.new_doc("Customer")
    return customer; 
