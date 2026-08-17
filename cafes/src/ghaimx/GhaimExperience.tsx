/**
 * غَيْم — Ghaim · Cloud Specialty Coffee
 * تجربة ثلاثية الأبعاد في مكوّن واحد.
 *
 * ── لماذا لا تتقطّع الحركة ──────────────────────────────────────────────
 * أشهر أسباب التلعثم في مشاهد R3F ليست كثرة المضلّعات، بل أربعة أخطاء بنيوية:
 *
 * 1. ربط الأجسام بقيمة التمرير مباشرة. التمرير يصل على شكل قفزات متقطّعة،
 *    فينسخها الجسم حرفياً. هنا لا يقرأ أي جسم قيمة التمرير الخام: يكتب GSAP
 *    قيمة مُنعّمة (scrub: 1.2) ثم يلاحقها كل جسم بـ lerp داخل useFrame.
 * 2. التخصيص داخل حلقة الرسم. كل `new THREE.Vector3()` في useFrame هو قمامة
 *    ستّين مرة في الثانية، ووقفة جامع المهملات هي ما يُحسّه المستخدم قفزةً.
 *    كل المتّجهات هنا مُخصّصة مرة واحدة في `scratch` أدناه.
 * 3. إعادة بناء الهندسة كل إطار. حلقة الكراميل وموجة الحرير تتشوّهان في
 *    مُظلِّل الرؤوس عبر onBeforeCompile — لا لمس لـ BufferGeometry إطلاقاً.
 * 4. MeshTransmissionMaterial على كل جسم زجاجي. الخامة تحجز هدف عرض خاصاً
 *    بها وتُعيد رسم المشهد كاملاً لكل مجسّم يحملها؛ خمسة أجسام زجاجية تعني
 *    ستّ عمليات رسم للمشهد في الإطار الواحد. هنا: الكوب وحده يحملها،
 *    ومكعّبات الثلج تستخدم إرسال meshPhysicalMaterial المدمج الذي يتشارك
 *    تمريرة واحدة على مستوى المشهد.
 *
 * وفوق ذلك: lerp مستقل عن معدّل الإطارات، وسقف dpr، وميزانية جودة تُخفّض
 * الأعداد وتُلغي ما بعد المعالجة على الأجهزة الضعيفة بدل أن تُجبرها عليها.
 *
 * التبعيات: three · @react-three/fiber · @react-three/drei
 *           @react-three/postprocessing · gsap · @gsap/react · lenis · tailwind
 */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
  Preload,
  RoundedBox,
} from "@react-three/drei";
import { Bloom, DepthOfField, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* ══════════════════════════════════════════════════════════════════════
   الهوية والبيانات
   ══════════════════════════════════════════════════════════════════════ */

const PALETTE = {
  cream: "#FDFBF7",
  espresso: "#2C1810",
  gold: "#C8A264",
  goldDeep: "#9A7638",
  sand: "#F1E7D6",
};

type Focus = "cup" | "ice" | "beans";

interface Product {
  id: string;
  ar: string;
  en: string;
  price: number;
  note: string;
  focus: Focus;
  /** تدرّج بديل الصورة — مساحة محجوزة صريحة لا صورة مُدّعاة */
  swatch: [string, string];
}

const PRODUCTS: Product[] = [
  {
    id: "cold-brew",
    ar: "غَيْم كولد برو",
    en: "Ghaim Cold Brew",
    price: 28,
    note: "تخمير بارد ١٨ ساعة على ثلج صافٍ",
    focus: "ice",
    swatch: ["#3A2417", "#8C6239"],
  },
  {
    id: "salted-caramel",
    ar: "سولتد كاراميل لاتيه",
    en: "Salted Caramel Latte",
    price: 32,
    note: "إسبريسو مزدوج وكراميل مملّح طبقةً فوق طبقة",
    focus: "cup",
    swatch: ["#C8A264", "#F1E7D6"],
  },
  {
    id: "v60-ethiopia",
    ar: "V60 إثيوبي فاخر",
    en: "V60 Ethiopian Reserve",
    price: 30,
    note: "يرغاتشيفي مفردة المصدر، ياسمين وحمضيات",
    focus: "beans",
    swatch: ["#6B4423", "#D9BE8F"],
  },
];

const NAV_LINKS = [
  { href: "#top", label: "الرئيسية" },
  { href: "#menu", label: "القائمة" },
  { href: "#craft", label: "حرفتنا" },
  { href: "#branches", label: "الفروع" },
];

/* ══════════════════════════════════════════════════════════════════════
   حالة مشتركة بين GSAP والمشهد

   كائنان عاديان لا حالة React: تحديث الحالة كل إطار يُعيد بناء الشجرة
   ستّين مرة في الثانية، وهو بالضبط ما نتجنّبه.
   ══════════════════════════════════════════════════════════════════════ */

/** ٠→١ يكتبها GSAP بفيزياء scrub، ويلاحقها المشهد بـ lerp */
const scroll = { p: 0 };

/** موضع المؤشّر مُطبَّعاً ‎-١→١‎ لاختلاف المنظر */
const pointer = { x: 0, y: 0 };

/**
 * متّجهات عمل مُخصّصة مرة واحدة.
 * إعادة استخدامها بدل التخصيص داخل useFrame يُبقي جامع المهملات ساكناً.
 */
const scratch = {
  camWanted: new THREE.Vector3(),
  camTarget: new THREE.Vector3(),
  lookAt: new THREE.Vector3(),
};

/** تنعيم مستقل عن معدّل الإطارات: نفس الإحساس على ٦٠ و١٢٠ هرتز */
function damp(current: number, target: number, lambda: number, delta: number) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * delta));
}

/* ══════════════════════════════════════════════════════════════════════
   ميزانية الجودة

   نقيس قدرة الجهاز مرة واحدة ونبني عليها. الأجهزة الضعيفة تحصل على مشهد
   أخفّ لا على نفس المشهد متقطّعاً.
   ══════════════════════════════════════════════════════════════════════ */

