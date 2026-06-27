// 1. Sélection des éléments HTML
const soldeAffichage = document.getElementById("soldeTotal");
const inputNom = document.getElementById("nomTransaction");
const inputMontant = document.getElementById("montant");
const selectType = document.getElementById("type");
const selectCategorie = document.getElementById("categorie");
const bouton = document.getElementById("btnAjouter");
const listeHistorique = document.getElementById("listeTransactions");
const inputPrenom = document.getElementById("inputPrenom");
const titre = document.getElementById("titreBienvenue");
const boutonReset = document.getElementById("btnReset");
const selectFiltre = document.getElementById("filtreCategorie");

// --- Éléments pour la section "Prévisions sur l'année" ---
const inputNomPrevision = document.getElementById("nomPrevision");
const inputMontantPrevision = document.getElementById("montantPrevision");
const selectTypePrevision = document.getElementById("typePrevision");
const selectCategoriePrevision = document.getElementById("categoriePrevision");
const selectMoisPrevision = document.getElementById("moisPrevision"); // Nouveau !
const listePrevisionsAffichage = document.getElementById("listePrevisions");
const messageAucunePrevision = document.getElementById("messageAucunePrevision");
const messageAucuneDepense = document.getElementById("messageAucuneDepense");

// Noms des mois pour l'affichage textuel et le graphique
const NOMS_MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const COULEURS_CATEGORIES = {
    alimentation: "#f39c12",
    transport: "#3498db",
    logement: "#9b59b6",
    loisirs: "#e67e22",
    sante: "#1abc9c",
    assurance: "#e74c3c",
    abonnements: "#34495e",
    impots: "#d35400",
    epargne: "#27ae60",
    animaux: "#a0522d",
    salaire: "#2ecc71",
    autre: "#7f8c8d"
};

let graphiqueCamembertInstance = null;
let graphiqueProjectionInstance = null;

const CATEGORIES = {
    alimentation: "🍔 Alimentation",
    transport: "🚗 Transport",
    logement: "🏠 Logement",
    loisirs: "🎉 Loisirs",
    sante: "💊 Santé",
    assurance: "🛡️ Assurances",
    abonnements: "📱 Abonnements & Télécom",
    impots: "📜 Impôts & Taxes",
    epargne: "🐷 Épargne & Inves.",
    animaux: "🐾 Animaux",
    salaire: "💼 Salaire",
    autre: "📦 Autre"
};

// --- PERSONNALISATION DU PRÉNOM ---
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

// --- CHARGEMENT DES DONNÉES SAUVEGARDÉES ---
const historiqueSauvegarde = localStorage.getItem("mesTransactions");
let listeDesTransactions = historiqueSauvegarde ? JSON.parse(historiqueSauvegarde) : [];

const previsionsSauvegardees = localStorage.getItem("mesPrevisions");
let listeDesPrevisions = previsionsSauvegardees ? JSON.parse(previsionsSauvegardees) : [];

// --- MIGRATION : catégories supprimées ---
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

// --- ÉCOUTEURS D'ÉVÉNEMENTS ---
bouton.addEventListener("click", ajouterUneTransaction);
boutonReset.addEventListener("click", reinitialiserTout);

inputNom.addEventListener("keypress", function(e) {
    if (e.key === "Enter") ajouterUneTransaction();
});
inputMontant.addEventListener("keypress", function(e) {
    if (e.key === "Enter") ajouterUneTransaction();
});

selectFiltre.addEventListener("change", rafraichirAffichage);
boutonAjouterPrevision.addEventListener("click", ajouterUnePrevision);

inputNomPrevision.addEventListener("keypress", function(e) {
    if (e.key === "Enter") ajouterUnePrevision();
});
inputMontantPrevision.addEventListener("keypress", function(e) {
    if (e.key === "Enter") ajouterUnePrevision();
});

rafraichirAffichage();
afficherPrevisions();

