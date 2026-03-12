// /js/partials
(function () {
  function getProjectRoot() {
    const currentScript = document.currentScript;
    if (currentScript && currentScript.src) {
      return new URL("../", currentScript.src);
    }

    const script = document.querySelector('script[src$="js/partials.js"]');
    if (script && script.src) {
      return new URL("../", script.src);
    }

    return new URL("./", window.location.href);
  }

  function rewriteLocalPath(value, projectRoot) {
    if (!value || !value.startsWith("/") || value.startsWith("//")) return value;
    return new URL(value.slice(1), projectRoot).toString();
  }

  function rewriteFragmentPaths(fragment, projectRoot) {
    fragment.querySelectorAll("[href], [src]").forEach((node) => {
      ["href", "src"].forEach((attr) => {
        if (!node.hasAttribute(attr)) return;
        node.setAttribute(attr, rewriteLocalPath(node.getAttribute(attr), projectRoot));
      });
    });
  }

  async function inject(targetSelector, file, projectRoot) {
    const mount = document.querySelector(targetSelector);
    if (!mount) return;

    const url = new URL(`partials/${file}`, projectRoot);
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const html = await res.text();
      const template = document.createElement("template");
      template.innerHTML = html.trim();
      rewriteFragmentPaths(template.content, projectRoot);
      mount.replaceWith(template.content);
    } catch (err) {
      console.error("Include failed:", url.toString(), err);
    }
  }

  async function run() {
    const projectRoot = getProjectRoot();

    await inject('[data-include="header"]', "header.html", projectRoot);
    await inject('[data-include="footer"]', "footer.html", projectRoot);

    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  if (document.readyState !== "loading") run();
  else document.addEventListener("DOMContentLoaded", run);
})();

