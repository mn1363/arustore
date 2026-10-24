'use client'

import React, { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei/core/ContactShadows'
import { Environment } from '@react-three/drei/core/Environment'
import { Float } from '@react-three/drei/core/Float'
import { Lightformer } from '@react-three/drei/core/Lightformer'
import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import { Sparkles } from '@react-three/drei/core/Sparkles'
import * as THREE from 'three'
import { Model3DArchetype } from '@/types'
import { ProductMeshes3D } from './ProductMeshes3D'
import { WebGLErrorBoundary } from './WebGLErrorBoundary'

interface OrbitalPedestalProps {
  accentColor: string
}

function OrbitalPedestal({ accentColor }: OrbitalPedestalProps) {
  const outerRingRef = useRef<THREE.Mesh>(null)
  const innerRingRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (outerRingRef.current) outerRingRef.current.rotation.z += delta * 0.2
    if (innerRingRef.current) innerRingRef.current.rotation.z -= delta * 0.32
  })

  return (
    <group position={[0, -1.28, 0]}>
      {/* Dark Nero Marble Gallery Plinth Disc */}
      <mesh position={[0, -0.07, 0]}>
        <cylinderGeometry args={[1.38, 1.48, 0.12, 64]} />
        <meshPhysicalMaterial
          color="#0e1017"
          metalness={0.35}
          roughness={0.22}
          clearcoat={0.9}
        />
      </mesh>
      <mesh ref={outerRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <ringGeometry args={[1.35, 1.38, 64]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.48} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={innerRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]}>
        <ringGeometry args={[0.96, 0.98, 48]} />
        <meshBasicMaterial color="#e2e8f0" transparent opacity={0.22} side={THREE.DoubleSide} />
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
  accentColor = '#eab308',
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
        alt="3D Aluminum Render"
        className="max-h-full max-w-full object-contain drop-shadow-[0_25px_45px_rgba(245,158,11,0.25)] animate-float-slow"
      />
    </div>
  )

  return (
    <WebGLErrorBoundary fallback={fallbackNode}>
      <div className={className}>
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 0.55, 3.95], fov: 39 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            {/* Warm Gallery Metalwork Lighting Environment (Makes Aluminum & Gold Gleam!) */}
            <Environment resolution={256}>
              <group rotation={[-Math.PI / 3, 0, 1]}>
                <Lightformer
                  form="rect"
                  color="#ffffff"
                  intensity={4.5}
                  rotation-x={Math.PI / 2}
                  position={[0, 6, -8]}
                  scale={[8, 4, 1]}
                />
                <Lightformer
                  form="ring"
                  color={accentColor}
                  intensity={3.4}
                  rotation-y={Math.PI / 2}
                  position={[-6, 3, -1]}
                  scale={4.5}
                />
                <Lightformer
                  form="rect"
                  color="#fef3c7"
                  intensity={3}
                  rotation-y={-Math.PI / 2}
                  position={[8, 3, 2]}
                  scale={[9, 3, 1]}
                />
                <Lightformer
                  form="rect"
                  color="#cbd5e1"
                  intensity={2.2}
                  position={[0, -4, 4]}
                  scale={[6, 2, 1]}
                />
              </group>
            </Environment>

            <ambientLight intensity={0.62} />
            <spotLight
              position={[4.5, 6.5, 4]}
              angle={0.42}
              penumbra={0.85}
              intensity={2.6}
              color="#fffbeb"
            />
            <pointLight position={[-3.8, 2, 2.2]} intensity={2.1} color={accentColor} />
            <pointLight position={[3.5, 1, -2.5]} intensity={1.8} color="#e2e8f0" />

            <Float speed={1.5} rotationIntensity={0.14} floatIntensity={0.22}>
              <ProductMeshes3D
                archetype={archetype}
                bodyColor={bodyColor}
                accentColor={accentColor}
                exploded={exploded}
                wireframe={wireframe}
              />
            </Float>

            <OrbitalPedestal accentColor={accentColor} />

            <Sparkles
              count={28}
              scale={4.0}
              size={1.9}
              speed={0.28}
              opacity={0.42}
              color={accentColor}
            />

            <ContactShadows
              position={[0, -1.26, 0]}
              opacity={0.68}
              scale={5.5}
              blur={2.2}
              far={3.2}
            />

            <OrbitControls
              enablePan={false}
              enableZoom={allowZoom}
              minDistance={2.6}
              maxDistance={5.6}
              autoRotate={autoRotate}
              autoRotateSpeed={1.2}
              minPolarAngle={Math.PI / 5}
              maxPolarAngle={(Math.PI * 3) / 5}
            />
          </Suspense>
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  )
}
