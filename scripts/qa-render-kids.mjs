/**
 * PRATIKSHYA FASHON — PHASE 22.2 RENDER QA
 *
 * Server-renders the three surfaces the phase touches and asserts on the real
 * output. A route returning 200 only proves the SPA shell loaded; this proves
 * the components actually render — a broken import, a bad prop, an undefined
 * map or a crashing selector fails here instead of in front of the user.
 *
 *   1. /admin/products/review    — the Kids finalization desk
 *   2. /employee/products/review — the assigned-products desk (authenticated)
 *   3. /category/kids            — the storefront cards
 *
 * Run: npm run qa:render
 */

/* ---- browser shims, installed before any application module loads ---- */
const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(String(key)) ? store.get(String(key)) : null),
  setItem: (key, value) => store.set(String(key), String(value)),
  removeItem: (key) => store.delete(String(key)),
  clear: () => store.clear(),
  key: (index) => [...store.keys()][index] ?? null,
  get length() {
    return store.size;
  },
};
globalThis.sessionStorage = globalThis.localStorage;
globalThis.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
});
globalThis.scrollTo = () => {};
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
globalThis.ResizeObserver = globalThis.IntersectionObserver;

const React = (await import("react")).default;
const { renderToStaticMarkup } = await import("react-dom/server");
const { MemoryRouter } = await import("react-router-dom");

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const renderAt = (element, path) =>
  renderToStaticMarkup(
    React.createElement(MemoryRouter, { initialEntries: [path] }, element)
  );

const imagesIn = (html) => [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);

/* ------------------------------------------------------------------ */
console.log("\n# 1. ADMIN — /admin/products/review");
/* ------------------------------------------------------------------ */

let adminHtml = "";
try {
  const Panel = (await import("../src/components/admin/AdminKidsFinalizationPanel.jsx")).default;
  adminHtml = renderAt(
    React.createElement(Panel, {
      actor: { adminId: "admin-root", name: "House Admin" },
      onNotice: () => {},
      focusId: null,
    }),
    "/admin/products/review"
  );
  check("finalization panel renders", adminHtml.length > 5000, `${adminHtml.length} chars`);
} catch (error) {
  check("finalization panel renders", false, error.message);
  console.error(error.stack?.split("\n").slice(0, 6).join("\n"));
}

if (adminHtml) {
  const ids = new Set([...adminHtml.matchAll(/KID-0\d{2}/g)].map((m) => m[0]));
  check("all 21 products in one place", ids.size === 21, `${ids.size} distinct Product IDs`);

  const files = new Set([...adminHtml.matchAll(/kids-0\d{2}\.webp/g)].map((m) => m[0]));
  check("every media filename shown", files.size === 21, `${files.size} distinct filenames`);

  const kidImages = imagesIn(adminHtml).filter((src) => /kids-0\d{2}/.test(src));
  check("every card shows its image", kidImages.length >= 21, `${kidImages.length} images`);
  check(
    "no image reused across cards",
    new Set(kidImages).size === kidImages.length,
    `${new Set(kidImages).size}/${kidImages.length} distinct`
  );

  check("search present", /type="search"/.test(adminHtml));
  ["Ready to publish", "Needs review", "Assigned", "Unassigned"].forEach((label) =>
    check(`filter “${label}”`, adminHtml.includes(label))
  );
  check("21-product checklist present", /21-product checklist/.test(adminHtml));
  ["Keep Existing", "Transfer to KID-", "Create Separate Product", "Review Later"].forEach(
    (label) => check(`conflict action “${label.replace("KID-", "KID-xxx")}”`, adminHtml.includes(label))
  );
  check("publish blockers listed with reasons", /Publishing blocked/.test(adminHtml));
  check(
    "explicit-decision warning shown",
    /Nothing is transferred, deleted or replaced silently/.test(adminHtml)
  );
  check("hover state reported", /Hover:/.test(adminHtml));
  check("media ownership reported", /Media ownership:/.test(adminHtml));
  check(
    "no placeholder/undefined leaked",
    !/\[object Object\]|>undefined<|>NaN</.test(adminHtml)
  );
}

