// /js/partials
(function () {
  function getRootPrefix() {
    const path = window.location.pathname.replace(/\/+$/, "");
    if (!path || path === "") return "";

    const segments = path.split("/").filter(Boolean);
    if (!segments.length) return "";

    const isFile = /\.[a-z0-9]+$/i.test(segments[segments.length - 1]);
    const depth = isFile ? segments.length - 1 : segments.length;
    return depth > 0 ? "../".repeat(depth) : "";
  }

  function rewriteLocalPath(value, rootPrefix) {
    if (!value || !value.startsWith("/") || value.startsWith("//")) return value;
    const trimmed = value.slice(1);
    return trimmed ? `${rootPrefix}${trimmed}` : (rootPrefix || "./");
  }

  function rewriteFragmentPaths(fragment, rootPrefix) {
    fragment.querySelectorAll("[href], [src]").forEach((node) => {
      ["href", "src"].forEach((attr) => {
        if (!node.hasAttribute(attr)) return;
        node.setAttribute(attr, rewriteLocalPath(node.getAttribute(attr), rootPrefix));
      });
    });
  }

  async function inject(targetSelector, file, rootPrefix) {
    const mount = document.querySelector(targetSelector);
    if (!mount) return;

    const url = `${rootPrefix}partials/${file}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const html = await res.text();
      const template = document.createElement("template");
      template.innerHTML = html.trim();
      rewriteFragmentPaths(template.content, rootPrefix);
      mount.replaceWith(template.content);
    } catch (err) {
      console.error("Include failed:", url, err);
    }
  }

  async function run() {
    const rootPrefix = getRootPrefix();

    await inject('[data-include="header"]', "header.html", rootPrefix);
    await inject('[data-include="footer"]', "footer.html", rootPrefix);

    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  if (document.readyState !== "loading") run();
  else document.addEventListener("DOMContentLoaded", run);
})();

