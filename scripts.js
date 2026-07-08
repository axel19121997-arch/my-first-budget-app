// 1. SÉLECTION DES ÉLÉMENTS HTML
const soldeAffichage = document.getElementById("soldeTotal");
const inputNom = document.getElementById("nomTransaction");
const inputMontant = document.getElementById("montant");
const selectType = document.getElementById("type");
const selectCategorie = document.getElementById("categorie");
const bouton = document.getElementById("btnAjouter");
const boutonAnnulerEdition = document.getElementById("btnAnnulerEdition");
const listeHistorique = document.getElementById("listeTransactions");
const inputPrenom = document.getElementById("inputPrenom");
const titre = document.getElementById("titreBienvenue");
const boutonReset = document.getElementById("btnReset");
const selectFiltre = document.getElementById("filtreCategorie");
const selectFiltrePeriode = document.getElementById("filtrePeriode");
const boutonExporterCSV = document.getElementById("btnExporterCSV");
const boutonExporterJSON = document.getElementById("btnExporterJSON");
// --- Éléments pour la section "Budgets mensuels par catégorie" ---
const selectCategorieBudget = document.getElementById("categorieBudget");
const inputMontantBudget = document.getElementById("montantBudget");
const boutonDefinirBudget = document.getElementById("btnDefinirBudget");
const messageAucunBudget = document.getElementById("messageAucunBudget");
const listeBudgetsAffichage = document.getElementById("listeBudgets");
// --- Éléments pour la section "Prévisions sur l'année" ---
const inputNomPrevision = document.getElementById("nomPrevision");
const inputMontantPrevision = document.getElementById("montantPrevision");
const selectTypePrevision = document.getElementById("typePrevision");
const selectCategoriePrevision = document.getElementById("categoriePrevision");
const selectMoisPrevision = document.getElementById("moisPrevision");
const boutonAjouterPrevision = document.getElementById("btnAjouterPrevision");
const listePrevisionsAffichage = document.getElementById("listePrevisions");
const messageAucunePrevision = document.getElementById("messageAucunePrevision");
const messageAucuneDepense = document.getElementById("messageAucuneDepense");

const NOMS_MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const COULEURS_CATEGORIES = {
    alimentation: "#f39c12", transport: "#3498db", logement: "#9b59b6", loisirs: "#e67e22",
    sante: "#1abc9c", assurance: "#e74c3c", abonnements: "#34495e", impots: "#d35400",
    epargne: "#27ae60", animaux: "#a0522d", salaire: "#2ecc71", autre: "#7f8c8d"
};

let graphiqueCamembertInstance = null;
let graphiqueProjectionInstance = null;
let idTransactionEnEdition = null;

const CATEGORIES = {
    alimentation: "🍔 Alimentation", transport: "🚗 Transport", logement: "🏠 Logement",
    loisirs: "🎉 Loisirs", sante: "💊 Santé", assurance: "🛡️ Assurances",
    abonnements: "📱 Abonnements & Télécom", impots: "📜 Impôts & Taxes",
    epargne: "🐷 Épargne & Inves.", animaux: "🐾 Animaux", salaire: "💼 Salaire", autre: "📦 Autre"
};

function chargerDepuisStockage(cle, valeurParDefaut) {
    const brut = localStorage.getItem(cle);
    if (!brut) return valeurParDefaut;
    try {
        return JSON.parse(brut);
    } catch (erreur) {
        console.warn(`Données corrompues pour "${cle}", réinitialisation.`, erreur);
        return valeurParDefaut;
    }
}

function genererId() {
    return Date.now() + Math.random();
}

const prenomSauvegarde = localStorage.getItem("prenomUtilisateur");
if (prenomSauvegarde) {
    inputPrenom.value = prenomSauvegarde;
    titre.textContent = `💰 Le Budget d'${prenomSauvegarde}`;
}

inputPrenom.addEventListener("input", function() {
    const prenom = inputPrenom.value.trim();
    if (prenom) {
        titre.textContent = `💰 Le Budget d'${prenom}`;
        localStorage.setItem("prenomUtilisateur", prenom);
    } else {
        titre.textContent = `💰 Mon Budget`;
        localStorage.removeItem("prenomUtilisateur");
    }
});