interface Quality {
  tier: "high" | "low";
  beans: number;
  mist: number;
  ice: number;
  silkSegments: [number, number];
  transmissionSamples: number;
  transmissionResolution: number;
  postProcessing: boolean;
  dpr: [number, number];
}

function useQuality(): Quality {
  return useMemo(() => {
    const nav = typeof navigator === "undefined" ? undefined : navigator;
    const cores = nav?.hardwareConcurrency ?? 4;
    const memory = (nav as unknown as { deviceMemory?: number })?.deviceMemory ?? 4;
    const coarse =
      typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

    const low = coarse || cores <= 4 || memory <= 4;

    return low
      ? {
          tier: "low",
          beans: 8,
          mist: 8,
          ice: 3,
          silkSegments: [48, 28],
          transmissionSamples: 2,
          transmissionResolution: 128,
          postProcessing: false,
          dpr: [1, 1],
        }
      : {
          tier: "high",
          beans: 18,
          mist: 22,
          ice: 5,
          silkSegments: [96, 56],
          transmissionSamples: 6,
          transmissionResolution: 256,
          postProcessing: true,
          dpr: [1, 1.5],
        };
  }, []);
}

/* ══════════════════════════════════════════════════════════════════════
   خلفية: شبكة موجة حريرية

   لوح مُزاح في مُظلِّل الرؤوس مع أعرفة محسوبة تحليلياً، فيستقبل الإضاءة
   كقماش حقيقي. مصمت عمداً: اللوحة الشفافة تترك هدف عرض ممسوحاً إلى صفر،
   فلا تجد خامة الإرسال ما تكسره وتمزج الضبابة فراغاً في حواف الأجسام.
   ══════════════════════════════════════════════════════════════════════ */

function SilkBackdrop({ segments }: { segments: [number, number] }) {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  const gradient = useMemo(() => {
    const size = 512;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!;

    g.fillStyle = PALETTE.cream;
    g.fillRect(0, 0, size, size);

    const warm = g.createRadialGradient(size * 0.68, size * 0.12, 0, size * 0.68, size * 0.12, size);
    warm.addColorStop(0, "#FFFDF8");
    warm.addColorStop(1, "rgba(255,253,248,0)");
    g.fillStyle = warm;
    g.fillRect(0, 0, size, size);

    const champagne = g.createRadialGradient(size * 0.2, size, 0, size * 0.2, size, size * 0.9);
    champagne.addColorStop(0, PALETTE.sand);
    champagne.addColorStop(1, "rgba(241,231,214,0)");
    g.fillStyle = champagne;
    g.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  const onBeforeCompile = useMemo(
    () => (shader: THREE.WebGLProgramParametersWithUniforms) => {
      Object.assign(shader.uniforms, uniforms);

      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
           uniform float uTime;
           float ghSilk(vec2 q, float t) {
             return sin(q.x * 0.55 + t * 0.40) * 0.55
                  + sin(q.y * 0.42 - t * 0.29) * 0.42
                  + sin((q.x + q.y) * 0.31 + t * 0.22) * 0.30;
           }`
        )
        // العرف محسوب بفروق محدودة من دالة الارتفاع نفسها،
        // وبدونه يبقى القماش مسطّحاً في الإضاءة مهما تموّج شكله
        .replace(
          "#include <beginnormal_vertex>",
          `#include <beginnormal_vertex>
           float e = 0.4;
           float hL = ghSilk(position.xy - vec2(e, 0.0), uTime);
           float hR = ghSilk(position.xy + vec2(e, 0.0), uTime);
           float hD = ghSilk(position.xy - vec2(0.0, e), uTime);
           float hU = ghSilk(position.xy + vec2(0.0, e), uTime);
           objectNormal = normalize(vec3(-(hR - hL) / (2.0 * e), -(hU - hD) / (2.0 * e), 1.0));`
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           transformed.z += ghSilk(position.xy, uTime);`
        );
    },
    [uniforms]
  );

  return (
    <mesh position={[0, 0, -11]}>
      <planeGeometry args={[54, 32, segments[0], segments[1]]} />
      <meshStandardMaterial
        map={gradient}
        roughness={0.72}
        metalness={0.05}
        onBeforeCompile={onBeforeCompile}
        customProgramCacheKey={() => "ghaim-silk"}
      />
    </mesh>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   الكوب الزجاجي — بؤرة المشهد

   الزجاج مبني بـ LatheGeometry: مقطع جانبي يصعد على الجدار الخارجي ثم ينزل
   على الداخلي، فيدور حول محور Y وينتج جداراً له سماكة حقيقية. خامة الإرسال
   بلا سماكة حقيقية تعطي غشاءً صابونياً لا زجاجاً.
   ══════════════════════════════════════════════════════════════════════ */

function GlassCup({ highlight, quality }: { highlight: boolean; quality: Quality }) {
  const group = useRef<THREE.Group>(null);
  const glow = useRef<THREE.PointLight>(null);

  const profile = useMemo(
    () => [
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
    ],
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (group.current) {
      // طفو لا اهتزاز: سعة صغيرة وتردّد بطيء
      group.current.position.y = -0.55 + Math.sin(t * 0.6) * 0.045;
      group.current.rotation.y += delta * 0.11;
    }

    if (glow.current) {
      glow.current.intensity = damp(glow.current.intensity, highlight ? 6 : 1.5, 5, delta);
    }
  });

  return (
    <group ref={group} position={[0, -0.55, 0]}>
      {/* الزجاج — الجسم الوحيد الذي يحمل خامة الإرسال الكاملة */}
      <mesh>
        <latheGeometry args={[profile, 88]} />
        <MeshTransmissionMaterial
          samples={quality.transmissionSamples}
          resolution={quality.transmissionResolution}
          transmission={1}
          thickness={0.45}
          roughness={0.03}
          ior={1.5}
          chromaticAberration={0.09}
          anisotropy={0.15}
          distortion={0.12}
          distortionScale={0.25}
          temporalDistortion={0.04}
          backside
          color="#ffffff"
          attenuationColor="#F6ECD9"
          attenuationDistance={2.4}
        />
      </mesh>

      {/*
        الطبقات أنحف من الجدار الداخلي بنحو ٠٫٠٣ عند كل ارتفاع. لو لامسته
        لاخترقته فيختفي الزجاج ويبدو الكوب أسطوانة معتمة؛ والفراغ المتروك
        فوق الرغوة هو ما يجعل الحافة تُقرأ زجاجاً.
      */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.53, 0.475, 0.62, 56]} />
        <meshPhysicalMaterial color="#2A150C" roughness={0.32} metalness={0.06} clearcoat={0.5} />
      </mesh>

      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.558, 0.53, 0.38, 56]} />
        <meshPhysicalMaterial color="#E8D3B4" roughness={0.6} sheen={0.6} sheenColor="#FFFAF0" />
      </mesh>

      {/* كريمة مخفوقة */}
      <mesh position={[0, 1.145, 0]}>
        <cylinderGeometry args={[0.572, 0.558, 0.11, 56]} />
        <meshPhysicalMaterial color="#FDF6EA" roughness={0.85} sheen={1} sheenColor="#ffffff" />
      </mesh>

      <CaramelDrizzle />

      <pointLight
        ref={glow}
        position={[0, 0.8, 0]}
        distance={3.6}
        color={PALETTE.gold}
        intensity={1.5}
      />
    </group>
  );
}

