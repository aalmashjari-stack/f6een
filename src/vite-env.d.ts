/// <reference types="vite/client" />

/* أنواع متغيّرات البيئة — بدونها `import.meta.env.VITE_...` من نوع any،
   فيمرّ خطأ إملائي في اسم المتغيّر بلا اعتراض حتى وقت التشغيل. */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
