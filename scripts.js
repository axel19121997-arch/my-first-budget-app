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
const boutonAjouterPrevision = document.getElementById("btnAjouterPrevision");
const listePrevisionsAffichage = document.getElementById("listePrevisions");
const messageAucunePrevision = document.getElementById("messageAucunePrevision");
const messageAucuneDepense = document.getElementById("messageAucuneDepense");

// Couleur attribuée à chaque catégorie, utilisée dans le camembert
const COULEURS_CATEGORIES = {
    alimentation: "#f39c12", // Orange
    transport: "#3498db",    // Bleu
    logement: "#9b59b6",     // Violet
    loisirs: "#e67e22",      // Orange foncé
    sante: "#1abc9c",        // Turquoise
    assurance: "#e74c3c",    // Rouge
    abonnements: "#34495e",  // Bleu nuit
    impots: "#d35400",       // Rouille
    epargne: "#27ae60",      // Vert foncé
    animaux: "#a0522d",      // Marron
    salaire: "#2ecc71",      // Vert clair
    autre: "#7f8c8d"         // Gris
};

// On garde une référence aux graphiques pour pouvoir les détruire/recréer proprement
let graphiqueCamembertInstance = null;
let graphiqueProjectionInstance = null;

// Dictionnaire pour afficher un joli label (emoji + texte) à partir de la valeur stockée
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

// --- PERSONNALISATION DU PRÉNOM (sans popup bloquante) ---
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

// --- MIGRATION : catégories supprimées (ex: "shopping", "cadeaux") basculent vers "autre" ---
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
// Branchés AVANT le premier rendu, pour qu'ils fonctionnent même si l'affichage initial rencontre un souci
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

// On restaure tout l'affichage au démarrage (historique + prévisions + graphiques)
rafraichirAffichage();
afficherPrevisions();

// 2. Fonction pour afficher la liste et calculer le solde
function rafraichirAffichage() {
    let argentTotal = 0;
    listeHistorique.innerHTML = "";

    const categorieChoisie = selectFiltre.value;

    listeDesTransactions.forEach(function(transaction) {
        // Le solde total prend TOUJOURS en compte l'ensemble des transactions,
        // peu importe le filtre actif (le filtre ne change que l'affichage de la liste)
        if (transaction.type === "revenu") {
            argentTotal += transaction.montant;
        } else {
            argentTotal -= transaction.montant;
        }

        // Si un filtre est actif et ne correspond pas, on n'affiche pas la ligne
        if (categorieChoisie !== "toutes" && transaction.categorie !== categorieChoisie) {
            return;
        }

        const nouvelleLigne = document.createElement("li");

        // .toFixed(2) transforme le montant en texte avec 2 décimales (ex: 5 devient 5.00)
        const montantFormate = transaction.montant.toFixed(2);

        // --- Conteneur texte (nom + montant) ---
        const conteneurTexte = document.createElement("div");
        conteneurTexte.className = "ligneTransaction";

        const spanNom = document.createElement("span");
        spanNom.textContent = transaction.nom; // textContent => pas d'injection HTML possible

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

        // --- Bouton supprimer (par transaction) ---
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

    // On applique aussi .toFixed(2) sur le solde total global
    soldeAffichage.textContent = argentTotal.toFixed(2);

    if (argentTotal >= 0) {
        soldeAffichage.style.color = "#2ecc71";
    } else {
        soldeAffichage.style.color = "#e74c3c";
    }

    // Les deux graphiques dépendent du solde / des dépenses : on les met à jour ici
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
        id: Date.now(), // identifiant unique pour pouvoir cibler/supprimer cette transaction précise
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
    // On demande une confirmation pour éviter les erreurs d'inattention
    const confirmer = confirm("Es-tu sûr de vouloir supprimer tout ton historique ?");

    if (confirmer) {
        listeDesTransactions = [];
        localStorage.removeItem("mesTransactions");
        rafraichirAffichage();
    }
}

// 6. Graphique camembert : répartition des dépenses réelles par catégorie
function mettreAJourGraphiqueCamembert() {
    // Sécurité : si Chart.js n'a pas pu se charger (pas d'internet, CDN bloqué...),
    // on arrête juste cette fonction au lieu de planter tout le reste du script
    if (typeof Chart === "undefined") {
        console.warn("Chart.js n'est pas chargé : le graphique camembert est désactivé.");
        return;
    }

    // On additionne les dépenses (type "depense" uniquement) par catégorie
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

    // Si on n'a aucune dépense, on affiche un message plutôt qu'un graphique vide
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

    // On détruit l'ancien graphique avant d'en recréer un (sinon Chart.js superpose les anciens)
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

        if (prevision.type === "revenu") {
            spanMontant.className = "plus";
            spanMontant.textContent = `+${montantFormate} €/mois`;
        } else {
            spanMontant.className = "moins";
            spanMontant.textContent = `-${montantFormate} €/mois`;
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

// 8. Ajoute une nouvelle prévision mensuelle (récurrente chaque mois)
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
        categorie: selectCategoriePrevision.value
    });

    localStorage.setItem("mesPrevisions", JSON.stringify(listeDesPrevisions));

    afficherPrevisions();
    rafraichirAffichage(); // recalcule aussi le graphique de projection

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

// 10. Graphique de projection : solde actuel + impact cumulé des prévisions sur 12 mois
function mettreAJourGraphiqueProjection(soldeActuel) {
    // Même sécurité que pour le camembert
    if (typeof Chart === "undefined") {
        console.warn("Chart.js n'est pas chargé : le graphique de projection est désactivé.");
        return;
    }

    // Net mensuel = somme des revenus prévus - somme des dépenses prévues
    let netMensuel = 0;
    listeDesPrevisions.forEach(function(prevision) {
        if (prevision.type === "revenu") {
            netMensuel += prevision.montant;
        } else {
            netMensuel -= prevision.montant;
        }
    });

    // On construit 13 points : "Aujourd'hui", puis "Mois 1" à "Mois 12"
    const labels = ["Aujourd'hui"];
    const donnees = [soldeActuel];

    let soldeProjete = soldeActuel;
    for (let mois = 1; mois <= 12; mois++) {
        soldeProjete += netMensuel;
        labels.push(`Mois ${mois}`);
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