let listeDesTransactions = chargerDepuisStockage("mesTransactions", []);
let listeDesPrevisions = chargerDepuisStockage("mesPrevisions", []);
let budgetsParCategorie = chargerDepuisStockage("mesBudgets", {});

function migrerCategoriesSupprimees() {
    const categoriesSupprimees = ["shopping", "cadeaux"];
    let modifie = false;
    listeDesTransactions.forEach(function(transaction) {
        if (categoriesSupprimees.includes(transaction.categorie)) {
            transaction.categorie = "autre";
            modifie = true;
        }
    });
    listeDesPrevisions.forEach(function(prevision) {
        if (categoriesSupprimees.includes(prevision.categorie)) {
            prevision.categorie = "autre";
            modifie = true;
        }
    });
    if (modifie) {
        localStorage.setItem("mesTransactions", JSON.stringify(listeDesTransactions));
        localStorage.setItem("mesPrevisions", JSON.stringify(listeDesPrevisions));
    }
}
migrerCategoriesSupprimees();

bouton.addEventListener("click", ajouterOuModifierTransaction);
boutonAnnulerEdition.addEventListener("click", annulerEdition);
boutonReset.addEventListener("click", reinitialiserTout);

inputNom.addEventListener("keypress", function(e) { if (e.key === "Enter") ajouterOuModifierTransaction(); });
inputMontant.addEventListener("keypress", function(e) { if (e.key === "Enter") ajouterOuModifierTransaction(); });

selectFiltre.addEventListener("change", rafraichirAffichage);
selectFiltrePeriode.addEventListener("change", rafraichirAffichage);
boutonExporterCSV.addEventListener("click", exporterEnCSV);
boutonExporterJSON.addEventListener("click", exporterEnJSON);

boutonDefinirBudget.addEventListener("click", definirUnBudget);

boutonAjouterPrevision.addEventListener("click", ajouterUnePrevision);
inputNomPrevision.addEventListener("keypress", function(e) { if (e.key === "Enter") ajouterUnePrevision(); });
inputMontantPrevision.addEventListener("keypress", function(e) { if (e.key === "Enter") ajouterUnePrevision(); });

rafraichirAffichage();
afficherPrevisions();
afficherBudgets();
// 2. AFFICHAGE DE LA LISTE + CALCUL DU SOLDE
function transactionDansLaPeriode(transaction, periode) {
    if (periode === "tout") return true;
    const timestamp = transaction.date || Math.floor(transaction.id);
    const dateTransaction = new Date(timestamp);
    const maintenant = new Date();

    if (periode === "moisCourant") {
        return dateTransaction.getMonth() === maintenant.getMonth() && dateTransaction.getFullYear() === maintenant.getFullYear();
    }
    if (periode === "3mois") {
        const ilYA3Mois = new Date();
        ilYA3Mois.setMonth(maintenant.getMonth() - 3);
        return dateTransaction >= ilYA3Mois;
    }
    if (periode === "anneeCourante") {
        return dateTransaction.getFullYear() === maintenant.getFullYear();
    }
    return true;
}

