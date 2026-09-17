const billInput=document.querySelector('#billAmount');
const tipInput=document.querySelector('#tipPercentage');
const tipButtons=document.querySelectorAll('[data-tip]');
const resetButton=document.querySelector('#resetButton');
const currency=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2});
function setActiveTip(value){tipButtons.forEach((button)=>button.classList.toggle('active',Number(button.dataset.tip)===Number(value)));}
function calculateTip(){
 const bill=Number.parseFloat(billInput.value); const percentage=Number.parseFloat(tipInput.value); const hasBill=Number.isFinite(bill)&&bill>=0; const safePercentage=Number.isFinite(percentage)&&percentage>=0?percentage:0;
 if(!hasBill||bill===0){document.querySelector('#tipAmount').textContent='$0.00';document.querySelector('#totalAmount').textContent='$0.00';document.querySelector('#effectiveTip').textContent='0.00%';document.querySelector('#roundingNote').textContent='Enter a bill to see the rounded total.';return;}
 const rawTotal=bill*(1+safePercentage/100); const roundedTotal=Math.round(rawTotal); const tip=roundedTotal-bill; const effectivePercentage=tip/bill*100;
 document.querySelector('#tipAmount').textContent=currency.format(tip); document.querySelector('#totalAmount').textContent=currency.format(roundedTotal); document.querySelector('#effectiveTip').textContent=`${effectivePercentage.toFixed(2)}%`; document.querySelector('#roundingNote').textContent=`Suggested ${safePercentage}% tip, adjusted to a whole-dollar total.`;
}
tipButtons.forEach((button)=>button.addEventListener('click',()=>{tipInput.value=button.dataset.tip;setActiveTip(button.dataset.tip);calculateTip();}));
tipInput.addEventListener('input',()=>{setActiveTip(tipInput.value);calculateTip();}); billInput.addEventListener('input',calculateTip);
resetButton.addEventListener('click',()=>{billInput.value='';tipInput.value='18';setActiveTip(18);calculateTip();billInput.focus();});
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));}
calculateTip();
