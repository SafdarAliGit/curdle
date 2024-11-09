$(document).ready(function () {
    if ('serial' in navigator) {
        let port;
        let reader;
        let textDecoder;
        let lastUpdate = 0; // Timestamp of the last update
        const throttleDelay = 3000; // Throttle delay in milliseconds

        function reverseString(str) {
            const numericData = str.match(/-?\d+(\.\d+)?/);
            return numericData[0].split('').reverse().join('');
        }

        // Function to connect to the serial port
        async function connectSerial() {
            try {
                port = await navigator.serial.requestPort();
                await port.open({baudRate: 9600});
                // Initialize text decoder
                textDecoder = new TextDecoderStream();
                const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
                reader = textDecoder.readable.getReader();

                // Start reading data
                readSerialData();
            } catch (error) {
                console.error('Error connecting to serial port:', error);
            }
        }

        // Function to read data from the serial port with throttling
        async function readSerialData() {
            while (true) {
                try {
                    const {value, done} = await reader.read();
                    if (done) {
                        reader.releaseLock();
                        break;
                    }

                    // Process the received data
                    let reversedValue = reverseString(value.trim());
                    let floatValue = parseFloat(reversedValue);

                    // Check if floatValue is a valid number
                    if (!isNaN(floatValue)) {
                        const currentTime = Date.now();

                        // Throttle the updates
                        if (currentTime - lastUpdate >= throttleDelay) {
                            lastUpdate = currentTime;
                            const inputField = $('#quantity');

                            if (inputField.length) {
                                inputField.val(floatValue);
                                // Optionally, you can add a delay for focusing the input field if needed
                                // setTimeout(() => {
                                //     // inputField.focus();
                                //     // inputField.select();
                                // }, 500);
                            } else {
                                console.error('Input field with data-fieldname="quantity" not found.');
                            }
                        }
                    } else {
                        console.error('Received data is not a valid number:', reversedValue);
                    }
                } catch (error) {
                    console.error('Error reading serial data:', error);
                    break;
                }
            }
        }

        // Bind click event to the button to start the serial connection
        $(document).on('click', '#quantity', function () {
            connectSerial();
        });
    } else {
        console.error('Web Serial API is not supported in this browser.');
    }
    // WRITER CODE
    if ('serial' in navigator) {
        let w_port;
        let writer;
        let textEncoder;
        let w_reader;
        let w_textDecoder;
        let w_lastUpdate = 0; // Timestamp of the last update
        const w_throttleDelay = 3000; // Throttle delay in milliseconds

        // Function to connect to the serial port
        async function connectSerial() {
            try {
                if (!w_port) {
                    w_port = await navigator.serial.requestPort();
                    await w_port.open({baudRate: 9600});

                    // Initialize text encoder and decoder
                    textEncoder = new TextEncoderStream();
                    w_textDecoder = new TextDecoderStream();

                    textEncoder.readable.pipeTo(w_port.writable);
                    writer = textEncoder.writable.getWriter();

                    w_port.readable.pipeTo(w_textDecoder.writable);
                    w_reader = w_textDecoder.readable.getReader();
                }
            } catch (error) {
                console.error('Error connecting to serial port:', error);
            }
        }

        // Function to write data to the serial port
        async function writeToSerial(data) {
            try {
                // Ensure the port is connected before writing
                if (!w_port || !writer) {
                    await connectSerial(); // Try connecting first
                }
                const prefixedData = `0200${data}`;
                await writer.write(prefixedData);
                console.log(`Data sent to serial port: ${prefixedData}`);
            } catch (error) {
                console.error('Failed to send data to serial port:', error);
            }
        }

        function showAlert(value) {
            // Create a custom alert div
            const alertBox = $('<div>')
                .text(`Machine returned data: ${value}`)
                .css({
                    'position': 'fixed',
                    'top': '20px',
                    'left': '50%',
                    'transform': 'translateX(-50%)',
                    'background-color': '#f8d7da',
                    'color': '#721c24',
                    'padding': '10px 20px',
                    'border': '1px solid #f5c6cb',
                    'border-radius': '5px',
                    'z-index': 9999
                });

            // Append the alert to the body
            $('body').append(alertBox);

            // Hide the alert after 3 seconds (3000 milliseconds)
            setTimeout(function () {
                alertBox.fadeOut(500, function () {
                    $(this).remove();
                });
            }, 3000);
        }

        // Function to read data from the serial port with throttling
        async function readSerialData() {
            while (true) {
                try {
                    const {value, done} = await w_reader.read();
                    if (done) {
                        w_reader.releaseLock();
                        break;
                    }

                    const currentTime = Date.now();

                    // Throttle the updates
                    if (currentTime - w_lastUpdate >= w_throttleDelay) {
                        w_lastUpdate = currentTime;

                        if (value.length) {
                            if (value == 'Cancelled') {
                                alert("Transaction Cancelled !");
                            } else {
                                // const obj = value.split(' ') // split by space
                                //     .filter(Boolean)       // remove any empty elements (if there are multiple spaces)
                                //     .reduce((acc, pair) => {
                                //         const [key, value] = pair.split('='); // split by '=' to separate key and value
                                //         acc[key] = value; // assign key-value pair to the object
                                //         return acc;
                                //     }, {});
                                // $('input[data-fieldname="machine_date"]').val(obj.Date).trigger('change');
                                // $('input[data-fieldname="machine_time"]').val(obj.Time).trigger('change');
                                // $('input[data-fieldname="machine_tid"]').val(obj.TID).trigger('change');
                                // $('input[data-fieldname="machine_mid"]').val(obj.MID).trigger('change');
                                // $('input[data-fieldname="machine_card_no"]').val(obj.CardNo).trigger('change');
                                // $('input[data-fieldname="machine_invoice_no"]').val(value).trigger('change');
                                $('textarea[data-fieldname="machine_returned_data"]').val(value).trigger('change');
                                showAlert(value);
                            }
                        } else {
                            console.error('No data returned by bank machine');
                        }
                    }

                } catch (error) {
                    console.error('Error reading serial data:', error);
                    break;
                }
            }
        }

        // Function to handle sending data from grand_total and mode_of_payment
        function sendDataBasedOnPayment() {
            const grandTotal = $('.frappe-control[data-fieldname="grand_total"] .control-value').text();

            if (grandTotal) {
                writeToSerial(grandTotal);
                readSerialData();
            } else {
                console.error('Grand Total or Mode of Payment is missing.');
            }
        }

        // Bind click event to the mode_of_payment inputs
        $(document).on('change', 'input[name="bank_alfalah"]', function () {
            connectSerial().then(() => {
                sendDataBasedOnPayment();
            });

        });

    } else {
        console.error('Web Serial API is not supported in this browser.');
    }


});

