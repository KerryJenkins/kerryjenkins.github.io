document.addEventListener("DOMContentLoaded", function() {
    // Check if the browser supports getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector('#interactive'), // Use the div as the target
                constraints: {
                    facingMode: "environment" // Use the rear camera
                },
            },
            decoder: {
                readers: ["code_128_reader", "ean_reader", "upc_reader"] // Specify the barcode types to scan
            }
        }, function(err) {
            if (err) {
                console.error("Error initializing Quagga:", err);
                return;
            }
            console.log("Quagga initialized successfully");
            Quagga.start();
        });

        Quagga.onDetected(function(result) {
            const code = result.codeResult.code;
            document.getElementById("result").innerText = "Barcode: " + code;
            console.log("Barcode detected:", code);
        });
    } else {
        alert("getUserMedia is not supported in this browser.");
    }
});