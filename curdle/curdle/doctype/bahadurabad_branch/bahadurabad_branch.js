const TaxRate = {
    tax_rate: 0
};
frappe.ui.form.on('Bahadurabad Branch', {
    refresh(frm) {
     $('input[name="mode_of_payment"]').prop('checked', false);
     $('input[name="bank_alfalah"]').prop('checked', false);

        if (frm.doc.docstatus == 1) {
            // // Add a custom button to the form's toolbar
            // frm.add_custom_button(__('New Invoice'), function () {
            //     // Create a new document of type 'Invoice'
            //     frappe.new_doc('Invoice');
            // }).addClass('btn btn-primary'); // Add Bootstrap classes for styling

            // Open a specific print format
            const print_format = 'POS Invoice Bahadurabad';
            const doctype = "POS Invoice";
            const name = frm.doc.ref_no;

            // Generate the print URL
            const print_url = frappe.urllib.get_full_url(`/api/method/frappe.utils.print_format.download_pdf?doctype=${doctype}&name=${name}&format=${print_format}&no_letterhead=0`);

            // Send the print command directly
            const printWindow = window.open(print_url, '_blank');
            printWindow.print();
            frappe.new_doc('Bahadurabad Branch');
        }
        var pos_profile = 'Bahadurabad Branch';
        // display pos profile name
        var pos_profile_html = `<h2 class="ellipsis" style="color: #0f6674;margin-top: 15px;">(${pos_profile})</h2>`;

        if ($('.flex.fill-width.title-area h2.ellipsis').length === 0) {
            $('.flex.fill-width.title-area').append(pos_profile_html);
        }

        frm.set_value('pos_profile', pos_profile);
        // Ensure DOM is fully loaded before executing
        $(document).ready(function () {

            // Check if content is already added
            if ($('.items-list').length === 0) {
                // Fetch the item list from the Item Doctype
                frappe.call({
                    method: 'curdle.curdle.doctype.utils.get_for_bahadurabad_branch', args: {
                        item_group: 'Finish', pos_profile: pos_profile
                    }, callback: function (response) {
                        const items = response.message.items;
                        const mode_of_payments = response.message.mode_of_payments;
                        let radioButtonsHtml = ``;
                        mode_of_payments.forEach(function (payment) {
                            const isChecked = payment.default ? 'checked' : '';
                            radioButtonsHtml += `
                        <label style="display: inline-block; margin-right: 16px; margin-bottom: 4px; vertical-align: middle;">
                            <input type="radio" name="mode_of_payment" value="${payment.mode_of_payment}" style="margin-right: 8px;transform: scale(2);">
                            ${payment.mode_of_payment}
                        </label>`;
                        });
                        if (response.message && response.message.items) {
                            var quantity = `<input type="input" value="" name="qty" id="qty"  style="width: 40%;border-radius: 5px;border: solid 2px red;margin-top: 20px;font-size: 2em;padding: 4px;color:green;" placeholder="Qty" readonly><input type="input" value="" name="quantity" id="quantity"  style="width: 60%;border-radius: 5px;border: solid 2px #2490ef;margin-top: 20px;font-size: 2em;padding: 4px;" readonly>`
                            var itemsList = `<ul style="list-style: none;padding: 0 !important;">`;
                            items.forEach(function (item) {
                                itemsList += `<li style="border: solid 1.5px #2490ef;  padding: 5px; margin-bottom:4px;width: 100%;" item_code="${item.item_code}" rate="${item.rate}">
                                   <span style="font-weight: bold;font-size: 1.1em;">${item.item_code}</span>
                                </li>`;
                            });
                            var num_form = `
                                    <label>
                                    <input style="transform: scale(2);" type="radio" id="bank_alfalah" name="bank_alfalah" value="Bank Alfalah">
                                    Bank Alfalah
                                    </label><br>
                            <form id="num_form" style="display: grid; grid-template-columns: repeat(5, 70px); grid-gap: 3px; justify-content: center;">
                                <input type="button" value="1" name="one" id="one" style="width: 70px; height: 55px; font-size: 2.5em;">
                                <input type="button" value="2" name="two" id="two" style="width: 70px; height: 55px; font-size: 2.5em;">
                                <input type="button" value="3" name="three" id="three" style="width: 70px; height: 55px; font-size: 2.5em;">
                                <input type="button" value="4" name="four" id="four" style="width: 70px; height: 55px; font-size: 2.5em;">
                                <input type="button" value="5" name="five" id="five" style="width: 70px; height: 55px; font-size: 2.5em;">
                                <input type="button" value="6" name="six" id="six" style="width: 70px; height: 55px; font-size: 2.5em;">
                                <input type="button" value="7" name="seven" id="seven" style="width: 70px; height: 55px; font-size: 2.5em;">
                                <input type="button" value="8" name="eight" id="eight" style="width: 70px; height: 55px; font-size: 2.5em;">
                                <input type="button" value="9" name="nine" id="nine" style="width: 70px; height: 55px; font-size: 2.5em;">
                                <input type="button" value="0" name="zero" id="zero" style="width: 70px; height: 55px; font-size: 2.5em;">
                                <input type="button" value="00" name="00" id="doublezero" style="width: 70px; height: 55px; font-size: 2.5em;">
                                <input type="button" value="10" name="ten" id="ten" style="width: 70px; height: 55px; font-size: 2.5em;">
                                <input type="button" value="20" name="twenty" id="twenty" style="width: 70px; height: 55px; font-size: 2.5em;">
                                <input type="button" value="50" name="fifty" id="fifty" style="width: 70px; height: 55px; font-size: 2.5em;">
                                <input type="button" value="100" name="hundred" id="hundred" style="width: 70px; height: 55px; font-size: 2.5em;">
                                <input type="button" value="500" name="fivehundred" id="fivehundred" style="width: 70px; height: 55px; font-size: 2.3em;">
                                <input type="button" value="1000" name="thousand" id="thousand" style="width: 70px; height: 55px; font-size: 1.8em;">
                                <input type="button" value="5000" name="fivethousand" id="fivethousand" style="width: 70px; height: 55px; font-size: 1.8em;">
                                <input type="button" value="del" name="del" id="del" style="width: 70px; height: 55px; font-size: 2.5em;">
                                <input type="button" value="All" name="all" id="all" style="width: 70px; height: 55px; font-size: 2.5em;">
                                </form>
                                    `;

                            // Insert the items list and number form
                            $('.section-body .col-sm-6').eq(1).find('form').append(`
                                        <div style="
                                            display: grid; 
                                            grid-template-columns: 1fr 2fr; 
                                            grid-gap: 8px; 
                                            width: 100%; 
                                            box-sizing: border-box;
                                        ">
                                            <div style="grid-column: 1 / 2; padding: 8px;">${quantity}</div>
                                            <div style="grid-column: 2 / 3; padding: 8px; text-align: right;">
                                                <div style="margin-top: 20px; font-size: 1.2em; font-weight: bold; border: solid 2px #2490ef; border-radius: 8px; padding: 8px;">
                                                    ${radioButtonsHtml}
                                                </div>
                                            </div>
                                        <div style="grid-column: 1; padding: 8px; overflow-y: auto; box-sizing: border-box; width: 100%; max-height: 280px;" class="items-list">
                                            ${itemsList}
                                        </div>
                                            <div style="grid-column: 2 / 3; padding: 8px; box-sizing: border-box;" class="num-form">
                                                ${num_form}
                                            </div>
                                        </div>
                                    `);


                            // Initialize event handlers
                            initEventHandlers(frm);
                        } else {
                            $('.section-body .col-sm-6').eq(1).find('form').append('<p>No items found.</p>');
                        }
                    }
                });
            } else {
                // If content already exists, reinitialize event handlers
                initEventHandlers(frm);
            }


        });
    }, paid_amount: function (frm) {
        calucateTotal(frm);
    }
});

