import frappe
from erpnext.accounts.utils import get_balance_on
from frappe.utils.pdf import get_pdf
import os
import platform
import subprocess
import tempfile
import sys


@frappe.whitelist()
def get_party_type(**args):
    if not frappe.has_permission("Account"):
        frappe.msgprint("No Permission", raise_exception=1)

    account_details = frappe.db.get_value(
        "Account", args.get('account'), ["account_type"], as_dict=1
    )

    if not account_details:
        return

    if account_details.account_type == "Receivable":
        party_type = "Customer"
    elif account_details.account_type == "Payable":
        party_type = "Supplier"
    else:
        party_type = ""

    grid_values = {
        "party_type": party_type,
    }
    if not party_type:
        grid_values["party"] = ""

    return grid_values


@frappe.whitelist()
def get_account_balance(**args):
    ac_balance = {}
    company = frappe.defaults.get_defaults().company
    cost_center = frappe.get_cached_value(
        "Company", company, ["cost_center"]
    )
    ac_balance['balance'] = get_balance_on(args.get('account'), args.get('posting_date'), cost_center=cost_center)
    if ac_balance:
        return ac_balance
    else:
        ac_balance['balance'] = 0
        return ac_balance


@frappe.whitelist()
def get_account_type(account_name):
    account = frappe.get_doc("Account", account_name)
    if account.is_group == 0:
        return account.account_type
    else:
        return None


# @frappe.whitelist()
# def add_crv(**args):
#     source_name = frappe.get_doc("Cash Receipt Voucher", args.get('source_name'))
#     company = frappe.defaults.get_defaults().company
#     cash_account = source_name.account
#     posting_date = source_name.posting_date
#     voucher_type = "Cash Entry"
#     crv_no = source_name.name
#     total = source_name.total
#     if len(source_name.items) > 0 and source_name.crv_status < 1:
#         je = frappe.new_doc("Journal Entry")
#         je.posting_date = posting_date
#         je.voucher_type = voucher_type
#         je.company = company
#         je.bill_no = crv_no
#         je.append("accounts", {
#             'account': cash_account,
#             'debit_in_account_currency': total,
#             'credit_in_account_currency': 0,
#         })
#         for item in source_name.items:
#             je.append("accounts", {
#                 'account': item.account,
#                 'party_type': item.party_type,
#                 'party': item.party,
#                 'debit_in_account_currency': 0,
#                 'credit_in_account_currency': item.amount,
#             })
#         je.submit()
#     else:
#         if len(source_name.items) < 1:
#             frappe.throw("No detailed rows found")
#         if source_name.crv_status > 0:
#             frappe.throw("Journal entry already created")
def get_doctype_by_field(doctype_name, field_name, field_value):
    query = frappe.get_all(doctype_name, filters={field_name: field_value},
                           fields=["name", "docstatus", "amended_from"])

    if query:
        docname = query[0].name
        doc = frappe.get_doc(doctype_name, docname)
        return doc
    else:
        return None


