const billInput = document.querySelector('#billAmount');
const tipInput = document.querySelector('#tipPercentage');
const tipButtons = document.querySelectorAll('[data-tip]');
const resetButton = document.querySelector('#resetButton');
const recommendationButton = document.querySelector('#recommendation');
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

let billCents = 0;
let recommendedPercentage = 18;

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
    recommendationButton.disabled = false;
    label.textContent = `${best.percentage}% → ${currency.format(best.roundedTotal)}`;
    recommendationButton.setAttribute('aria-label', `Use recommended ${best.percentage} percent tip for a ${currency.format(best.roundedTotal)} total`);
}

function calculateTip() {
    const bill = billCents / 100;
    const percentage = Number.parseFloat(tipInput.value);
    const safePercentage = Number.isFinite(percentage) && percentage >= 0 ? percentage : 0;
    updateRecommendation(bill);

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

tipButtons.forEach((button) => button.addEventListener('click', () => {
    tipInput.value = button.dataset.tip;
    setActiveTip(button.dataset.tip);
    calculateTip();
}));

tipInput.addEventListener('input', () => { setActiveTip(tipInput.value); calculateTip(); });
billInput.addEventListener('input', handleBillInput);
recommendationButton.addEventListener('click', () => {
    tipInput.value = recommendedPercentage;
    setActiveTip(recommendedPercentage);
    calculateTip();
});
resetButton.addEventListener('click', () => {
    billCents = 0;
    billInput.value = '';
    tipInput.value = '18';
    setActiveTip(18);
    calculateTip();
    billInput.focus();
});

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
calculateTip();
