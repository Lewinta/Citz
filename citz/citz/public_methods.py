import frappe
import json
from frappe.model.mapper import get_mapped_doc
from frappe.model.naming import getseries
from datetime import datetime

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
        branch['schedule'] = frappe.db.sql(""" 
        SELECT 
            day_of_week as name, 
            DATE_FORMAT(opening_time, '%%H:%%i:%%S') as opening_time, 
            DATE_FORMAT(closing_time, '%%H:%%i:%%S') as closing_time, 
            is_open 
        FROM 
            `tabBranch Schedule` 
        WHERE 
            parent = %(parent)s
        """, {"parent": branch.name}, as_dict=1)
    return branches
@frappe.whitelist()
def responsibles(branch = None):
    responsibles = frappe.db.sql("SELECT name as id, user_id as name, first_name, last_name, branch from `tabEmployee` WHERE (branch = %(branch)s or '' = %(branch)s) and user_id != ''", {"branch": branch or ""}, as_dict=1)
    for responsible in responsibles:
        responsible['schedule'] = frappe.db.sql(""" 
            SELECT
                day,
                from_time,
                to_time 
            FROM `tabHealthcare Schedule Time Slot`
            WHERE parent = %(parent)s 
        """, {"parent": responsible.id}, as_dict=1)
    return responsibles
    

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
def event(subject, responsible, starts_on, ends_on, description, branch, services):
    services = json.loads(services)
    newEvent = frappe.get_doc({
        'doctype': 'Event', 
        'subject': subject,
        'responsible': responsible,
        'starts_on': starts_on,
        'ends_on': ends_on,
        'description': description,
        'branch': branch,
        'send_reminder': 0,
        'event_type': 'Public',
        'event_items': [frappe._dict({'item_code': s['name'], 'item_name': s['item_name'], 'duration': s['duration']}) for s in services]
    })
    newEvent.save(ignore_permissions=True)
    newEvent.reload()
    return newEvent

@frappe.whitelist()
def make_sales_order(event_name):
    event = frappe.get_doc("Event", event_name)
    if event: 
        sales_order = get_mapped_doc("Event", event_name, {
            "Event": {
                "doctype": "Sales Order"
            },
            "Event Items": {
                "doctype": "Sales Order Item",
                "field_map" : {
                    "item_code": "item_code",
                    "item_name": "item_name"
                }
            }
        })
        sales_order.customer = next((event.reference_docname for event in event.event_participants if event.reference_doctype == "Customer"), "")   
        sales_order.delivery_date = datetime.today()
        for item in sales_order.items:
            item.qty = 1
        sales_order.save()   
        return sales_order
