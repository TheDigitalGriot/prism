import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@prism-ui/styles/bridge.css"
import "./index.css"
import { App } from "./App"
import { PrismProviders } from "./Providers"
import { setTransport } from "@prism-ui/services/grpc-client-base"
import { electronApi } from "./electron"

// Register Electron transport before any gRPC clients initialize.
// electronApi only exposes postMessage; getState/setState are no-ops in Electron.
setTransport({
  postMessage: (msg) => electronApi.postMessage(msg),
  getState: () => undefined,
  setState: () => {},
})

const rootElement = document.getElementById("root")
if (!rootElement) {
  throw new Error("[Prism] #root element not found")
}

createRoot(rootElement).render(
  <StrictMode>
    <PrismProviders>
      <App />
    </PrismProviders>
  </StrictMode>,
)
