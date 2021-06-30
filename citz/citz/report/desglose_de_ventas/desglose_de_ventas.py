# Copyright (c) 2013, Lewin Villar and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe

def execute(filters=None):
	return get_columns(), get_data(filters)

def get_columns():
	return [
		"Centro de Costo:Data:120",
		"Factura No.:Link/Sales Invoice:100",
		"NCF:Data:110",
		"Fecha:Date:100",
		"Sub-Total:Currency:120",
		"Total:Currency:120",
		"Efectivo:Currency:120",
		"Tarjeta:Currency:120",
	]

def get_filters(filters):
	conditions = ["`tabSales Invoice`.docstatus = 1"]
	
	if filters.get("cost_center"):
		conditions.append("`tabSales Invoice`.cost_center = '{}'".format(filters.get("cost_center")))
	
	if filters.get("from_date"):
		conditions.append("`tabSales Invoice`.posting_date >= '{}'".format(filters.get("from_date")))
	
	if filters.get("to_date"):
		conditions.append("`tabSales Invoice`.posting_date <= '{}'".format(filters.get("to_date")))
	
	return " and ".join(conditions)

def get_data(filters):
	data = []
	filters = get_filters(filters)

	return frappe.db.sql("""
		SELECT 
			`tabSales Invoice`.cost_center,
			`tabSales Invoice`.name,
			`tabSales Invoice`.ncf,
			`tabSales Invoice`.posting_date,
			`tabSales Invoice`.base_net_total,
			`tabSales Invoice`.base_grand_total,
			SUM(
				IF(
					`tabSales Invoice Payment`.mode_of_payment = 'Efectivo',
					`tabSales Invoice Payment`.base_amount,
					0
				)
			) as efectivo,
			SUM(
				IF(
					`tabSales Invoice Payment`.mode_of_payment = 'Tarjeta',
					`tabSales Invoice Payment`.base_amount,
					0
				)
			) as tarjeta
		FROM 
			`tabSales Invoice`
		LEFT JOIN
			`tabSales Invoice Payment`
		ON
			`tabSales Invoice`.name = `tabSales Invoice Payment`.parent
		WHERE
			{filters}
		Group By 
			`tabSales Invoice`.name
	""".format(filters=filters), debug=True)
	