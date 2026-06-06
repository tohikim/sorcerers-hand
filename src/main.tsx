import React, { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { BackgroundMusic } from "./components/BackgroundMusic.tsx";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const OtherComponent = React.lazy(() =>
  Promise.all([import("./App.tsx"), delay(1500)]).then(
    ([moduleExports]) => moduleExports,
  ),
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BackgroundMusic src="../public/vault_bgm.mp3" volume={0.7} />

    <Suspense
      fallback={
        <div className="relative min-h-screen h-full w-full flex flex-col items-center justify-center gap-10 p-4 select-none bg-black">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at center, #2a3441 0%, #11161d 45%, #05070a 80%, #000000 100%)",
            }}
          />
          <div className="w-64 h-64 md:w-80 md:h-80 max-w-full relative z-10 drop-shadow-[0_0_35px_rgba(234,179,8,0.2)]">
            {" "}
            <DotLottieReact
              src="../public/loadingAnimation.lottie"
              autoplay
              loop
            />
          </div>
          <p className="text-white text-[2rem] md:text-[3rem] tracking-wider animate-pulse mt-8 text-center relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {" "}
            Unlocking the game... Tap to start
          </p>
        </div>
      }
    >
      <OtherComponent />
    </Suspense>
  </StrictMode>,
);