/** حلزون كراميل رفيع على سطح الكريمة */
function CaramelDrizzle() {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const turns = 2.6;
    for (let i = 0; i <= 130; i++) {
      const u = i / 130;
      const angle = u * Math.PI * 2 * turns;
      const radius = 0.06 + u * 0.44;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 150, 0.015, 8, false);
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} position={[0, 1.208, 0]}>
      <meshPhysicalMaterial
        color={PALETTE.goldDeep}
        roughness={0.22}
        clearcoat={1}
        clearcoatRoughness={0.18}
      />
    </mesh>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   حلقة السائل — انسكاب كراميل يلتف ٣٦٠° حول الكوب

   ثلاثة أشرطة من حلقات مُشوّهة في مُظلِّل الرؤوس. إعادة بناء TubeGeometry
   كل إطار — وهو الحل البديهي — تُخصّص آلاف الرؤوس داخل حلقة الرسم.
   ══════════════════════════════════════════════════════════════════════ */

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

const BANDS: BandSpec[] = [
  { radius: 1.02, tube: 0.052, lobes: 3, wave: 0.17, tilt: 0.22, speed: 0.34, color: PALETTE.gold, roughness: 0.2 },
  // ميل قويّ عمداً: بميل ضحل يقع هذا الشريط شبه منطبق على مستوى النظر
  // فيظهر قضيباً مستقيماً يعبر الكوب بدل حلقة تلتف حوله
  { radius: 1.26, tube: 0.042, lobes: 4, wave: 0.13, tilt: -0.68, speed: -0.26, color: "#F6ECD9", roughness: 0.45 },
  { radius: 0.85, tube: 0.024, lobes: 5, wave: 0.1, tilt: 0.5, speed: 0.46, color: PALETTE.goldDeep, roughness: 0.28 },
];

