export default function Shifumi({ playGame, handleCancelGame }) {
    return (
        <>
            <span className="chat__game-label">Shifumi :</span>
            <button onClick={() => playGame('pierre')} className="chat__game-btn">🪨 Pierre</button>
            <button onClick={() => playGame('feuille')} className="chat__game-btn">📄 Feuille</button>
            <button onClick={() => playGame('ciseaux')} className="chat__game-btn">✂️ Ciseaux</button>
            <button onClick={() => handleCancelGame('shifumi')} className="chat__game-btn chat__game-btn--cancel">✖</button>
        </>
    );
}