@frappe.whitelist()
def get_for_invoice(**args):
    try:
        price_list = frappe.get_value('POS Profile', args.get('pos_profile'), 'selling_price_list')
        mode_of_payments = frappe.get_all(
            'POS Payment Method',
            fields=['mode_of_payment', 'default'],
            filters={'parent': args.get('pos_profile')},
            ignore_permissions=True
        )
        items = frappe.get_list('Item', fields=['item_code', 'image'], filters={'item_group': args.get('item_group')})
        if not items:
            raise ValueError(frappe._('No items found for the given item group.'))

        item_codes = [item['item_code'] for item in items]
        if not item_codes:
            return []

        query = """
            SELECT item_code, price_list_rate
            FROM `tabItem Price`
            WHERE item_code IN ({})
            AND price_list = %s
            AND selling = 1
        """.format(','.join(['%s'] * len(item_codes)))

        prices = frappe.db.sql(query, tuple(item_codes) + (price_list,), as_dict=True)
        item_prices = {price['item_code']: price['price_list_rate'] for price in prices}

        merged_items = [
            {
                'item_code': item['item_code'],
                'image': item['image'],
                'rate': item_prices.get(item['item_code'], None)
            }
            for item in items
        ]

        return {
            'items': merged_items,
            'mode_of_payments': mode_of_payments,
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Error in get_for_invoice')
        raise


@frappe.whitelist()
def get_for_bahadurabad_branch(**args):
    try:
        price_list = frappe.get_value('POS Profile', args.get('pos_profile'), 'selling_price_list')
        mode_of_payments = frappe.get_all(
            'POS Payment Method',
            fields=['mode_of_payment', 'default'],
            filters={'parent': args.get('pos_profile')},
            ignore_permissions=True
        )
        items = frappe.get_list('Item', fields=['item_code', 'image'],
                                filters={'item_group': ['in', ['Finish', 'Kitchen']]})
        if not items:
            raise ValueError(frappe._('No items found for the given item group.'))

        item_codes = [item['item_code'] for item in items]
        if not item_codes:
            return []

        query = """
            SELECT item_code, price_list_rate
            FROM `tabItem Price`
            WHERE item_code IN ({})
            AND price_list = %s
            AND selling = 1
        """.format(','.join(['%s'] * len(item_codes)))

        prices = frappe.db.sql(query, tuple(item_codes) + (price_list,), as_dict=True)
        item_prices = {price['item_code']: price['price_list_rate'] for price in prices}

        merged_items = [
            {
                'item_code': item['item_code'],
                'image': item['image'],
                'rate': item_prices.get(item['item_code'], None)
            }
            for item in items
        ]

        return {
            'items': merged_items,
            'mode_of_payments': mode_of_payments,
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Error in get_for_invoice')
        raise


@frappe.whitelist()
def get_for_shahbaz_branch_dha(**args):
    try:
        price_list = frappe.get_value('POS Profile', args.get('pos_profile'), 'selling_price_list')
        mode_of_payments = frappe.get_all(
            'POS Payment Method',
            fields=['mode_of_payment', 'default'],
            filters={'parent': args.get('pos_profile')},
            ignore_permissions=True
        )
        items = frappe.get_list('Item', fields=['item_code', 'image'], filters={'item_group': args.get('item_group')})
        if not items:
            raise ValueError(frappe._('No items found for the given item group.'))

        item_codes = [item['item_code'] for item in items]
        if not item_codes:
            return []

        query = """
            SELECT item_code, price_list_rate
            FROM `tabItem Price`
            WHERE item_code IN ({})
            AND price_list = %s
            AND selling = 1
        """.format(','.join(['%s'] * len(item_codes)))

        prices = frappe.db.sql(query, tuple(item_codes) + (price_list,), as_dict=True)
        item_prices = {price['item_code']: price['price_list_rate'] for price in prices}

        merged_items = [
            {
                'item_code': item['item_code'],
                'image': item['image'],
                'rate': item_prices.get(item['item_code'], None)
            }
            for item in items
        ]

        return {
            'items': merged_items,
            'mode_of_payments': mode_of_payments,
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Error in get_for_invoice')
        raise


@frappe.whitelist()
def get_tax_rate(**args):
    tax_rate = 0
    mode_of_payment = args.get('mode_of_payment')
    try:
        if mode_of_payment == 'Cash':
            tax_rate = frappe.get_value('POS Profile', args.get('pos_profile'), 'tax_on_cash')
        elif mode_of_payment == 'Credit Card':
            tax_rate = frappe.get_value('POS Profile', args.get('pos_profile'), 'tax_on_credit_card')

        return {
            'tax_rate': tax_rate,
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Error in getting Tax Rate')
        raise


@frappe.whitelist()
def get_payments_of_closing_invoices(**args):
    try:
        # Get invoice IDs from args
        invoice_ids = args.get('invoice_ids')  # This should be the list from AJAX

        # Ensure invoice_ids is a list
        if isinstance(invoice_ids, str):
            # If it's a JSON string, convert it to a Python list
            import json
            invoice_ids = json.loads(invoice_ids)

        # Convert the list to a tuple
        invoice_list_tuple = tuple(invoice_ids)

        # Validate input
        if not invoice_ids:
            return {
                'error': 'No invoice IDs provided.'
            }

        # If no invoices, return early
        if not invoice_list_tuple:
            return {
                'payments': []
            }

        # Prepare the SQL query with placeholders
        query = """
        SELECT
            "mp" AS mode_of_payment,
            SUM(sip.amount) AS amount
        FROM
            `tabSales Invoice Payment` sip
        WHERE
            sip.parent IN %s
        """

        # Execute the query safely using the placeholder
        payments = frappe.db.sql(query, (invoice_list_tuple,), as_dict=True)

        return {
            'payments': payments
        }

    except Exception as e:
        # Log the error with the stack trace
        frappe.log_error(frappe.get_traceback(), 'Error in get_payments_of_closing_invoices')
        return {
            'error': str(e)  # Return the error message in the response
        }

