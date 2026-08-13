import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

/**
 * الكوب الزجاجي مع طبقات اللاتيه.
 *
 * الزجاج مبني بـ LatheGeometry: نرسم مقطعاً جانبياً يصعد على الجدار الخارجي ثم
 * ينزل على الداخلي، فيدور حول محور Y وينتج جداراً له سماكة حقيقية — وهو ما
 * يحتاجه خامة الإرسال (transmission) لتُظهر انكساراً مقنعاً.
 */
export function GlassCup({ highlight = false }: { highlight?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const glow = useRef<THREE.PointLight>(null);

  // مقطع الكوب: (نصف القطر، الارتفاع)
  const profile = useMemo(() => {
    const p: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.52, 0.0),
      new THREE.Vector2(0.56, 0.05),
      new THREE.Vector2(0.6, 0.35),
      new THREE.Vector2(0.65, 0.95),
      new THREE.Vector2(0.68, 1.45),
      new THREE.Vector2(0.62, 1.45),
      new THREE.Vector2(0.59, 0.95),
      new THREE.Vector2(0.54, 0.35),
      new THREE.Vector2(0.5, 0.09),
      new THREE.Vector2(0.0, 0.09),
    ];
    return p;
  }, []);

  useFrame((state, delta) => {
    if (group.current) {
      const t = state.clock.elapsedTime;
      // طفو خفيف جداً — الكوب يجب أن يبدو معلّقاً لا مهتزّاً
      group.current.position.y = Math.sin(t * 0.6) * 0.045;
      group.current.rotation.y += delta * 0.12;
    }
    if (glow.current) {
      glow.current.intensity = THREE.MathUtils.lerp(
        glow.current.intensity,
        highlight ? 5.5 : 1.4,
        delta * 4
      );
    }
  });

  return (
    <group ref={group} position={[0, -0.55, 0]}>
      {/* الزجاج */}
      <mesh castShadow>
        <latheGeometry args={[profile, 96]} />
        <MeshTransmissionMaterial
          samples={6}
          resolution={256}
          transmission={1}
          thickness={0.45}
          roughness={0.03}
          ior={1.5}
          chromaticAberration={0.09}
          anisotropy={0.15}
          distortion={0.12}
          distortionScale={0.25}
          temporalDistortion={0.05}
          backside
          color="#ffffff"
          attenuationColor="#f6ecd9"
          attenuationDistance={2.4}
        />
      </mesh>

      {/*
        الطبقات أنحف من الجدار الداخلي بنحو ٠٫٠٣ عند كل ارتفاع. حين كانت تلامسه
        كانت تخترقه فيختفي الزجاج ويبدو الكوب أسطوانة معتمة؛ والفراغ المتروك فوق
        الرغوة (٠٫٢٥) هو ما يجعل الحافة تُقرأ زجاجاً فعلاً.
      */}

      {/* طبقة الإسبريسو — الأثقل في القاع */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.53, 0.475, 0.62, 64]} />
        <meshPhysicalMaterial color="#2a150c" roughness={0.32} metalness={0.06} clearcoat={0.5} />
      </mesh>

      {/* الحليب المخفوق */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.558, 0.53, 0.38, 64]} />
        <meshPhysicalMaterial color="#f3e3cb" roughness={0.62} sheen={0.6} sheenColor="#fffaf0" />
      </mesh>

      {/* رغوة الكريما */}
      <mesh position={[0, 1.145, 0]}>
        <cylinderGeometry args={[0.572, 0.558, 0.11, 64]} />
        <meshPhysicalMaterial color="#fdf6ea" roughness={0.85} sheen={1} sheenColor="#ffffff" />
      </mesh>

      {/* نقش الكراميل على السطح — حلزون رفيع */}
      <CaramelArt />

      {/* توهّج داخلي يشتد عند تحويم المؤشر على بطاقة اللاتيه */}
      <pointLight ref={glow} position={[0, 0.8, 0]} distance={3.4} color="#d99b26" intensity={1.4} />
    </group>
  );
}

/** حلزون كراميل رفيع مرسوم على سطح الرغوة */
function CaramelArt() {
  const geometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const turns = 2.6;
    for (let i = 0; i <= 140; i++) {
      const u = i / 140;
      const a = u * Math.PI * 2 * turns;
      const r = 0.06 + u * 0.44;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 180, 0.016, 8, false);
  }, []);

  return (
    <mesh geometry={geometry} position={[0, 1.208, 0]}>
      <meshPhysicalMaterial color="#c98a1f" roughness={0.25} clearcoat={1} clearcoatRoughness={0.2} />
    </mesh>
  );
}
