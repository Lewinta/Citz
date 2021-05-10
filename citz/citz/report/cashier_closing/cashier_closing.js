// Copyright (c) 2016, Lewin Villar and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Cashier Closing"] = {
	"filters": [
		{
			"label": __("From Date"),
			"fieldname": "from_date",
			"fieldtype": "Date",
			"reqd": 1,
		},
		{
			"label": __("To Date"),
			"fieldname": "to_date",
			"fieldtype": "Date",
			"reqd": 1,
		},
		{
			"label": __("Mode of Payment"),
			"fieldname": "to_date",
			"fieldtype": "Link",
			"options": "Mode of Payment",
			
		},
	]
};
