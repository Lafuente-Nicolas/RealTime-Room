import Header from "../components/Header/Header";
import Hero from "../components/Hero/Hero";
import Card from "../components/Card/Card";
import Sidebar from "../components/Sidebar/Sidebar";
import ChatBox from "../components/ChatBox/ChatBox";
import Footer from "../components/Footer/Footer";

export default function Home() {
    return (
        <div className="page">
            <Header />

            <main className="page__main">
                <Hero />

                <section className="page__content">
                    <Card />
                    <Sidebar />
                </section>

                <ChatBox />
            </main>

            <Footer />
        </div>
    );
}
