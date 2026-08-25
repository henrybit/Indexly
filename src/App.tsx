import { ConnectionProvider } from "./context/ConnectionContext";
import { ConnectionPanel } from "./components/connection/ConnectionPanel";
import { ExpirationPanel } from "./components/expiration/ExpirationPanel";
import { IndicesPanel } from "./components/indices/IndicesPanel";
import { AppShell } from "./components/layout/AppShell";
import { Workspace } from "./components/layout/Workspace";

function App() {
  return (
    <ConnectionProvider>
      <AppShell sidebar={<ConnectionPanel />}>
        <Workspace indices={<IndicesPanel />} expiration={<ExpirationPanel />} />
      </AppShell>
    </ConnectionProvider>
  );
}

export default App;
