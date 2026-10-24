'use client'

import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei/core/RoundedBox'
import * as THREE from 'three'
import { Model3DArchetype } from '@/types'

export interface ProductMeshProps {
  archetype: Model3DArchetype
  bodyColor?: string
  accentColor?: string
  exploded?: boolean
  wireframe?: boolean
}

function makePlateGeo(radius: number, depth = 0.07): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(radius * 0.68, 0),
    new THREE.Vector2(radius * 0.86, depth * 0.65),
    new THREE.Vector2(radius, depth),
    new THREE.Vector2(radius * 0.98, depth + 0.022),
    new THREE.Vector2(radius * 0.84, depth * 0.68 + 0.02),
    new THREE.Vector2(0, 0.022),
  ]
  return new THREE.LatheGeometry(pts, 64)
}

function makeBowlGeo(radius: number, height: number): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = []
  const steps = 20
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const r = Math.pow(t, 0.68) * radius
    const y = Math.pow(t, 1.45) * height
    pts.push(new THREE.Vector2(r, y))
  }
  // Thickness return path
  for (let i = steps; i >= 0; i--) {
    const t = i / steps
    const r = Math.max(0, Math.pow(t, 0.68) * (radius - 0.045))
    const y = Math.pow(t, 1.45) * height + 0.035
    pts.push(new THREE.Vector2(r, y))
  }
  return new THREE.LatheGeometry(pts, 64)
}

function makeDomeGeo(radius: number, height: number): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = []
  const steps = 18
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const angle = (t * Math.PI) / 2
    const r = Math.cos(angle) * radius
    const y = Math.sin(angle) * height
    pts.push(new THREE.Vector2(r, y))
  }
  return new THREE.LatheGeometry(pts, 56)
}

function makePedestalGeo(baseR: number, topR: number, height: number): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(baseR, 0),
    new THREE.Vector2(baseR * 0.95, height * 0.12),
    new THREE.Vector2(baseR * 0.52, height * 0.35),
    new THREE.Vector2(topR * 0.72, height * 0.72),
    new THREE.Vector2(topR, height),
    new THREE.Vector2(0, height),
  ]
  return new THREE.LatheGeometry(pts, 56)
}