// 2. Fonction pour afficher la liste et calculer le solde
function rafraichirAffichage() {
    let argentTotal = 0;
    listeHistorique.innerHTML = "";

    const categorieChoisie = selectFiltre.value;

    listeDesTransactions.forEach(function(transaction) {
        if (transaction.type === "revenu") {
            argentTotal += transaction.montant;
        } else {
            argentTotal -= transaction.montant;
        }

        if (categorieChoisie !== "toutes" && transaction.categorie !== categorieChoisie) {
            return;
        }

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

        const boutonSupprimer = document.createElement("button");
        boutonSupprimer.className = "btnSupprimer";
        boutonSupprimer.textContent = "✕";
        boutonSupprimer.title = "Supprimer cette transaction";
        boutonSupprimer.addEventListener("click", function() {
            supprimerUneTransaction(transaction.id);
        });

        nouvelleLigne.appendChild(conteneurTexte);
        nouvelleLigne.appendChild(boutonSupprimer);
        listeHistorique.appendChild(nouvelleLigne);
    });

    soldeAffichage.textContent = argentTotal.toFixed(2);

    if (argentTotal >= 0) {
        soldeAffichage.style.color = "#2ecc71";
    } else {
        soldeAffichage.style.color = "#e74c3c";
    }

    mettreAJourGraphiqueCamembert();
    mettreAJourGraphiqueProjection(argentTotal);
}

// 3. Fonction pour ajouter une transaction
function ajouterUneTransaction() {
    const nom = inputNom.value.trim();
    const montant = parseFloat(inputMontant.value);

    if (nom === "" || isNaN(montant) || montant <= 0) {
        alert("Le nom doit être renseigné et le montant doit être un nombre positif ! 😉");
        return;
    }

    const nouvelleTransaction = {
        id: Date.now(),
        nom: nom,
        montant: montant,
        type: selectType.value,
        categorie: selectCategorie.value
    };

    listeDesTransactions.push(nouvelleTransaction);
    localStorage.setItem("mesTransactions", JSON.stringify(listeDesTransactions));

    rafraichirAffichage();

    inputNom.value = "";
    inputMontant.value = "";
    inputNom.focus();
}

// 4. Fonction pour supprimer une transaction précise
function supprimerUneTransaction(id) {
    listeDesTransactions = listeDesTransactions.filter(function(transaction) {
        return transaction.id !== id;
    });

    localStorage.setItem("mesTransactions", JSON.stringify(listeDesTransactions));
    rafraichirAffichage();
}

// 5. Fonction pour réinitialiser tout l'historique
function reinitialiserTout() {
    const confirmer = confirm("Es-tu sûr de vouloir supprimer tout ton historique ?");
    if (confirmer) {
        listeDesTransactions = [];
        localStorage.removeItem("mesTransactions");
        rafraichirAffichage();
    }
}

// 6. Graphique camembert : répartition des dépenses réelles par catégorie
function mettreAJourGraphiqueCamembert() {
    if (typeof Chart === "undefined") {
        console.warn("Chart.js n'est pas chargé : le graphique camembert est désactivé.");
        return;
    }

    const totauxParCategorie = {};

    listeDesTransactions.forEach(function(transaction) {
        if (transaction.type !== "depense") return;

        const categorie = transaction.categorie || "autre";
        if (!totauxParCategorie[categorie]) {
            totauxParCategorie[categorie] = 0;
        }
        totauxParCategorie[categorie] += transaction.montant;
    });

    const categoriesPresentes = Object.keys(totauxParCategorie);

    if (categoriesPresentes.length === 0) {
        messageAucuneDepense.style.display = "block";
        if (graphiqueCamembertInstance) {
            graphiqueCamembertInstance.destroy();
            graphiqueCamembertInstance = null;
        }
        return;
    }

    messageAucuneDepense.style.display = "none";

    const labels = categoriesPresentes.map(function(cle) {
        return CATEGORIES[cle] || CATEGORIES.autre;
    });
    const donnees = categoriesPresentes.map(function(cle) {
        return totauxParCategorie[cle];
    });
    const couleurs = categoriesPresentes.map(function(cle) {
        return COULEURS_CATEGORIES[cle] || COULEURS_CATEGORIES.autre;
    });

    const contexte = document.getElementById("graphiqueCamembert").getContext("2d");

    if (graphiqueCamembertInstance) {
        graphiqueCamembertInstance.destroy();
    }

    graphiqueCamembertInstance = new Chart(contexte, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: donnees,
                backgroundColor: couleurs
            }]
        },
        options: {
            plugins: {
                legend: { position: "bottom", labels: { color: "#cdd6f4" } }
            }
        }
    });
}

