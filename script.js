const billInput = document.querySelector('#billAmount');
const tipInput = document.querySelector('#tipPercentage');
const tipButtons = document.querySelectorAll('[data-tip]');
const resetButton = document.querySelector('#resetButton');
const recommendationButton = document.querySelector('#recommendation');
const receiptInput = document.querySelector('#receiptInput');
const scanStatus = document.querySelector('#scanStatus');
const scanMessage = document.querySelector('#scanMessage');
const scanProgress = document.querySelector('#scanProgress');
const scanResult = document.querySelector('#scanResult');
const detectedTotalInput = document.querySelector('#detectedTotal');
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

let billCents = 0;
let recommendedPercentage = 18;
let tipOverridden = false;

function setActiveTip(value) {
    tipButtons.forEach((button) => button.classList.toggle('active', Number(button.dataset.tip) === Number(value)));
}

function findBestWholeDollarTip(bill) {
    const choices = [];
    for (let percentage = 14; percentage <= 20; percentage += 1) {
        const rawTotal = bill * (1 + percentage / 100);
        choices.push({
            percentage,
            roundedTotal: Math.round(rawTotal),
            adjustment: Math.abs(Math.round(rawTotal) - rawTotal)
        });
    }
    choices.sort((a, b) => a.adjustment - b.adjustment || Math.abs(a.percentage - 18) - Math.abs(b.percentage - 18));
    return choices[0];
}

function updateRecommendation(bill) {
    const label = recommendationButton.querySelector('strong');
    if (bill <= 0) {
        recommendationButton.disabled = true;
        label.textContent = 'Enter a bill to see';
        return;
    }
    const best = findBestWholeDollarTip(bill);
    recommendedPercentage = best.percentage;
    if (!tipOverridden) {
        tipInput.value = best.percentage;
        setActiveTip(best.percentage);
    }
    recommendationButton.disabled = false;
    label.textContent = `${best.percentage}% → ${currency.format(best.roundedTotal)}${tipOverridden ? '' : ' · Default'}`;
    recommendationButton.setAttribute('aria-label', `Use recommended ${best.percentage} percent tip for a ${currency.format(best.roundedTotal)} total`);
}

function calculateTip() {
    const bill = billCents / 100;
    updateRecommendation(bill);
    const percentage = Number.parseFloat(tipInput.value);
    const safePercentage = Number.isFinite(percentage) && percentage >= 0 ? percentage : 0;

    if (bill <= 0) {
        document.querySelector('#tipAmount').textContent = '$0.00';
        document.querySelector('#totalAmount').textContent = '$0.00';
        document.querySelector('#effectiveTip').textContent = '0.00%';
        document.querySelector('#roundingNote').textContent = 'Enter a bill to see the rounded total.';
        return;
    }

    const rawTotal = bill * (1 + safePercentage / 100);
    const roundedTotal = Math.round(rawTotal);
    const tip = roundedTotal - bill;
    const effectivePercentage = tip / bill * 100;
    document.querySelector('#tipAmount').textContent = currency.format(tip);
    document.querySelector('#totalAmount').textContent = currency.format(roundedTotal);
    document.querySelector('#effectiveTip').textContent = `${effectivePercentage.toFixed(2)}%`;
    document.querySelector('#roundingNote').textContent = `${safePercentage}% selected; ${currency.format(rawTotal)} rounds to ${currency.format(roundedTotal)}.`;
}

function handleBillInput() {
    const digits = billInput.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    if (!digits) {
        billCents = 0;
        billInput.value = '';
    } else {
        billCents = Number.parseInt(digits, 10);
        billInput.value = (billCents / 100).toFixed(2);
    }
    billInput.setSelectionRange(billInput.value.length, billInput.value.length);
    calculateTip();
}

function loadReceiptScanner() {
    if (window.Tesseract) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@6/dist/tesseract.min.js';
        script.crossOrigin = 'anonymous';
        script.onload = resolve;
        script.onerror = () => reject(new Error('The receipt scanner could not be downloaded.'));
        document.head.appendChild(script);
    });
}

async function prepareReceiptImage(file) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1800 / bitmap.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < image.data.length; index += 4) {
        const gray = image.data[index] * .299 + image.data[index + 1] * .587 + image.data[index + 2] * .114;
        const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.35 + 128));
        image.data[index] = contrasted;
        image.data[index + 1] = contrasted;
        image.data[index + 2] = contrasted;
    }
    context.putImageData(image, 0, 0);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', .9));
}

