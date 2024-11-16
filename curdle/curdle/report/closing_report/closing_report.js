frappe.query_reports["Closing Report"] = {
    "filters": [
        {
            label: __("Date"),
            fieldname: "date",
            fieldtype: "Date",
            default: frappe.datetime.get_today(),
            reqd: 1
        },
        {
            label: __("POS Profile"),
            fieldname: "pos_profile",
            fieldtype: "Link",
            options:"POS Profile",
            reqd:   1
        }
    ]
};