function Band({ spec, highlight }: { spec: BandSpec; highlight: boolean }) {
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLobes: { value: spec.lobes },
      uWave: { value: spec.wave },
      uSpeed: { value: spec.speed },
    }),
    [spec.lobes, spec.wave, spec.speed]
  );

  useFrame((state, delta) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    if (material.current) {
      material.current.emissiveIntensity = damp(
        material.current.emissiveIntensity,
        highlight ? 0.6 : 0.1,
        4,
        delta
      );
    }
  });

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
           // تنفّس في نصف القطر مع تموّج رأسي: يقرأ سائلاً لا أنبوباً صلباً
           float breathe = 1.0 + sin(ang * uLobes + t * 2.0) * 0.085;
           transformed.xz *= breathe;
           transformed.y += sin(ang * uLobes + t * 1.6) * uWave
                          + sin(ang * 2.0 - t) * 0.055;`
        );
    },
    [uniforms]
  );

  return (
    <mesh rotation={[spec.tilt, 0, spec.tilt * 0.6]}>
      <torusGeometry args={[spec.radius, spec.tube, 18, 190]} />
      <meshPhysicalMaterial
        ref={material}
        color={spec.color}
        roughness={spec.roughness}
        metalness={0.14}
        clearcoat={1}
        clearcoatRoughness={0.14}
        emissive={spec.color}
        emissiveIntensity={0.1}
        onBeforeCompile={onBeforeCompile}
        // بدونه يُعيد three استخدام برنامج مُصنَّف بلا تشويهنا
        customProgramCacheKey={() => `ghaim-band-${spec.lobes}-${spec.wave}`}
      />
    </mesh>
  );
}

function SplashRing({ highlight }: { highlight: boolean }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef(0);

  useFrame((_, delta) => {
    if (!group.current) return;
    // الدوران يتبع التمرير المُنعّم بلا قفزات
    spin.current = damp(spin.current, scroll.p * Math.PI * 1.4, 3, delta);
    group.current.rotation.z = spin.current;
  });

  return (
    <group position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <group ref={group}>
        {BANDS.map((spec, i) => (
          <Band key={i} spec={spec} highlight={highlight} />
        ))}
        <Droplets highlight={highlight} />
      </group>
    </group>
  );
}

/** قطرات صغيرة تدور مع الحلقة وتُكمل إيحاء الرذاذ */
function Droplets({ highlight }: { highlight: boolean }) {
  const group = useRef<THREE.Group>(null);

  const drops = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        angle: (i / 14) * Math.PI * 2,
        radius: 0.9 + (i % 4) * 0.11,
        depth: ((i % 5) - 2) * 0.13,
        size: 0.022 + (i % 3) * 0.011,
        speed: 0.3 + (i % 3) * 0.12,
      })),
    []
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < group.current.children.length; i++) {
      const child = group.current.children[i];
      const d = drops[i];
      const a = d.angle + t * d.speed;
      // المجموعة الأم مُدارة ٩٠°، فالعمق هنا على المحور Z
      child.position.set(Math.cos(a) * d.radius, Math.sin(a) * d.radius, d.depth + Math.sin(t * 1.4 + i) * 0.08);
      const target = d.size * (highlight ? 1.5 : 1);
      const s = damp(child.scale.x, target, 5, delta);
      child.scale.setScalar(s);
    }
  });

  return (
    <group ref={group}>
      {drops.map((d, i) => (
        <mesh key={i} scale={d.size}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshPhysicalMaterial
            color={i % 3 === 0 ? "#F6ECD9" : PALETTE.gold}
            roughness={0.18}
            clearcoat={1}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   مكعّبات ثلج بلّورية

   إرسال meshPhysicalMaterial المدمج لا خامة drei: المدمج يتشارك تمريرة
   إرسال واحدة على مستوى المشهد، بينما تحجز خامة drei هدف عرض لكل مجسّم.
   على مكعّبات بهذا الحجم الفرق البصري لا يكاد يُرى، وفرق الكلفة كبير.
   ══════════════════════════════════════════════════════════════════════ */

const ICE = [
  { position: [2.35, 0.35, -1.4], size: 0.26, spin: 0.22 },
  { position: [-2.45, -0.3, -1.8], size: 0.3, spin: -0.16 },
  { position: [2.0, -1.2, -2.2], size: 0.22, spin: 0.3 },
  { position: [-2.0, 0.75, -1.1], size: 0.19, spin: -0.26 },
  { position: [1.55, 1.35, -2.6], size: 0.17, spin: 0.19 },
] as const;

function IceCubes({ highlight, count }: { highlight: boolean; count: number }) {
  const group = useRef<THREE.Group>(null);
  const cubes = useMemo(() => ICE.slice(0, count), [count]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < group.current.children.length; i++) {
      const child = group.current.children[i];
      const c = cubes[i];
      child.rotation.x = t * c.spin;
      child.rotation.y = t * c.spin * 0.7;
      child.position.y = c.position[1] + Math.sin(t * 0.5 + i * 1.7) * 0.14;
      const s = damp(child.scale.x, c.size * (highlight ? 1.3 : 1), 3, delta);
      child.scale.setScalar(s);
    }
  });

  return (
    <group ref={group}>
      {cubes.map((c, i) => (
        <RoundedBox
          key={i}
          args={[1, 1, 1]}
          radius={0.16}
          smoothness={3}
          position={c.position as unknown as [number, number, number]}
          scale={c.size}
        >
          <meshPhysicalMaterial
            transmission={0.92}
            thickness={0.35}
            roughness={0.06}
            ior={1.31}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.08}
            color="#ffffff"
            attenuationColor="#EAF3FF"
            attenuationDistance={4}
          />
        </RoundedBox>
      ))}
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   حبوب القهوة

   مجسّم واحد مُنسَّخ: نداء رسم واحد مهما بلغ العدد. بعضها أمام الكوب عمداً
   (z موجب) كي تلتقطه ضبابة عمق الميدان مقدمةً غير محدّدة.
   ══════════════════════════════════════════════════════════════════════ */

function Beans({ highlight, count }: { highlight: boolean; count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const boost = useRef(1);

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        angle: (i / count) * Math.PI * 2 + Math.random() * 0.5,
        radius: 2.2 + Math.random() * 1.8,
        height: -0.4 + (Math.random() - 0.5) * 2.6,
        // ثلثها أمام الكوب لتصنع المقدمة الضبابية
        depth: i % 3 === 0 ? 1.4 + Math.random() * 0.9 : -0.8 - Math.random() * 1.9,
        size: 0.055 + Math.random() * 0.04,
        speed: 0.06 + Math.random() * 0.11,
        tilt: Math.random() * Math.PI,
      })),
    [count]
  );

  useFrame((state, delta) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;
    boost.current = damp(boost.current, highlight ? 1.35 : 1, 4, delta);
    const b = boost.current;

    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const a = s.angle + t * s.speed;
      dummy.position.set(
        Math.cos(a) * s.radius,
        s.height + Math.sin(t * 0.4 + i) * 0.2,
        Math.sin(a) * s.radius * 0.45 + s.depth
      );
      dummy.rotation.set(t * 0.3 + s.tilt, a, t * 0.2);
      // إهليج مفلطح لا كرة
      dummy.scale.set(s.size * b, s.size * 0.62 * b, s.size * 0.78 * b);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 16, 12]} />
      <meshPhysicalMaterial
        color="#3B2013"
        roughness={0.42}
        clearcoat={0.6}
        clearcoatRoughness={0.35}
      />
    </instancedMesh>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   جزيئات الرذاذ

   ألواح تواجه الكاميرا دائماً. نتجنّب مكوّن Cloud الجاهز لأنه يجلب نسيجاً
   من الشبكة؛ النسيج هنا يُرسم مرة واحدة على canvas محلي.
   ══════════════════════════════════════════════════════════════════════ */

function MistParticles({ count }: { count: number }) {
  const group = useRef<THREE.Group>(null);

  const texture = useMemo(() => {
    const size = 128;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(255,255,255,0.9)");
    grad.addColorStop(0.45, "rgba(255,255,255,0.32)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  const puffs = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 7.5,
        y: -1.2 + Math.random() * 1.6,
        z: -0.4 - Math.random() * 2.2,
        scale: 0.6 + Math.random() * 1.1,
        speed: 0.04 + Math.random() * 0.1,
        phase: Math.random() * Math.PI * 2,
        // منخفضة عمداً: عدة ألواح تتراكم، والقيم الأعلى تُنتج لطخة بيضاء صلبة
        opacity: 0.05 + Math.random() * 0.08,
      })),
    [count]
  );

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < group.current.children.length; i++) {
      const child = group.current.children[i];
      const p = puffs[i];
      child.position.x = p.x + Math.sin(t * p.speed + p.phase) * 0.5;
      child.position.y = p.y + Math.sin(t * 0.22 + p.phase) * 0.16;
    }
  });

  return (
    <group ref={group}>
      {puffs.map((p, i) => (
        <sprite key={i} position={[p.x, p.y, p.z]} scale={p.scale}>
          <spriteMaterial
            map={texture}
            transparent
            opacity={p.opacity}
            depthWrite={false}
            color="#ffffff"
          />
        </sprite>
      ))}
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   الكاميرا — انتقال مداري حول الكوب

   إحداثيات كروية حول الهدف: السمت يمسح، ونصف القطر يقترب في المنتصف ثم
   يتراجع، والارتفاع ينخفض. كل قيمة تُلاحَق بـ damp فتبقى الحركة زبدية
   مهما تقطّعت أحداث التمرير الواردة.
   ══════════════════════════════════════════════════════════════════════ */

function CameraRig({ reduced }: { reduced: boolean }) {
  const { camera, size } = useThree();

  useFrame((_, delta) => {
    const p = reduced ? 0 : scroll.p;

    /*
      على الشاشات الضيقة لا يوجد ممرّ جانبي حرّ، فالكوب يقع خلف نصّ البطل
      مباشرةً ويبتلع الفقرة. نرفع نقطة النظر فوقه فتنظر الكاميرا لأعلى ويسقط
      الكوب إلى النصف السفلي، ونتراجع قليلاً فيصغر — فيخلو أعلى الإطار للنصّ.
      يتلاشى الرفع مع التمرير لأن النصّ يكون قد غادر الشاشة.
    */
    const narrow = size.width / size.height < 1.05;
    const lift = narrow ? 1.25 * (1 - Math.min(p * 1.6, 1)) : 0;

    const azimuth = -0.32 + p * 1.15;
    const elevation = 0.3 - p * 0.2;
    const radius = (6.4 - Math.sin(p * Math.PI) * 1.25) * (narrow ? 1.14 : 1);

    // اختلاف منظر خفيف من المؤشّر يمنح الطبقات عمقاً محسوساً
    const px = reduced ? 0 : pointer.x * 0.28;
    const py = reduced ? 0 : pointer.y * 0.18;

    scratch.camWanted.set(
      Math.sin(azimuth + px) * Math.cos(elevation) * radius,
      Math.sin(elevation + py) * radius + 0.35,
      Math.cos(azimuth + px) * Math.cos(elevation) * radius
    );

    const lambda = 3.2;
    camera.position.x = damp(camera.position.x, scratch.camWanted.x, lambda, delta);
    camera.position.y = damp(camera.position.y, scratch.camWanted.y, lambda, delta);
    camera.position.z = damp(camera.position.z, scratch.camWanted.z, lambda, delta);

    scratch.camTarget.set(0, 0.35 - p * 0.15 + lift, 0);
    scratch.lookAt.x = damp(scratch.lookAt.x, scratch.camTarget.x, lambda, delta);
    scratch.lookAt.y = damp(scratch.lookAt.y, scratch.camTarget.y, lambda, delta);
    scratch.lookAt.z = damp(scratch.lookAt.z, scratch.camTarget.z, lambda, delta);

    camera.lookAt(scratch.lookAt);
  });

  return null;
}

/* ══════════════════════════════════════════════════════════════════════
   المشهد
   ══════════════════════════════════════════════════════════════════════ */

function SceneContents({
  focus,
  reduced,
  quality,
}: {
  focus: Focus | null;
  reduced: boolean;
  quality: Quality;
}) {
  return (
    <>
      <CameraRig reduced={reduced} />

      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 6, 5]} intensity={2.1} />
      <directionalLight position={[-5, 2, -4]} intensity={0.7} color="#F6ECD9" />
      <pointLight position={[0, -2, 2]} intensity={0.9} color={PALETTE.gold} distance={9} />

      {/*
        البيئة مبنية من ألواح ضوئية داخل المشهد. إعدادات Environment الجاهزة
        (preset) تنزّل HDRI من شبكة توصيل خارجية؛ حين تُحجب يسقط الانعكاس
        بصمت فيبدو الزجاج باهتاً بلا أي خطأ في الطرفية.
      */}
      <Environment resolution={quality.tier === "high" ? 256 : 128}>
        <Lightformer form="rect" intensity={3.4} position={[0, 4, -5]} scale={[12, 8, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.6} position={[-5, 1, 2]} scale={[6, 8, 1]} color={PALETTE.cream} />
        <Lightformer form="rect" intensity={1.2} position={[5, -1, 2]} scale={[6, 6, 1]} color="#F6ECD9" />
        <Lightformer form="ring" intensity={2.2} position={[0, -3, 1]} scale={5} color={PALETTE.gold} />
      </Environment>

      <fog attach="fog" args={["#F5EFE4", 11, 26]} />

      <SilkBackdrop segments={quality.silkSegments} />

      <GlassCup highlight={focus === "cup"} quality={quality} />
      <SplashRing highlight={focus === "cup"} />
      <IceCubes highlight={focus === "ice"} count={quality.ice} />
      <Beans highlight={focus === "beans"} count={quality.beans} />
      <MistParticles count={quality.mist} />

      {quality.postProcessing && !reduced && (
        <EffectComposer enableNormalPass={false} multisampling={2}>
          {/*
            التركيز بوحدات العالم لا بالمدى المُطبَّع: نصف قطر الكاميرا يتراوح
            بين ٥٫١ و٦٫٤، والقيمة المُطبَّعة تنزلق معه فيخرج الكوب عن التركيز
            كلّما تحرّكت. المدى واسع كي يبقى الكوب حاداً وتلين المقدمة وحدها.
          */}
          <DepthOfField
            worldFocusDistance={5.9}
            worldFocusRange={3.0}
            focalLength={0.05}
            bokehScale={2.4}
            height={420}
          />
          <Bloom intensity={0.4} luminanceThreshold={0.74} luminanceSmoothing={0.3} height={280} />
        </EffectComposer>
      )}
    </>
  );
}

function Scene({
  focus,
  reduced,
  quality,
}: {
  focus: Focus | null;
  reduced: boolean;
  quality: Quality;
}) {
  return (
    <Canvas
      className="!fixed inset-0"
      dpr={quality.dpr}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.35, 6.4], fov: 40, near: 0.1, far: 60 }}
      // اللمس يجب أن يمرّ إلى الصفحة كي يبقى التمرير ممكناً فوق اللوحة
      style={{ pointerEvents: "none", touchAction: "auto" }}
    >
      <color attach="background" args={[PALETTE.cream]} />
      <Suspense fallback={null}>
        <SceneContents focus={focus} reduced={reduced} quality={quality} />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   أنماط الزجاج

   مضمّنة داخل المكوّن ليبقى ملفاً واحداً قابلاً للإسقاط في أي مشروع
   دون انتظار إضافات إلى إعداد Tailwind.
   ══════════════════════════════════════════════════════════════════════ */

const STYLES = `
.gh-root {
  --gh-cream: ${PALETTE.cream};
  --gh-espresso: ${PALETTE.espresso};
  --gh-gold: ${PALETTE.gold};
  --gh-gold-deep: ${PALETTE.goldDeep};
  --gh-sand: ${PALETTE.sand};
  direction: rtl;
  color: var(--gh-espresso);
  font-family: "Noto Sans Arabic", system-ui, sans-serif;
  font-weight: 300;
  line-height: 1.9;
  -webkit-font-smoothing: antialiased;
}

