const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));

const header=$('#header');
const progress=$('#progress');
const portrait=$('#portrait-stage');
const identity=$('#identity');
const work=$('#work');
const workTrack=$('#work-track');
const cards=$$('.case-card');
const workCurrent=$('#work-current');
const skillDeck=$('#skill-deck');
const positionIndex=$('#position-index');
const positionLabel=$('#position-label');

$('#year').textContent=new Date().getFullYear();
const menu=$('#menu');
const nav=$('#nav-links');
menu.addEventListener('click',()=>{
  const open=nav.classList.toggle('open');
  menu.setAttribute('aria-expanded',String(open));
});
$$('#nav-links a').forEach(link=>link.addEventListener('click',()=>{
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded','false');
}));

const caseFiles={
  sirts:{title:'CCorp SIRTS',lede:'A collaborative final-year incident and service-request tracking system built around the operational shape of a fictional SOC.',role:'Contributed to the team-based system and its evidence. It is presented here as collaborative work—not a solo capstone.',method:'Mapped request and incident lifecycles, role boundaries and audit needs into interfaces and database-backed workflow states.',evidence:['Role-based analyst, lead and user views','Incident and request lifecycle tracking','Audit-oriented records and security controls','Architecture, testing and project documentation'],learning:'A security workflow is credible only when its states, ownership, escalation and evidence remain clear under pressure.',next:'Continue production-readiness work, strengthen defensive controls and consolidate the final academic evidence.',repo:'https://github.com/cyr6x/ccorp-sirts'},
  sentinel:{title:'Azure Sentinel Detection Lab',lede:'A cloud telemetry pipeline turning failed Windows authentication into searchable evidence, detection logic and investigation views.',role:'Designed and documented the lab path from event generation through ingestion, KQL analysis and visualisation.',method:'Connected Windows telemetry to Log Analytics and Sentinel, enriched Event ID 4625 data with KQL and built an attack-map view.',evidence:['VM → AMA/DCR → Log Analytics → Sentinel path','KQL queries for failed-logon enrichment','Architecture and troubleshooting notes','Screenshots and workbook evidence'],learning:'Good detection work is equal parts telemetry quality, query logic and an evidence trail another analyst can reproduce.',next:'Deepen identity and endpoint detections, tune false positives and add incident-response mapping.',repo:'https://github.com/cyr6x/azure-soc-honeypot'},
  ctech:{title:'C TECH Inventory Management System',lede:'A connected operational system covering inventory, orders, suppliers, reporting, administration and audit history.',role:'Built as a substantial degree evidence artifact demonstrating end-to-end systems thinking beyond isolated screens.',method:'Connected a typed interface, backend operations and persistent data into workflows for stock, orders, users and reports.',evidence:['Inventory and supplier operations','Order and reporting workflows','User administration and audit logging','Full-stack repository and system documentation'],learning:'Operational software becomes trustworthy through consistent data, visible state and accountability—not feature count.',next:'Preserve it as consolidated BSc evidence and continue hardening the security model.',repo:'https://github.com/cyr6x/CTECH-IMS'},
  sim:{title:'SY0-701 MCQ × PBQ Simulator',lede:'A practice environment built to make Security+ preparation more measurable, realistic and reviewable.',role:'Developed the product direction around exam behaviour, scenario practice and post-attempt learning.',method:'Structured MCQs and PBQs around exam domains, then added exam state, review logic and performance feedback.',evidence:['Scenario-led MCQ and PBQ modes','Question review and domain feedback','Responsive exam workflow','Automated and manual testing evidence'],learning:'Assessment software should expose why an answer failed, not merely label it wrong.',next:'Continue calibration, PBQ realism and the complete post-exam review workflow.',repo:'https://github.com/cyr6x/MCQ-X-PBQ-SIM-vercel'},
  pcap:{title:'PCAP Traffic Analysis',lede:'A documented investigation of network traffic using protocol behaviour, filters and external reputation evidence.',role:'Performed the analysis and preserved the path from observation to conclusion.',method:'Filtered DHCP, DNS and HTTP traffic, isolated relevant infrastructure and checked suspicious indicators against public intelligence.',evidence:['Packet filters and annotated screenshots','Protocol-level observations','IOC and infrastructure checks','Written findings and evidence trail'],learning:'Packet analysis is strongest when every conclusion can be traced back to a frame, flow or corroborating source.',next:'Add more complex encrypted-traffic, beaconing and lateral-movement investigations.',repo:'https://github.com/cyr6x/wireshark-traffic-analysis'},
  network:{title:'Network Security & Defence',lede:'A consolidated set of degree exercises covering how network architecture changes exposure and containment.',role:'Designed, analysed and documented the defensive controls across five exercises.',method:'Worked through segmented LANs, DMZs, amplification risk, rogue wireless access and policy design.',evidence:['Five structured exercises','Network diagrams and control rationale','Threat-to-control mapping','Documented limitations and decisions'],learning:'Segmentation is useful only when trust boundaries and permitted flows are explicit.',next:'Translate more of the designs into reproducible cloud and lab configurations.',repo:'https://github.com/cyr6x/network-security-defence'},
  ethical:{title:'Ethical Hacking Reports',lede:'Controlled security assessments documented as findings, evidence, impact and remediation.',role:'Performed the lab work and wrote the assessment evidence.',method:'Examined web upload paths, SNMP, FTP artifacts, privilege escalation and OSINT in isolated environments.',evidence:['Five assessment reports','Reproduction evidence and screenshots','Impact explanations','Practical remediation'],learning:'The quality of a finding depends on restraint, reproducibility and a fix the reader can act on.',next:'Reframe future assessments around attack paths and validation of defensive coverage.',repo:'https://github.com/cyr6x/ethical-hacking-lab-reports'},
  nmap:{title:'Nmap Network Scan',lede:'A staged network-enumeration exercise moving from discovery to services and operating-system hypotheses.',role:'Executed and documented the scan against controlled targets.',method:'Used progressive scans to reduce noise, identify exposed services and correlate fingerprints.',evidence:['Host discovery sequence','Service and version enumeration','OS fingerprinting evidence','Commands, screenshots and interpretation'],learning:'Enumeration is a decision process: each scan should answer a question and shape the next one.',next:'Add detection-side telemetry to show how each scan appears to defenders.',repo:'https://github.com/cyr6x/nmap-network-scan'},
  burp:{title:'Burp Suite Web Testing',lede:'A controlled web-security lab examining SQL injection and reflected cross-site scripting in DVWA.',role:'Performed the tests, captured evidence and documented defensive fixes.',method:'Intercepted and modified requests, validated application behaviour and connected each result to its underlying weakness.',evidence:['Request and response evidence','SQL injection and XSS reproduction','Root-cause explanation','Defensive remediation guidance'],learning:'A useful security report connects payload, application behaviour, business impact and a verifiable fix.',next:'Expand into authenticated testing and retesting after remediation.',repo:'https://github.com/cyr6x/burpsuite-web-testing-lab'}
  ,metasploit:{title:'Metasploit Exploitation Lab',lede:'A controlled exploitation exercise kept as practical evidence, with an emphasis on impact, safe handling and remediation.',role:'Completed the lab work and retained the supporting documentation.',method:'Worked through the exploitation workflow in an isolated environment, then documented the exposure and the defensive control it calls for.',evidence:['Controlled-lab documentation','Exploit workflow notes','Observed impact','Remediation perspective'],learning:'Technical validation matters most when it leads to a practical defensive response.',next:'Continue mapping offensive validation to detection and hardening evidence.',repo:'https://github.com/cyr6x/metasploit-exploitation-lab'}
  ,password:{title:'Password Auditing Lab',lede:'A controlled password-security exercise focused on credential risk, password strength and remediation.',role:'Completed and documented the lab work in an authorised environment.',method:'Examined credential-risk concepts and recorded the security measures that reduce exposure.',evidence:['Lab documentation','Password-security concepts','Risk and control notes','Repository evidence'],learning:'Credential security is a human and technical control problem, not only a policy requirement.',next:'Connect future identity work to monitoring and access-control design.',repo:'https://github.com/cyr6x/password-cracking-lab'}
  ,recon:{title:'Passive Reconnaissance Labs',lede:'A research-led lab series covering passive discovery, asset context and careful evidence handling.',role:'Completed the coursework exercises and recorded the process.',method:'Used passive research methods to build an evidence trail before making any active assumptions.',evidence:['Research workflow','Asset-context notes','Evidence handling','Repository documentation'],learning:'A useful investigation begins with sound context and disciplined documentation.',next:'Extend reconnaissance work into defensive exposure-management exercises.',repo:'https://github.com/cyr6x/passive-recon-labs'}
};

