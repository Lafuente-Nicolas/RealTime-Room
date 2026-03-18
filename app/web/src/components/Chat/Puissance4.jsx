export default function Puissance4({ board, playPuissance4, handleCancelGame }) {
    return (
        <div className="chat__p4-wrapper">
            <span className="chat__game-label">Puissance 4 :</span>

            <div className="chat__p4-grid">
                {board.map((ligne, rowIndex) => (
                    ligne.map((cellule, colIndex) => (
                        <button
                            key={`${rowIndex}-${colIndex}`}
                            className="chat__p4-cell"
                            data-color={cellule}
                            onClick={() => playPuissance4(colIndex)}
                        >
                        </button>
                    ))
                ))}
            </div>

            <button onClick={() => handleCancelGame('puissance4')} className="chat__game-btn chat__game-btn--cancel">✖</button>
        </div>
    );
}