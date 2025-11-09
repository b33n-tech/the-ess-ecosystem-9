let data = {};
let currentQuestion = 0;
let answers = {};
let radarChart;
let wishlist = [];

const quizQuestions = [
  {question: "Maturité du projet", options: ["Pas structuré", "Un peu structuré", "Bien structuré"], key: "maturite"},
  {question: "Modèle économique défini ?", options: ["Non", "Quelques pistes", "Oui"], key: "modele_eco"},
  {question: "Besoins (multi)", options: ["Financement","Accompagnement","Visibilité","Partenaires"], key: "besoins"},
  {question: "Déjà bénéficié de dispositifs similaires ?", options: ["Non","Oui"], key: "deja"},
  {question: "Quand avez-vous besoin de la solution ?", options: ["Plus tard","1-3 mois","Immédiat"], key: "urgence"}
];

async function chargerData() {
  const response = await fetch("data.json");
  data = await response.json();
  afficherOffres([...data.ponctuels, ...data.stables]);
}

function afficherOffres(offresAff) {
  const container = document.getElementById("offres");
  container.innerHTML = "";
  offresAff.forEach(o => {
    const div = document.createElement("div");
    div.className = "carte";
    div.innerHTML = `<h3>${o.title}</h3>
                     ${o.deadline ? `<p>Deadline: ${o.deadline}</p>` : ""}
                     ${o.description ? `<p>${o.description}</p>` : ""}
                     <p>Tags: ${o.tags.join(", ")}</p>
                     <a href="${o.url}" target="_blank">Voir plus</a>
                     <button onclick="ajouterWishlist('${o.title}')">Ajouter à ma sélection</button>`;
    container.appendChild(div);
  });
}

function showQuestion() {
  const q = quizQuestions[currentQuestion];
  document.getElementById("question").innerText = `Q${currentQuestion+1}: ${q.question}`;
  const select = document.getElementById("reponse");
  select.innerHTML = "";
  q.options.forEach(o => {
    const optionEl = document.createElement("option");
    optionEl.value = o;
    optionEl.innerText = o;
    if(answers[q.key] && answers[q.key].includes(o)) optionEl.selected = true;
    select.appendChild(optionEl);
  });
  document.getElementById("progress").innerText = `Question ${currentQuestion+1} sur ${quizQuestions.length}`;
}

document.getElementById("nextBtn").addEventListener("click", ()=>{
  saveAnswer();
  if(currentQuestion < quizQuestions.length-1){
    currentQuestion++;
    showQuestion();
  } else {
    const scores = calculerScores();
    afficherRadar(scores);
    genererSynthese(scores);
  }
});

document.getElementById("prevBtn").addEventListener("click", ()=>{
  saveAnswer();
  if(currentQuestion > 0){
    currentQuestion--;
    showQuestion();
  }
});

function saveAnswer(){
  const q = quizQuestions[currentQuestion];
  const select = document.getElementById("reponse");
  answers[q.key] = Array.from(select.selectedOptions).map(o=>o.value);
}

function calculerScores(){
  const scores = {structuration:0, modele_eco:0, financement:0, accompagnement:0, visibilite:0, partenaires:0};
  // Maturité
  if(answers.maturite){
    scores.structuration = answers.maturite[0]==="Pas structuré"?0: answers.maturite[0]==="Un peu structuré"?5:10;
  }
  // Modèle économique
  if(answers.modele_eco){
    scores.modele_eco = answers.modele_eco[0]==="Non"?2: answers.modele_eco[0]==="Quelques pistes"?6:10;
  }
  // Besoins
  if(answers.besoins){
    answers.besoins.forEach(b=>{
      if(b==="Financement") scores.financement +=5;
      if(b==="Accompagnement") scores.accompagnement +=5;
      if(b==="Visibilité") scores.visibilite +=5;
      if(b==="Partenaires") scores.partenaires +=5;
    });
  }
  // Déjà bénéficié
  if(answers.deja && answers.deja[0]==="Oui"){
    scores.financement = Math.min(scores.financement,7);
  }
  // Urgence
  if(answers.urgence){
    const u = answers.urgence[0]==="Plus tard"?0: answers.urgence[0]==="1-3 mois"?1:2;
    for(let k in scores) scores[k]+=u;
  }
  return scores;
}

function afficherRadar(scores){
  const ctx = document.getElementById('radarChart').getContext('2d');
  const dataRadar = {
    labels:Object.keys(scores),
    datasets:[{label:"Diagnostic projet",data:Object.values(scores),fill:true,backgroundColor:"rgba(142,68,173,0.2)",borderColor:"rgba(142,68,173,1)",pointBackgroundColor:"rgba(142,68,173,1)"}]
  };
  if(radarChart) radarChart.destroy();
  radarChart = new Chart(ctx,{type:'radar',data:dataRadar});
}

function genererSynthese(scores){
  let texte = "<h4>Synthèse rapide :</h4><ul>";
  for(let k in scores){
    if(scores[k]>7) texte+=`<li>${k}: ✅ point fort</li>`;
    else if(scores[k]>=4) texte+=`<li>${k}: ⚠️ à consolider</li>`;
    else texte+=`<li>${k}: ❌ faible</li>`;
  }
  texte+="</ul>";
  document.getElementById("synthese").innerHTML=texte;
}

function filtrerOffres(scores){
  const all = [...data.ponctuels,...data.stables];
  return all.filter(o => o.tags.some(tag => Object.keys(scores).includes(tag) && scores[tag]>=5));
}

document.getElementById("btnFiltrer").addEventListener("click", ()=>{
  const scores = calculerScores();
  const filtres = filtrerOffres(scores);
  afficherOffres(filtres);
});

function ajouterWishlist(title){
  const all = [...data.ponctuels,...data.stables];
  const o = all.find(x=>x.title===title);
  if(!wishlist.includes(o)) wishlist.push(o);
  afficherWishlist();
}

function afficherWishlist(){
  const container = document.getElementById("wishlist");
  container.innerHTML="";
  wishlist.forEach(o=>{
    const div = document.createElement("div");
    div.innerHTML=`<strong>${o.title}</strong>${o.deadline?` - ${o.deadline}`:""}`;
    container.appendChild(div);
  });
}

function viderWishlist(){
  wishlist=[];
  afficherWishlist();
}

function exportPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;
  doc.setFontSize(14);
  doc.text("Ma sélection d'offres",10,y);
  y+=10;
  wishlist.forEach(o=>{
    doc.setFontSize(12);
    doc.text(`- ${o.title}${o.deadline?` (${o.deadline})`:''} - ${o.url}`,10,y);
    y+=10;
  });
  doc.save("wishlist.pdf");
}

document.getElementById("btnExportPDF").addEventListener("click",exportPDF);
document.getElementById("btnViderWishlist").addEventListener("click",viderWishlist);

window.onload=()=>{
  chargerData();
  showQuestion();
};
