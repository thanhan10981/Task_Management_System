/* eslint-disable */
// Tells TypeScript that `.vue` files are valid modules that export a Vue component
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
