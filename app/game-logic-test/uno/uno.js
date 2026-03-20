export function createDeck() {
    const couleurs = ['rouge', 'bleu', 'vert', 'jaune'];
    // Toutes les cartes qui existent en double dans une couleur
    const valeursNormales = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '+2', 'inversion', 'passer'];

    const deck = [];

    // Création des cartes de couleur
    couleurs.forEach(couleur => {
        // Un seul '0' par couleur
        deck.push({ couleur, valeur: '0' });

        // Les autres cartes sont en double
        valeursNormales.forEach(valeur => {
            deck.push({ couleur, valeur });
            deck.push({ couleur, valeur });
        });
    });

    // Création des cartes noires (Joker et +4)
    // Il y en a 4 de chaque
    for (let i = 0; i < 4; i++) {
        deck.push({ couleur: 'noir', valeur: 'joker' });
        deck.push({ couleur: 'noir', valeur: '+4' });
    }

    // On pourrait mélanger le paquet ici, mais pour les tests c'est mieux de le garder trié !
    return deck;
}

export function distribuerCartes(deck, pseudosJoueurs) {
    // On copie le paquet pour ne pas détruire l'original
    const pioche = [...deck];

    // On mélange le paquet (Algorithme de Fisher-Yates, le meilleur pour mélanger)
    for (let i = pioche.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // On échange la carte 'i' avec une carte au hasard 'j'
        [pioche[i], pioche[j]] = [pioche[j], pioche[i]];
    }

    // On prépare les "mains" vides pour chaque joueur
    const mains = {};
    pseudosJoueurs.forEach(pseudo => {
        mains[pseudo] = []; // Un tableau vide pour commencer
    });

    // On distribue 7 cartes, une par une, à tour de rôle
    for (let tour = 0; tour < 7; tour++) {
        pseudosJoueurs.forEach(pseudo => {
            // .shift() prend la première carte du dessus du paquet et l'enlève de la pioche
            const carteTiree = pioche.shift();
            mains[pseudo].push(carteTiree);
        });
    }

    // On renvoie le résultat au serveur
    return {
        mains: mains,   // Les cartes que chaque joueur tient
        pioche: pioche  // Les cartes qui restent au milieu de la table
    };
}

export function peutJouerCarte(carteJouee, carteAuMilieu, couleurActive) {

    if (carteJouee.couleur === 'noir') {
        return true;
    }

    if (carteJouee.couleur === couleurActive) {
        return true;
    }

    // ex : 5 Vert sur 5 Rouge
    if (carteJouee.valeur === carteAuMilieu.valeur) {
        return true;
    }

    // Si on n'a validé aucune de ces règles, le coup est illégal 
    return false;
}