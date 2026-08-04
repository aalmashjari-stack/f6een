/**
 * المؤثرات الصوتية.
 *
 * المبدأ الحاكم: **الصوت لما لا تراه العين.** صحصحلي تُلعب في مجلس صاخب،
 * والضجيج فيه من الناس لا من الشاشة. لعبة تُصفّر عند كل ضغطة تتحوّل إلى تطبيق
 * جوال وتزاحم طاقة الغرفة. فلا صوت إلا حيث يشتغل شغلاً حقيقياً: لحظة لا ينظر
 * فيها أحد إلى الشاشة (تنازل المؤقت والفريق متشاور)، أو لحظة تستحقّ تثبيتاً.
 *
 * الأصوات مركّبة بـ Web Audio لا ملفات مسجّلة، لأن اللعبة تعمل بلا إنترنت:
 * لا شيء يُجلب وقت اللعب، ولا كيلوبايت يُضاف للحزمة، ولا رخص ملفات تُتابع.
 * وتبديلها بتسجيلات لاحقاً لا يمسّ إلا هذا الملف.
 */

export type SfxName =
  | 'tick' // نبضة كل ثانية في آخر خمس ثوانٍ
  | 'timeUp' // انتهاء الوقت
  | 'pickStep' // قفزة الضوء بين التصنيفات
  | 'pickLand' // استقرار السحبة على تصنيف
  | 'correct' // إجابة صحيحة في راس براس
  | 'wrong' // إجابة خاطئة في راس براس
  | 'win' // نهاية اللعبة

const MUTE_KEY = 'sahsahli.muted'
/** مستوى مضبوط على مجلس: مسموع من آخره، ولا يقطع الحديث فيه. */
const MASTER_GAIN = 0.32

let ctx: AudioContext | null = null
let master: GainNode | null = null

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

let muted = readMuted()

export function isMuted(): boolean {
  return muted
}

export function setMuted(value: boolean) {
  muted = value
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0')
  } catch {
    /* تجاهل */
  }
  if (master) master.gain.value = value ? 0 : MASTER_GAIN
}

function audio(): { ctx: AudioContext; master: GainNode } | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null // متصفح بلا Web Audio: اللعبة تعمل صامتة، لا تنكسر
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : MASTER_GAIN
    master.connect(ctx.destination)
  }
  // المتصفح يعلّق السياق حتى أول لمسة. أول صوت في اللعبة يقع بعد ضغطة الحكم
  // على «ابدأ» دائماً، فالاستئناف الكسول هنا يكفي بلا مستمع إضافي.
  if (ctx.state === 'suspended') void ctx.resume()
  return { ctx, master: master! }
}

interface ToneOpts {
  freq: number
  /** انزلاق التردّد إلى هذه القيمة خلال المدّة. */
  to?: number
  /** بالثواني. */
  dur: number
  type?: OscillatorType
  gain?: number
  /** تأخير عن الآن بالثواني — لتركيب نغمتين متتابعتين. */
  at?: number
}

/**
 * نغمة واحدة بمغلّف سريع الهجوم أُسّي الخفوت.
 * الهجوم السريع يُسمع في مجلس صاخب، والخفوت الأُسّي يمنع تراكم الذيول
 * حين تتلاحق النغمات (نقرات السحبة تصل ثلاثين في اللفّة الواحدة).
 */
function tone(o: ToneOpts) {
  const a = audio()
  if (!a) return
  const t0 = a.ctx.currentTime + (o.at ?? 0)
  const dur = o.dur
  const peak = o.gain ?? 0.5

  const osc = a.ctx.createOscillator()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(o.freq, t0)
  if (o.to !== undefined) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur)

  const env = a.ctx.createGain()
  env.gain.setValueAtTime(0.0001, t0)
  env.gain.exponentialRampToValueAtTime(peak, t0 + 0.008)
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)

  osc.connect(env)
  env.connect(a.master)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

/**
 * الطابع: مثلّثية وجيبية دافئة لا منشارية حادّة — عدا «غلط» فحدّتها مقصودة.
 * السلّم مبني على دو الكبير حتى تتناغم الأصوات إن تلاحقت في تنقيط سريع.
 */
export function play(name: SfxName) {
  if (muted) return
  switch (name) {
    // نقرة خشبية خافتة — تتكرّر خمس مرات فقط فلا تُملّ، وتُسمع بلا نظر
    case 'tick':
      tone({ freq: 880, dur: 0.09, type: 'triangle', gain: 0.38 })
      break

    // هبوط حاسم: يريح الحكم من إعلان انتهاء الوقت بصوته
    case 'timeUp':
      tone({ freq: 466, to: 175, dur: 0.55, type: 'square', gain: 0.3 })
      break

    // قفزة الضوء — أخفت أصوات اللعبة، لأنها تتكرّر ثلاثين مرة في اللفّة
    case 'pickStep':
      tone({ freq: 1180, dur: 0.04, type: 'triangle', gain: 0.14 })
      break

    // الاستقرار: صعود ثم رنّة تمتدّ — تثبيت للحظة السحبة النهائية
    case 'pickLand':
      tone({ freq: 659.25, to: 987.77, dur: 0.15, type: 'triangle', gain: 0.45 })
      tone({ freq: 987.77, dur: 0.55, type: 'sine', gain: 0.3, at: 0.13 })
      break

    // ثالثة صاعدة مشرقة
    case 'correct':
      tone({ freq: 783.99, dur: 0.1, type: 'sine', gain: 0.45 })
      tone({ freq: 1174.66, dur: 0.3, type: 'sine', gain: 0.4, at: 0.09 })
      break

    // هبوط قصير خشن — متمايز عن «صح» بلا لبس، والتنقيط في راس براس سريع متتابع
    case 'wrong':
      tone({ freq: 311.13, to: 185, dur: 0.28, type: 'square', gain: 0.26 })
      break

    // بشارة: أربع درجات صاعدة، آخرها تمتدّ مع الكونفيتي
    case 'win': {
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.forEach((f, i) =>
        tone({ freq: f, dur: i === notes.length - 1 ? 0.9 : 0.2, type: 'triangle', gain: 0.42, at: i * 0.12 }),
      )
      break
    }
  }
}
