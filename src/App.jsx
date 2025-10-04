import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <h1>Interactif Blob</h1>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            Compteur: {count}
          </button>
          <p>
            Modifiez <code>src/App.jsx</code> et sauvegardez pour tester HMR
          </p>
        </div>
        <p className="read-the-docs">
          Cliquez sur les logos Vite et React pour en savoir plus
        </p>
      </div>
    </>
  )
}

export default App
