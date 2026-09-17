const billInput = document.querySelector('#billAmount');
const resetButton = document.querySelector('#resetButton');
const optionWheel = document.querySelector('#optionWheel');
const selectionAnnouncement = document.querySelector('#selectionAnnouncement');
const cameraInput = document.querySelector('#cameraInput');
const uploadInput = document.querySelector('#uploadInput');
const scanStatus = document.querySelector('#scanStatus');
const scanMessage = document.querySelector('#scanMessage');
const scanProgress = document.querySelector('#scanProgress');
const scanResult = document.querySelector('#scanResult');
const detectedTotalInput = document.querySelector('#detectedTotal');
const removePersonButton = document.querySelector('#removePerson');
const addPersonButton = document.querySelector('#addPerson');
const peopleCountOutput = document.querySelector('#peopleCount');
const targetRateValue = document.querySelector('#targetRateValue');
const lowerTargetButton = document.querySelector('#lowerTarget');
const raiseTargetButton = document.querySelector('#raiseTarget');
const optionLegend = document.querySelector('#optionLegend');
const modeHelp = document.querySelector('#modeHelp');
const modeButtons = [...document.querySelectorAll('.mode-tab')];
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

let billCents = 0;
let tipOptions = [];
let bestOptionIndex = 0;
let selectedOptionIndex = 0;
let peopleCount = 1;
let targetTipPercentage = 16;
let roundingMode = 'total';

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

function makeWholeDollarTipOptions(bill) {
    if (bill <= 0) return [];
    const minimumTip = Math.ceil(bill * .05 - .000001);
    const maximumTip = Math.floor(bill * .25 + .000001);
    const options = [];
    for (let tip = minimumTip; tip <= maximumTip; tip += 1) {
        options.push({ total: bill + tip, tip, effectivePercentage: tip / bill * 100 });
    }
    return options;
}

function makeWholePercentageOptions(bill) {
    if (bill <= 0) return [];
    const options = [];
    for (let percentage = 5; percentage <= 25; percentage += 1) {
        const tip = Math.round(bill * percentage) / 100;
        if (tip <= 0) continue;
        options.push({ total: bill + tip, tip, effectivePercentage: tip / bill * 100, requestedPercentage: percentage });
    }
    return options;
}

function makeWholeTotalEachOptions(bill) {
    if (bill <= 0 || peopleCount <= 1) return [];
    const minimumEach = Math.ceil(bill * 1.05 / peopleCount - .000001);
    const maximumEach = Math.floor(bill * 1.25 / peopleCount + .000001);
    const options = [];
    for (let totalEach = minimumEach; totalEach <= maximumEach; totalEach += 1) {
        const total = totalEach * peopleCount;
        const tip = total - bill;
        options.push({ total, tip, effectivePercentage: tip / bill * 100 });
    }
    return options;
}

function makeWholeTipEachOptions(bill) {
    if (bill <= 0 || peopleCount <= 1) return [];
    const minimumTipEach = Math.ceil(bill * .05 / peopleCount - .000001);
    const maximumTipEach = Math.floor(bill * .25 / peopleCount + .000001);
    const options = [];
    for (let tipEach = minimumTipEach; tipEach <= maximumTipEach; tipEach += 1) {
        const tip = tipEach * peopleCount;
        options.push({ total: bill + tip, tip, effectivePercentage: tip / bill * 100 });
    }
    return options;
}

function makeOptions(bill) {
    if (roundingMode === 'tip') return makeWholeDollarTipOptions(bill);
    if (roundingMode === 'rate') return makeWholePercentageOptions(bill);
    if (roundingMode === 'splitTotal') return makeWholeTotalEachOptions(bill);
    if (roundingMode === 'splitTip') return makeWholeTipEachOptions(bill);
    return makeWholeDollarOptions(bill);
}

function describeOption(option) {
    const base = `${currency.format(option.total)} total · ${currency.format(option.tip)} tip · ${option.effectivePercentage.toFixed(2)}% effective rate`;
    if (peopleCount === 1) return base;
    const split = splitOption(option);
    return `${base} · split ${peopleCount} ways: ${currency.format(split.billEachCents / 100)} bill, ${currency.format(split.tipEachCents / 100)} tip, and ${currency.format(split.totalEachCents / 100)} total per person`;
}

