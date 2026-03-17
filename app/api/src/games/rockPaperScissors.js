export function playRound(joueur1, joueur2) {

    const victoiresJoueur1 = [
        { j1: 'pierre', j2: 'ciseaux' },
        { j1: 'feuille', j2: 'pierre' },
        { j1: 'ciseaux', j2: 'feuille' }
    ];

    const joueur1Gagne = victoiresJoueur1.some(
        combo => combo.j1 === joueur1 && combo.j2 === joueur2
    );

    if (joueur1Gagne) {
        return 'Joueur 1 gagne';
    }
    const victoiresJoueur2 = [
        { j1: 'pierre', j2: 'feuille' },
        { j1: 'feuille', j2: 'ciseaux' },
        { j1: 'ciseaux', j2: 'pierre' }
    ];
    const joueur2Gagne = victoiresJoueur2.some(
        combo => combo.j1 === joueur1 && combo.j2 === joueur2
    );

    if (joueur2Gagne) {
        return 'Joueur 2 gagne';
    }

    const MatchNul = joueur1 === joueur2;
    if (MatchNul) {
        return null;
    }

    return null;
}