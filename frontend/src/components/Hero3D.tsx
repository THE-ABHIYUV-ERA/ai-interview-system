"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, TorusKnot, Float, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

function SculpturalObject() {
  const mesh = useRef<THREE.Mesh>(null);
  const targetRotation = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (mesh.current) {
      // Base slow rotation
      mesh.current.rotation.y += 0.005;
      mesh.current.rotation.x += 0.002;
      
      // Parallax to mouse
      targetRotation.current.x = (state.mouse.y * Math.PI) / 8;
      targetRotation.current.y = (state.mouse.x * Math.PI) / 8;
      
      // Smooth interpolation for parallax
      mesh.current.rotation.x += (targetRotation.current.x - mesh.current.rotation.x) * 0.05;
      mesh.current.rotation.y += (targetRotation.current.y - mesh.current.rotation.y) * 0.05;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
      <TorusKnot ref={mesh} args={[1, 0.3, 256, 64]}>
        <meshPhysicalMaterial
          color="#111111"
          roughness={0.1}
          metalness={0.8}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transmission={0.9} // Glass-like effect
          ior={1.5}
          thickness={0.5}
          envMapIntensity={2}
        />
      </TorusKnot>
    </Float>
  );
}

export default function Hero3D() {
  return (
    <div className="w-full h-[500px] md:h-[600px] lg:h-[700px] opacity-80 md:opacity-100 pointer-events-none md:pointer-events-auto">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <spotLight position={[5, 5, 5]} angle={0.3} penumbra={1} intensity={2} color="#F5F3EE" />
        <spotLight position={[-5, 5, -5]} angle={0.3} penumbra={1} intensity={1} color="#C24E1F" />
        <spotLight position={[0, -5, 0]} angle={0.3} penumbra={1} intensity={0.5} color="#F5F3EE" />
        
        <SculpturalObject />
        <Environment preset="city" />
        <ContactShadows position={[0, -2, 0]} opacity={0.6} scale={10} blur={2.5} far={4} color="#000000" />
      </Canvas>
    </div>
  );
}