// Function to initialize event handlers
function initEventHandlers(frm) {
    $(document).off('click', '.items-list li').on('click', '.items-list li', function () {
        var itemCode = $(this).attr('item_code');
        var itemRate = $(this).attr('rate') || 0;
        addItemToChildTable(frm, itemCode, itemRate);
        calucateTotal(frm);
        get_tax_rate(frm, frm.doc.mop, 'Bahadurabad Branch')
    });
    // Add event listener for keypad
    // Variable to keep track of the last focused field
    var lastFocusedField = 'paid_amount';

// Event listener to update the lastFocusedField variable when fields are focused
    $(document).on('focus', '#qty, [data-fieldname="paid_amount"]', function () {
        lastFocusedField = $(this).attr('id');
        // Remove the background color from all other elements
        $('#qty, [data-fieldname="paid_amount"]').css('background-color', '');
        // Apply the background color to the focused element
        $(this).css({
            'background-color': '#c9f1e1'
        });
    });

    $(document).on('blur', '#qty, [data-fieldname="paid_amount"]', function () {
        // Reset the background color when the element loses focus
        $(this).css('background-color', '');
    });


// Event listener for number button clicks
    $(document).off('click', '#num_form input[type="button"]:not([name="del"])').on('click', '#num_form input[type="button"]:not([name="del"])', function () {
        var value = $(this).val();

        if (lastFocusedField === 'qty') {
            var current_qty = parseFloat($("#qty").val() || 0);
            $("#qty").val(current_qty + value);
        } else {
            var current_paid_amount = flt(frm.doc.paid_amount || '');
            if (value == 'All') {
                frm.set_value('paid_amount', frm.doc.grand_total);
            } else {
                if (value >= 10) {
                    frm.set_value('paid_amount', parseFloat(current_paid_amount) + parseFloat(value));
                } else {
                    frm.set_value('paid_amount', current_paid_amount + value);
                }

            }

        }

        calucateTotal(frm); // Ensure this function handles the recalculation

    });


    // Event listener for the delete button click
    $(document).off('click', '#num_form input[name="del"]').on('click', '#num_form input[name="del"]', function () {
        if (lastFocusedField === 'qty') {
            var current_qty = String($("#qty").val() || '');
            $("#qty").val(current_qty.slice(0, -1));
        } else {
            var current_paid_amount = String(frm.doc.paid_amount || '');
            frm.set_value('paid_amount', current_paid_amount.slice(0, -1));
        }

        calucateTotal(frm); // Ensure this function handles the recalculation
    });

    $(document).off('click', '.grid-remove-rows"]').on('click', '.grid-remove-rows', function () {
        calucateTotal(frm);
    });
    $(document).off('change', 'input[name="mode_of_payment"]').on('change', 'input[name="mode_of_payment"]', function () {
        var mop = $('input[name="mode_of_payment"]:checked').val();
        frm.set_value('mop', mop);

        get_tax_rate(frm, mop, 'Bahadurabad Branch');

    });
}


