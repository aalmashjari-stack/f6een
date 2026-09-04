/// <reference types="vite/client" />

/* أنواع متغيّرات البيئة — بدونها `import.meta.env.VITE_...` من نوع any،
   فيمرّ خطأ إملائي في اسم المتغيّر بلا اعتراض حتى وقت التشغيل. */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  /* معرّفا غوغل — اختياريّان: الويب يدخل بإعادة التوجيه بلا معرّف هنا،
     والتطبيق الأصليّ وحده يشترط معرّف iOS (انظر lib/auth.ts). */
  readonly VITE_GOOGLE_IOS_CLIENT_ID?: string
  readonly VITE_GOOGLE_WEB_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
