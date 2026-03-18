import { describe, it, expect } from 'vitest';
import { playMove, calculateWinner } from './morpion.js';

describe('Logique du jeu Morpion', () => {

    it('devrait placer le symbole X sur la case 0', () => {
        // On crée un plateau vide de 9 cases
        const plateauVide = [null, null, null, null, null, null, null, null, null];

        // Le joueur 'X' joue sur la case 0
        const nouveauPlateau = playMove(plateauVide, 0, 'X');

        // On vérifie que la case 0 contient bien 'X'
        expect(nouveauPlateau[0]).toBe('X');
    });
    it('ne devrait pas modifier le plateau si la case est déjà prise', () => {
        // On crée un plateau où la case 0 est déjà prise par 'O'
        const plateauPris = ['O', null, null, null, null, null, null, null, null];

        // Le joueur 'X' essaie de jouer sur la case 0
        const resultat = playMove(plateauPris, 0, 'X');

        // La case 0 doit TOUJOURS être 'O', elle n'a pas changé
        expect(resultat[0]).toBe('O');
    })
});
describe('Détection du gagnant (calculateWinner)', () => {

    it('devrait faire gagner X sur la première ligne horizontale', () => {

        const plateauGagnant = [
            'X', 'X', 'X',
            null, 'O', null,
            'O', null, null
        ];

        const gagnant = calculateWinner(plateauGagnant);

        expect(gagnant).toBe('X');
    });

    it('devrait retourner null si personne n a encore gagné', () => {
        const plateauEnCours = [
            'X', 'O', null,
            null, 'X', null,
            'O', null, null
        ];

        const gagnant = calculateWinner(plateauEnCours);

        expect(gagnant).toBeNull();
    });
});