function get_tax_rate(frm, mode_of_payment, pos_profile) {
    frappe.call({
        method: 'curdle.curdle.doctype.utils.get_tax_rate', args: {
            mode_of_payment: mode_of_payment, pos_profile: pos_profile
        }, callback: function (response) {
            var net_total = flt(frm.doc.net_total);
            TaxRate.tax_rate = response.message.tax_rate;
            var tax = flt(TaxRate.tax_rate / 100) * flt(net_total);

            if (mode_of_payment == 'Credit Card') {
                frm.set_value('tax', tax);
                frm.set_value('grand_total', tax + net_total);
                frm.set_value('paid_amount', tax + net_total);
                frm.set_value("to_be_paid", 0);
            } else if (mode_of_payment == 'Cash') {
                frm.set_value('tax', tax);
                frm.set_value('grand_total', tax + net_total);
                frm.set_value('paid_amount', 0);
                frm.set_value("to_be_paid", flt(frm.doc.grand_total));
            }


        }
    });
}

// Function to add item to the child table
function addItemToChildTable(frm, itemCode, itemRate) {
    var child_table_field = 'items'; // Replace with your actual field name

    // Ensure the child table field exists and is accessible
    if (frm.fields_dict[child_table_field]) {
        // Check if the child table field is initialized in the form's document
        if (!frm.doc[child_table_field]) {
            frm.doc[child_table_field] = [];
        }

        // Find the existing item in the child table
        var existingItem = frm.doc[child_table_field].find(row => row.item === itemCode);
        var qty = isFlavourYogurt(itemCode) ? ($('#qty').val() || 1) : ($('#quantity').val() || 1);
        if (existingItem) {
            // Item already exists, increment the quantity by 1
            existingItem.qty = (parseInt(qty) || 0);
            existingItem.amount = (existingItem.rate || 0) * existingItem.qty; // Recalculate the amount
            frm.refresh_field(child_table_field); // Refresh the child table to show the updated row
        } else {
            // Add a new row to the child table

            var new_row = frm.add_child(child_table_field, {
                item: itemCode, qty: qty, rate: itemRate, amount: (itemRate || 0) * qty
            });

            frm.refresh_field(child_table_field); // Refresh the child table to show the new row
            $("#qty").val('');
        }
    } else {
        frappe.msgprint(__('Child table field is not defined.'));
    }
    $('.static-area.ellipsis').css({
        'font-size': '1.2em', 'color': 'black', 'font-weight': 'bold'
    });
}

