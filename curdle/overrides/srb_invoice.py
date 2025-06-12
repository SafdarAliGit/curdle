import frappe
import requests
from frappe.utils import now
import json

def custom_before_submit(doc, method):
    tax_rate = frappe.get_value('POS Profile', doc.pos_profile, 'tax_on_cash')
    srb_invoice_id = get_srb_invoice_id(doc, tax_rate)  
    doc.custom_srb_invoice_id = srb_invoice_id   
    

def get_srb_invoice_id(doc, tax_rate):
    url = "http://apps.srb.gos.pk/PoSService/CloudSalesInvoiceService"

    payload = {
        "posId": 1974,
        "name": "CURDLE",
        "ntn": "SF672756",
        "invoiceDateTime": now(),
        "invoiceType": 1,
        "invoiceID": doc.name,
        "rateValue": tax_rate,
        "saleValue": doc.total,
        "taxAmount": doc.total_taxes_and_charges,
        "consumerName": "N/A",
        "consumerNTN": "N/A",
        "address": "N/A",
        "tariffCode": "N/A",
        "extraInf": "N/A",
        "pos_user": "F672756",
        "pos_pass": "W55471W15122L"
    }

    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)

        data = json.loads(response.text)

        res_code = data.get("resCode")
        srb_invoice_id = data.get("srbInvoceId")
        if res_code == "00":
            return srb_invoice_id
        else:
            frappe.throw(f"SRB Error: {res_code or 'Unknown error'}")
    except requests.exceptions.RequestException as err:
        frappe.throw(f"Request error: {str(err)}")
    except Exception as e:
        frappe.throw(f"Unexpected error: {str(e)}")
