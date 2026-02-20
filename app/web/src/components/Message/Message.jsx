export default function Message({ msg = {}, self }) {
    if (msg.system) {
        return <div className="message message--system">{msg.message}</div>;
    }

    const date = msg.date
        ? new Date(msg.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "";

    return (
        <div className={`message ${self ? "message--self" : ""}`}>
            <div className="message__meta">
                <span className="message__author">{msg.pseudo || "Anon"}</span>
                {date && <span className="message__time">{date}</span>}
            </div>

            <p className="message__text">{msg.message}</p>
        </div>
    );
}