/* ------------------------------------------------------------------ */
console.log("\n# 2. EMPLOYEE — /employee/products/review");
/* ------------------------------------------------------------------ */

try {
  const { default: Page } = await import("../src/pages/employee/EmployeeProductReview.jsx");
  const EmployeeAuthContext = (await import("../src/context/EmployeeAuthContext.jsx")).default;
  const { getEmployee, loadEmployees } = await import("../src/services/employees/employeeService.js");
  const { assignProductToEmployee } = await import("../src/services/productWorkflow.js");

  const MANAGER_ID = "PF-MGR-00008";
  const employee = getEmployee(loadEmployees(), MANAGER_ID);
  ["KID-001", "KID-002", "KID-003"].forEach((id) =>
    assignProductToEmployee(id, MANAGER_ID, { adminId: "admin-root", name: "House Admin" })
  );

  const html = renderAt(
    React.createElement(
      EmployeeAuthContext.Provider,
      {
        value: {
          employee,
          loading: false,
          error: "",
          signIn: () => {},
          signOut: () => {},
          hasPermission: () => true,
          hasAnyPermission: () => true,
          hasAllPermissions: () => true,
          canAccessPath: () => true,
        },
      },
      React.createElement(Page)
    ),
    "/employee/products/review"
  );

  check("employee desk renders authenticated", html.length > 2000, `${html.length} chars`);
  check("assigned Kids products listed", /KID-00[123]/.test(html));
  check("mandatory image present", imagesIn(html).some((src) => /kids-0\d{2}/.test(src)));
  check("media filename shown", /kids-0\d{2}\.webp/.test(html));
  check("inventory editable", /Inventory/i.test(html));
  check("price editable", /Price/i.test(html));
  check("Save Draft offered", /Save\s*(as)?\s*draft/i.test(html));
  check("Submit for Review offered", /Submit for review/i.test(html));
  check("no placeholder/undefined leaked", !/\[object Object\]|>NaN</.test(html));
} catch (error) {
  check("employee desk renders authenticated", false, error.message);
  console.error(error.stack?.split("\n").slice(0, 8).join("\n"));
}

/* ------------------------------------------------------------------ */
console.log("\n# 3. STOREFRONT — /category/kids");
/* ------------------------------------------------------------------ */

try {
  const { default: ProductCard } = await import("../src/design-system/components/ProductCard.jsx");
  const { getLiveStorefrontProducts } = await import("../src/data/products/index.js");
  const { getProductCardMedia } = await import("../src/services/media/productMediaSet.js");

  const kids = getLiveStorefrontProducts().filter((product) => product.category === "kidswear");
  check("published Kids products live", kids.length === 21, `${kids.length} live`);

  const html = renderAt(
    React.createElement(
      "div",
      null,
      kids.map((product) => React.createElement(ProductCard, { key: product.id, product }))
    ),
    "/category/kids"
  );
  check("all cards render", html.length > 5000, `${html.length} chars`);

  const srcs = imagesIn(html);
  check("one image per card", srcs.length === kids.length, `${srcs.length} images`);
  check("no image reused", new Set(srcs).size === srcs.length, `${new Set(srcs).size} distinct`);

  const wouldSwap = kids.filter((product) => getProductCardMedia(product).hoverImage !== undefined);
  check("hover = no change on standalone media", wouldSwap.length === 0, `${wouldSwap.length} would swap`);
  check("no draft leaked to the storefront", !/KID-0\d{2}/.test(html));
} catch (error) {
  check("storefront cards render", false, error.message);
  console.error(error.stack?.split("\n").slice(0, 8).join("\n"));
}

/* ------------------------------------------------------------------ */
const failed = results.filter((result) => !result.ok);
console.log(
  `\n${failed.length ? "RENDER QA FAIL" : "RENDER QA PASS"} — ${
    results.length - failed.length
  }/${results.length} checks`
);
if (failed.length) {
  failed.forEach((entry) => console.log(`  · ${entry.name} — ${entry.detail}`));
  process.exit(1);
}
