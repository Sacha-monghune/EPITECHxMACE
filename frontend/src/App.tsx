import Map from "./components/Map"

function App() {
  return (
    <div className="flex h-screen w-screen bg-[radial-gradient(circle_at_top_left,_#fffaf2,_#eef2f6_42%,_#e2e8f0_100%)] p-5">
      <aside className="h-full w-2/7 rounded-[2rem] border border-white/80 bg-white/68 shadow-[0_18px_50px_rgba(148,163,184,0.16)] backdrop-blur-sm">
      </aside>
      <main className="h-full w-5/7 p-3">
        <Map />
      </main>
    </div>
  )
}

export default App
