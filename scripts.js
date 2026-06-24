const prenom = prompt("Comment tu t'appelles ?");
const titre = document.getElementById("titreBienvenue");
if (prenom) {
    titre.textContent = `💰 Le Budget d'${prenom}`;}
// 1. Sélection des éléments HTML
const soldeAffichage = document.getElementById("soldeTotal");
const inputNom = document.getElementById("nomTransaction");
const inputMontant = document.getElementById("montant");
const selectType = document.getElementById("type");
const bouton = document.getElementById("btnAjouter");
const listeHistorique = document.getElementById("listeTransactions");

// --- CHARGEMENT DES DONNÉES SAUVEGARDÉES ---
const historiqueSauvegarde = localStorage.getItem("mesTransactions");
let listeDesTransactions = historiqueSauvegarde ? JSON.parse(historiqueSauvegarde) : [];

// On restaure l'affichage au démarrage
restaurerApplication();

// 2. Fonction pour afficher la liste et calculer le solde
function restaurerApplication() {
    let argentTotal = 0;
    listeHistorique.innerHTML = "";

    listeDesTransactions.forEach(function(transaction) {
        const nouvelleLigne = document.createElement("li");

        // .toFixed(2) transforme le montant en texte avec 2 décimales (ex: 5 devient 5.00)
        const montantFormate = transaction.montant.toFixed(2);

        if (transaction.type === "revenu") {
            argentTotal += transaction.montant;
            nouvelleLigne.innerHTML = `${transaction.nom} <span class="plus">+${montantFormate} €</span>`;
        } else {
            argentTotal -= transaction.montant;
            nouvelleLigne.innerHTML = `${transaction.nom} <span class="moins">-${montantFormate} €</span>`;
        }

        listeHistorique.appendChild(nouvelleLigne);
    });

    // On applique aussi .toFixed(2) sur le solde total global
    soldeAffichage.textContent = argentTotal.toFixed(2);
    
    if (argentTotal >= 0) {
        soldeAffichage.style.color = "#2ecc71";
    } else {
        soldeAffichage.style.color = "#e74c3c";
    }
}

// 3. Fonction pour ajouter une transaction
function ajouterUneTransaction() {
    const nom = inputNom.value.trim();
    const montant = parseFloat(inputMontant.value);

    if (nom === "" || isNaN(montant)) {
        alert("Remplis le nom et le montant avant de valider ! 😉");
        return;
    }

    const nouvelleTransaction = {
        nom: nom,
        montant: montant,
        type: selectType.value
    };

    listeDesTransactions.push(nouvelleTransaction);
    localStorage.setItem("mesTransactions", JSON.stringify(listeDesTransactions));

    restaurerApplication();

    inputNom.value = "";
    inputMontant.value = "";
}

// 4. L'écouteur
bouton.addEventListener("click", ajouterUneTransaction);
// --- SYSTÈME DE RÉINITIALISATION ---

// 1. On sélectionne le bouton de reset
const boutonReset = document.getElementById("btnReset");

// 2. On crée la fonction qui vide tout
function réinitialiserTout() {
    // On demande une confirmation pour éviter les erreurs d'inattention
    const confirmer = confirm("Es-tu sûr de vouloir supprimer tout ton historique ?");

    if (confirmer) {
        // On vide notre tableau JavaScript
        listeDesTransactions = [];

        // On efface le carnet secret du navigateur (localStorage)
        localStorage.removeItem("mesTransactions");

        // On relance l'affichage (qui va tout remettre à 0 proprement)
        restaurerApplication();
    }
}

// 3. On écoute le clic sur le bouton rouge
boutonReset.addEventListener("click", réinitialiserTout);
