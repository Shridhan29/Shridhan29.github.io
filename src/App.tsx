import { Canvas } from '@react-three/fiber'

// Phase 0 smoke test only. Replaced in Phase 1 by the DOM sections and in
// Phase 2 by the real fixed-position canvas shell.
export default function App() {
  return (
    <main className="grid min-h-dvh place-items-center">
      <div className="text-center">
        <h1 className="font-display text-4xl tracking-tight">Shridhan Vidhate</h1>
        <p className="mt-2 text-sm text-mist">Portfolio — build pipeline online.</p>
        <div className="mx-auto mt-8 h-56 w-56">
          <Canvas camera={{ position: [0, 0, 3.2] }}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[3, 4, 5]} intensity={2} />
            <mesh rotation={[0.5, 0.5, 0]}>
              <boxGeometry />
              <meshStandardMaterial color="#4d7cfe" roughness={0.3} metalness={0.4} />
            </mesh>
          </Canvas>
        </div>
      </div>
    </main>
  )
}