const dialog=$('#case-dialog');
const dialogBody=$('#dialog-body');
function openCase(key){
  const data=caseFiles[key];
  if(!data)return;
  dialogBody.innerHTML=`<h2>${data.title}</h2><p class="dialog-lede">${data.lede}</p><div class="dialog-grid"><section class="dialog-block"><h3>My position</h3><p>${data.role}</p></section><section class="dialog-block"><h3>Method</h3><p>${data.method}</p></section><section class="dialog-block"><h3>Evidence</h3><ul>${data.evidence.map(item=>`<li>${item}</li>`).join('')}</ul></section><section class="dialog-block"><h3>What changed in my thinking</h3><p>${data.learning}</p></section><section class="dialog-block"><h3>Next move</h3><p>${data.next}</p></section></div><div class="dialog-repo"><a class="pill" href="${data.repo}" target="_blank" rel="noreferrer">Inspect repository ↗</a></div>`;
  dialog.showModal();
}
$$('[data-case] .case-open,.lab-row[data-case]').forEach(element=>element.addEventListener('click',()=>openCase(element.closest('[data-case]').dataset.case)));
$('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});

portrait.addEventListener('pointermove',event=>{
  if(reduced)return;
  const rect=portrait.getBoundingClientRect();
  const x=(event.clientX-rect.left)/rect.width;
  const y=(event.clientY-rect.top)/rect.height;
  portrait.style.setProperty('--tilt-x',`${(x-.5)*5}deg`);
  portrait.style.setProperty('--tilt-y',`${(.5-y)*4}deg`);
  portrait.style.setProperty('--px',`${x*100}%`);
  portrait.style.setProperty('--py',`${y*100}%`);
});
portrait.addEventListener('pointerleave',()=>{
  portrait.style.setProperty('--tilt-x','0deg');
  portrait.style.setProperty('--tilt-y','0deg');
});
portrait.addEventListener('pointermove',event=>{
  if(!portrait.classList.contains('galaxy-mode')||reduced)return;
  const rect=portrait.getBoundingClientRect();
  const x=(event.clientX-rect.left)/rect.width-.5;
  const y=(event.clientY-rect.top)/rect.height-.5;
  $$('.planet').forEach((planet,index)=>{
    const strength=12-index*1.5;
    planet.style.setProperty('--pull-x',`${-x*strength}px`);
    planet.style.setProperty('--pull-y',`${-y*strength}px`);
  });
});

const sections=$$('section[id]');
let pageRaf=0;
function updatePage(){
  pageRaf=0;
  const available=document.documentElement.scrollHeight-innerHeight;
  const total=available?scrollY/available:0;
  progress.style.transform=`scaleX(${total})`;
  header.classList.toggle('scrolled',scrollY>25);
  document.documentElement.style.setProperty('--brand',`hsl(${clamp(total)*230+5} 82% ${total>.7?68:88}%)`);
  if(!reduced){
    const identityRect=identity.getBoundingClientRect();
    const identityProgress=clamp(-identityRect.top/(identity.offsetHeight-innerHeight));
    const galaxyProgress=clamp((identityProgress-.18)/.36);
    const accessProgress=clamp((identityProgress-.36)/.12)*(1-clamp((identityProgress-.65)/.12));
    portrait.style.setProperty('--face-scale',String(1-identityProgress*.18));
    portrait.style.setProperty('--face-x','0px');
    portrait.style.setProperty('--face-y',`${identityProgress*-2.5}vh`);
    portrait.style.setProperty('--portrait-opacity',String(1-galaxyProgress));
    portrait.style.setProperty('--galaxy-opacity',String(galaxyProgress));
    portrait.style.setProperty('--planet-opacity',String(clamp((identityProgress-.72)/.15)));
    portrait.classList.toggle('galaxy-mode',identityProgress>.72);
    portrait.classList.toggle('portrait-mode',identityProgress<.35);
    $$('.ssh-line').forEach((line,index)=>line.style.opacity=String(clamp((identityProgress-.4-index*.035)/.05)));
    $('.hero-intro').style.setProperty('--intro-opacity',String(clamp(1-identityProgress*2.2)));
    $('.identity-scroll').style.setProperty('--intro-opacity',String(clamp(1-identityProgress*2.5)));
    $('#access-terminal').style.setProperty('--access-opacity',String(accessProgress));
    $('#access-terminal').style.translate=`-50% calc(-50% + ${20-accessProgress*20}px)`;
    const deckRect=skillDeck.getBoundingClientRect();
    const deckProgress=clamp((innerHeight-deckRect.top)/(innerHeight*.55));
    skillDeck.style.setProperty('--deck-open',String(deckProgress));

    if(innerWidth>820){
      const workRect=work.getBoundingClientRect();
      const workProgress=clamp(-workRect.top/(work.offsetHeight-innerHeight));
      const entrance=clamp(workProgress/.13);
      const travel=clamp((workProgress-.13)/.87);
      const maxShift=Math.max(0,workTrack.scrollWidth-innerWidth+innerWidth*.08);
      workTrack.style.setProperty('--work-x',`${(1-entrance)*30-travel*maxShift/innerWidth*100}vw`);
      workTrack.style.setProperty('--work-y',`${(1-entrance)*25}vh`);
      workTrack.style.setProperty('--work-r',`${(1-entrance)*4}deg`);
      const center=innerWidth/2;
      let nearest=0;
      let minimum=Infinity;
      cards.forEach((card,index)=>{
        const rect=card.getBoundingClientRect();
        const distance=Math.min(1,Math.abs(rect.left+rect.width/2-center)/innerWidth);
        card.style.setProperty('--case-opacity',String(1-distance*.55));
        card.style.setProperty('--case-turn',`${(rect.left+rect.width/2-center)/innerWidth*-5}deg`);
        if(distance<minimum){minimum=distance;nearest=index}
      });
      workCurrent.textContent=String(nearest+1).padStart(2,'0');
    }
  }
  let active='identity';
  sections.forEach(section=>{
    if(section.getBoundingClientRect().top<=innerHeight*.42)active=section.id;
  });
  $$('#nav-links a').forEach(link=>link.classList.toggle('active',link.dataset.section===active));
  const visibleSections=['identity','work','investigations','archive','arsenal','roadmap','contact'];
  const sectionPosition=Math.max(0,visibleSections.indexOf(active));
  positionIndex.textContent=String(sectionPosition+1).padStart(2,'0');
  positionLabel.textContent=(sections.find(section=>section.id===active)?.dataset.label||'About').toUpperCase();
  $('#journey-percent').textContent=`${Math.round(total*100)}%`;
  $('#journey-fill').style.transform=`scaleX(${total})`;
  $$('.journey-links a').forEach(link=>{if(link.hash===`#${active}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')});
}
addEventListener('scroll',()=>{if(!pageRaf)pageRaf=requestAnimationFrame(updatePage)},{passive:true});
addEventListener('resize',()=>{if(!pageRaf)pageRaf=requestAnimationFrame(updatePage)},{passive:true});
updatePage();

const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.add('in');revealObserver.unobserve(entry.target)}
}),{threshold:.13});
$$('.reveal').forEach(element=>revealObserver.observe(element));
$$('[data-open-case]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();openCase(link.dataset.openCase)}));

const mesh=$('#mesh');
const meshContext=mesh.getContext('2d');
let width,height,ratio,meshNodes=[],meshEdges=[],meshFrame,lastMesh=0;
let pointer={x:-999,y:-999,on:false};
function sizeMesh(){
  ratio=Math.min(devicePixelRatio||1,2);width=innerWidth;height=innerHeight;
  mesh.width=width*ratio;mesh.height=height*ratio;meshContext.setTransform(ratio,0,0,ratio,0,0);
  const count=Math.max(55,Math.min(115,Math.floor(width*height/13000)));
  meshNodes=Array.from({length:count},(_,index)=>({x:Math.random()*width,y:Math.random()*height,z:Math.random()*.8+.2,phase:Math.random()*6.28,vx:(Math.random()-.5)*.045,vy:(Math.random()-.5)*.045,hot:index%17===0}));
  meshEdges=[];
  meshNodes.forEach((node,index)=>{
    const nearby=[];
    meshNodes.forEach((other,otherIndex)=>{if(otherIndex<=index)return;const distance=Math.hypot(node.x-other.x,node.y-other.y);if(distance<175)nearby.push({otherIndex,distance})});
    nearby.sort((a,b)=>a.distance-b.distance).slice(0,3).forEach(item=>meshEdges.push({a:index,b:item.otherIndex,hot:(index+item.otherIndex)%13===0,phase:Math.random()}));
  });
}
function drawMesh(time=0){
  if(!reduced&&time-lastMesh<32){meshFrame=requestAnimationFrame(drawMesh);return}
  lastMesh=time;meshContext.clearRect(0,0,width,height);
  const positions=meshNodes.map(node=>{
    const breath=reduced?0:Math.sin(time*.00055+node.phase)*9*node.z;
    let x=node.x+Math.cos(node.phase)*breath;
    let y=node.y+Math.sin(node.phase)*breath;
    if(pointer.on&&!reduced){const dx=pointer.x-x,dy=pointer.y-y,distance=Math.hypot(dx,dy);if(distance<220&&distance){const pull=(1-distance/220)*18;x+=dx/distance*pull;y+=dy/distance*pull}}
    return{x,y};
  });
  meshEdges.forEach(edge=>{
    const a=positions[edge.a],b=positions[edge.b],distance=Math.hypot(a.x-b.x,a.y-b.y),pulse=.5+Math.sin(time*.0008+edge.phase*6.28)*.5;
    meshContext.beginPath();meshContext.moveTo(a.x,a.y);meshContext.lineTo(b.x,b.y);
    meshContext.strokeStyle=edge.hot?`rgba(255,48,56,${.14*pulse*(1-distance/200)})`:`rgba(180,190,204,${.1*pulse*(1-distance/200)})`;
    meshContext.lineWidth=edge.hot?1:.55;meshContext.stroke();
  });
  meshNodes.forEach((node,index)=>{
    if(!reduced){node.x+=node.vx;node.y+=node.vy;if(node.x<-15||node.x>width+15)node.vx*=-1;if(node.y<-15||node.y>height+15)node.vy*=-1}
    meshContext.beginPath();meshContext.arc(positions[index].x,positions[index].y,node.hot?1.8:.7,0,Math.PI*2);meshContext.fillStyle=node.hot?'rgba(255,48,56,.72)':'rgba(205,212,222,.32)';meshContext.fill();
  });
  if(!reduced)meshFrame=requestAnimationFrame(drawMesh);
}
sizeMesh();drawMesh();
addEventListener('resize',()=>{cancelAnimationFrame(meshFrame);sizeMesh();drawMesh()},{passive:true});
addEventListener('pointermove',event=>{pointer={x:event.clientX,y:event.clientY,on:true}},{passive:true});
document.documentElement.addEventListener('pointerleave',()=>pointer.on=false);

const brainGalaxy=$('#brain-galaxy');
const galaxyContext=brainGalaxy.getContext('2d');
let galaxyFrame,galaxyPoints=[],galaxyRatio=1;
function sizeBrainGalaxy(){
  const box={width:brainGalaxy.clientWidth,height:brainGalaxy.clientHeight};
  galaxyRatio=Math.min(devicePixelRatio||1,2);
  brainGalaxy.width=Math.max(1,box.width*galaxyRatio);brainGalaxy.height=Math.max(1,box.height*galaxyRatio);
  galaxyContext.setTransform(galaxyRatio,0,0,galaxyRatio,0,0);
  galaxyPoints=Array.from({length:120},(_,index)=>({x:Math.random()*box.width,y:Math.random()*box.height,r:index%19===0?1.8:Math.random()*.8+.3,hot:index%17===0,phase:Math.random()*6.28}));
}
function drawBrainGalaxy(time=0){
  const box={width:brainGalaxy.clientWidth,height:brainGalaxy.clientHeight};
  galaxyContext.clearRect(0,0,box.width,box.height);
  const centerX=box.width*.5,centerY=box.height*.31;
  galaxyContext.save();galaxyContext.translate(centerX,centerY);galaxyContext.rotate(time*.000035);galaxyContext.scale(1,.46);
  for(let ring=0;ring<4;ring++){galaxyContext.beginPath();galaxyContext.ellipse(0,0,box.width*(.16+ring*.09),box.width*(.16+ring*.09),0,0,Math.PI*2);galaxyContext.strokeStyle=`rgba(190,201,216,${.13-ring*.018})`;galaxyContext.setLineDash(ring%2?[5,9]:[]);galaxyContext.stroke()}
  galaxyContext.restore();galaxyContext.setLineDash([]);
  galaxyPoints.forEach((point,index)=>{const breathe=Math.sin(time*.001+point.phase)*3;galaxyContext.beginPath();galaxyContext.arc(point.x+breathe,point.y+breathe*.4,point.r,0,Math.PI*2);galaxyContext.fillStyle=point.hot?'rgba(255,48,56,.85)':'rgba(210,220,232,.42)';galaxyContext.fill();if(index%23===0){const next=galaxyPoints[(index+7)%galaxyPoints.length];galaxyContext.beginPath();galaxyContext.moveTo(point.x,point.y);galaxyContext.lineTo(next.x,next.y);galaxyContext.strokeStyle='rgba(190,201,216,.08)';galaxyContext.stroke()}});
  if(!reduced)galaxyFrame=requestAnimationFrame(drawBrainGalaxy);
}
sizeBrainGalaxy();drawBrainGalaxy();
addEventListener('resize',()=>{cancelAnimationFrame(galaxyFrame);sizeBrainGalaxy();drawBrainGalaxy()},{passive:true});
