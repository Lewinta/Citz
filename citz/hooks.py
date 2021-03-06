# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from . import __version__ as app_version

app_name = "citz"
app_title = "Citz"
app_publisher = "Lewin Villar"
app_description = "An amazing appointment app"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "lewin.villar@gmail.com"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/citz/css/citz.css"
# app_include_js = "/assets/citz/js/citz.js"

# include js, css files in header of web template
# web_include_css = "/assets/citz/css/citz.css"
# web_include_js = "/assets/citz/js/citz.js"

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {
	"Event" : "public/js/event.js",
	"Employee" : "public/js/employee.js",
	"Sales Invoice": "public/js/sales_invoice.js",
	"Sales Order": "public/js/sales_order.js"
}
doctype_list_js = {"Customer" : "public/js/customer_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Fixtures
# ----------
fixtures = [
	{
		"doctype": "Weekday",
		"filters": {
			"name": (
				"in", (
					"Monday",
					"Tuesday",
					"Wednesday",
					"Thursday",
					"Friday",
					"Saturday",
					"Sunday",
				)
			)
		}
	},
	{
		"doctype": "Translation",
		"filters": {
			"name": (
				"in", (
					"9caff7a137",
					"b98fa676dd",
					"36c4710498",
					"0143614f19",
					"23ecf385a6",
					"9d807ef20f",
					"b919fa56f3",
					"370c21dab4",
					"ff98067489",
					"d3cd4fb007",
					"17968bcae1",
					"3497187195",
					"2bf178db6a",
					"7f55287301",
				)
			)
		}
	}
]
# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Website user home page (by function)
# get_website_user_home_page = "citz.utils.get_home_page"

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "citz.install.before_install"
# after_install = "citz.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "citz.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
# 	# "*": {
# 	# 	"on_update": "method",
# 	# 	"on_cancel": "method",
# 	# 	"on_trash": "method"
# 	# }
	"Employee": {
		"validate": "citz.hook.employee.validate",
		"after_insert": "citz.hook.employee.on_update",
	}
}

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"citz.tasks.all"
# 	],
# 	"daily": [
# 		"citz.tasks.daily"
# 	],
# 	"hourly": [
# 		"citz.tasks.hourly"
# 	],
# 	"weekly": [
# 		"citz.tasks.weekly"
# 	]
# 	"monthly": [
# 		"citz.tasks.monthly"
# 	]
# }

# Testing
# -------

# before_tests = "citz.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "citz.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "citz.task.get_dashboard_data"
# }