/* البطاقات تدخل بإزاحة أفقية وتتجاوز الحافة أثناء الحركة على الشاشات
   الضيقة. clip لا hidden كي لا يُكسر أي التصاق لاحق. */
html.gh-html { overflow-x: clip; }

.gh-display { font-family: "El Messiri", Georgia, serif; font-weight: 600; line-height: 1.4; }
.gh-latin { font-family: "Cormorant Garamond", Georgia, serif; font-weight: 300; letter-spacing: 0.14em; }

/* زجاج مصنفر بحدّ ذهبي رفيع */
.gh-glass {
  background: rgba(253, 251, 247, 0.55);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid rgba(200, 162, 100, 0.3);
  box-shadow: 0 18px 50px -22px rgba(44, 24, 16, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.gh-glass-strong {
  background: rgba(253, 251, 247, 0.74);
  backdrop-filter: blur(22px) saturate(150%);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
  border: 1px solid rgba(200, 162, 100, 0.38);
  box-shadow: 0 24px 60px -26px rgba(44, 24, 16, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

/* على الشاشات الضيقة يبقى الكوب خلف البطاقات مباشرة بلا ممرّ جانبي حرّ،
   فنرفع العتامة كي يبقى النص مقروءاً فوق مشهد متحرّك. */
@media (max-width: 1023px) {
  .gh-glass { background: rgba(253, 251, 247, 0.78); }
  .gh-glass-strong { background: rgba(253, 251, 247, 0.9); }
}

@media (prefers-reduced-transparency: reduce) {
  .gh-glass, .gh-glass-strong {
    background: rgba(253, 251, 247, 0.97);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}

.gh-root ::selection { background: rgba(200, 162, 100, 0.28); }
.gh-root :focus-visible { outline: 2px solid var(--gh-gold); outline-offset: 3px; }
`;

/* ══════════════════════════════════════════════════════════════════════
   المكوّن الرئيسي
   ══════════════════════════════════════════════════════════════════════ */

export default function GhaimExperience() {
  const [focus, setFocus] = useState<Focus | null>(null);
  const [cart, setCart] = useState(2);
  const [reduced, setReduced] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const quality = useQuality();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    document.documentElement.classList.add("gh-html");
    return () => {
      mq.removeEventListener("change", onChange);
      document.documentElement.classList.remove("gh-html");
    };
  }, []);

  /* ===== اختلاف المنظر من المؤشّر — كتابة في كائن عادي لا في حالة ===== */
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced]);

  /* ===== محرّك التمرير الناعم + تغذية المشهد ===== */
  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      touchMultiplier: 1.6,
    });

    // ScrollTrigger يجب أن يُحدَّث من Lenis لا من حدث scroll الأصلي،
    // وإلا حسب المواضع من قيمة تمرير متأخّرة عن الفعلية
    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    // بدونه يبتلع GSAP الإطارات الطويلة فتتقطّع مزامنة Lenis
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, [reduced]);

  useGSAP(
    () => {
      if (reduced) return;

      // فيزياء scrub هي مصدر النعومة: الهدف يتحرّك فوراً والقيمة تلاحقه
      gsap.to(scroll, {
        p: 1,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.2,
        },
      });

      // البطاقات تنزلق إلى البؤرة
      /*
        fromTo لا from — وهذا ليس تفضيلاً في الأسلوب.

        `gsap.from` يقرأ الموضع الحالي ويعتبره نهاية الحركة. تحت StrictMode
        يُركَّب المكوّن ثم يُفكَّك ثم يُعاد تركيبه: التفكيك يُعيد العنصر إلى حالة
        البداية (‎y: 90‎)، فيقرأها التركيب الثاني نهايةً ويتحرّك ‎١٨٠→٩٠‎ — فتستقرّ
        البطاقة أخفض بتسعين بكسل دائماً وتُقصّ عند حافة الإطار. `fromTo` يُصرّح
        بالطرفين فيصير مُتَقَاوِماً مهما تكرّر التركيب.
      */
      /*
        الإزاحة أقصر على الأجهزة الضعيفة، وتسقط تماماً في الطبقة المنخفضة.

        البطاقات تبدأ من autoAlpha: 0، فلو تعثّرت الحركة بقيت غير مرئية وخارج
        موضعها. GSAP يُقيّد الفروق الزمنية الكبيرة بين الإطارات، فحين يهبط معدّل
        الإطارات إلى واحد أو اثنين تزحف الحركة بدل أن تنتهي. إسقاط الإزاحة هناك
        يجعل أسوأ الحالات تلاشياً بسيطاً لا بطاقةً عالقة تحت حافة الإطار.
      */
      gsap.fromTo(
        ".gh-card",
        { y: quality.tier === "low" ? 0 : 56, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.1,
          delay: 0.35,
        }
      );

      gsap.utils.toArray<HTMLElement>(".gh-reveal").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 40, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          }
        );
      });
    },
    { scope: root, dependencies: [reduced, quality.tier] }
  );

  return (
    <div ref={root} className="gh-root relative">
      <style>{STYLES}</style>

      {/* ===== المشهد ثلاثي الأبعاد — طبقة ثابتة خلف كل شيء ===== */}
      <Scene focus={focus} reduced={reduced} quality={quality} />

      {/* ===== شريط التنقّل الزجاجي ===== */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
          <a href="#top" className="gh-glass flex items-center gap-2.5 rounded-full px-5 py-2">
            <span className="gh-display text-2xl leading-none">غَيْم</span>
            <span className="gh-latin hidden text-[0.62rem] uppercase opacity-60 sm:inline">
              Ghaim
            </span>
          </a>

          <nav className="gh-glass hidden items-center gap-1 rounded-full px-1.5 py-1.5 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-1.5 text-sm opacity-80 transition-all duration-300 hover:bg-white/60 hover:opacity-100"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="بحث"
              className="gh-glass flex h-10 w-10 items-center justify-center rounded-full opacity-80 transition-opacity hover:opacity-100"
            >
              <SearchIcon />
            </button>
            <button
              type="button"
              aria-label={`سلّة التسوّق، ${cart} أصناف`}
              className="gh-glass relative flex h-10 w-10 items-center justify-center rounded-full opacity-80 transition-opacity hover:opacity-100"
            >
              <BagIcon />
              <span
                dir="ltr"
                className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[0.62rem] font-medium text-white"
                style={{ background: PALETTE.gold }}
              >
                {cart}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          القسم الأول: البطل
          النصّ يسار الإطار والكوب في المركز تماماً، والحافة اليمنى للنصّ
          (وهي بداية السطر في RTL) تصنع ممرّاً نظيفاً يؤطّر الكوب.
          ═══════════════════════════════════════════════════════════════ */}
      <section id="top" className="relative z-10 flex min-h-screen items-center supports-[height:100svh]:min-h-[100svh]">
        <div className="w-full px-5 sm:px-8 lg:px-12">
          {/*
            الهامش فيزيائي لا منطقي عن قصد. الكتلة مطلوبة يسار الإطار بينما
            الصفحة RTL، و`margin-inline` كان سيتبع اتجاه القراءة فيرميها يميناً.
            الهامش التلقائي يدفع الصندوق بعيداً عن الجهة التي وُضع عليها: auto
            على اليمين ⇒ الصندوق يسار. والمحاذاة داخلها تبقى يميناً كي تُقرأ
            العربية من بدايتها الطبيعية، فتتكوّن حافة رأسية تواجه الكوب.
          */}
          <div className="max-w-[30rem] text-right" style={{ marginLeft: 0, marginRight: "auto" }}>
            <span className="gh-latin block text-[0.7rem] uppercase opacity-60">
              Cloud Specialty Coffee
            </span>

            <h1 className="gh-display mt-5 text-[clamp(2.1rem,4.6vw,3.9rem)]">
              تحليق في سماء القهوة المختصة
            </h1>

            <p className="mt-5 text-[0.98rem] opacity-75 sm:text-lg">
              رشفة تحلّق بك فوق الغمام — حبّة مختارة، تحميص خفيف، وطبقات تُبنى أمامك.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#menu"
                className="rounded-full px-8 py-3.5 text-sm font-medium text-white transition-transform duration-300 hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, ${PALETTE.gold}, ${PALETTE.goldDeep})`,
                  boxShadow: "0 14px 34px -14px rgba(154,118,56,0.75)",
                }}
              >
                اطلب الآن
              </a>
              <a
                href="#menu"
                className="gh-glass gh-latin rounded-full px-8 py-3.5 text-sm transition-colors duration-300 hover:bg-white/70"
              >
                Order Online
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          كاروسيل البطاقات العائم أسفل الشاشة
          ═══════════════════════════════════════════════════════════════ */}
      <section
        id="menu"
        aria-label="مختارات القائمة"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 hidden px-5 pb-8 sm:px-8 lg:block lg:px-12"
      >
        <div className="pointer-events-auto mx-auto flex max-w-5xl gap-4">
          {PRODUCTS.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onFocus={setFocus}
              onAdd={() => setCart((c) => c + 1)}
            />
          ))}
        </div>
      </section>

      {/* نسخة متدفّقة للشاشات الضيقة: التثبيت أسفل الشاشة يلتهم الارتفاع */}
      <section aria-label="مختارات القائمة" className="relative z-10 px-5 pb-16 sm:px-8 lg:hidden">
        <div className="grid gap-4">
          {PRODUCTS.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onFocus={setFocus}
              onAdd={() => setCart((c) => c + 1)}
            />
          ))}
        </div>
      </section>

      {/* ===== حرفتنا ===== */}
      <section id="craft" className="relative z-10 px-5 py-28 sm:px-8 lg:px-12">
        <div className="gh-glass-strong gh-reveal mx-auto max-w-2xl rounded-[2rem] p-8 text-center sm:p-12">
          <span className="gh-latin text-[0.7rem] uppercase opacity-60">Our Craft</span>
          <h2 className="gh-display mt-2 text-[clamp(1.6rem,3.2vw,2.3rem)]">
            نحمّص خفيفاً لتبقى الحبّة صادقة
          </h2>
          <p className="mx-auto mt-5 max-w-[48ch] opacity-75">
            نختار دفعات صغيرة من مزارع نعرف أسماء أصحابها، ونحمّصها تحميصاً فاتحاً يُبقي حموضة
            الفاكهة وعطر الزهر. لا نضيف شيئاً يخفي أصل القهوة.
          </p>

          <dl
            className="mt-9 grid grid-cols-3 gap-6 pt-7"
            style={{ borderTop: "1px solid rgba(200,162,100,0.3)" }}
          >
            {[
              ["٤٨ س", "أقصى عمر للتحميص"],
              ["٣", "مزارع شريكة"],
              ["٩٢", "نقطة تحكيم"],
            ].map(([big, small]) => (
              <div key={small}>
                <dt className="gh-display text-2xl" style={{ color: PALETTE.goldDeep }}>
                  {big}
                </dt>
                <dd className="mt-1 text-[0.7rem] opacity-65">{small}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ===== الفروع ===== */}
      <section id="branches" className="relative z-10 px-5 pb-28 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {[
            { ar: "غَيْم — الملقا", en: "Al Malqa", address: "طريق الأمير محمد بن سلمان، الرياض" },
            { ar: "غَيْم — الخبر", en: "Al Khobar", address: "شارع الأمير فيصل بن فهد، الخبر" },
          ].map((branch) => (
            <div key={branch.en} className="gh-glass gh-reveal flex items-start gap-4 rounded-3xl p-6">
              <span
                className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ background: "rgba(200,162,100,0.16)", color: PALETTE.goldDeep }}
              >
                <PinIcon />
              </span>
              <div>
                <h3 className="gh-display text-lg">{branch.ar}</h3>
                <p className="gh-latin text-[0.7rem] uppercase opacity-60">{branch.en}</p>
                <p className="mt-1.5 text-sm opacity-75">{branch.address}</p>
              </div>
            </div>
          ))}
        </div>

        <footer
          className="mx-auto mt-14 max-w-3xl pt-7 text-center"
          style={{ borderTop: "1px solid rgba(200,162,100,0.3)" }}
        >
          <span className="gh-display text-xl">غَيْم</span>
          <p className="mt-2 text-[0.75rem] opacity-55">
            © ٢٠٢٦ غَيْم للقهوة المختصة. جميع الحقوق محفوظة.
          </p>
        </footer>
      </section>

      {/* مساحة أسفل الكاروسيل المثبّت كي لا يحجب نهاية الصفحة */}
      <div aria-hidden className="hidden h-44 lg:block" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   بطاقة منتج

   التحويم يُبرز الجسم المقابل في المشهد: البطاقة تُعلن عن أي شيء تتحدّث.
   ══════════════════════════════════════════════════════════════════════ */

