// Copyright (c) 2016, Lewin Villar and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Desglose de Ventas"] = {
	"filters": [
		{
			"label": __("From Date"),
			"fieldname": "from_date",
			"fieldtype": "Date",
			"bold": 1,
			"reqd": 1
		},
		{
			"label": __("To Date"),
			"fieldname": "to_date",
			"fieldtype": "Date",
			"bold": 1,
			"reqd": 1
		},
		{
			"fieldtype": "Link",
			"fieldname": "cost_center",
			"label": __("Cost Center"),
			"options": "Cost Center",
			"bold": 1,
		},
	]
};
