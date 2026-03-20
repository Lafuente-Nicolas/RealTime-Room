export const playMove = (grille, indexColonne, joueur) => {
    const nouvelleGrille = grille.map(ligne => [...ligne]);

    // On parcourt la colonne de bas en haut
    for (let ligne = 5; ligne >= 0; ligne--) {
        if (nouvelleGrille[ligne][indexColonne] === null) {
            nouvelleGrille[ligne][indexColonne] = joueur;
            return nouvelleGrille;
        }
    }

    return grille; // Colonne pleine, on renvoie à l'identique
};

export const calculateWinner = (grille) => {
    const lignes = 6;
    const colonnes = 7;

    // Fonction utilitaire pour vérifier si 4 cases sont identiques et non vides
    const checkLine = (c1, c2, c3, c4) => {
        return c1 !== null && c1 === c2 && c1 === c3 && c1 === c4;
    };

    for (let l = 0; l < lignes; l++) {
        for (let c = 0; c < colonnes; c++) {
            const cellule = grille[l][c];
            if (!cellule) continue; // Si la case est vide, on passe à la suivante

            // Horizontale
            if (c <= colonnes - 4 && checkLine(cellule, grille[l][c + 1], grille[l][c + 2], grille[l][c + 3])) return cellule;

            // Verticale
            if (l <= lignes - 4 && checkLine(cellule, grille[l + 1][c], grille[l + 2][c], grille[l + 3][c])) return cellule;

            // Diagonale descendante (\)
            if (l <= lignes - 4 && c <= colonnes - 4 && checkLine(cellule, grille[l + 1][c + 1], grille[l + 2][c + 2], grille[l + 3][c + 3])) return cellule;

            // Diagonale montante (/)
            if (l >= 3 && c <= colonnes - 4 && checkLine(cellule, grille[l - 1][c + 1], grille[l - 2][c + 2], grille[l - 3][c + 3])) return cellule;
        }
    }

    return null;
};