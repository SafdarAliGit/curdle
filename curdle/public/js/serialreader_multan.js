$(document).ready(function () {
    if ('serial' in navigator) {
        let port;
        let reader;
        let textDecoder;
        let lastUpdate = 0;
        const throttleDelay = 3000;

        function reverseString(str) {
            const numericData = str.match(/(\d+\.\d+)/);
            if (!numericData) {
                throw new Error("No valid numeric data with a decimal point found in the string.");
            }
            return parseFloat(numericData[0]) * 1000;
        }

        // Reuses an already-open connection instead of re-requesting/re-opening
        // the port on every click, which used to throw on an already-open port
        // and leave the stream stuck until a hard page refresh.
        async function connectSerial() {
            if (port && reader) {
                return;
            }
            try {
                if (!port) {
                    const grantedPorts = await navigator.serial.getPorts();
                    port = grantedPorts.length ? grantedPorts[0] : await navigator.serial.requestPort();
                }
                if (!port.readable) {
                    await port.open({baudRate: 9600});
                }
                textDecoder = new TextDecoderStream();
                port.readable.pipeTo(textDecoder.writable).catch(() => {});
                reader = textDecoder.readable.getReader();
                readSerialData();
            } catch (error) {
                console.error('Error connecting to serial port:', error);
                port = null;
                reader = null;
            }
        }

        // Forget a stale port on physical disconnect so the next click can reconnect cleanly.
        navigator.serial.addEventListener('disconnect', (event) => {
            if (event.target === port) {
                port = null;
                reader = null;
            }
        });

        async function readSerialData() {
            while (true) {
                try {
                    const {value, done} = await reader.read();
                    if (done) {
                        reader.releaseLock();
                        port = null;
                        reader = null;
                        break;
                    }

                    // A single garbled/partial chunk must not kill the loop,
                    // otherwise every weighed object after it needs a refresh.
                    try {
                        const floatValue = reverseString(value);
                        if (!isNaN(floatValue)) {
                            const currentTime = Date.now();
                            if (currentTime - lastUpdate >= throttleDelay) {
                                lastUpdate = currentTime;
                                const inputField = $('#quantity');
                                if (inputField.length) {
                                    inputField.val(floatValue);
                                } else {
                                    console.error('Input field with data-fieldname="quantity" not found.');
                                }
                            }
                        } else {
                            console.error('Received data is not a valid number:', floatValue);
                        }
                    } catch (parseError) {
                        console.warn('Skipping unparsable serial chunk:', value, parseError.message);
                    }
                } catch (error) {
                    // Genuine read/hardware error - reset connection state so the next click can reconnect.
                    console.error('Error reading serial data:', error);
                    try {
                        reader.releaseLock();
                    } catch (releaseError) {
                        // reader may already be closed
                    }
                    port = null;
                    reader = null;
                    break;
                }
            }
        }

        $(document).on('click', '#quantity', function () {
            connectSerial();
        });
    } else {
        console.error('Web Serial API is not supported in this browser.');
    }

    // Bank machine writer
    if ('serial' in navigator) {
        let w_port;
        let writer;
        let textEncoder;
        let w_reader;
        let w_textDecoder;
        let w_lastUpdate = 0;
        const w_throttleDelay = 3000;

        async function connectSerial() {
            try {
                if (!w_port) {
                    w_port = await navigator.serial.requestPort();
                    await w_port.open({baudRate: 9600});

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

        async function writeToSerial(data) {
            try {
                if (!w_port || !writer) {
                    await connectSerial();
                }
                const prefixedData = `0200${data}`;
                await writer.write(prefixedData);
                console.log(`Data sent to serial port: ${prefixedData}`);
            } catch (error) {
                console.error('Failed to send data to serial port:', error);
            }
        }

        function showAlert(value) {
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

            $('body').append(alertBox);

            setTimeout(function () {
                alertBox.fadeOut(500, function () {
                    $(this).remove();
                });
            }, 3000);
        }

        async function readSerialData() {
            while (true) {
                try {
                    const {value, done} = await w_reader.read();
                    if (done) {
                        w_reader.releaseLock();
                        break;
                    }

                    const currentTime = Date.now();
                    if (currentTime - w_lastUpdate >= w_throttleDelay) {
                        w_lastUpdate = currentTime;

                        if (value.length) {
                            if (value == 'Cancelled') {
                                alert("Transaction Cancelled !");
                            } else {
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

        function sendDataBasedOnPayment() {
            const grandTotal = $('.frappe-control[data-fieldname="grand_total"] .control-value').text();
            if (grandTotal) {
                writeToSerial(grandTotal);
                readSerialData();
            } else {
                console.error('Grand Total or Mode of Payment is missing.');
            }
        }

        $(document).on('change', 'input[name="bank_alfalah"]', function () {
            connectSerial().then(() => {
                sendDataBasedOnPayment();
            });
        });
    } else {
        console.error('Web Serial API is not supported in this browser.');
    }
});
