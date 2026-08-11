import { BrowserRouter, Route, Routes } from "react-router-dom";
import { routeManifest } from "./config/navigationConfig";
import CustomerLayout from "./layouts/CustomerLayout";
import AtelierDesign from "./pages/AtelierDesign";
import CategoryPage from "./pages/CategoryPage";
import NotFound from "./pages/NotFound";

/**
 * Routing.
 *
 * Every customer-facing route is nested inside `CustomerLayout`, so the
 * header, footer and page transition are declared once. The interior
 * routes are generated from the route manifest in
 * `src/config/navigationConfig.js` — the same source the navigation, the
 * mega menu, the drawer and the breadcrumbs read from, so a destination
 * can never appear in the menu without resolving.
 *
 * The landing page keeps the index route and its own full-bleed
 * composition; the shell simply frames it.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route index element={<AtelierDesign />} />

          {routeManifest.map((route) => (
            <Route key={route.path} path={route.path} element={<CategoryPage />} />
          ))}

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
