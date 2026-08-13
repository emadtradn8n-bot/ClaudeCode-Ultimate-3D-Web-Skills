import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

/* ===== مكعّبات ثلج بلّورية ===== */

/*
  الارتفاعات منخفضة عمداً والعمق سالب: المكعّبات ترافق الكوب في النصف السفلي
  وتبقى خلف مستوى التركيز، فلا تزاحم العنوان في أعلى الإطار.
*/
const CUBES = [
  { p: [2.3, 0.15, -1.5], s: 0.26, spin: 0.22 },
  { p: [-2.4, -0.35, -1.9], s: 0.3, spin: -0.16 },
  { p: [1.95, -1.25, -2.3], s: 0.22, spin: 0.3 },
  { p: [-1.9, 0.6, -1.2], s: 0.19, spin: -0.26 },
] as const;

export function IceCubes({ highlight = false }: { highlight?: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      const c = CUBES[i];
      child.rotation.x = t * c.spin;
      child.rotation.y = t * c.spin * 0.7;
      child.position.y = c.p[1] + Math.sin(t * 0.5 + i * 1.7) * 0.14;
      const target = c.s * (highlight ? 1.28 : 1);
      child.scale.setScalar(THREE.MathUtils.lerp(child.scale.x, target, 0.06));
    });
  });

  return (
    <group ref={group}>
      {CUBES.map((c, i) => (
        <RoundedBox
          key={i}
          args={[1, 1, 1]}
          radius={0.16}
          smoothness={4}
          position={c.p as unknown as [number, number, number]}
          scale={c.s}
        >
          {/*
            إرسال three المدمج لا MeshTransmissionMaterial.

            خامة drei تحجز هدف عرض خاصاً بها وتُعيد رسم المشهد لكل مجسّم يحملها؛
            بأربعة مكعّبات مع الكوب صارت خمس مرات رسم إضافية في الإطار الواحد،
            فنفدت الموارد وبدأ المُركِّب يُخرج إطارات سوداء بعد ثوانٍ. الإرسال
            المدمج يتشارك هدفاً واحداً على مستوى المشهد — والفرق البصري على
            مكعّبات بهذا الحجم لا يكاد يُرى.
          */}
          <meshPhysicalMaterial
            transmission={0.92}
            thickness={0.35}
            roughness={0.06}
            ior={1.31}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.08}
            color="#ffffff"
            attenuationColor="#eaf3ff"
            attenuationDistance={4}
          />
        </RoundedBox>
      ))}
    </group>
  );
}

/* ===== حبوب قهوة محمّصة تطفو على أعماق مختلفة ===== */

const BEAN_COUNT = 13;

export function Beans({ highlight = false }: { highlight?: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const seeds = useMemo(
    () =>
      Array.from({ length: BEAN_COUNT }, (_, i) => ({
        a: (i / BEAN_COUNT) * Math.PI * 2 + Math.random() * 0.4,
        r: 2.5 + Math.random() * 1.7,
        // منحاز للأسفل كي تبقى الحبوب في محيط الكوب لا في مساحة العنوان
        y: -0.5 + (Math.random() - 0.5) * 2.4,
        // انحياز سالب: نُبقي الحبوب خلف الكوب لا أمامه
        z: -0.7 - Math.random() * 1.9,
        s: 0.055 + Math.random() * 0.042,
        speed: 0.06 + Math.random() * 0.12,
        tilt: Math.random() * Math.PI,
      })),
    []
  );

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;
    const boost = highlight ? 1.35 : 1;
    seeds.forEach((b, i) => {
      const a = b.a + t * b.speed;
      dummy.position.set(Math.cos(a) * b.r, b.y + Math.sin(t * 0.4 + i) * 0.2, Math.sin(a) * b.r * 0.5 + b.z);
      dummy.rotation.set(t * 0.3 + b.tilt, a, t * 0.2);
      // الحبة إهليج مفلطح لا كرة
      dummy.scale.set(b.s * boost, b.s * 0.62 * boost, b.s * 0.78 * boost);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, BEAN_COUNT]} castShadow>
      <sphereGeometry args={[1, 20, 14]} />
      <meshPhysicalMaterial color="#3b2013" roughness={0.42} clearcoat={0.6} clearcoatRoughness={0.35} />
    </instancedMesh>
  );
}

/* ===== ضباب سحابي حول قاعدة الكوب ===== */

const PUFFS = 26;

/**
 * غيوم من ألواح شفافة تواجه الكاميرا دائماً. تجنّبنا مكوّن Cloud الجاهز لأنه
 * يجلب نسيجاً من الشبكة، وكل طلب خارجي محجوب هنا — فالنسيج يُرسم داخلياً مرة
 * واحدة على canvas.
 */
export function CloudMist({ highlight = false }: { highlight?: boolean }) {
  const group = useRef<THREE.Group>(null);

  const texture = useMemo(() => {
    const size = 128;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(255,255,255,0.9)");
    grad.addColorStop(0.45, "rgba(255,255,255,0.34)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  const puffs = useMemo(
    () =>
      Array.from({ length: PUFFS }, (_, i) => ({
        x: (Math.random() - 0.5) * 7.5,
        // يلتف حول قاعدة الكوب (‎-٠٫٥٥‎) بدل أن يغرق تحت حافة الإطار
        y: -1.15 + Math.random() * 1.05,
        z: -0.4 - Math.random() * 2.2,
        s: 0.6 + Math.random() * 1.1,
        speed: 0.04 + Math.random() * 0.1,
        phase: Math.random() * Math.PI * 2,
        // شفافية منخفضة: عدة ألواح تتراكم، والقيم الأعلى تُنتج لطخة بيضاء صلبة
        o: 0.04 + Math.random() * 0.08,
        i,
      })),
    []
  );

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      const p = puffs[i];
      child.position.x = p.x + Math.sin(t * p.speed + p.phase) * 0.5;
      child.position.y = p.y + Math.sin(t * 0.22 + p.phase) * 0.16;
      const m = child as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
      m.material.opacity = THREE.MathUtils.lerp(m.material.opacity, p.o * (highlight ? 1.9 : 1), 0.05);
    });
  });

  return (
    <group ref={group}>
      {puffs.map((p) => (
        <sprite key={p.i} position={[p.x, p.y, p.z]} scale={p.s}>
          <spriteMaterial
            map={texture}
            transparent
            opacity={p.o}
            depthWrite={false}
            color="#ffffff"
          />
        </sprite>
      ))}
    </group>
  );
}
