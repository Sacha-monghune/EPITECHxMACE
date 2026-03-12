function App() {
    return (
        <main className="board">
            <div className="column">
                <section className="box left-top">
                    <header className="box-title">Activiter</header>
                    <div className="box-content"></div>
                </section>

                <div className="left-bottom-wrapper">
                    <section className="box left-bottom">
                        <div className="box-content"></div>
                    </section>
                </div>

            </div>

            <div className="column">
                <section className="box right-main">
                    <div className="right-main-header">
                        <h4 className="titre">To do our reunion</h4>
                        <div className="logo-inline">
                            <img className="logo-image" src="logo_Kreol'inl2.png" alt="Logo Kreolink" />
                        </div>
                    </div>
                    <div className="box-carte"></div>
                </section>
            </div>
        </main>
    );
}

export default App;