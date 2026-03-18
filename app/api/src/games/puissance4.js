export function playMove(grille, indexColonne, joueur) {
    // Création d'une vraie copie de la grille (on copie chaque ligne)
    const nouvelleGrille = grille.map(ligne => [...ligne]);

    // parcourt la colonne en partant du BAS vers le HAUT
    for (let ligne = 5; ligne >= 0; ligne--) {

        // On regarde la case à l'intersection de notre ligne et de notre colonne
        if (nouvelleGrille[ligne][indexColonne] === null) {

            // La case est vide, on peut y faire tomber le pion
            nouvelleGrille[ligne][indexColonne] = joueur;

            // Le pion est posé, on renvoie la grille
            return nouvelleGrille;
        }
    }

    //Si la boucle se termine sans avoir trouvé de case vide, On renvoie la grille sans modification
    return grille;
}

export function calculateWinner(grille) {
    const lignes = 6;
    const colonnes = 7;

    // Vérification Horizontale 
    for (let l = 0; l < lignes; l++) {
        // On s'arrête à colonnes - 3, car il faut au moins 4 cases pour gagner
        for (let c = 0; c < colonnes - 3; c++) {
            if (grille[l][c] &&
                grille[l][c] === grille[l][c + 1] &&
                grille[l][c] === grille[l][c + 2] &&
                grille[l][c] === grille[l][c + 3]) {
                return grille[l][c]; // On retourne 'R' ou 'J'
            }
        }
    }

    // Vérification Verticale
    // On s'arrête à lignes - 3
    for (let l = 0; l < lignes - 3; l++) {
        for (let c = 0; c < colonnes; c++) {
            if (grille[l][c] &&
                grille[l][c] === grille[l + 1][c] &&
                grille[l][c] === grille[l + 2][c] &&
                grille[l][c] === grille[l + 3][c]) {
                return grille[l][c];
            }
        }
    }

    // Vérification Diagonale descendante (\)
    for (let l = 0; l < lignes - 3; l++) {
        for (let c = 0; c < colonnes - 3; c++) {
            if (grille[l][c] &&
                grille[l][c] === grille[l + 1][c + 1] &&
                grille[l][c] === grille[l + 2][c + 2] &&
                grille[l][c] === grille[l + 3][c + 3]) {
                return grille[l][c];
            }
        }
    }

    // Vérification Diagonale montante (/)
    for (let l = 3; l < lignes; l++) {
        for (let c = 0; c < colonnes - 3; c++) {
            if (grille[l][c] &&
                grille[l][c] === grille[l - 1][c + 1] &&
                grille[l][c] === grille[l - 2][c + 2] &&
                grille[l][c] === grille[l - 3][c + 3]) {
                return grille[l][c];
            }
        }
    }
    // Si aucune condition de victoire n'est remplie, on retourne null
    return null;
}