function rafraichirAffichage() {
    let argentTotal = 0;
    listeHistorique.innerHTML = "";

    const categorieChoisie = selectFiltre.value;
    const periodeChoisie = selectFiltrePeriode.value;

    listeDesTransactions.forEach(function(transaction) {
        if (transaction.type === "revenu") argentTotal += transaction.montant;
        else argentTotal -= transaction.montant;

        if (categorieChoisie !== "toutes" && transaction.categorie !== categorieChoisie) return;
        if (!transactionDansLaPeriode(transaction, periodeChoisie)) return;

        const nouvelleLigne = document.createElement("li");
        const montantFormate = transaction.montant.toFixed(2);

        const conteneurTexte = document.createElement("div");
        conteneurTexte.className = "ligneTransaction";

        const spanNom = document.createElement("span");
        spanNom.textContent = transaction.nom;

        const badgeCategorie = document.createElement("span");
        badgeCategorie.className = "badgeCategorie";
        badgeCategorie.textContent = CATEGORIES[transaction.categorie] || CATEGORIES.autre;

        const spanMontant = document.createElement("span");
        if (transaction.type === "revenu") {
            spanMontant.className = "plus";
            spanMontant.textContent = `+${montantFormate} €`;
        } else {
            spanMontant.className = "moins";
            spanMontant.textContent = `-${montantFormate} €`;
        }

        conteneurTexte.appendChild(spanNom);
        conteneurTexte.appendChild(badgeCategorie);
        conteneurTexte.appendChild(spanMontant);

        const boutonModifier = document.createElement("button");
        boutonModifier.className = "btnModifier";
        boutonModifier.textContent = "✎";
        boutonModifier.title = "Modifier cette transaction";
        boutonModifier.addEventListener("click", function() { passerEnModeEdition(transaction.id); });

        const boutonSupprimer = document.createElement("button");
        boutonSupprimer.className = "btnSupprimer";
        boutonSupprimer.textContent = "✕";
        boutonSupprimer.title = "Supprimer cette transaction";
        boutonSupprimer.addEventListener("click", function() { supprimerUneTransaction(transaction.id); });

        nouvelleLigne.appendChild(conteneurTexte);
        nouvelleLigne.appendChild(boutonModifier);
        nouvelleLigne.appendChild(boutonSupprimer);
        listeHistorique.appendChild(nouvelleLigne);
    });

    soldeAffichage.textContent = argentTotal.toFixed(2);
    soldeAffichage.style.color = argentTotal >= 0 ? "#2ecc71" : "#e74c3c";

    mettreAJourGraphiqueCamembert();
    mettreAJourGraphiqueProjection(argentTotal);
    afficherBudgets();
}

// 3. AJOUT / MODIFICATION D'UNE TRANSACTION
function ajouterOuModifierTransaction() {
    const nom = inputNom.value.trim();
    const montant = parseFloat(inputMontant.value);

    if (nom === "" || isNaN(montant) || montant <= 0) {
        alert("Le nom doit être renseigné et le montant doit être un nombre positif ! 😉");
        return;
    }

    if (idTransactionEnEdition !== null) {
        const transaction = listeDesTransactions.find(function(t) { return t.id === idTransactionEnEdition; });
        if (transaction) {
            transaction.nom = nom;
            transaction.montant = montant;
            transaction.type = selectType.value;
            transaction.categorie = selectCategorie.value;
        }
        localStorage.setItem("mesTransactions", JSON.stringify(listeDesTransactions));
        annulerEdition();
    } else {
        const nouvelleTransaction = {
            id: genererId(), nom: nom, montant: montant,
            type: selectType.value, categorie: selectCategorie.value, date: Date.now()
        };
        listeDesTransactions.push(nouvelleTransaction);
        localStorage.setItem("mesTransactions", JSON.stringify(listeDesTransactions));
    }

    rafraichirAffichage();
    inputNom.value = "";
    inputMontant.value = "";
    inputNom.focus();
}

function passerEnModeEdition(id) {
    const transaction = listeDesTransactions.find(function(t) { return t.id === id; });
    if (!transaction) return;

    idTransactionEnEdition = id;
    inputNom.value = transaction.nom;
    inputMontant.value = transaction.montant;
    selectType.value = transaction.type;
    selectCategorie.value = transaction.categorie;

    bouton.textContent = "Modifier";
    boutonAnnulerEdition.style.display = "block";

    inputNom.focus();
    inputNom.scrollIntoView({ behavior: "smooth", block: "center" });
}