function extractReceiptTotal(text) {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const candidates = [];
    lines.forEach((line, lineIndex) => {
        const upper = line.toUpperCase();
        const amounts = [...line.matchAll(/(?:\$|USD\s*)?(\d{1,4}(?:,\d{3})*\.\d{2})\b/g)];
        amounts.forEach((match, amountIndex) => {
            const amount = Number.parseFloat(match[1].replace(/,/g, ''));
            if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) return;
            let score = lineIndex / Math.max(lines.length, 1);
            if (/GRAND\s*TOTAL|AMOUNT\s*DUE|TOTAL\s*DUE|BALANCE\s*DUE/.test(upper)) score += 12;
            else if (/\bTOTAL\b/.test(upper)) score += 8;
            if (/SUB\s*TOTAL|SUBTOTAL|TAX|TIP|GRATUITY|CHANGE|CASH|TENDER|SAVINGS/.test(upper)) score -= 10;
            score += amountIndex * .1;
            candidates.push({ amount, score });
        });
    });
    candidates.sort((a, b) => b.score - a.score || b.amount - a.amount);
    return candidates[0]?.amount ?? null;
}

async function scanReceipt(file) {
    scanResult.hidden = true;
    scanStatus.hidden = false;
    scanProgress.style.width = '3%';
    scanMessage.textContent = 'Loading the private on-device scanner…';
    let worker;
    try {
        await loadReceiptScanner();
        const preparedImage = await prepareReceiptImage(file);
        worker = await window.Tesseract.createWorker('eng', 1, {
            logger: ({ status, progress }) => {
                if (Number.isFinite(progress)) scanProgress.style.width = `${Math.max(5, Math.round(progress * 100))}%`;
                scanMessage.textContent = status === 'recognizing text' ? 'Reading receipt text…' : 'Preparing receipt scanner…';
            }
        });
        const result = await worker.recognize(preparedImage);
        const detectedTotal = extractReceiptTotal(result.data.text);
        if (detectedTotal === null) throw new Error('I could not confidently find a total. Try a flatter, brighter photo.');
        detectedTotalInput.value = detectedTotal.toFixed(2);
        scanStatus.hidden = true;
        scanResult.hidden = false;
        detectedTotalInput.focus();
        detectedTotalInput.select();
    } catch (error) {
        scanProgress.style.width = '0';
        scanMessage.textContent = error.message || 'The receipt could not be read. Please enter the amount manually.';
    } finally {
        if (worker) await worker.terminate();
        receiptInput.value = '';
    }
}

tipButtons.forEach((button) => button.addEventListener('click', () => {
    tipOverridden = true;
    tipInput.value = button.dataset.tip;
    setActiveTip(button.dataset.tip);
    calculateTip();
}));

tipInput.addEventListener('input', () => { tipOverridden = true; setActiveTip(tipInput.value); calculateTip(); });
billInput.addEventListener('input', handleBillInput);
receiptInput.addEventListener('change', () => {
    const file = receiptInput.files?.[0];
    if (file) scanReceipt(file);
});
document.querySelector('#cancelScan').addEventListener('click', () => { scanResult.hidden = true; billInput.focus(); });
document.querySelector('#useDetectedTotal').addEventListener('click', () => {
    const detected = Number.parseFloat(detectedTotalInput.value);
    if (!Number.isFinite(detected) || detected <= 0) {
        detectedTotalInput.focus();
        return;
    }
    billCents = Math.round(detected * 100);
    billInput.value = (billCents / 100).toFixed(2);
    tipOverridden = false;
    scanResult.hidden = true;
    calculateTip();
});
recommendationButton.addEventListener('click', () => {
    tipOverridden = false;
    tipInput.value = recommendedPercentage;
    setActiveTip(recommendedPercentage);
    calculateTip();
});
resetButton.addEventListener('click', () => {
    billCents = 0;
    tipOverridden = false;
    billInput.value = '';
    scanStatus.hidden = true;
    scanResult.hidden = true;
    tipInput.value = '18';
    setActiveTip(18);
    calculateTip();
    billInput.focus();
});

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
calculateTip();
