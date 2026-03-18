export default function Morpion({ board, playMorpion, handleCancelGame }) {
    return (
        <div className="chat__morpion-container">
            <span className="chat__game-label">Morpion :</span>
            <div className="chat__morpion-grid">
                {board.map((cell, index) => (
                    <button
                        key={index}
                        className="chat__morpion-cell"
                        onClick={() => playMorpion(index)}
                    >
                        {cell}
                    </button>
                ))}
            </div>
            <button onClick={() => handleCancelGame('morpion')} className="chat__game-btn chat__game-btn--cancel">✖</button>
        </div>
    );
}