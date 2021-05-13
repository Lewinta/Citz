# Copyright (c) 2013, Lewin Villar and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _

def execute(filters=None):
	return get_columns(), get_data(filters)

def get_columns():
	return [
		_("Invoice") 		+ ":Link/Sales Invoice:120",
		_("Date") 			+ ":Date:100",
		_("Customer") 		+ ":Data:230",
		
		_("Efectivo") 			+ ":Currency/currency:120",
		_("Tarjeta de Credito") + ":Currency/currency:120",
		_("Trans. Bancaria") 	+ ":Currency/currency:120",
		_("Cheque") 			+ ":Currency/currency:120",
	]

def get_conditions(filters):
	conditions = []
	
	if filters.get("mode_of_payment"):
		conditions.append("`tabSales Invoice Payment`.mode_of_payment = '{}'".format(filters.get("mode_of_payment")))
	
	if filters.get("from_date"):
		conditions.append("`tabSales Invoice`.posting_date >= '{}'".format(filters.get("from_date")))
	
	if filters.get("to_date"):
		conditions.append("`tabSales Invoice`.posting_date <= '{}'".format(filters.get("to_date")))
	
	return " and ".join(conditions)

def get_data(filters=None):
	conditions = get_conditions(filters)
	if conditions:
		conditions = " AND {}".format(conditions)
	 
	return frappe.db.sql("""
		SELECT
			`tabSales Invoice`.name,
			`tabSales Invoice`.posting_date,
			`tabSales Invoice`.customer_name,
			SUM(IF(
				`tabSales Invoice Payment`.mode_of_payment = 'Efectivo',
				`tabSales Invoice Payment`.amount,
				0
			)) as cash,
			SUM(IF(
				`tabSales Invoice Payment`.mode_of_payment = 'Tarjeta',
				`tabSales Invoice Payment`.amount,
				0
			)) as tc, 
			SUM(IF(
				`tabSales Invoice Payment`.mode_of_payment = 'Transferencia Bancaria',
				`tabSales Invoice Payment`.amount,
				0
			)) as transfer,
			SUM(IF(
				`tabSales Invoice Payment`.mode_of_payment = 'Cheque',
				`tabSales Invoice Payment`.amount,
				0
			)) as cheque
		FROM 
			`tabSales Invoice`
		JOIN
			`tabSales Invoice Payment`
		ON
			`tabSales Invoice`.name = `tabSales Invoice Payment`.parent
		WHERE	
			`tabSales Invoice`.docstatus = 1
		{conditions}
		GROUP BY 
			`tabSales Invoice`.name
	""".format(conditions=conditions), debug=True)