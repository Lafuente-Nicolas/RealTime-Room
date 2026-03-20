export const createDeck = () => {
    const couleurs = ['rouge', 'bleu', 'vert', 'jaune'];
    const valeursNormales = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '+2', 'inversion', 'passer'];
    const deck = [];

    couleurs.forEach(couleur => {
        deck.push({ couleur, valeur: '0' }); // Un seul '0' par couleur
        valeursNormales.forEach(valeur => {
            deck.push({ couleur, valeur });
            deck.push({ couleur, valeur }); // Les autres en double
        });
    });

    // Cartes noires (4 jokers, 4 +4)
    for (let i = 0; i < 4; i++) {
        deck.push({ couleur: 'noir', valeur: 'joker' });
        deck.push({ couleur: 'noir', valeur: '+4' });
    }

    return deck;
};

export const distribuerCartes = (deck, pseudosJoueurs) => {
    const pioche = [...deck];

    // Mélange (Fisher-Yates)
    for (let i = pioche.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pioche[i], pioche[j]] = [pioche[j], pioche[i]];
    }

    const mains = {};
    pseudosJoueurs.forEach(pseudo => mains[pseudo] = []);

    // Distribution (7 cartes par joueur)
    for (let tour = 0; tour < 7; tour++) {
        pseudosJoueurs.forEach(pseudo => {
            mains[pseudo].push(pioche.shift());
        });
    }

    return { mains, pioche };
};

// Version ultra-propre et optimisée
export const peutJouerCarte = (carteJouee, carteAuMilieu, couleurActive) => {
    return (
        carteJouee.couleur === 'noir' ||
        carteJouee.couleur === couleurActive ||
        carteJouee.valeur === carteAuMilieu.valeur
    );
};