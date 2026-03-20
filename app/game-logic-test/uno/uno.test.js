import { describe, it, expect } from 'vitest';
import { createDeck, distribuerCartes, peutJouerCarte } from './uno.js';

describe('Logique de préparation du UNO', () => {

    it('devrait générer un paquet complet de 108 cartes', () => {
        const deck = createDeck();

        // Un deck de UNO a 108 cartes
        expect(deck.length).toBe(108);

        // Il doit y avoir exactement 4 zéros (un par couleur)
        const zeros = deck.filter(carte => carte.valeur === '0');
        expect(zeros.length).toBe(4);

        // Il doit y avoir exactement 4 jokers normaux
        const jokers = deck.filter(carte => carte.valeur === 'joker');
        expect(jokers.length).toBe(4);
    });

    it('devrait distribuer 7 cartes à 4 joueurs et préparer la pioche', () => {
        const deck = createDeck();
        const pseudos = ['Nico', 'Bob', 'Alice', 'Charlie'];

        const resultat = distribuerCartes(deck, pseudos);

        // Chaque joueur doit avoir exactement 7 cartes
        expect(resultat.mains['Nico'].length).toBe(7);
        expect(resultat.mains['Bob'].length).toBe(7);
        expect(resultat.mains['Alice'].length).toBe(7);
        expect(resultat.mains['Charlie'].length).toBe(7);

        // 108 - (4 * 7) = 80 cartes restantes dans la pioche
        expect(resultat.pioche.length).toBe(80);
    });

});

describe('Règles de pose des cartes (peutJouerCarte)', () => {

    it('devrait valider une carte de la même couleur', () => {
        const carteJouee = { couleur: 'rouge', valeur: '5' };
        const carteAuMilieu = { couleur: 'rouge', valeur: '9' };
        // Le 3ème paramètre est la couleur active sur la table
        expect(peutJouerCarte(carteJouee, carteAuMilieu, 'rouge')).toBe(true);
    });

    it('devrait valider une carte de la même valeur (ex: 5 Vert sur 5 Rouge)', () => {
        const carteJouee = { couleur: 'vert', valeur: '5' };
        const carteAuMilieu = { couleur: 'rouge', valeur: '5' };
        expect(peutJouerCarte(carteJouee, carteAuMilieu, 'rouge')).toBe(true);
    });

    it('devrait valider un Joker ou un +4 sur n importe quoi', () => {
        const carteJouee = { couleur: 'noir', valeur: '+4' };
        const carteAuMilieu = { couleur: 'bleu', valeur: '7' };
        expect(peutJouerCarte(carteJouee, carteAuMilieu, 'bleu')).toBe(true);
    });

    it('devrait refuser une carte qui n a ni la bonne couleur, ni la bonne valeur', () => {
        const carteJouee = { couleur: 'vert', valeur: '2' };
        const carteAuMilieu = { couleur: 'jaune', valeur: '8' };
        expect(peutJouerCarte(carteJouee, carteAuMilieu, 'jaune')).toBe(false);
    });
});
