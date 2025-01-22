//WebAssembly polyfill for some browsers
try { window['BarcodeDetector'].getSupportedFormats() }
catch { window['BarcodeDetector'] = barcodeDetectorPolyfill.BarcodeDetectorPolyfill }

// Define video as the video element. You can pass the element to the barcode detector.
const video = document.querySelector('video');

// Get a stream for the rear camera, else the front (or side?) camera.
video.srcObject = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });

// Create a BarcodeDetector for simple retail operations.
const barcodeDetector = new BarcodeDetector({ formats: "ean_13", "ean_8", "upc_a", "upc_e"] });

// Let's scan barcodes forever
while(true) {
    try {
        // Try to detect barcodes in the current video frame.
        let barcodes = await barcodeDetector.detect(video);

        // Continue loop if no barcode was found.
        if (barcodes.length == 0)
        {
            // Scan interval 50 ms like in other barcode scanner demos.
            // The higher the interval the longer the battery lasts.
            await new Promise(r => setTimeout(r, 50));
            continue;
        }

        // We expect a single barcode.
        // It's possible to compare X/Y coordinates to get the center-most one.
        // One can also do "preferred symbology" logic here.
        document.getElementById("barcode").innerText = barcodes[0].rawValue;

        // Notify user that a barcode has been found.
        navigator.vibrate(200);

        // Give the user time to find another product to scan
        await new Promise(r => setTimeout(r, 1000));
    }
    catch {
        //Wait till video is ready
        //barcodeDetector.detect(video) might fail the first time
        await new Promise(r => setTimeout(r, 200));
    }
}