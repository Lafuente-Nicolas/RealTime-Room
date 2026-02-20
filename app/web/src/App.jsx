import { useState } from "react";
import Home from "./pages/Home";
import Chat from "./components/Chat/Chat";
import "./styles/main.scss";

export default function App() {
  const [session, setSession] = useState(null);

  return (
    <div className="app">
      {!session ? (
        <Home onJoin={setSession} />
      ) : (
        <Chat session={session} />
      )}
    </div>
  );
}