export function ProductMeshes3D({
  archetype,
  bodyColor = '#d8dee9',
  accentColor = '#eab308',
  exploded = false,
  wireframe = false,
}: ProductMeshProps) {
  const rootRef = useRef<THREE.Group>(null)
  const expRef = useRef(0)

  // Memoized Lathe Geometries for authentic spun & cast aluminum vessels
  const geos = useMemo(() => {
    return {
      tierPlateBottom: makePlateGeo(1.12, 0.085),
      tierPlateMid: makePlateGeo(0.84, 0.075),
      tierPlateTop: makePlateGeo(0.58, 0.065),
      standBase: makePedestalGeo(0.62, 0.16, 0.24),
      fruitBowl: makeBowlGeo(1.18, 0.56),
      nutBowl: makeBowlGeo(0.66, 0.44),
      nutDome: makeDomeGeo(0.65, 0.36),
      nutFoot: makePedestalGeo(0.46, 0.18, 0.42),
      orduMiniBowl: makeBowlGeo(0.38, 0.22),
      teaTray: makePlateGeo(1.36, 0.07),
      sugarBowl: makeBowlGeo(0.36, 0.26),
      sugarDome: makeDomeGeo(0.35, 0.2),
      candleBase: makePedestalGeo(0.52, 0.14, 0.34),
      candleCup: makeBowlGeo(0.14, 0.16),
      kashkoolOuter: makeBowlGeo(0.88, 0.46),
      kashkoolInner: makeBowlGeo(0.83, 0.44),
    }
  }, [])

  // Luxury Brushed Aluminum, Mirror Silver, Champagne Gold & Tea Crystal PBR Materials
  const mats = useMemo(() => {
    const brushedAluminum = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(bodyColor),
      metalness: 0.93,
      roughness: 0.2,
      clearcoat: 0.65,
      clearcoatRoughness: 0.18,
      side: THREE.DoubleSide,
      wireframe,
    })

    const mirrorAluminum = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#f1f5f9'),
      metalness: 0.98,
      roughness: 0.07,
      clearcoat: 1,
      side: THREE.DoubleSide,
      wireframe,
    })

    const champagneAccent = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(accentColor),
      metalness: 0.92,
      roughness: 0.17,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      side: THREE.DoubleSide,
      wireframe,
    })

    const darkSlate = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#181c26'),
      metalness: 0.55,
      roughness: 0.45,
      wireframe,
    })

    const teaGlass = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#b45309'),
      metalness: 0.05,
      roughness: 0.06,
      transmission: wireframe ? 0 : 0.72,
      thickness: 0.5,
      transparent: true,
      opacity: 0.88,
      wireframe,
    })

    const ivoryWax = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#fef3c7'),
      roughness: 0.55,
      metalness: 0.05,
      wireframe,
    })

    const warmFlame = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#fde047'),
      emissive: new THREE.Color('#f59e0b'),
      emissiveIntensity: 2.6,
      roughness: 0.1,
      wireframe,
    })

    return {
      brushedAluminum,
      mirrorAluminum,
      champagneAccent,
      darkSlate,
      teaGlass,
      ivoryWax,
      warmFlame,
    }
  }, [bodyColor, accentColor, wireframe])

  // Refs for smooth 3D assembly / exploded view animation
  const tier1Ref = useRef<THREE.Group>(null)
  const tier2Ref = useRef<THREE.Group>(null)
  const tier3Ref = useRef<THREE.Group>(null)
  const topFinialRef = useRef<THREE.Group>(null)
  const midPartRef = useRef<THREE.Group>(null)
  const basePartRef = useRef<THREE.Group>(null)
  const leftHandleRef = useRef<THREE.Group>(null)
  const rightHandleRef = useRef<THREE.Group>(null)
  const subItemsRef = useRef<THREE.Group>(null)
  const flameGroupRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    const target = exploded ? 1 : 0
    expRef.current = THREE.MathUtils.lerp(expRef.current, target, Math.min(1, delta * 5.2))
    const e = expRef.current

    if (rootRef.current) {
      rootRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.4) * 0.045
    }

    if (flameGroupRef.current) {
      const flicker = 1 + Math.sin(state.clock.elapsedTime * 14) * 0.07
      flameGroupRef.current.scale.set(1, flicker, 1)
    }

    if (archetype === 'tiered-stand') {
      if (basePartRef.current) basePartRef.current.position.y = -1.05 - e * 0.22
      if (tier1Ref.current) tier1Ref.current.position.y = -0.82 - e * 0.06
      if (tier2Ref.current) tier2Ref.current.position.y = -0.14 + e * 0.24
      if (tier3Ref.current) tier3Ref.current.position.y = 0.52 + e * 0.55
      if (topFinialRef.current) topFinialRef.current.position.y = 0.96 + e * 0.88
    } else if (archetype === 'fruit-bowl') {
      if (tier3Ref.current) tier3Ref.current.position.y = -0.05 + e * 0.48
      if (midPartRef.current) midPartRef.current.position.y = -0.18 + e * 0.12
      if (basePartRef.current) basePartRef.current.position.y = -0.58 - e * 0.28
    } else if (archetype === 'serving-tray') {
      if (leftHandleRef.current) leftHandleRef.current.position.x = -1.24 - e * 0.45
      if (rightHandleRef.current) rightHandleRef.current.position.x = 1.24 + e * 0.45
      if (midPartRef.current) midPartRef.current.position.y = 0.06 + e * 0.38
    } else if (archetype === 'nut-dish') {
      if (topFinialRef.current) topFinialRef.current.position.y = 0.26 + e * 0.72
      if (midPartRef.current) midPartRef.current.position.y = -0.18 + e * 0.1
      if (basePartRef.current) basePartRef.current.position.y = -0.62 - e * 0.25
    } else if (archetype === 'ordu-platter') {
      if (topFinialRef.current) topFinialRef.current.position.y = 0.35 + e * 0.52
      if (subItemsRef.current) subItemsRef.current.position.y = -0.16 + e * 0.32
      if (basePartRef.current) basePartRef.current.position.y = -0.25 - e * 0.22
    } else if (archetype === 'tea-set') {
      if (topFinialRef.current) topFinialRef.current.position.y = 0.24 + e * 0.62
      if (midPartRef.current) midPartRef.current.position.y = -0.05 + e * 0.28
      if (subItemsRef.current) subItemsRef.current.position.y = -0.08 + e * 0.36
    } else if (archetype === 'candelabra') {
      if (topFinialRef.current) topFinialRef.current.position.y = e * 0.48
      if (midPartRef.current) midPartRef.current.position.y = e * 0.16
      if (basePartRef.current) basePartRef.current.position.y = -0.95 - e * 0.22
    } else if (archetype === 'kashkool-vessel') {
      if (topFinialRef.current) topFinialRef.current.position.y = -0.06 + e * 0.46
      if (midPartRef.current) midPartRef.current.position.y = -0.1 + e * 0.14
      if (basePartRef.current) basePartRef.current.position.y = -0.45 - e * 0.28
    }
  })

  return (
    <group ref={rootRef}>
      {/* 1. ROYAL 3-TIER ALUMINUM PASTRY STAND */}
      {archetype === 'tiered-stand' && (
        <group scale={0.96}>
          {/* Internal Threaded Stainless Assembly Rod (Visible in Exploded View!) */}
          <mesh position={[0, 0.05, 0]} material={mats.mirrorAluminum}>
            <cylinderGeometry args={[0.025, 0.025, 2.0, 20]} />
          </mesh>

          {/* Heavy Cast Pedestal Foot */}
          <group ref={basePartRef} position={[0, -1.05, 0]}>
            <mesh geometry={geos.standBase} material={mats.brushedAluminum} />
          </group>

          {/* Bottom Tier Plate + Column */}
          <group ref={tier1Ref} position={[0, -0.82, 0]}>
            <mesh geometry={geos.tierPlateBottom} material={mats.brushedAluminum} />
            <mesh position={[0, 0.085, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.champagneAccent}>
              <torusGeometry args={[1.11, 0.014, 16, 64]} />
            </mesh>
            <mesh position={[0, 0.34, 0]} material={mats.brushedAluminum}>
              <cylinderGeometry args={[0.075, 0.105, 0.64, 32]} />
            </mesh>
          </group>

          {/* Middle Tier Plate + Column */}
          <group ref={tier2Ref} position={[0, -0.14, 0]}>
            <mesh geometry={geos.tierPlateMid} material={mats.brushedAluminum} />
            <mesh position={[0, 0.075, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.champagneAccent}>
              <torusGeometry args={[0.83, 0.013, 16, 64]} />
            </mesh>
            <mesh position={[0, 0.33, 0]} material={mats.brushedAluminum}>
              <cylinderGeometry args={[0.065, 0.09, 0.62, 32]} />
            </mesh>
          </group>

          {/* Top Tier Plate */}
          <group ref={tier3Ref} position={[0, 0.52, 0]}>
            <mesh geometry={geos.tierPlateTop} material={mats.brushedAluminum} />
            <mesh position={[0, 0.065, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.champagneAccent}>
              <torusGeometry args={[0.57, 0.012, 16, 64]} />
            </mesh>
          </group>

          {/* Sculpted Champagne-Gold Ring Handle Crown */}
          <group ref={topFinialRef} position={[0, 0.96, 0]}>
            <mesh position={[0, -0.22, 0]} material={mats.brushedAluminum}>
              <cylinderGeometry args={[0.055, 0.08, 0.38, 28]} />
            </mesh>
            <mesh position={[0, 0.02, 0]} material={mats.champagneAccent}>
              <sphereGeometry args={[0.085, 24, 24]} />
            </mesh>
            <mesh position={[0, 0.24, 0]} material={mats.champagneAccent}>
              <torusGeometry args={[0.19, 0.032, 24, 48]} />
            </mesh>
          </group>
        </group>
      )}

      {/* 2. LOTUS FLUTED PEDESTAL ALUMINUM FRUIT BOWL */}
      {archetype === 'fruit-bowl' && (
        <group scale={1.08} rotation={[0.12, 0, 0]}>
          {/* Faceted Architectural Cast Aluminum Base */}
          <group ref={basePartRef} position={[0, -0.58, 0]}>
            <mesh material={mats.brushedAluminum}>
              <cylinderGeometry args={[0.26, 0.52, 0.68, 8]} />
            </mesh>
          </group>

          {/* Anodized Champagne/Bronze Collar Ring */}
          <group ref={midPartRef} position={[0, -0.18, 0]}>
            <mesh material={mats.champagneAccent}>
              <cylinderGeometry args={[0.3, 0.25, 0.16, 36]} />
            </mesh>
          </group>

          {/* Wide Fluted Spun/CNC Aluminum Bowl */}
          <group ref={tier3Ref} position={[0, -0.05, 0]}>
            <mesh geometry={geos.fruitBowl} material={mats.brushedAluminum} />
            {/* Champagne Rim Accent */}
            <mesh position={[0, 0.575, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.champagneAccent}>
              <torusGeometry args={[1.16, 0.018, 16, 64]} />
            </mesh>
            {/* 24 Radial CNC Fluted Ribs */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i / 24) * Math.PI * 2
              return (
                <group key={i} rotation={[0, angle, 0]}>
                  <mesh position={[0.64, 0.24, 0]} rotation={[0, 0, -0.95]} material={mats.mirrorAluminum}>
                    <boxGeometry args={[0.022, 0.72, 0.022]} />
                  </mesh>
                </group>
              )
            })}
          </group>
        </group>
      )}

      {/* 3. IMPERIAL ENGRAVED HANDLED ALUMINUM SERVING TRAY */}
      {archetype === 'serving-tray' && (
        <group scale={1.05} rotation={[0.48, -0.35, 0.08]}>
          {/* Heavy-Gauge Brushed Satin Aluminum Bed */}
          <RoundedBox args={[2.36, 0.07, 1.52]} radius={0.14} smoothness={6} material={mats.brushedAluminum} />

          {/* Raised Gallery Rim & Engraved Champagne Inner Frame */}
          <group ref={midPartRef} position={[0, 0.06, 0]}>
            {/* Outer Raised Walls */}
            <RoundedBox position={[0, 0, -0.71]} args={[2.28, 0.075, 0.07]} radius={0.03} material={mats.mirrorAluminum} />
            <RoundedBox position={[0, 0, 0.71]} args={[2.28, 0.075, 0.07]} radius={0.03} material={mats.mirrorAluminum} />
            <RoundedBox position={[-1.12, 0, 0]} args={[0.07, 0.075, 1.44]} radius={0.03} material={mats.mirrorAluminum} />
            <RoundedBox position={[1.12, 0, 0]} args={[0.07, 0.075, 1.44]} radius={0.03} material={mats.mirrorAluminum} />

            {/* Engraved Inner Champagne Geometric Border */}
            <mesh position={[0, -0.015, -0.52]} material={mats.champagneAccent}>
              <boxGeometry args={[1.86, 0.015, 0.025]} />
            </mesh>
            <mesh position={[0, -0.015, 0.52]} material={mats.champagneAccent}>
              <boxGeometry args={[1.86, 0.015, 0.025]} />
            </mesh>
            <mesh position={[-0.92, -0.015, 0]} material={mats.champagneAccent}>
              <boxGeometry args={[0.025, 0.015, 1.06]} />
            </mesh>
            <mesh position={[0.92, -0.015, 0]} material={mats.champagneAccent}>
              <boxGeometry args={[0.025, 0.015, 1.06]} />
            </mesh>
          </group>

          {/* Left Sculpted Champagne-Gold Cast Handle */}
          <group ref={leftHandleRef} position={[-1.24, 0.1, 0]}>
            <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]} material={mats.champagneAccent}>
              <torusGeometry args={[0.32, 0.042, 20, 40, Math.PI]} />
            </mesh>
          </group>

          {/* Right Sculpted Champagne-Gold Cast Handle */}
          <group ref={rightHandleRef} position={[1.24, 0.1, 0]}>
            <mesh rotation={[Math.PI / 2, 0, -Math.PI / 2]} material={mats.champagneAccent}>
              <torusGeometry args={[0.32, 0.042, 20, 40, Math.PI]} />
            </mesh>
          </group>
        </group>
      )}

      {/* 4. ZARRIN HAMMERED LIDDED ALUMINUM NUT & CANDY BONBONNIERE */}
      {archetype === 'nut-dish' && (
        <group scale={1.15}>
          {/* Cast Ornate Pedestal Foot */}
          <group ref={basePartRef} position={[0, -0.62, 0]}>
            <mesh geometry={geos.nutFoot} material={mats.brushedAluminum} />
            <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.champagneAccent}>
              <torusGeometry args={[0.45, 0.016, 16, 48]} />
            </mesh>
          </group>

          {/* Deep Hammered-Style Aluminum Goblet Bowl */}
          <group ref={midPartRef} position={[0, -0.18, 0]}>
            <mesh geometry={geos.nutBowl} material={mats.brushedAluminum} />
            <mesh position={[0, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.champagneAccent}>
              <torusGeometry args={[0.66, 0.018, 16, 56]} />
            </mesh>
          </group>

          {/* Domed Aluminum Lid + Sculpted Gold Leaf Finial */}
          <group ref={topFinialRef} position={[0, 0.26, 0]}>
            <mesh geometry={geos.nutDome} material={mats.brushedAluminum} />
            {/* Sculpted 3-Leaf Champagne Finial */}
            <mesh position={[0, 0.42, 0]} scale={[0.55, 1.25, 0.2]} material={mats.champagneAccent}>
              <octahedronGeometry args={[0.14, 1]} />
            </mesh>
            <mesh position={[-0.09, 0.39, 0]} rotation={[0, 0, 0.55]} scale={[0.4, 0.9, 0.18]} material={mats.champagneAccent}>
              <octahedronGeometry args={[0.11, 1]} />
            </mesh>
            <mesh position={[0.09, 0.39, 0]} rotation={[0, 0, -0.55]} scale={[0.4, 0.9, 0.18]} material={mats.champagneAccent}>
              <octahedronGeometry args={[0.11, 1]} />
            </mesh>
          </group>
        </group>
      )}

      {/* 5. NEGIN 4-BOWL ALUMINUM ORDU & RELISH PLATTER */}
      {archetype === 'ordu-platter' && (
        <group scale={1.1} rotation={[0.25, 0.4, 0]}>
          {/* Wave Cradle Base */}
          <group ref={basePartRef} position={[0, -0.25, 0]}>
            <RoundedBox args={[1.65, 0.07, 1.65]} radius={0.28} smoothness={6} material={mats.darkSlate} />
            <mesh position={[0, 0.035, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.brushedAluminum}>
              <torusGeometry args={[0.88, 0.028, 16, 64]} />
            </mesh>
          </group>

          {/* 4 Detachable Hammered Spun Aluminum Bowls */}
          <group ref={subItemsRef} position={[0, -0.16, 0]}>
            {[
              [0.48, 0.48],
              [-0.48, 0.48],
              [0.48, -0.48],
              [-0.48, -0.48],
            ].map(([bx, bz], idx) => (
              <group key={idx} position={[bx, 0, bz]}>
                <mesh geometry={geos.orduMiniBowl} material={mats.brushedAluminum} />
                <mesh position={[0, 0.225, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.champagneAccent}>
                  <torusGeometry args={[0.38, 0.012, 14, 48]} />
                </mesh>
              </group>
            ))}
          </group>

          {/* Tall Sculpted Champagne-Gold Vertical Loop Handle */}
          <group ref={topFinialRef} position={[0, 0.35, 0]}>
            <mesh position={[0, -0.42, 0]} material={mats.champagneAccent}>
              <cylinderGeometry args={[0.07, 0.14, 0.26, 28]} />
            </mesh>
            <mesh scale={[0.68, 1.35, 0.8]} material={mats.champagneAccent}>
              <torusGeometry args={[0.34, 0.042, 24, 56]} />
            </mesh>
          </group>
        </group>
      )}

      {/* 6. ISFAHAN CAST ALUMINUM TEA & SUGAR SERVICE SET */}
      {archetype === 'tea-set' && (
        <group scale={0.96} rotation={[0.28, -0.2, 0]}>
          {/* Round Engraved Aluminum Serving Tray */}
          <group position={[0, -0.28, 0]}>
            <mesh geometry={geos.teaTray} material={mats.brushedAluminum} />
            <mesh position={[0, 0.075, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.champagneAccent}>
              <torusGeometry args={[1.34, 0.018, 16, 64]} />
            </mesh>
          </group>

          {/* Central Footed Aluminum Sugar Bowl (قندان) */}
          <group ref={midPartRef} position={[0, -0.05, 0]}>
            <mesh position={[0, -0.12, 0]} material={mats.brushedAluminum}>
              <cylinderGeometry args={[0.12, 0.22, 0.16, 32]} />
            </mesh>
            <mesh position={[0, -0.04, 0]} geometry={geos.sugarBowl} material={mats.brushedAluminum} />
          </group>

          {/* Sugar Bowl Lid + Gold Finial */}
          <group ref={topFinialRef} position={[0, 0.24, 0]}>
            <mesh geometry={geos.sugarDome} material={mats.brushedAluminum} />
            <mesh position={[0, 0.24, 0]} material={mats.champagneAccent}>
              <sphereGeometry args={[0.065, 24, 24]} />
            </mesh>
          </group>

          {/* 4 Filigree Cast Aluminum Tea Holders + Amber Tea Glasses */}
          <group ref={subItemsRef} position={[0, -0.08, 0]}>
            {[
              [0.76, 0.45],
              [-0.76, 0.45],
              [0.76, -0.45],
              [-0.76, -0.45],
            ].map(([tx, tz], idx) => (
              <group key={idx} position={[tx, 0, tz]}>
                {/* Cast Aluminum Holder Sleeve */}
                <mesh position={[0, 0.06, 0]} material={mats.brushedAluminum}>
                  <cylinderGeometry args={[0.17, 0.15, 0.28, 24, 1, true]} />
                </mesh>
                <mesh position={[0, -0.08, 0]} material={mats.brushedAluminum}>
                  <cylinderGeometry args={[0.18, 0.19, 0.04, 24]} />
                </mesh>
                {/* Delicate Ear Handle */}
                <mesh position={[0.19, 0.06, 0]} rotation={[0, 0, -Math.PI / 2]} material={mats.champagneAccent}>
                  <torusGeometry args={[0.085, 0.015, 14, 28, Math.PI]} />
                </mesh>
                {/* Warm Saffron Tea Crystal Glass */}
                <mesh position={[0, 0.16, 0]} material={mats.teaGlass}>
                  <cylinderGeometry args={[0.155, 0.135, 0.42, 28]} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      )}

      {/* 7. ARULUX 3-ARM SCULPTURAL ALUMINUM CANDELABRA */}
      {archetype === 'candelabra' && (
        <group scale={0.98}>
          {/* Stepped Weighted Cast Aluminum Base */}
          <group ref={basePartRef} position={[0, -0.95, 0]}>
            <mesh geometry={geos.candleBase} material={mats.brushedAluminum} />
            <mesh position={[0, 0.42, 0]} material={mats.brushedAluminum}>
              <cylinderGeometry args={[0.08, 0.13, 0.65, 32]} />
            </mesh>
          </group>

          {/* Sweeping Cast Aluminum Arms */}
          <group ref={midPartRef}>
            {/* Left Sweeping Arm */}
            <mesh position={[-0.42, -0.18, 0]} rotation={[0, 0, Math.PI]} material={mats.brushedAluminum}>
              <torusGeometry args={[0.42, 0.042, 20, 48, Math.PI]} />
            </mesh>
            {/* Right Sweeping Arm */}
            <mesh position={[0.42, -0.18, 0]} rotation={[0, 0, Math.PI]} material={mats.brushedAluminum}>
              <torusGeometry args={[0.42, 0.042, 20, 48, Math.PI]} />
            </mesh>
            {/* Center Stem */}
            <mesh position={[0, -0.05, 0]} material={mats.brushedAluminum}>
              <cylinderGeometry args={[0.048, 0.065, 0.48, 24]} />
            </mesh>
          </group>

          {/* Champagne-Gold Candle Cups + Ivory Taper Candles + Warm Glowing Flames */}
          <group ref={topFinialRef}>
            {[
              [-0.84, -0.18],
              [0, 0.16],
              [0.84, -0.18],
            ].map(([cx, cy], idx) => (
              <group key={idx} position={[cx, cy, 0]}>
                <mesh geometry={geos.candleCup} material={mats.champagneAccent} />
                <mesh position={[0, 0.54, 0]} material={mats.ivoryWax}>
                  <cylinderGeometry args={[0.048, 0.058, 0.82, 24]} />
                </mesh>
                <group ref={idx === 1 ? flameGroupRef : undefined} position={[0, 1.02, 0]}>
                  <mesh scale={[0.6, 1.4, 0.6]} material={mats.warmFlame}>
                    <sphereGeometry args={[0.055, 16, 16]} />
                  </mesh>
                </group>
              </group>
            ))}
          </group>
        </group>
      )}

      {/* 8. MOWJ SCULPTURAL TWO-TONE ALUMINUM KASHKOOL VESSEL */}
      {archetype === 'kashkool-vessel' && (
        <group scale={1.08} rotation={[0.18, -0.35, 0]}>
          {/* Oval Sculpted Cast Aluminum Foot */}
          <group ref={basePartRef} position={[0, -0.45, 0]} scale={[1.35, 1, 0.72]}>
            <mesh material={mats.brushedAluminum}>
              <cylinderGeometry args={[0.24, 0.46, 0.36, 40]} />
            </mesh>
          </group>

          {/* Outer Brushed Satin Silver Wave Shell */}
          <group ref={midPartRef} position={[0, -0.1, 0]} scale={[1.56, 0.85, 0.74]}>
            <mesh geometry={geos.kashkoolOuter} material={mats.brushedAluminum} />
          </group>

          {/* Inner Anodized Champagne-Gold Bowl Liner */}
          <group ref={topFinialRef} position={[0, -0.06, 0]} scale={[1.53, 0.84, 0.72]}>
            <mesh geometry={geos.kashkoolInner} material={mats.champagneAccent} />
          </group>
        </group>
      )}
    </group>
  )
}
