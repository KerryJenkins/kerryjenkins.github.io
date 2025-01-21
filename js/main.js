const
    el = {},
    usingOffscreenCanvas = isOffscreenCanvasWorking();

document
    .querySelectorAll('[id]')
    .forEach(element => el[element.id] = element)

let
    offCanvas,
    afterPreviousCallFinished,
    requestId = null;

function isOffscreenCanvasWorking() {
    try {
        return Boolean((new OffscreenCanvas(1, 1)).getContext('2d'))

    } catch {
        return false
    }
}


function formatNumber(number, fractionDigits = 1) {
    return number.toLocaleString(
        undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }
    )
}


function detect(source) {
    const
        afterFunctionCalled = performance.now(),
        canvas = el.canvas,
        ctx = canvas.getContext('2d');

    function getOffCtx2d(width, height) {
        if (usingOffscreenCanvas) {
            if (!offCanvas || (offCanvas.width !== width) || (offCanvas.height !== height)) {
                // Only resizing the canvas caused Chromium to become progressively slower
                offCanvas = new OffscreenCanvas(width, height)
            }

            return offCanvas.getContext('2d')
        }
    }

    canvas.width = source.naturalWidth || source.videoWidth || source.width
    canvas.height = source.naturalHeight || source.videoHeight || source.height

    if (canvas.height && canvas.width) {
        const offCtx = getOffCtx2d(canvas.width, canvas.height) || ctx

        offCtx.drawImage(source, 0, 0)

        const
            afterDrawImage = performance.now(),
            imageData = offCtx.getImageData(0, 0, canvas.width, canvas.height),
            afterGetImageData = performance.now();

        return zbarWasm
            .scanImageData(imageData)
            .then(symbols => {
                const afterScanImageData = performance.now()

                symbols.forEach(symbol => {
                    const lastPoint = symbol.points[symbol.points.length - 1]
                    ctx.moveTo(lastPoint.x, lastPoint.y)
                    symbol.points.forEach(point => ctx.lineTo(point.x, point.y))

                    ctx.lineWidth = Math.max(Math.min(canvas.height, canvas.width) / 100, 1)
                    ctx.strokeStyle = '#00e00060'
                    ctx.stroke()
                })

                symbols.forEach(s => s.rawValue = s.decode("UTF-8"))

                var jsonSymbols = JSON.stringify(symbols, null, 2);
                if (jsonSymbols.length > 2) {
                    el.result.innerText = symbols[0].rawValue; //JSON.stringify(symbols, null, 2);
                }

                afterPreviousCallFinished = performance.now()
            })

    } else {
        el.result.innerText = 'Source not ready'

        return Promise.resolve()
    }
}


function detectImg() {
    detectVideo(false)

    if (el.video.srcObject) {
        el.video.srcObject.getTracks().forEach(track => track.stop())
        el.video.srcObject = null
    }

    // FF needs some time to properly update decode()
    setTimeout(() => el.img.decode().then(() => detect(el.img)), 100)
}


function detectVideo(active) {
    if (active) {
        detect(el.video)
            .then(() => requestId = requestAnimationFrame(() => detectVideo(true)))

    } else {
        cancelAnimationFrame(requestId)
        requestId = null
    }
}

el.videoBtn.addEventListener('click', event => {
    if (!requestId) {
        navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'environment' } })
            .then(stream => {
                el.videoBtn.className = 'button-primary'

                el.video.srcObject = stream
                detectVideo(true)
            })
            .catch(error => {
                el.result.innerText = JSON.stringify(error)
                //el.timing.className = ''
            })

    } else {
        detectVideo(false)
    }
})