function ProductCard({
  product,
  onFocus,
  onAdd,
}: {
  product: Product;
  onFocus: (focus: Focus | null) => void;
  onAdd: () => void;
}) {
  return (
    <article
      tabIndex={0}
      onMouseEnter={() => onFocus(product.focus)}
      onMouseLeave={() => onFocus(null)}
      onFocus={() => onFocus(product.focus)}
      onBlur={() => onFocus(null)}
      className="gh-card gh-glass-strong flex-1 rounded-3xl p-4 transition-transform duration-500 hover:-translate-y-2"
    >
      {/*
        صفّ واحد لا صفّان. البطاقة مثبّتة أسفل الإطار، والتخطيط المكدّس
        (صورة فوق، ثم سعر وزرّ تحت فاصل) بلغ ~١٤٨px فقُصّ عند الحافة السفلية.
        الصفّ الواحد يهبط إلى ~٨٨px ويقرأ أنظف ككاروسيل سفلي.
      */}
      <div className="flex items-center gap-3">
        {/* مساحة صورة محجوزة صراحةً — لا نعرض تدرّجاً على أنه لقطة منتج */}
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{
            background: `linear-gradient(140deg, ${product.swatch[0]}, ${product.swatch[1]})`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
          }}
          role="img"
          aria-label={`مساحة صورة ${product.ar}`}
        >
          <CupGlyph />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="gh-display truncate text-[0.95rem] leading-tight">{product.ar}</h3>
          <p className="gh-latin truncate text-[0.6rem] uppercase leading-tight opacity-55">
            {product.en}
          </p>
          <span
            dir="ltr"
            className="gh-latin mt-0.5 block text-[0.95rem] leading-tight"
            style={{ color: PALETTE.goldDeep }}
          >
            {product.price} SAR
          </span>
        </div>

        <button
          type="button"
          onClick={onAdd}
          aria-label={`إضافة ${product.ar} إلى السلّة`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-transform duration-200 hover:scale-110 active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${PALETTE.gold}, ${PALETTE.goldDeep})`,
            boxShadow: "0 10px 22px -10px rgba(154,118,56,0.8)",
          }}
        >
          <PlusIcon />
        </button>
      </div>
    </article>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   أيقونات مضمّنة — لا تبعية خارجية
   ══════════════════════════════════════════════════════════════════════ */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" {...stroke} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" {...stroke} strokeWidth={2} aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function CupGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} strokeWidth={1.3} aria-hidden opacity={0.85} color="#fff">
      <path d="M5 8h11v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8Z" />
      <path d="M16 9h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8 3.5v2M12 3.5v2" />
    </svg>
  );
}
