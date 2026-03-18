import { describe, it, expect } from 'vitest';
import { playMove, calculateWinner } from './puissance4.js';

describe('Logique du jeu Puissance 4', () => {

    it('devrait faire tomber le pion tout en bas d une colonne vide', () => {
        // Création d'une grille vide de 6 lignes et 7 colonnes
        const grilleVide = Array(6).fill(null).map(() => Array(7).fill(null));
        // Le joueur joue dans la colonne 0
        const nouvelleGrille = playMove(grilleVide, 0, 'R');
        // Le pion doit atterrir sur la ligne 5 de la colonne 0
        expect(nouvelleGrille[5][0]).toBe('R');
        // La case juste au-dessus doit toujours être vide
        expect(nouvelleGrille[4][0]).toBeNull();
    });

});

describe('Détection du gagnant', () => {

    it('devrait faire gagner R avec 4 pions alignés à l horizontale', () => {
        // On crée une grille vide
        const grille = Array(6).fill(null).map(() => Array(7).fill(null));

        // R a aligné 4 pions 
        grille[5][0] = 'R';
        grille[5][1] = 'R';
        grille[5][2] = 'R';
        grille[5][3] = 'R';

        // On demande qui a gagné
        const gagnant = calculateWinner(grille);

        // R doit être déclaré vainqueur
        expect(gagnant).toBe('R');
    });

    it('devrait retourner null si personne n a aligné 4 pions', () => {
        const grille = Array(6).fill(null).map(() => Array(7).fill(null));
        grille[5][0] = 'R';
        grille[5][1] = 'J'; // Un pion jaune bloque la ligne 
        grille[5][2] = 'R';
        grille[5][3] = 'R';

        const gagnant = calculateWinner(grille);
        expect(gagnant).toBeNull();
    });

});