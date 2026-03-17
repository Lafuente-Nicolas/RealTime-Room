export function playMove(plateau, caseIndex, joueur) {

    if (plateau[caseIndex] !== null) {
        return plateau;
    }

    const nouveauPlateau = [...plateau];
    nouveauPlateau[caseIndex] = joueur;

    return nouveauPlateau;
}

export function calculateWinner(plateau) {
    // On liste des 8 combinaisons de cases qui font gagner
    const lignesGagnantes = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    // On vérifie chaque ligne gagnante une par une
    for (let i = 0; i < lignesGagnantes.length; i++) {
        const [a, b, c] = lignesGagnantes[i];

        // Si la case 'a' n'est pas vide, ET qu'elle est égale à 'b', ET égale à 'c'
        if (plateau[a] && plateau[a] === plateau[b] && plateau[a] === plateau[c]) {
            // Alors on a un gagnant 
            return plateau[a];
        }
    }
    // Si on a vérifié toutes les lignes et que personne n'a gagné, on retourne null
    return null;
}