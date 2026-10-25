'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei/core/ContactShadows'
import { Environment } from '@react-three/drei/core/Environment'
import { Float } from '@react-three/drei/core/Float'
import { Lightformer } from '@react-three/drei/core/Lightformer'
import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import * as THREE from 'three'
import { Model3DArchetype } from '@/types'
import { ProductMeshes3D } from './ProductMeshes3D'
import { WebGLErrorBoundary } from './WebGLErrorBoundary'

function SanctuaryPedestal({
  accentColor,
  isMobile,
}: {
  accentColor: string
  isMobile: boolean
}) {
  const segments = isMobile ? 36 : 64
  return (
    <group position={[0, -1.28, 0]}>
      {/* Upper sculpted obsidian display plinth */}
      <mesh position={[0, -0.055, 0]}>
        <cylinderGeometry args={[1.32, 1.42, 0.1, segments]} />
        <meshPhysicalMaterial
          color="#121623"
          metalness={0.35}
          roughness={0.38}
          clearcoat={0.65}
        />
      </mesh>

      {/* Lower stepped floating stone base */}
      <mesh position={[0, -0.145, 0]}>
        <cylinderGeometry args={[1.46, 1.54, 0.06, segments]} />
        <meshStandardMaterial color="#0b0d15" metalness={0.25} roughness={0.6} />
      </mesh>

      {/* Inlaid champagne metallic bevel ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.003, 0]}>
        <ringGeometry args={[1.27, 1.305, segments]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Subtle inner moonlit alignment ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
        <ringGeometry args={[0.88, 0.895, segments]} />
        <meshBasicMaterial
          color="#9ec0f0"
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
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
  accentColor = '#dfc08e',
  exploded = false,
  wireframe = false,
  autoRotate = true,
  allowZoom = false,
  fallbackImage = '/images/products/tiered-stand.png',
  className = 'w-full h-full',
}: StudioScene3DProps) {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mqMobile = window.matchMedia('(max-width: 767px)')
    const sync = () => {
      setReducedMotion(mqMotion.matches)
      setIsMobile(mqMobile.matches)
    }
    sync()
    mqMotion.addEventListener('change', sync)
    mqMobile.addEventListener('change', sync)
    return () => {
      mqMotion.removeEventListener('change', sync)
      mqMobile.removeEventListener('change', sync)
    }
  }, [])

  const fallbackNode = (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      <img
        src={fallbackImage}
        alt="Aluminum Product"
        className="max-h-full max-w-full object-contain drop-shadow-[0_24px_40px_rgba(0,0,0,0.75)]"
      />
    </div>
  )

  const productNode = (
    <ProductMeshes3D
      archetype={archetype}
      bodyColor={bodyColor}
      accentColor={accentColor}
      exploded={exploded}
      wireframe={wireframe}
    />
  )

  return (
    <WebGLErrorBoundary fallback={fallbackNode}>
      <div className={className}>
        <Canvas
          dpr={isMobile ? [1, 1.35] : [1, 2]}
          camera={{ position: [0, 0.54, 3.95], fov: 38 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            {/* Coherent Fantasy-Studio Dual Rim Lighting (Warm Champagne + Moonlit Aether) */}
            <Environment resolution={isMobile ? 128 : 256}>
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
                  form="ring"
                  color={accentColor}
                  intensity={2.9}
                  rotation-y={Math.PI / 2}
                  position={[-6, 3, -1]}
                  scale={4.2}
                />
                <Lightformer
                  form="rect"
                  color="#cfe0ff"
                  intensity={2.7}
                  rotation-y={-Math.PI / 2}
                  position={[8, 3, 2]}
                  scale={[8, 3, 1]}
                />
                <Lightformer
                  form="rect"
                  color="#cbd5e1"
                  intensity={1.7}
                  position={[0, -4, 4]}
                  scale={[6, 2, 1]}
                />
              </group>
            </Environment>

            <ambientLight intensity={0.56} />
            <spotLight
              position={[4.5, 6.5, 4]}
              angle={0.42}
              penumbra={0.85}
              intensity={2.4}
              color="#fff9ed"
            />
            <pointLight position={[-3.8, 2, 2.2]} intensity={1.75} color={accentColor} />
            <pointLight position={[3.6, 1.4, -2.5]} intensity={1.55} color="#9ec0f0" />

            {reducedMotion || isMobile ? (
              productNode
            ) : (
              <Float speed={1.15} rotationIntensity={0.06} floatIntensity={0.14}>
                {productNode}
              </Float>
            )}

            <SanctuaryPedestal accentColor={accentColor} isMobile={isMobile} />

            <ContactShadows
              position={[0, -1.2, 0]}
              opacity={0.68}
              scale={5.2}
              blur={2.1}
              far={3.0}
              frames={isMobile ? 1 : Infinity}
            />

            <OrbitControls
              enablePan={false}
              enableZoom={allowZoom}
              minDistance={2.6}
              maxDistance={5.6}
              autoRotate={autoRotate && !reducedMotion}
              autoRotateSpeed={0.72}
              minPolarAngle={Math.PI / 5}
              maxPolarAngle={(Math.PI * 3) / 5}
            />
          </Suspense>
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  )
}
