export const playMove = (plateau, caseIndex, joueur) => {
    // Coup illégal si la case est déjà prise
    if (plateau[caseIndex] !== null) return plateau;

    const nouveauPlateau = [...plateau];
    nouveauPlateau[caseIndex] = joueur;

    return nouveauPlateau;
};

export const calculateWinner = (plateau) => {
    const lignesGagnantes = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontales
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Verticales
        [0, 4, 8], [2, 4, 6]             // Diagonales
    ];

    for (const [a, b, c] of lignesGagnantes) {
        if (plateau[a] && plateau[a] === plateau[b] && plateau[a] === plateau[c]) {
            return plateau[a];
        }
    }

    return null;
};