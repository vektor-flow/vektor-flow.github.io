const source=document.querySelector('#source'),button=document.querySelector('#run'),status=document.querySelector('#status');
source.value=await fetch('./workflow-source/few-math-labels.vkf').then(r=>r.text());
button.disabled=true;button.setAttribute('aria-disabled','true');
status.textContent='This separate demo is not qualified for the current package.';
