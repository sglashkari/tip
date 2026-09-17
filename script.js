const billInput = document.querySelector('#billAmount');
const resetButton = document.querySelector('#resetButton');
const recommendationButton = document.querySelector('#recommendation');
const optionWheel = document.querySelector('#optionWheel');
const receiptInput = document.querySelector('#receiptInput');
const scanStatus = document.querySelector('#scanStatus');
const scanMessage = document.querySelector('#scanMessage');
const scanProgress = document.querySelector('#scanProgress');
const scanResult = document.querySelector('#scanResult');
const detectedTotalInput = document.querySelector('#detectedTotal');
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

let billCents = 0;
let wholeDollarOptions = [];
let bestOptionIndex = 0;
let selectedOptionIndex = 0;

function makeWholeDollarOptions(bill) {
    if (bill <= 0) return [];
    const minimumTotal = Math.ceil(bill * 1.05 - .000001);
    const maximumTotal = Math.floor(bill * 1.25 + .000001);
    const options = [];
    for (let total = minimumTotal; total <= maximumTotal; total += 1) {
        const tip = total - bill;
        options.push({ total, tip, effectivePercentage: tip / bill * 100 });
    }
    return options;
}

function describeOption(option) {
    return `${currency.format(option.total)} total · ${currency.format(option.tip)} tip · ${option.effectivePercentage.toFixed(2)}%`;
}

function renderOptionWheel() {
    optionWheel.replaceChildren();
    wholeDollarOptions.forEach((option, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'fit-option';
        button.dataset.index = index;
        button.setAttribute('role', 'option');
        button.setAttribute('aria-label', describeOption(option));
        button.innerHTML = `<span class="option-total">${currency.format(option.total)}${index === bestOptionIndex ? '<span class="option-best">Best fit</span>' : ''}</span><span class="option-tip">Tip ${currency.format(option.tip)}</span><span class="option-rate">${option.effectivePercentage.toFixed(2)}%</span>`;
        button.addEventListener('click', () => selectOption(index));
        optionWheel.appendChild(button);
    });
    requestAnimationFrame(() => centerSelectedOption('auto'));
}

function centerSelectedOption(behavior = 'smooth') {
    const item = optionWheel.querySelector(`[data-index="${selectedOptionIndex}"]`);
    if (!item) return;
    const top = item.offsetTop - optionWheel.clientHeight / 2 + item.offsetHeight / 2;
    optionWheel.scrollTo({ top, behavior });
}

function selectOption(index, center = true) {
    selectedOptionIndex = Math.max(0, Math.min(wholeDollarOptions.length - 1, index));
    renderSelectedOption();
    if (center) centerSelectedOption();
}

function buildTipOptions(bill) {
    wholeDollarOptions = makeWholeDollarOptions(bill);
    if (!wholeDollarOptions.length) {
        recommendationButton.disabled = true;
        document.querySelector('#bestFitSummary').textContent = bill > 0 ? 'No whole-dollar total falls between 5% and 25%' : 'Enter a bill to see options';
        document.querySelector('#bestFitAction').textContent = 'Default';
        document.querySelector('#optionCount').textContent = 'No options yet';
        optionWheel.innerHTML = `<p class="wheel-empty">${bill > 0 ? 'No whole-dollar option falls within 5%–25%' : 'Enter a bill to see whole-dollar totals'}</p>`;
        return;
    }

    bestOptionIndex = wholeDollarOptions.reduce((bestIndex, option, index) => {
        const currentDistance = Math.abs(option.effectivePercentage - 15);
        const bestDistance = Math.abs(wholeDollarOptions[bestIndex].effectivePercentage - 15);
        return currentDistance < bestDistance ? index : bestIndex;
    }, 0);
    selectedOptionIndex = bestOptionIndex;
    recommendationButton.disabled = false;
    document.querySelector('#bestFitSummary').textContent = describeOption(wholeDollarOptions[bestOptionIndex]);
    document.querySelector('#bestFitAction').textContent = 'Default';
    recommendationButton.setAttribute('aria-label', `Use best whole-dollar fit: ${describeOption(wholeDollarOptions[bestOptionIndex])}`);
    document.querySelector('#optionCount').textContent = `${wholeDollarOptions.length} option${wholeDollarOptions.length === 1 ? '' : 's'}`;
    renderOptionWheel();
}