function isFlavourYogurt(itemCode) {
    if (itemCode != 'Flavour Yogurt') {
        return true;
    } else {
        return false;
    }
}

function calucateTotal(frm) {
    var net_total = 0;
    $.each(frm.doc.items || [], function (i, d) {
        net_total += flt(d.amount) || 0;
    });
    frm.set_value("net_total", flt(net_total));
    //to be paid calculation
    var paid_amount = flt(frm.doc.paid_amount) || 0;
    var grand_total = flt(frm.doc.grand_total) || 0;
    var to_be_paid = paid_amount - grand_total;
    // if (to_be_paid < 0) {
    //     to_be_paid = 0;
    // }
    frm.set_value("to_be_paid", to_be_paid);
    frm.set_value('mop', $('input[name="mode_of_payment"]:checked').val());
}

// Initialize custom styles
$(document).ready(function () {
    $('.form-control').css({
        'border': 'solid 2px #2490ef', 'font-size': '2em'
    });
    $('.control-value.like-disabled-input').css({
        'border': 'solid 2px #2490ef', 'font-size': '2em'
    });
    $('.row.form-section.card-section.visible-section').css({
        'background-color': '#8beec6', 'border-radius': '8px'
    });
    $('#page-Bahadurabad\\ Branch').css({
        'background-color': '#c9f1e1'
    });
    $('.page-head.flex').css({
        'background-color': '#c9f1e1'
    });
    $('.navbar.navbar-expand.sticky-top').css({
        'background-color': '#64a8ec', 'color': '#ffffff'
    });
    $('.page-head.flex.drop-shadow').css({
        'background-color': '#4becab'
    });
    $('.form-grid').css({
        'background-color': '#64a8ec'
    });
    $('.data-row.row').css({
        'background-color': '#64a8ec'
    });
    $('.no-breadcrumbs').css({
        'background-color': '#c9f1e1'
    });
    $('.btn-primary').css({
        'font-weight': 'bold'
    });
    $('.static-area.ellipsis').css({
        'font-size': '1.2em', 'color': 'black', 'font-weight': 'bold'
    });
    $('.control-label').css({
        'font-size': '1.2em',
    });

    $('[data-fieldname="pos_profile"]').css({'visibility': 'hidden'});
    $('input[data-fieldname="paid_amount"]').css({
        'color': 'green', 'border': 'solid 2px red',
    });

});
