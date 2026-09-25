import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../fonts/cairo.css'
import './admin.css'
import AdminApp from './AdminApp'
import { setRequestTimeout } from '../lib/supabase'

/* اللوحة تنتظر أطول من اللاعب: اعتمادُ دفعةٍ من المسوّدات أو رفعُ ملفٍّ بمئات
   الأسئلة عملٌ حقيقيّ في القاعدة، ومهلةُ اللاعب (15 ثانية) تقطعه في منتصفه. */
setRequestTimeout(90_000)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
)
