import frappe
from frappe.model.document import Document
from yofroyo.yofroyo.doctype.utils import get_doctype_by_field
from frappe.model.naming import make_autoname


class BahadurabadBranch(Document):

    def validate_items(self):
        if self.net_total is None or self.net_total < 1:
            frappe.throw("Net Total cannot be zero or less than 1 for Invoice.")

    # def before_save(self):
    #     self.posting_time = frappe.utils.now_datetime()
    def on_update(self):
        if self.docstatus == 0:
            self.submit()

    def on_submit(self):
        # Ensure the POS Profile exists
        pos_profile = frappe.get_doc("POS Profile", "Bahadurabad Branch")

        # Create a new POS Invoice
        posi = frappe.new_doc("POS Invoice")
        posi.customer = self.customer
        posi.is_pos = 1
        posi.pos_profile = pos_profile.name
        posi.posting_date = self.posting_date
        posi.posting_time = self.posting_time
        posi.set_warehouse = pos_profile.warehouse
        posi.letter_head = pos_profile.letter_head
        posi.ref_no = self.name
        posi.update_stock = 1
        posi.naming_series = self.pos_ivoice_series
        posi.machine_returned_data = self.machine_returned_data

        # Append source items
        for item in self.items:
            it = posi.append("items", {})
            it.item_code = item.item
            it.qty = item.qty
            it.rate = item.rate
            it.amount = item.amount

        # Append payment details
        payment = posi.append("payments", {})
        payment.mode_of_payment = self.mop
        payment.amount = float(self.grand_total)
        if self.mop == 'Cash':
            posi.taxes_and_charges = 'GST on Cash - C'
        elif self.mop == 'Credit Card':
            posi.taxes_and_charges = 'GST on Credit Card - C'

        try:
            posi.submit()
            self.ref_no = posi.name
            self.save()
        except Exception as e:
            frappe.throw(frappe._("Error submitting POS Invoice: {0}".format(str(e))))


    def validate(self):
        # Fetch the POS profile from the current document
        pos_profile = self.pos_profile
        # self.validate_items()

        # Query to check if there is an open POS Opening Entry for the given POS profile
        pos_opening_entry = frappe.get_all(
            'POS Opening Entry',
            filters={
                'pos_profile': pos_profile,
                'status': 'Open'
            },
            fields=['name']
        )
        has_flavour_yogurt = any(item.item == "Flavour Yogurt" for item in self.items)
        if has_flavour_yogurt:
            has_cup = any(item.item == "Cup" for item in self.items)
            if not has_cup:
                frappe.throw(
                    'Cup item is mandatory if Flavour Yogurt is Selected.'
                )

        # Check if an entry is found
        if not pos_opening_entry:
            # Raise an exception if no open POS Opening Entry is found
            frappe.throw(
                'Please create a POS Opening Entry with status "Open" for the given POS Profile before saving or submitting.')
        if float(self.grand_total) < 1:
            frappe.throw(
                'Grand Total cannot be zero or less than 1 for Invoice.'
            )


    def on_cancel(self):
        pi = get_doctype_by_field('POS Invoice', 'ref_no', self.name)
        pi.cancel()
        frappe.db.commit()
        if pi.amended_from:
            new_name = int(pi.name.split("-")[-1]) + 1
        else:
            new_name = f"{pi.name}-{1}"
        make_autoname(new_name, 'POS Invoice')


