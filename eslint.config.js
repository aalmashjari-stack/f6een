import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

/*
  الفحص الآليّ — `npm run lint`.

  الأنواعُ والمتغيّرات غير المستعملة يحرسها `tsc` (strict وnoUnused*)، فلا تُكرَّر هنا.
  وما يُضيفه ESLint: قواعد الخطافات (useEffect بتبعيّاتٍ ناقصة، وخطافٌ داخل شرط)،
  والأخطاء الشائعة في JS التي لا يراها المترجم.
*/
export default tseslint.config(
  /* و«اسم 2.tsx» نسخُ iCloud المكرّرة: متجاهَلةٌ في git لكنّها على القرص، ولا تُفحص. */
  {
    ignores: [
      'dist',
      'android',
      'ios',
      'node_modules',
      'design-system',
      '.design-sync',
      '.ds-sync',
      'ds-bundle',
      'reports',
      'tmp',
      'output',
      'outputs',
      'backups',
      '**/* [0-9].*',
      '**/* [0-9][0-9].*',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
)
