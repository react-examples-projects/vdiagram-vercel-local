import { Toaster } from "sonner";
import "@/styles/globals.scss";
import "inter-ui/inter.css";
import "@xyflow/react/dist/style.css";
import "rc-slider/assets/index.css";

import { GeistProvider, CssBaseline } from "@geist-ui/core";
import { ReactFlowProvider } from "@xyflow/react";
import useConfig from "@/hooks/useConfig";

export default function App({ Component, pageProps }) {
  const { theme } = useConfig();
  return (
    <>
      <GeistProvider themeType={theme}>
        <CssBaseline />
        <ReactFlowProvider>
          <Component {...pageProps} />
        </ReactFlowProvider>
      </GeistProvider>

      <Toaster
        position="top-right"
        visibleToasts={4}
        theme={theme}
        expand={true}
        richColors
        closeButton
      />
    </>
  );
}
