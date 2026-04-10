import { createBrowserRouter, type RouteObject } from "react-router-dom";

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
    path: "*",
    element: <NotFoundPage />,
  },
];

export const router = createBrowserRouter(routes);