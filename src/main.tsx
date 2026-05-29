import React, { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const OtherComponent = React.lazy(() => import("./App.tsx"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense
      fallback={
        <div
          className="relative min-h-screen h-full w-full overflow-y-auto flex items-center justify-center p-4 md:p-8 select-none bg-[#0a2012]"
          style={{
            background:
              "radial-gradient(circle at center, #1b5e20 0%, #0c3816 40%, #051a0b 85%, #020a04 100%)",
          }}
        >
          <div className="flex items-center justify-center w-full h-screen absolute inset-0 opacity-5 mix-blend-overlay pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[16px_16px]" />
          <p className="text-white text-[2rem]">Loading...</p>
        </div>
      }
    >
      <OtherComponent />
    </Suspense>
  </StrictMode>,
);
