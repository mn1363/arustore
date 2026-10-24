'use client'

import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei/core/ContactShadows'
import { Environment } from '@react-three/drei/core/Environment'
import { Lightformer } from '@react-three/drei/core/Lightformer'
import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import { Model3DArchetype } from '@/types'
import { ProductMeshes3D } from './ProductMeshes3D'
import { WebGLErrorBoundary } from './WebGLErrorBoundary'

function StudioPedestal() {
  return (
    <group position={[0, -1.28, 0]}>
      <mesh position={[0, -0.07, 0]}>
        <cylinderGeometry args={[1.38, 1.46, 0.12, 64]} />
        <meshStandardMaterial
          color="#17191e"
          metalness={0.2}
          roughness={0.65}
        />
      </mesh>
    </group>
  )
}

export interface StudioScene3DProps {
  archetype: Model3DArchetype
  bodyColor?: string
  accentColor?: string
  exploded?: boolean
  wireframe?: boolean
  autoRotate?: boolean
  allowZoom?: boolean
  fallbackImage?: string
  className?: string
}

export default function StudioScene3D({
  archetype,
  bodyColor = '#d8dee9',
  accentColor = '#d6b88a',
  exploded = false,
  wireframe = false,
  autoRotate = true,
  allowZoom = false,
  fallbackImage = '/images/products/tiered-stand.png',
  className = 'w-full h-full',
}: StudioScene3DProps) {
  const fallbackNode = (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      <img
        src={fallbackImage}
        alt="Aluminum Product"
        className="max-h-full max-w-full object-contain"
      />
    </div>
  )

  return (
    <WebGLErrorBoundary fallback={fallbackNode}>
      <div className={className}>
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 0.52, 3.95], fov: 38 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            <Environment resolution={256}>
              <group rotation={[-Math.PI / 3, 0, 1]}>
                <Lightformer
                  form="rect"
                  color="#ffffff"
                  intensity={4.2}
                  rotation-x={Math.PI / 2}
                  position={[0, 6, -8]}
                  scale={[9, 4, 1]}
                />
                <Lightformer
                  form="rect"
                  color="#f6ead7"
                  intensity={2.8}
                  rotation-y={Math.PI / 2}
                  position={[-6, 3, -1]}
                  scale={[5, 3, 1]}
                />
                <Lightformer
                  form="rect"
                  color="#e5e7eb"
                  intensity={2.6}
                  rotation-y={-Math.PI / 2}
                  position={[8, 3, 2]}
                  scale={[8, 3, 1]}
                />
                <Lightformer
                  form="rect"
                  color="#cbd5e1"
                  intensity={1.8}
                  position={[0, -4, 4]}
                  scale={[6, 2, 1]}
                />
              </group>
            </Environment>

            <ambientLight intensity={0.58} />
            <spotLight
              position={[4.5, 6.5, 4]}
              angle={0.42}
              penumbra={0.85}
              intensity={2.3}
              color="#fffaf0"
            />
            <pointLight position={[-3.8, 2, 2.2]} intensity={1.6} color={accentColor} />
            <pointLight position={[3.5, 1, -2.5]} intensity={1.5} color="#e2e8f0" />

            <ProductMeshes3D
              archetype={archetype}
              bodyColor={bodyColor}
              accentColor={accentColor}
              exploded={exploded}
              wireframe={wireframe}
            />

            <StudioPedestal />

            <ContactShadows
              position={[0, -1.21, 0]}
              opacity={0.62}
              scale={5.2}
              blur={2.0}
              far={3.0}
            />

            <OrbitControls
              enablePan={false}
              enableZoom={allowZoom}
              minDistance={2.6}
              maxDistance={5.6}
              autoRotate={autoRotate}
              autoRotateSpeed={0.85}
              minPolarAngle={Math.PI / 5}
              maxPolarAngle={(Math.PI * 3) / 5}
            />
          </Suspense>
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  )
}