function annulerEdition() {
    idTransactionEnEdition = null;
    bouton.textContent = "Ajouter";
    boutonAnnulerEdition.style.display = "none";
    inputNom.value = "";
    inputMontant.value = "";
}
// 4. SUPPRESSION D'UNE TRANSACTION PRÉCISE
function supprimerUneTransaction(id) {
    if (idTransactionEnEdition === id) annulerEdition();
    listeDesTransactions = listeDesTransactions.filter(function(transaction) { return transaction.id !== id; });
    localStorage.setItem("mesTransactions", JSON.stringify(listeDesTransactions));
    rafraichirAffichage();
}
// 5. RÉINITIALISATION DE TOUT L'HISTORIQUE
function reinitialiserTout() {
    const confirmer = confirm("Es-tu sûr de vouloir supprimer tout ton historique ?");
    if (confirmer) {
        listeDesTransactions = [];
        localStorage.removeItem("mesTransactions");
        annulerEdition();
        rafraichirAffichage();
    }
}
// 6. EXPORT DES DONNÉES (CSV / JSON)
function declencherTelechargement(contenu, nomFichier, typeMime) {
    const blob = new Blob([contenu], { type: typeMime });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = nomFichier;
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    URL.revokeObjectURL(url);
}

function exporterEnCSV() {
    if (listeDesTransactions.length === 0) {
        alert("Il n'y a aucune transaction à exporter pour l'instant.");
        return;
    }
    const entetes = ["Nom", "Montant", "Type", "Categorie", "Date"];
    const lignes = listeDesTransactions.map(function(t) {
        const dateLisible = new Date(t.date || Math.floor(t.id)).toLocaleDateString("fr-FR");
        const nomEchappe = `"${t.nom.replace(/"/g, '""')}"`;
        return [nomEchappe, t.montant, t.type, t.categorie, dateLisible].join(",");
    });
    const contenuCSV = [entetes.join(","), ...lignes].join("\n");
    declencherTelechargement(contenuCSV, "mes-transactions.csv", "text/csv;charset=utf-8;");
}

function exporterEnJSON() {
    if (listeDesTransactions.length === 0 && listeDesPrevisions.length === 0) {
        alert("Il n'y a aucune donnée à exporter pour l'instant.");
        return;
    }
    const donneesCompletes = {
        transactions: listeDesTransactions, previsions: listeDesPrevisions,
        budgets: budgetsParCategorie, exporteLe: new Date().toISOString()
    };
    declencherTelechargement(JSON.stringify(donneesCompletes, null, 2), "mon-budget.json", "application/json");
}
// 7. GRAPHIQUE CAMEMBERT
function mettreAJourGraphiqueCamembert() {
    if (typeof Chart === "undefined") return;

    const totauxParCategorie = {};
    listeDesTransactions.forEach(function(transaction) {
        if (transaction.type !== "depense") return;
        const categorie = transaction.categorie || "autre";
        if (!totauxParCategorie[categorie]) totauxParCategorie[categorie] = 0;
        totauxParCategorie[categorie] += transaction.montant;
    });

    const categoriesPresentes = Object.keys(totauxParCategorie);
    if (categoriesPresentes.length === 0) {
        messageAucuneDepense.style.display = "block";
        if (graphiqueCamembertInstance) { graphiqueCamembertInstance.destroy(); graphiqueCamembertInstance = null; }
        return;
    }
    messageAucuneDepense.style.display = "none";

    const labels = categoriesPresentes.map(function(cle) { return CATEGORIES[cle] || CATEGORIES.autre; });
    const donnees = categoriesPresentes.map(function(cle) { return totauxParCategorie[cle]; });
    const couleurs = categoriesPresentes.map(function(cle) { return COULEURS_CATEGORIES[cle] || COULEURS_CATEGORIES.autre; });

    const contexte = document.getElementById("graphiqueCamembert").getContext("2d");
    if (graphiqueCamembertInstance) graphiqueCamembertInstance.destroy();

    graphiqueCamembertInstance = new Chart(contexte, {
        type: "pie",
        data: { labels: labels, datasets: [{ data: donnees, backgroundColor: couleurs }] },
        options: { plugins: { legend: { position: "bottom", labels: { color: "#cdd6f4" } } } }
    });
}
// 8. BUDGETS MENSUELS PAR CATÉGORIE
function definirUnBudget() {
    const categorie = selectCategorieBudget.value;
    const montant = parseFloat(inputMontantBudget.value);

    if (isNaN(montant) || montant <= 0) {
        alert("Le budget doit être un nombre positif ! 😉");
        return;
    }

    budgetsParCategorie[categorie] = montant;
    localStorage.setItem("mesBudgets", JSON.stringify(budgetsParCategorie));
    inputMontantBudget.value = "";
    afficherBudgets();
}

