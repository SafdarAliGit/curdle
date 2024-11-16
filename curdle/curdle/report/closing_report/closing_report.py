import frappe
from frappe import _


def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data


def get_conditions(filters):
    conditions = ""
    if filters.get("date"):
        conditions += " AND DATE(posce.period_start_date) = %(date)s"
    if filters.get("pos_profile"):
        conditions += " AND posce.pos_profile = %(pos_profile)s"
    return conditions


def get_columns():
    return [
        {
            "fieldname": "pos_opening_entry",
            "label": _("Invoices"),
            "fieldtype": "Data",
            "width": 140
        }
    ]


def get_data(filters):
    conditions = get_conditions(filters)
    data = []

    # Fetching Finished Goods
    closing = frappe.db.sql(f"""
        SELECT 
            CONCAT(
                posce.pos_opening_entry, '<br>', 
                posce.user, '<br>', 
                'Transaction :<span style="float:right;">', ROUND(COUNT(posir.pos_invoice), 0), '</span><br>', 
                'Amount :<span style="float:right;">', ROUND(IFNULL(SUM(posir.grand_total), 0), 2), '</span>'
            ) AS pos_opening_entry
        FROM 
            `tabPOS Closing Entry` posce
        JOIN 
            `tabPOS Invoice Reference` posir ON posir.parent = posce.name
        WHERE 
            posce.docstatus = 1
            AND 
            posce.status = 'Submitted'
            {conditions}
        GROUP BY 
            posce.pos_opening_entry, posce.user
    """, {
        "date": filters.get("date"),
        "pos_profile": filters.get("pos_profile")
    }, as_dict=True)

    mode_of_payment = frappe.db.sql(f"""
        SELECT 
            CONCAT(
                '<div style="display:flex;border: 1.4px solid black; padding: 2px;margin-bottom: -12px;">',
                    '<div style="flex: 2; padding: 2px; border-right: 1.4px solid black; text-align: left;">', posced.mode_of_payment, '</div>', 
                    '<div style="flex: 1; padding: 2px; text-align: right;">', ROUND(SUM(posced.expected_amount), 0) - ROUND(SUM(posced.opening_amount),0), '</div>',
                '</div>'
            ) AS pos_opening_entry
        FROM 
            `tabPOS Closing Entry` posce
        JOIN 
            `tabPOS Closing Entry Detail` posced ON posced.parent = posce.name
        WHERE 
            posce.docstatus = 1
            AND 
            posce.status = 'Submitted'
            {conditions}  -- Ensure that `conditions` is a properly formatted string
        GROUP BY 
            posced.mode_of_payment
    """, {
        "date": filters.get("date"),
        "pos_profile": filters.get("pos_profile")
    }, as_dict=True)

    invoices = frappe.db.sql(f"""
        SELECT 
            posir.pos_invoice
        FROM 
            `tabPOS Closing Entry` posce
        JOIN 
            `tabPOS Invoice Reference` posir ON posir.parent = posce.name
        WHERE 
            posce.docstatus = 1
            AND 
            posce.status = 'Submitted'
            {conditions}
    """, {
        "date": filters.get("date"),
        "pos_profile": filters.get("pos_profile")
    }, as_dict=True)

    # Extract list of invoice numbers from the result
    invoice_list = [d["pos_invoice"] for d in invoices]
    if invoice_list:
        invoice_list_tuple = tuple(invoice_list)
        # Special handling if there is only one item in the tuple
        if len(invoice_list_tuple) == 1:
            invoice_list_tuple = f"('{invoice_list_tuple[0]}')"
    else:
        invoice_list_tuple = "('')"  # Empty condition if no invoices found
    pos_invoices = frappe.db.sql(f"""
        SELECT 
            CONCAT(
                '<div style="display: flex; width: 100%; padding: 2px; border: 1.4px solid black;margin-bottom: -12px;">',
                    '<div style="flex: 2; padding: 2px; border-right: 1px solid black; text-align: left;">', posii.item_code, '</div>', 
                    '<div style="flex: 1; padding: 2px; text-align: right;">', ROUND(IFNULL(SUM(posii.qty), 0), 0), '</div>',
                '</div>'
            ) AS pos_opening_entry
        FROM 
            `tabPOS Invoice` posi
        JOIN 
            `tabPOS Invoice Item` posii ON posii.parent = posi.name
        WHERE 
            posi.name IN {invoice_list_tuple}
        GROUP BY 
            posii.item_code
    """, as_dict=True)

    cancelled_pos_invoices = frappe.db.sql(f"""
        SELECT 
            CONCAT(
                '<div style="display: flex; padding: 2px; border: 1.4px solid black;margin-bottom: -12px;">',
                    '<div style="flex: 2; padding: 2px; border-right: 1px solid black; text-align: left;">', posi.owner, '</div>', 
                    '<div style="flex: 1; padding: 2px;  text-align: right;">', COUNT(posi.name), '</div>',
                '</div>'
            ) AS pos_opening_entry
        FROM 
            `tabPOS Invoice` posi
        WHERE 
            posi.docstatus = 2
            AND 
            posi.posting_date = %(date)s
        GROUP BY 
            posi.owner
    """, {
        "date": filters.get("date")  # Ensure you have 'filters' defined with 'date'
    }, as_dict=True)

    opening_entries = [{
        "pos_opening_entry": _("<b style='font-size:1.3em'>Opening Entries</b>")
    }]

    cash_detail = [{
        "pos_opening_entry": _("<b style='font-size:1.3em'>Amount Detail</b>")
    }]
    cancelled_invoices = [{
        "pos_opening_entry": _("<b style='font-size:1.3em'>Cancelled Invoices</b>")
    }]
    menu_items = [{
        "pos_opening_entry": _("<b style='font-size:1.3em'>Items Detail</b>")
    }]
    items_heading = [{
        "pos_opening_entry": _(
            '<div style="width: 100%;margin-bottom: -12px;">'
            '<div style="display: flex; width: 100%; padding: 2px; border: 1.4px solid black; font-weight: bold;">'
            '<div style="flex: 2; padding: 2px; border-right: 1px solid black; text-align: left;">Item</div>'
            '<div style="flex: 1; padding: 2px;  text-align: right;">Qty</div>'
            '</div>'
            '</div>'
        )
    }]
    cancelled_invoices_heading = [{
        "pos_opening_entry": _(
            '<div style="width: 100%;margin-bottom: -12px;">'
            '<div style="display: flex; width: 100%; padding: 2px; border: 1.4px solid black; font-weight: bold;">'
            '<div style="flex: 2; padding: 2px; border-right: 1px solid black; text-align: left;">User</div>'
            '<div style="flex: 1; padding: 2px; text-align: right;">Count</div>'
            '</div>'
            '</div>'
        )
    }]

    data.extend(opening_entries)
    data.extend(closing)
    data.extend(cash_detail)
    data.extend(mode_of_payment)
    data.extend(menu_items)
    data.extend(items_heading)
    data.extend(pos_invoices)
    if cancelled_pos_invoices:
        data.extend(cancelled_invoices)
        data.extend(cancelled_invoices_heading)
        data.extend(cancelled_pos_invoices)
    return data
