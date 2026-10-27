const q=new URLSearchParams(location.search);document.documentElement.style.setProperty('--s',q.get('s')+'px');
const i=document.getElementById('i');if(q.get('m'))i.classList.add('m');if(q.get('q'))i.classList.add('q');
