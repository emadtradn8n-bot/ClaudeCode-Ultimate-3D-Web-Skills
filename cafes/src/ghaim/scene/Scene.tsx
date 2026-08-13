import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, AdaptiveDpr, Preload } from "@react-three/drei";
import { EffectComposer, DepthOfField, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { GlassCup } from "./GlassCup";
import { SplashRing } from "./SplashRing";
import { Beans, CloudMist, IceCubes } from "./Floaters";
import type { Focus } from "../data";

/** تقدّم التمرير ٠→١، يكتبه ScrollTrigger ويقرأه المشهد كل إطار */
export const scrollRef = { current: 0 };

/**
 * خلفية الشمبانيا مرسومة داخل المشهد لا في CSS.
 *
 * لوحة شفافة تعني هدف عرض ممسوحاً إلى RGBA(0,0,0,0): تمزج ضبابة عمق الميدان
 * تلك البكسلات الفارغة في حواف الأجسام فتُقتم أطرافها، ولا تجد خامات الإرسال
 * شيئاً تكسره فتبدو باهتة. لوح مصمت خلف المشهد يحلّ الأمرين معاً — ويغني عن
 * تمرير لون بديل يدوياً إلى كل خامة إرسال.
 */
function Backdrop() {
  const texture = useMemo(() => {
    const w = 512;
    const h = 512;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d")!;
    g.fillStyle = "#f4f4f6";
    g.fillRect(0, 0, w, h);

    // نفس تدرّجي CSS: كريم من الأعلى، وشمبانيا دافئة من أسفل البداية
    const top = g.createRadialGradient(w * 0.7, 0, 0, w * 0.7, 0, w * 0.95);
    top.addColorStop(0, "#fdf9f3");
    top.addColorStop(1, "rgba(253,249,243,0)");
    g.fillStyle = top;
    g.fillRect(0, 0, w, h);

    const bottom = g.createRadialGradient(w * 0.15, h, 0, w * 0.15, h, w * 0.85);
    bottom.addColorStop(0, "#f6ecd9");
    bottom.addColorStop(1, "rgba(246,236,217,0)");
    g.fillStyle = bottom;
    g.fillRect(0, 0, w, h);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <mesh position={[0, 0, -14]} renderOrder={-1}>
      <planeGeometry args={[70, 46]} />
      {/* بلا إضاءة وبلا ضباب: هذه خلفية مطبوعة لا سطح في المشهد */}
      <meshBasicMaterial map={texture} toneMapped={false} depthWrite={false} fog={false} />
    </mesh>
  );
}

interface SceneProps {
  focus: Focus | null;
  reduced: boolean;
}

/**
 * مسار الكاميرا كمفاتيح على محور التمرير.
 *
 * `shift` هو الحيلة الأساسية للتنسيق: حين نحرّك الكاميرا وهدفها معاً على
 * المحور X، يبقى اتجاه النظر موازياً فينزاح الكوب أفقياً على الشاشة دون أن
 * يدور. قيمة موجبة تدفعه إلى يسار الإطار — أي الجهة الحرّة في تخطيط RTL،
 * فتبقى البطاقات على اليمين بلا تصادم.
 *
 * `targetY` فوق الكوب في البداية: الكاميرا تنظر لأعلى فيسقط الكوب إلى أسفل
 * الإطار ويترك الثلثين العلويين للعنوان.
 */
interface CamKey {
  p: number;
  shift: number;
  targetY: number;
  camY: number;
  dist: number;
}

const CAM_PATH: CamKey[] = [
  { p: 0.0, shift: 0.0, targetY: 1.98, camY: 0.9, dist: 6.2 },
  { p: 0.28, shift: 0.2, targetY: 1.4, camY: 0.85, dist: 5.9 },
  { p: 0.5, shift: 1.6, targetY: 0.5, camY: 0.55, dist: 5.1 },
  { p: 0.78, shift: 1.85, targetY: 0.32, camY: 0.32, dist: 5.3 },
  { p: 1.0, shift: 2.2, targetY: 0.15, camY: 0.15, dist: 6.1 },
];

/** يقرأ المسار عند تقدّم p بالاستيفاء الخطي بين أقرب مفتاحين */
function samplePath(p: number): CamKey {
  const c = THREE.MathUtils.clamp(p, 0, 1);
  let a = CAM_PATH[0];
  let b = CAM_PATH[CAM_PATH.length - 1];
  for (let i = 0; i < CAM_PATH.length - 1; i++) {
    if (c >= CAM_PATH[i].p && c <= CAM_PATH[i + 1].p) {
      a = CAM_PATH[i];
      b = CAM_PATH[i + 1];
      break;
    }
  }
  const span = b.p - a.p || 1;
  const t = (c - a.p) / span;
  return {
    p: c,
    shift: THREE.MathUtils.lerp(a.shift, b.shift, t),
    targetY: THREE.MathUtils.lerp(a.targetY, b.targetY, t),
    camY: THREE.MathUtils.lerp(a.camY, b.camY, t),
    dist: THREE.MathUtils.lerp(a.dist, b.dist, t),
  };
}

/**
 * نلطّف القيمة بـ lerp داخل useFrame بدل تحريك الكاميرا مباشرة من GSAP،
 * فيبقى المسار ناعماً مهما تقطّعت أحداث التمرير.
 */
function CameraRig({ reduced }: { reduced: boolean }) {
  const { camera, size } = useThree();
  const target = useRef(new THREE.Vector3(0, 1.98, 0));

  useFrame((_, delta) => {
    const p = reduced ? 0 : scrollRef.current;
    const k = 1 - Math.pow(0.001, delta); // تنعيم مستقل عن معدّل الإطارات
    const key = samplePath(p);

    // على الشاشات الضيقة لا يوجد عمود جانبي حرّ، فنلغي الإزاحة ونُبقيه وسطاً
    const wide = size.width / size.height > 1.05;
    const shift = wide ? key.shift : key.shift * 0.12;

    const wanted = new THREE.Vector3(
      shift + Math.sin(p * Math.PI) * 0.55, // مدار خفيف يعطي اختلاف منظر
      key.camY,
      key.dist
    );
    camera.position.lerp(wanted, k);

    target.current.lerp(new THREE.Vector3(shift, key.targetY, 0), k);
    camera.lookAt(target.current);
  });

  return null;
}

function Rig({ focus, reduced }: SceneProps) {
  return (
    <>
      <CameraRig reduced={reduced} />

      {/* إضاءة ثلاثية النقاط ناعمة تناسب اللؤلؤ السحابي */}
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 5]} intensity={2.1} castShadow />
      <directionalLight position={[-5, 2, -4]} intensity={0.7} color="#f6ecd9" />
      <pointLight position={[0, -2, 2]} intensity={0.9} color="#d99b26" distance={9} />

      {/*
        خريطة البيئة مبنية داخل المشهد من ألواح ضوئية. إعدادات Environment
        الجاهزة (preset) تنزّل HDRI من شبكة توصيل خارجية، وهي محجوبة هنا،
        فيسقط الانعكاس بصمت ويصبح الزجاج باهتاً.
      */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3.4} position={[0, 4, -5]} scale={[12, 8, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.6} position={[-5, 1, 2]} scale={[6, 8, 1]} color="#fdf9f3" />
        <Lightformer form="rect" intensity={1.2} position={[5, -1, 2]} scale={[6, 6, 1]} color="#f6ecd9" />
        <Lightformer form="ring" intensity={2.2} position={[0, -3, 1]} scale={5} color="#d99b26" />
      </Environment>

      <Backdrop />

      <group>
        <GlassCup highlight={focus === "cup"} />
        <SplashRing highlight={focus === "cup"} />
        <IceCubes highlight={focus === "ice"} />
        <Beans highlight={focus === "beans"} />
        <CloudMist highlight={focus === "cloud"} />
      </group>

      {/* ضباب خفيف يُذيب أبعد الحبوب في شمبانيا الخلفية قبل أن تصل إليها الضبابة */}
      <fog attach="fog" args={["#f2ede4", 10.5, 24]} />

      {!reduced && (
        <EffectComposer enableNormalPass={false}>
          {/*
            التركيز بوحدات العالم لا بالمدى المُطبَّع: الكاميرا تتراوح بين ٥٫١ و٦٫٢
            عن الكوب، والقيمة المُطبَّعة كانت تنزلق معها فيخرج الكوب عن التركيز
            كلّما تحرّكت. المدى واسع كي يبقى الكوب حاداً على طول المسار وتلين
            الحبوب والمكعّبات والخلفية وحدها.
          */}
          <DepthOfField
            worldFocusDistance={5.7}
            worldFocusRange={3.4}
            focalLength={0.05}
            bokehScale={2.4}
            height={480}
          />
          <Bloom intensity={0.42} luminanceThreshold={0.72} luminanceSmoothing={0.3} height={300} />
        </EffectComposer>
      )}
    </>
  );
}

export function Scene({ focus, reduced }: SceneProps) {
  return (
    <Canvas
      className="!fixed inset-0"
      dpr={[1, 1.75]}
      // مصمتة: لوح الخلفية داخل المشهد يتكفّل بالتدرّج، ولا نريد بكسلات فارغة
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.35, 6.2], fov: 42, near: 0.1, far: 40 }}
      // اللمس يجب أن يمرّ إلى الصفحة كي يبقى التمرير ممكناً فوق اللوحة
      style={{ pointerEvents: "none", touchAction: "auto" }}
    >
      <color attach="background" args={["#f4f4f6"]} />
      <Suspense fallback={null}>
        <Rig focus={focus} reduced={reduced} />
        <Preload all />
      </Suspense>
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
