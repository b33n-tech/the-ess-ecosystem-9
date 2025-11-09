let data = {};
let currentQuestion = 0;
let answers = {};
let radarChart;
let wishlist = [];

const quizQuestions = [
  {question:"Où en êtes-vous de votre projet aujourd’hui ?", options:["Je n’ai qu’une idée","Je teste déjà","Je suis lancé","Je cherche à grandir"], key:"stade_maturite", type:"single"},
  {question:"Quel est votre principal besoin aujourd’hui ?", options:["Financement","Accompagnement","Outils","Ressources humaines","Réseau","Autre"], key:"type_besoin", type:"multi"},
  {question:"Quelle est la nature principale de votre projet ?", options:["ESS","Tech","Culture","Éducation","Écologie","Inclusion","Autre"], key:"nature_projet", type:"single"},
  {question:"Sous quelle forme existe votre projet aujourd’hui ?", options:["Aucune structure","Association","Entreprise","Coopérative","Autre"], key:"niveau_structuration", type:"single"},
  {question:"Quand avez-vous besoin d’une solution concrète ?", options:["Dès maintenant","D’ici 1 mois","D’ici 3 mois","Plus tard"], key:"echeance", type:"single"},
  {question:"Quel est votre objectif principal pour les 6 prochains mois ?", options:["Tester une idée","Trouver un financement","Structurer l’équipe","Lancer le projet","Développer l’activité"], key:"objectif", type:"single"},
  {question:"Votre projet est-il déjà financé ou soutenu ?", options:["Oui","Non"], key:"deja_finance", type:"single"},
  {question:"Où est basé votre projet ?", options:["National","Régional","Local","International"], key:"territoire", type:"single"}
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
  select.multiple = q.type==="multi";
  document.getElementById("progress").innerText = `Question ${currentQuestion+1} sur ${quizQuestions.length}`;
}

document.getElementById("nextBtn").addEventListener("click", ()=>{
  saveAnswer();
  if(currentQuestion < quizQuestions.length-1){
    currentQuestion++;
    showQuestion();
  } else {
    genererSynthese();
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

function genererSynthese(){
  let texte = "<h4>Synthèse rapide :</h4><ul>";
  for(let k in answers){
    texte+=`<li>${k}: ${answers[k].join(", ")}</li>`;
  }
  texte+="</ul>";
  document.getElementById("synthese").innerHTML=texte;
  afficherRadar();
}

function afficherRadar(){
  const axes = ["stade_maturite","type_besoin","nature_projet","niveau_structuration","echeance"];
  const valeurs = axes.map(a => answers[a] ? answers[a].length*2 : 0);
  const ctx = document.getElementById('radarChart').getContext('2d');
  const dataRadar = {
    labels: axes,
    datasets:[{label:"Diagnostic projet",data:valeurs,fill:true,backgroundColor:"rgba(142,68,173,0.2)",borderColor:"rgba(142,68,173,1)",pointBackgroundColor:"rgba(142,68,173,1)"}]
  };
  if(radarChart) radarChart.destroy();
  radarChart = new Chart(ctx,{type:'radar',data:dataRadar});
}

function filtrerOffres(){
  const all = [...data.ponctuels,...data.stables];
  const filtres = [];
  for(let k in answers){
    answers[k].forEach(v=>filtres.push(`${k}:${v}`));
  }
  return all.filter(o=>o.tags.some(t=>filtres.includes(t)));
}

document.getElementById("btnFiltrer").addEventListener("click", ()=>{
  const filtres = filtrerOffres();
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