// 7. Affiche la liste des prévisions mensuelles enregistrées
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

        // Gestion personnalisée du texte selon la périodicité du mois sélectionné
        let textePeriodicite = "/mois";
        if (prevision.mois !== "tous") {
            textePeriodicite = ` en ${NOMS_MOIS[parseInt(prevision.mois)]}`;
        }

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
        boutonSupprimer.addEventListener("click", function() {
            supprimerUnePrevision(prevision.id);
        });

        ligne.appendChild(conteneurTexte);
        ligne.appendChild(boutonSupprimer);
        listePrevisionsAffichage.appendChild(ligne);
    });
}

// 8. Ajoute une nouvelle prévision mensuelle ou ponctuelle
function ajouterUnePrevision() {
    const nom = inputNomPrevision.value.trim();
    const montant = parseFloat(inputMontantPrevision.value);

    if (nom === "" || isNaN(montant) || montant <= 0) {
        alert("Le nom doit être renseigné et le montant doit être un nombre positif ! 😉");
        return;
    }

    listeDesPrevisions.push({
        id: Date.now(),
        nom: nom,
        montant: montant,
        type: selectTypePrevision.value,
        categorie: selectCategoriePrevision.value,
        mois: selectMoisPrevision.value // On stocke la valeur ("tous", "0", "1" etc.)
    });

    localStorage.setItem("mesPrevisions", JSON.stringify(listeDesPrevisions));

    afficherPrevisions();
    rafraichirAffichage();

    inputNomPrevision.value = "";
    inputMontantPrevision.value = "";
    inputNomPrevision.focus();
}

// 9. Supprime une prévision précise
function supprimerUnePrevision(id) {
    listeDesPrevisions = listeDesPrevisions.filter(function(prevision) {
        return prevision.id !== id;
    });

    localStorage.setItem("mesPrevisions", JSON.stringify(listeDesPrevisions));

    afficherPrevisions();
    rafraichirAffichage();
}

// 10. LOGIQUE MAGIQUE CHANGER : Graphique de projection glissant et intelligent mois par mois
function mettreAJourGraphiqueProjection(soldeActuel) {
    if (typeof Chart === "undefined") {
        console.warn("Chart.js n'est pas chargé : le graphique de projection est désactivé.");
        return;
    }

    const labels = ["Aujourd'hui"];
    const donnees = [soldeActuel];

    // On récupère l'index du mois actuel de la machine de l'utilisateur (0 pour janvier, 5 pour juin, etc.)
    const moisActuelIndex = new Date().getMonth();

    let soldeProjete = soldeActuel;

    // On calcule l'évolution sur les 12 prochains mois glissants
    for (let i = 1; i <= 12; i++) {
        // Calcul du mois ciblé dans la boucle (0 à 11) grâce au modulo
        const moisCibleIndex = (moisActuelIndex + i - 1) % 12;

        let fluxDuMois = 0;

        // On parcourt les prévisions pour voir si elles s'appliquent au mois ciblé
        listeDesPrevisions.forEach(function(prevision) {
            // La prévision s'applique si elle est récurrente ("tous") OU si elle matche le mois pile
            if (prevision.mois === "tous" || parseInt(prevision.mois) === moisCibleIndex) {
                if (prevision.type === "revenu") {
                    fluxDuMois += prevision.montant;
                } else {
                    fluxDuMois -= prevision.montant;
                }
            }
        });

        soldeProjete += fluxDuMois;
        
        // On affiche le nom du mois réel sur l'axe X (ex: "Juillet", "Août"...)
        labels.push(NOMS_MOIS[moisCibleIndex]);
        donnees.push(Math.round(soldeProjete * 100) / 100);
    }

    const contexte = document.getElementById("graphiqueProjection").getContext("2d");

    if (graphiqueProjectionInstance) {
        graphiqueProjectionInstance.destroy();
    }

    graphiqueProjectionInstance = new Chart(contexte, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Solde projeté (€)",
                data: donnees,
                borderColor: "#3498db",
                backgroundColor: "rgba(52, 152, 219, 0.2)",
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            plugins: {
                legend: { labels: { color: "#cdd6f4" } }
            },
            scales: {
                x: { ticks: { color: "#cdd6f4" } },
                y: { ticks: { color: "#cdd6f4" } }
            }
        }
    });
}
