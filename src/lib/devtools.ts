/**
 * Geliştirici araçlarını (DevTools) kapatır.
 *
 * Tauri, pencereyi `devtools(true)` ile açmadığı için F12 varsayılan olarak
 * çalışmaz; yine de WebView2'nin kısayolları ve sağ tık menüsü bazı
 * derlemelerde açık kalabiliyor. Bu modül üç katmanı da kapatır:
 * kısayollar, sağ tık menüsü ve `beforeinput` üzerinden yazılan komut.
 */
export function blockDevTools(): void {
  // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (view-source)
  window.addEventListener(
    'keydown',
    (event) => {
      const key = event.key.toLowerCase()

      const isF12 = key === 'f12'
      const isInspectCombo =
        event.ctrlKey && event.shiftKey && (key === 'i' || key === 'j' || key === 'c')
      const isViewSource = event.ctrlKey && key === 'u'

      if (isF12 || isInspectCombo || isViewSource) {
        event.preventDefault()
        event.stopPropagation()
      }
    },
    true,
  )

  // Sağ tık -> "Inspect" kaldırılır. Uygulama içinde bu menüye ihtiyaç yok.
  window.addEventListener('contextmenu', (event) => event.preventDefault())
}