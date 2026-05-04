import { createBrowserRouter, type RouteObject } from "react-router-dom";

import BenchmarkPage from "../../pages/BenchmarkPage";
import HomePage from "../../pages/HomePage";
import NotFoundPage from "../../pages/NotFoundPage";
import PredictionPage from "../../pages/PredictionPage";
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/prediction",
    element: <PredictionPage />,
  },
  {
  path: "/benchmark",
  element: <BenchmarkPage />,
},
  {
    path: "*",
    element: <NotFoundPage />,
  },
];

export const router = createBrowserRouter(routes);