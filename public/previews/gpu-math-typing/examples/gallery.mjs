const container=document.getElementById('examples'),filters=document.getElementById('filters');
try{
 const response=await fetch('./catalog.json');if(!response.ok)throw Error('Example library unavailable');const examples=await response.json();
 function show(category){container.replaceChildren();for(const example of examples.filter(e=>category==='All'||e.category===category)){const card=document.createElement('article'),kind=document.createElement('small'),heading=document.createElement('h2'),link=document.createElement('a'),description=document.createElement('p');kind.textContent=example.category;link.href=example.url;link.textContent=example.title;description.textContent=example.description;heading.append(link);card.append(kind,heading,description);container.append(card);}for(const button of filters.children)button.setAttribute('aria-pressed',String(button.textContent===category));}
 for(const category of ['All',...new Set(examples.map(e=>e.category))]){const button=document.createElement('button');button.textContent=category;button.onclick=()=>show(category);filters.append(button);}show('All');
}catch(error){document.getElementById('error').textContent=error.message;}
