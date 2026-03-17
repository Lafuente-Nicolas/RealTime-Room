import { describe, it, expect } from 'vitest';
import { playRound } from './game.js';

describe('Logique du jeu Pierre-Feuille-Ciseaux', () => {
    it('devrait faire gagner le Joueur 1 si Pierre affronte Ciseaux', () => {
        // éxécution de la fonction
        const resultat = playRound('pierre', 'ciseaux');

        // vérification du résultat
        expect(resultat).toBe('Joueur 1 gagne');
    });
    it('devrait faire gagner le Joueur 1 si Feuille affronte Pierre', () => {
        const resultat = playRound('feuille', 'pierre');
        expect(resultat).toBe('Joueur 1 gagne');
    });
    it('devrait faire gagner le Joueur 1 si Ciseaux affronte Feuille', () => {
        const resultat = playRound('ciseaux', 'feuille');
        expect(resultat).toBe('Joueur 1 gagne');
    });
    it('devrait retourner null si les deux joueurs font le même choix', () => {
        const resultat = playRound('pierre', 'pierre');
        expect(resultat).toBeNull();
    });
    it('devrait retourner null si les deux joueurs font le même choix', () => {
        const resultat = playRound('feuille', 'feuille');
        expect(resultat).toBeNull();
    });
    it('devrait retourner null si les deux joueurs font le même choix', () => {
        const resultat = playRound('ciseaux', 'ciseaux');
        expect(resultat).toBeNull();
    });
    it('devrait faire gagner le Joueur 2 si Pierre affronte Feuille', () => {
        const resultat = playRound('pierre', 'feuille');
        expect(resultat).toBe('Joueur 2 gagne');
    });
    it('devrait faire gagner le Joueur 2 si Feuille affronte Ciseaux', () => {
        const resultat = playRound('feuille', 'ciseaux');
        expect(resultat).toBe('Joueur 2 gagne');
    });
    it('devrait faire gagner le Joueur 2 si Ciseaux affronte Pierre', () => {
        const resultat = playRound('ciseaux', 'pierre');
        expect(resultat).toBe('Joueur 2 gagne');
    });
});