function renderSelectedOption() {
    const bill = billCents / 100;
    const option = wholeDollarOptions[selectedOptionIndex];
    if (!option || bill <= 0) {
        document.querySelector('#tipAmount').textContent = '$0.00';
        document.querySelector('#totalAmount').textContent = '$0.00';
        document.querySelector('#effectiveTip').textContent = '0.00%';
        document.querySelector('#roundingNote').textContent = bill > 0 ? 'No whole-dollar option is available in the 5%–25% range.' : 'Enter a bill to see whole-dollar options.';
        return;
    }
    const isBest = selectedOptionIndex === bestOptionIndex;
    document.querySelector('#tipAmount').textContent = currency.format(option.tip);
    document.querySelector('#totalAmount').textContent = currency.format(option.total);
    document.querySelector('#effectiveTip').textContent = `${option.effectivePercentage.toFixed(2)}%`;
    document.querySelector('#bestFitAction').textContent = isBest ? 'Selected' : 'Use best';
    document.querySelector('#roundingNote').textContent = isBest ? 'Recommended: closest whole-dollar option to a 15% tip.' : 'Alternative whole-dollar option selected.';
    optionWheel.querySelectorAll('.fit-option').forEach((item, index) => {
        const active = index === selectedOptionIndex;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', active ? 'true' : 'false');
    });
}

function calculateTip() {
    buildTipOptions(billCents / 100);
    renderSelectedOption();
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
    const imageUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('The selected photo could not be read.'));
        reader.readAsDataURL(file);
    });
    const sourceImage = new Image();
    await new Promise((resolve, reject) => {
        sourceImage.onload = resolve;
        sourceImage.onerror = () => reject(new Error('This photo format could not be opened. Try choosing a screenshot or JPEG photo.'));
        sourceImage.src = imageUrl;
    });
    const scale = Math.min(1, 1800 / sourceImage.naturalWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sourceImage.naturalWidth * scale);
    canvas.height = Math.round(sourceImage.naturalHeight * scale);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < pixels.data.length; index += 4) {
        const gray = pixels.data[index] * .299 + pixels.data[index + 1] * .587 + pixels.data[index + 2] * .114;
        const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.35 + 128));
        pixels.data[index] = contrasted;
        pixels.data[index + 1] = contrasted;
        pixels.data[index + 2] = contrasted;
    }
    context.putImageData(pixels, 0, 0);
    return canvas;
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

billInput.addEventListener('input', handleBillInput);
let wheelScrollTimer;
optionWheel.addEventListener('scroll', () => {
    clearTimeout(wheelScrollTimer);
    wheelScrollTimer = setTimeout(() => {
        const wheelCenter = optionWheel.getBoundingClientRect().top + optionWheel.clientHeight / 2;
        const items = [...optionWheel.querySelectorAll('.fit-option')];
        if (!items.length) return;
        const nearest = items.reduce((best, item) => {
            const rect = item.getBoundingClientRect();
            const distance = Math.abs(rect.top + rect.height / 2 - wheelCenter);
            return distance < best.distance ? { index: Number(item.dataset.index), distance } : best;
        }, { index: selectedOptionIndex, distance: Infinity });
        if (nearest.index !== selectedOptionIndex) selectOption(nearest.index, false);
    }, 70);
});
optionWheel.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    selectOption(selectedOptionIndex + (event.key === 'ArrowDown' ? 1 : -1));
});
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
    scanResult.hidden = true;
    calculateTip();
});
recommendationButton.addEventListener('click', () => {
    if (!wholeDollarOptions.length) return;
    selectOption(bestOptionIndex);
});
resetButton.addEventListener('click', () => {
    billCents = 0;
    billInput.value = '';
    scanStatus.hidden = true;
    scanResult.hidden = true;
    calculateTip();
    billInput.focus();
});

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
calculateTip();
