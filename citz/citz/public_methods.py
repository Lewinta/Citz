import frappe
import json
from frappe.utils import flt
from frappe.model.mapper import get_mapped_doc
from frappe.model.naming import getseries
from frappe.model.utils import get_fetch_values
from erpnext.setup.doctype.item_group.item_group import get_item_group_defaults
from erpnext.stock.doctype.item.item import get_item_defaults
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
        ORDER BY starts_on ASC
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
        sales_order.cost_center = event.cost_center
        sales_order.event = event.name
        for item in sales_order.items:
            item.qty = 1
        sales_order.save()   
        return sales_order


@frappe.whitelist()
def make_sales_invoice(source_name, tax_category, payments, target_doc=None, ignore_permissions=False):
    payments = json.loads(payments)
    def postprocess(source, target):
        set_missing_values(source, target)
        #Get the advance paid Journal Entries in Sales Invoice Advance
        if target.get("allocate_advances_automatically"):
            target.set_advances()

    def set_missing_values(source, target):
        target.ignore_pricing_rule = 1
        target.flags.ignore_permissions = True
        target.run_method("set_missing_values")
        target.run_method("set_po_nos")
        target.run_method("calculate_taxes_and_totals")

        if source.company_address:
            target.update({'company_address': source.company_address})
        else:
            # set company address
            target.update(get_company_address(target.company))

        if target.company_address:
            target.update(get_fetch_values("Sales Invoice", 'company_address', target.company_address))

        if source.cost_center:
            target.update({"cost_center": source.cost_center})

        # set the redeem loyalty points if provided via shopping cart
        if source.loyalty_points and source.order_type == "Shopping Cart":
            target.redeem_loyalty_points = 1

    def update_item(source, target, source_parent):
        target.amount = flt(source.amount) - flt(source.billed_amt)
        target.base_amount = target.amount * flt(source_parent.conversion_rate)
        target.qty = target.amount / flt(source.rate) if (source.rate and source.billed_amt) else source.qty - source.returned_qty

        if source_parent.project:
            target.cost_center = frappe.db.get_value("Project", source_parent.project, "cost_center")
        if target.item_code:
            item = get_item_defaults(target.item_code, source_parent.company)
            item_group = get_item_group_defaults(target.item_code, source_parent.company)
            cost_center = item.get("selling_cost_center") \
                or item_group.get("selling_cost_center")

            if cost_center:
                target.cost_center = cost_center

    doclist = get_mapped_doc("Sales Order", source_name, {
        "Sales Order": {
            "doctype": "Sales Invoice",
            "field_map": {
                "party_account_currency": "party_account_currency",
                "payment_terms_template": "payment_terms_template",
                "event": "event"
            },
            "validation": {
                "docstatus": ["=", 1]
            }
        },
        "Sales Order Item": {
            "doctype": "Sales Invoice Item",
            "field_map": {
                "name": "so_detail",
                "parent": "sales_order",
            },
            "postprocess": update_item,
            "condition": lambda doc: doc.qty and (doc.base_amount==0 or abs(doc.billed_amt) < abs(doc.amount))
        },
        "Sales Taxes and Charges": {
            "doctype": "Sales Taxes and Charges",
            "add_if_empty": True
        },
        "Sales Team": {
            "doctype": "Sales Team",
            "add_if_empty": True
        }
    }, target_doc, postprocess, ignore_permissions=ignore_permissions)
    doclist.tax_category = tax_category
    doclist.payments = []
    idx = 1
    for payment in payments:
        mode_of_payment = payment['mode_of_payment']
        if type(mode_of_payment) == str:
            mode_of_payment = frappe.get_doc("Mode of Payment", mode_of_payment)
        
        mop_accounts = [r.default_account for r in mode_of_payment.accounts if r.company == doclist.company]
        if not mop_accounts:
            frappe.throw(
                "Favor especifique una cuenta por defecto en el "
                "Metodo de Pago {0} para la empresa {1}" \
                .format(mode_of_payment.name, doclist.company)
            )
        doc_payment = frappe.get_doc({
            'doctype': 'Sales Invoice Payment',
            'parenttype': 'Sales Invoice',
            'parentfield': 'payments',
            'docstatus': 1,
            'idx': idx,
            'parent': doclist.name,
            'mode_of_payment': payment['mode_of_payment'],
            'amount': payment['amount'],
            'type': mode_of_payment.type,
            'default': 0,
            'account': mop_accounts[0]
        })
        doclist.payments.append(doc_payment)
        idx += 1

    doclist.save()
    doclist.submit()
    frappe.msgprint("Factura de Venta creada exitosamente!")
    return doclist