function supprimerUnBudget(categorie) {
    delete budgetsParCategorie[categorie];
    localStorage.setItem("mesBudgets", JSON.stringify(budgetsParCategorie));
    afficherBudgets();
}

function totalDepenseMoisCourant(categorie) {
    const maintenant = new Date();
    let total = 0;
    listeDesTransactions.forEach(function(transaction) {
        if (transaction.type !== "depense" || transaction.categorie !== categorie) return;
        const timestamp = transaction.date || Math.floor(transaction.id);
        const dateTransaction = new Date(timestamp);
        if (dateTransaction.getMonth() === maintenant.getMonth() && dateTransaction.getFullYear() === maintenant.getFullYear()) {
            total += transaction.montant;
        }
    });
    return total;
}

function afficherBudgets() {
    listeBudgetsAffichage.innerHTML = "";
    const categoriesAvecBudget = Object.keys(budgetsParCategorie);

    if (categoriesAvecBudget.length === 0) {
        messageAucunBudget.style.display = "block";
        return;
    }
    messageAucunBudget.style.display = "none";

    categoriesAvecBudget.forEach(function(categorie) {
        const budget = budgetsParCategorie[categorie];
        const depense = totalDepenseMoisCourant(categorie);
        const pourcentage = Math.min(Math.round((depense / budget) * 100), 100);

        let couleurBarre = "#2ecc71";
        if (depense / budget >= 1) couleurBarre = "#e74c3c";
        else if (depense / budget >= 0.8) couleurBarre = "#f39c12";

        const conteneur = document.createElement("div");
        conteneur.className = "budgetItem";

        const entete = document.createElement("div");
        entete.className = "budgetEntete";

        const labelCategorie = document.createElement("span");
        labelCategorie.textContent = CATEGORIES[categorie] || CATEGORIES.autre;

        const conteneurDroite = document.createElement("div");
        conteneurDroite.style.display = "flex";
        conteneurDroite.style.alignItems = "center";
        conteneurDroite.style.gap = "8px";

        const labelMontants = document.createElement("span");
        labelMontants.textContent = `${depense.toFixed(2)} € / ${budget.toFixed(2)} €`;

        const boutonSupprimerBudget = document.createElement("button");
        boutonSupprimerBudget.className = "budgetSupprimer";
        boutonSupprimerBudget.textContent = "✕";
        boutonSupprimerBudget.title = "Supprimer ce budget";
        boutonSupprimerBudget.addEventListener("click", function() { supprimerUnBudget(categorie); });

        conteneurDroite.appendChild(labelMontants);
        conteneurDroite.appendChild(boutonSupprimerBudget);

        entete.appendChild(labelCategorie);
        entete.appendChild(conteneurDroite);

        const barreExterieure = document.createElement("div");
        barreExterieure.className = "budgetBarreExterieure";

        const barreInterieure = document.createElement("div");
        barreInterieure.className = "budgetBarreInterieure";
        barreInterieure.style.width = `${pourcentage}%`;
        barreInterieure.style.backgroundColor = couleurBarre;

        barreExterieure.appendChild(barreInterieure);

        conteneur.appendChild(entete);
        conteneur.appendChild(barreExterieure);

        listeBudgetsAffichage.appendChild(conteneur);
    });
}
// 9. LISTE DES PRÉVISIONS MENSUELLES ENREGISTRÉES
function afficherPrevisions() {
    listePrevisionsAffichage.innerHTML = "";
    if (listeDesPrevisions.length === 0) {
        messageAucunePrevision.style.display = "block";
        return;
    }
    messageAucunePrevision.style.display = "none";

    listeDesPrevisions.forEach(function(prevision) {
        const ligne = document.createElement("li");
        const conteneurTexte = document.createElement("div");
        conteneurTexte.className = "ligneTransaction";

        const spanNom = document.createElement("span");
        spanNom.textContent = prevision.nom;

        const badgeCategorie = document.createElement("span");
        badgeCategorie.className = "badgeCategorie";
        badgeCategorie.textContent = CATEGORIES[prevision.categorie] || CATEGORIES.autre;

        const spanMontant = document.createElement("span");
        const montantFormate = prevision.montant.toFixed(2);

        let textePeriodicite = "/mois";
        if (prevision.mois !== "tous") textePeriodicite = ` en ${NOMS_MOIS[parseInt(prevision.mois)]}`;

        if (prevision.type === "revenu") {
            spanMontant.className = "plus";
            spanMontant.textContent = `+${montantFormate} €${textePeriodicite}`;
        } else {
            spanMontant.className = "moins";
            spanMontant.textContent = `-${montantFormate} €${textePeriodicite}`;
        }

        conteneurTexte.appendChild(spanNom);
        conteneurTexte.appendChild(badgeCategorie);
        conteneurTexte.appendChild(spanMontant);

        const boutonSupprimer = document.createElement("button");
        boutonSupprimer.className = "btnSupprimer";
        boutonSupprimer.textContent = "✕";
        boutonSupprimer.title = "Supprimer cette prévision";
        boutonSupprimer.addEventListener("click", function() { supprimerUnePrevision(prevision.id); });

        ligne.appendChild(conteneurTexte);
        ligne.appendChild(boutonSupprimer);
        listePrevisionsAffichage.appendChild(ligne);
    });
}
// 10. AJOUT D'UNE PRÉVISION
function ajouterUnePrevision() {
    const nom = inputNomPrevision.value.trim();
    const montant = parseFloat(inputMontantPrevision.value);

    if (nom === "" || isNaN(montant) || montant <= 0) {
        alert("Le nom doit être renseigné et le montant doit être un nombre positif ! 😉");
        return;
    }

    listeDesPrevisions.push({
        id: genererId(), nom: nom, montant: montant,
        type: selectTypePrevision.value, categorie: selectCategoriePrevision.value, mois: selectMoisPrevision.value
    });

    localStorage.setItem("mesPrevisions", JSON.stringify(listeDesPrevisions));
    afficherPrevisions();
    rafraichirAffichage();

    inputNomPrevision.value = "";
    inputMontantPrevision.value = "";
    inputNomPrevision.focus();
}
// 11. SUPPRESSION D'UNE PRÉVISION
function supprimerUnePrevision(id) {
    listeDesPrevisions = listeDesPrevisions.filter(function(prevision) { return prevision.id !== id; });
    localStorage.setItem("mesPrevisions", JSON.stringify(listeDesPrevisions));
    afficherPrevisions();
    rafraichirAffichage();
}
// 12. PROJECTION MOIS PAR MOIS GLISSANTE
function mettreAJourGraphiqueProjection(soldeActuel) {
    if (typeof Chart === "undefined") return;

    const labels = ["Aujourd'hui"];
    const donnees = [soldeActuel];
    const moisActuelIndex = new Date().getMonth();
    let soldeProjete = soldeActuel;

    for (let i = 1; i <= 12; i++) {
        const moisCibleIndex = (moisActuelIndex + i - 1) % 12;
        let fluxDuMois = 0;

        listeDesPrevisions.forEach(function(prevision) {
            if (prevision.mois === "tous" || parseInt(prevision.mois) === moisCibleIndex) {
                if (prevision.type === "revenu") fluxDuMois += prevision.montant;
                else fluxDuMois -= prevision.montant;
            }
        });

        soldeProjete += fluxDuMois;
        labels.push(NOMS_MOIS[moisCibleIndex]);
        donnees.push(Math.round(soldeProjete * 100) / 100);
    }

    const contexte = document.getElementById("graphiqueProjection").getContext("2d");
    if (graphiqueProjectionInstance) graphiqueProjectionInstance.destroy();

    graphiqueProjectionInstance = new Chart(contexte, {
        type: "line",
        data: { labels: labels, datasets: [{ label: "Solde projeté (€)", data: donnees, borderColor: "#3498db", backgroundColor: "rgba(52, 152, 219, 0.2)", fill: true, tension: 0.2 }] },
        options: { plugins: { legend: { labels: { color: "#cdd6f4" } } }, scales: { x: { ticks: { color: "#cdd6f4" } }, y: { ticks: { color: "#cdd6f4" } } } }
    });
}