function splitOption(option) {
    const totalCents = Math.round(option.total * 100);
    const tipCents = Math.round(option.tip * 100);
    return {
        billEachCents: Math.floor(billCents / peopleCount),
        totalEachCents: Math.floor(totalCents / peopleCount),
        tipEachCents: Math.floor(tipCents / peopleCount),
        extraBillShares: billCents % peopleCount,
        extraTotalShares: totalCents % peopleCount,
        extraTipShares: tipCents % peopleCount
    };
}

function splitNote(split) {
    const notes = [];
    if (split.extraBillShares) notes.push(`${split.extraBillShares} ${split.extraBillShares === 1 ? 'has' : 'have'} ${currency.format((split.billEachCents + 1) / 100)} bill`);
    if (split.extraTotalShares) notes.push(`${split.extraTotalShares} ${split.extraTotalShares === 1 ? 'pays' : 'pay'} ${currency.format((split.totalEachCents + 1) / 100)} total`);
    if (split.extraTipShares) notes.push(`${split.extraTipShares} ${split.extraTipShares === 1 ? 'tips' : 'tip'} ${currency.format((split.tipEachCents + 1) / 100)}`);
    return notes.length ? notes.join(' · ') : `${peopleCount} equal shares`;
}

function renderOptionWheel() {
    optionWheel.replaceChildren();
    tipOptions.forEach((option, index) => {
        const split = splitOption(option);
        const personDetails = peopleCount > 1
            ? `<span class="option-person"><span>Per person</span><span>Bill <strong>${currency.format(split.billEachCents / 100)}</strong></span><span>Tip <strong>${currency.format(split.tipEachCents / 100)}</strong></span><span>Total <strong>${currency.format(split.totalEachCents / 100)}</strong></span></span><span class="option-split-note">${splitNote(split)}</span>`
            : '';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `fit-option${index === bestOptionIndex ? ' best' : ''}`;
        button.dataset.index = index;
        button.setAttribute('role', 'option');
        button.setAttribute('aria-label', describeOption(option));
        button.innerHTML = `${index === bestOptionIndex ? '<span class="option-best">Best fit</span>' : ''}<span class="option-metric"><span class="option-label">Total</span><strong>${currency.format(option.total)}</strong></span><span class="option-metric"><span class="option-label">Tip</span><strong>${currency.format(option.tip)}</strong></span><span class="option-metric"><span class="option-label">Effective</span><strong>${option.effectivePercentage.toFixed(2)}%</strong></span>${personDetails}`;
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
    selectedOptionIndex = Math.max(0, Math.min(tipOptions.length - 1, index));
    renderSelectedOption();
    if (center) centerSelectedOption();
}

function updatePeopleControl() {
    peopleCountOutput.textContent = `${peopleCount} ${peopleCount === 1 ? 'person' : 'people'}`;
    removePersonButton.disabled = peopleCount === 1;
    addPersonButton.disabled = peopleCount === 20;
    modeButtons.filter((button) => button.classList.contains('split-mode')).forEach((button) => {
        button.hidden = peopleCount === 1;
    });
}

function changePeopleCount(change) {
    peopleCount = Math.max(1, Math.min(20, peopleCount + change));
    updatePeopleControl();
    if (peopleCount === 1 && roundingMode === 'splitTotal') {
        setRoundingMode('total');
    } else if (peopleCount === 1 && roundingMode === 'splitTip') {
        setRoundingMode('tip');
    } else {
        calculateTip();
    }
    if (navigator.vibrate) navigator.vibrate(8);
}

function savePreference(key, value) {
    try { localStorage.setItem(key, String(value)); } catch (_) { /* Preferences are optional. */ }
}

function setTargetTip(value, save = true) {
    targetTipPercentage = Math.max(5, Math.min(25, Number(value)));
    targetRateValue.textContent = `${targetTipPercentage}%`;
    lowerTargetButton.disabled = targetTipPercentage === 5;
    raiseTargetButton.disabled = targetTipPercentage === 25;
    if (save) savePreference('icebergTargetTip', targetTipPercentage);
    calculateTip();
}

function setRoundingMode(mode, save = true) {
    const allowedModes = ['total', 'tip', 'rate', 'splitTotal', 'splitTip'];
    roundingMode = allowedModes.includes(mode) ? mode : 'total';
    if (peopleCount === 1 && roundingMode === 'splitTotal') roundingMode = 'total';
    if (peopleCount === 1 && roundingMode === 'splitTip') roundingMode = 'tip';
    const modeCopy = {
        total: { aria: 'Compare clean-total tip options', help: 'Ends the check on a whole dollar.' },
        tip: { aria: 'Compare whole-dollar tip options', help: 'Makes the tip itself a whole dollar.' },
        rate: { aria: 'Compare whole-percent tip options', help: 'Matches a clean percentage as closely as cents allow.' },
        splitTotal: { aria: 'Compare clean per-person total options', help: 'Gives each person a whole-dollar total.' },
        splitTip: { aria: 'Compare clean per-person tip options', help: 'Gives each person a whole-dollar tip.' }
    };
    optionLegend.textContent = 'Choose your tip';
    optionWheel.setAttribute('aria-label', modeCopy[roundingMode].aria);
    modeHelp.textContent = modeCopy[roundingMode].help;
    modeButtons.forEach((button) => {
        const active = button.dataset.mode === roundingMode;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    if (save) savePreference('icebergRoundingMode', roundingMode);
    calculateTip();
}

function loadPreferences() {
    try {
        const savedTarget = Number.parseInt(localStorage.getItem('icebergTargetTip'), 10);
        const savedMode = localStorage.getItem('icebergRoundingMode');
        if (Number.isFinite(savedTarget)) targetTipPercentage = Math.max(5, Math.min(25, savedTarget));
        if (['total', 'tip', 'rate', 'splitTotal', 'splitTip'].includes(savedMode)) roundingMode = savedMode;
    } catch (_) { /* Use defaults when storage is unavailable. */ }
    setTargetTip(targetTipPercentage, false);
    setRoundingMode(roundingMode, false);
}

function buildTipOptions(bill) {
    tipOptions = makeOptions(bill);
    if (!tipOptions.length) {
        document.querySelector('#optionCount').textContent = 'No options yet';
        optionWheel.innerHTML = `<p class="wheel-empty">${bill > 0 ? 'No option falls within 5%–25%' : 'Enter a bill to see tip options'}</p>`;
        selectionAnnouncement.textContent = bill > 0 ? 'No option is available in the 5% to 25% range.' : '';
        return;
    }

    const preferredFloor = targetTipPercentage >= 14 ? 14 : 5;
    const preferredOptions = tipOptions.filter((option) => option.effectivePercentage >= preferredFloor);
    const recommendationPool = preferredOptions.length ? preferredOptions : tipOptions;
    const bestOption = recommendationPool.reduce((best, option) => {
        const currentRate = option.requestedPercentage ?? option.effectivePercentage;
        const bestRate = best.requestedPercentage ?? best.effectivePercentage;
        const currentDistance = Math.abs(currentRate - targetTipPercentage);
        const bestDistance = Math.abs(bestRate - targetTipPercentage);
        return currentDistance < bestDistance ? option : best;
    });
    bestOptionIndex = tipOptions.findIndex((option) => option === bestOption);
    selectedOptionIndex = bestOptionIndex;
    document.querySelector('#optionCount').textContent = `${tipOptions.length} option${tipOptions.length === 1 ? '' : 's'}`;
    renderOptionWheel();
}

function renderSelectedOption() {
    const option = tipOptions[selectedOptionIndex];
    if (!option) return;
    const isBest = selectedOptionIndex === bestOptionIndex;
    selectionAnnouncement.textContent = `${isBest ? 'Best fit selected. ' : 'Selected. '}${describeOption(option)}`;
    optionWheel.querySelectorAll('.fit-option').forEach((item, index) => {
        const active = index === selectedOptionIndex;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', active ? 'true' : 'false');
    });
}

function calculateTip() {
    buildTipOptions(billCents / 100);
    renderSelectedOption();
    updatePeopleControl();
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
        cameraInput.value = '';
        uploadInput.value = '';
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
function scanSelectedReceipt(input) {
    const file = input.files?.[0];
    if (file) scanReceipt(file);
}

cameraInput.addEventListener('change', () => scanSelectedReceipt(cameraInput));
uploadInput.addEventListener('change', () => scanSelectedReceipt(uploadInput));
removePersonButton.addEventListener('click', () => changePeopleCount(-1));
addPersonButton.addEventListener('click', () => changePeopleCount(1));
lowerTargetButton.addEventListener('click', () => setTargetTip(targetTipPercentage - 1));
raiseTargetButton.addEventListener('click', () => setTargetTip(targetTipPercentage + 1));
modeButtons.forEach((button) => button.addEventListener('click', () => setRoundingMode(button.dataset.mode)));
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
resetButton.addEventListener('click', () => {
    billCents = 0;
    peopleCount = 1;
    billInput.value = '';
    scanStatus.hidden = true;
    scanResult.hidden = true;
    calculateTip();
    billInput.focus();
});

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
loadPreferences();
