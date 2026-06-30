<script lang="ts">
  import { onMount } from "svelte";
  import Header from "./components/Header.svelte";
  import Dashboard from "./components/Dashboard.svelte";
  import Settings from "./components/Settings.svelte";
  import Footer from "./components/Footer.svelte";
  import { t } from "./lib/i18n";
  import { loadAllData, refreshAllAccounts, startAutoRefresh } from "./lib/stores";
  import { onDataChanged, onWindowShown } from "./lib/api";

  let activeView = $state<"dashboard" | "settings">("dashboard");

  onMount(() => {
    const unsubs: Array<() => void> = [];
    (async () => {
      await loadAllData();
      startAutoRefresh();
      unsubs.push(await onDataChanged(() => void refreshAllAccounts()));
      unsubs.push(await onWindowShown(() => void refreshAllAccounts()));
    })();
    return () => unsubs.forEach((u) => u());
  });
</script>

<div class="widget-layout">
  <Header
    {activeView}
    onHome={() => (activeView = "dashboard")}
    onToggleSettings={() =>
      (activeView = activeView === "dashboard" ? "settings" : "dashboard")}
  />

  <main class="widget-content">
    {#if activeView === "dashboard"}
      <Dashboard onGoToSettings={() => (activeView = "settings")} />
    {:else}
      <Settings onAdded={() => (activeView = "dashboard")} />
    {/if}
  </main>

  <Footer />
</div>
