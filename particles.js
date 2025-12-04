const particleContainer = document.getElementById('particle-container');
for(let i=0;i<30;i++){
  const p = document.createElement('div');
  p.classList.add('particle');
  p.style.left = Math.random()*100 + 'vw';
  p.style.top = Math.random()*100 + 'vh';
  p.style.width = p.style.height = (Math.random()*4 + 2) + 'px';
  p.style.animationDuration = (Math.random()*5 + 5) + 's';
  particleContainer.appendChild(p);
}
