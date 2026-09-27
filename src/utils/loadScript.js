const loading = {};

/** Adds a third-party <script> once (Google / Facebook sign-in SDKs); resolves when it has loaded. */
export function loadScript(src) {
  if (!loading[src]) {
    loading[src] = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => {
        delete loading[src];
        reject(new Error(`Could not load ${src}`));
      };
      document.head.appendChild(script);
    });
  }
  return loading[src];
}
