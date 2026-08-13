import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * حلقة السائل — انسياب كراميل وحليب يلتف حول الكوب في الهواء.
 *
 * التشويه يجري على بطاقة الرسوميات: نبدأ من حلقة (torus) ونزيح رؤوسها في
 * vertex shader عبر onBeforeCompile. إعادة بناء الهندسة كل إطار كانت ستخصّص
 * ذاكرة داخل حلقة الرسم — وهي أسرع طريق إلى تقطيع الحركة على الأجهزة الضعيفة.
 */

interface BandSpec {
  radius: number;
  tube: number;
  lobes: number;
  wave: number;
  tilt: number;
  speed: number;
  color: string;
  roughness: number;
}

/*
  الأنصاف مضبوطة على عرض الكوب (٠٫٦٨ نصف قطر) لا على عرض الإطار: الحلقة يجب أن
  تلتفّ حول الزجاج كأنها انسكاب لحظي، لا أن تعبر الشاشة.
*/
const BANDS: BandSpec[] = [
  { radius: 0.94, tube: 0.05, lobes: 3, wave: 0.16, tilt: 0.22, speed: 0.34, color: "#d99b26", roughness: 0.22 },
  { radius: 1.16, tube: 0.034, lobes: 4, wave: 0.13, tilt: -0.34, speed: -0.26, color: "#f6ecd9", roughness: 0.5 },
  { radius: 0.79, tube: 0.024, lobes: 5, wave: 0.1, tilt: 0.52, speed: 0.46, color: "#a8741a", roughness: 0.3 },
];

function Band({ spec, highlight }: { spec: BandSpec; highlight: boolean }) {
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLobes: { value: spec.lobes },
      uWave: { value: spec.wave },
      uSpeed: { value: spec.speed },
    }),
    [spec.lobes, spec.wave, spec.speed]
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    if (mat.current) {
      mat.current.emissiveIntensity = THREE.MathUtils.lerp(
        mat.current.emissiveIntensity,
        highlight ? 0.55 : 0.1,
        0.08
      );
    }
  });

  /** يحقن تموّجاً حول محيط الحلقة قبل تحويل العرض */
  const onBeforeCompile = useMemo(
    () => (shader: THREE.WebGLProgramParametersWithUniforms) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
           uniform float uTime;
           uniform float uLobes;
           uniform float uWave;
           uniform float uSpeed;`
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           float ang = atan(transformed.z, transformed.x);
           float t = uTime * uSpeed;
           // تنفّس نصف القطر + تموّج رأسي، فيبدو الشريط سائلاً لا صلباً
           float breathe = 1.0 + sin(ang * uLobes + t * 2.0) * 0.085;
           transformed.xz *= breathe;
           transformed.y += sin(ang * uLobes + t * 1.6) * uWave
                          + sin(ang * 2.0 - t) * 0.06;`
        );
    },
    [uniforms]
  );

  return (
    <mesh rotation={[spec.tilt, 0, spec.tilt * 0.6]}>
      <torusGeometry args={[spec.radius, spec.tube, 20, 220]} />
      <meshPhysicalMaterial
        ref={mat}
        color={spec.color}
        roughness={spec.roughness}
        metalness={0.12}
        clearcoat={1}
        clearcoatRoughness={0.15}
        emissive={spec.color}
        emissiveIntensity={0.1}
        onBeforeCompile={onBeforeCompile}
        // يمنع three من إعادة استخدام برنامج مصنّف بلا تشويهنا
        customProgramCacheKey={() => `ghaim-band-${spec.lobes}-${spec.wave}`}
      />
    </mesh>
  );
}

export function SplashRing({ highlight = false }: { highlight?: boolean }) {
  return (
    <group position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
      {BANDS.map((spec, i) => (
        <Band key={i} spec={spec} highlight={highlight} />
      ))}
      <Droplets highlight={highlight} />
    </group>
  );
}

/** قطرات صغيرة تدور مع الحلقة وتُكمل إيحاء الرذاذ */
function Droplets({ highlight }: { highlight: boolean }) {
  const group = useRef<THREE.Group>(null);
  const drops = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        a: (i / 14) * Math.PI * 2,
        r: 0.86 + (i % 4) * 0.11,
        z: ((i % 5) - 2) * 0.13,
        s: 0.022 + (i % 3) * 0.011,
        speed: 0.3 + (i % 3) * 0.12,
      })),
    []
  );

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      const d = drops[i];
      const a = d.a + t * d.speed;
      // المجموعة مُدارة ٩٠° فالعمق هنا على المحور Z
      child.position.set(Math.cos(a) * d.r, Math.sin(a) * d.r, d.z + Math.sin(t * 1.4 + i) * 0.09);
      const s = d.s * (highlight ? 1.5 : 1);
      child.scale.setScalar(THREE.MathUtils.lerp(child.scale.x, s, 0.08));
    });
  });

  return (
    <group ref={group}>
      {drops.map((d, i) => (
        <mesh key={i} scale={d.s}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshPhysicalMaterial
            color={i % 3 === 0 ? "#f6ecd9" : "#d99b26"}
            roughness={0.18}
            clearcoat={1}
          />
        </mesh>
      ))}
    </group>
  );
}
