<script lang="ts">
  import { accounts } from "../lib/stores";
  import AccountCard from "./AccountCard.svelte";
  import EmptyState from "./EmptyState.svelte";

  let { onGoToSettings }: { onGoToSettings: () => void } = $props();
</script>

<section class="view-panel active">
  {#if $accounts.length === 0}
    <EmptyState {onGoToSettings} />
  {:else}
    <div class="accounts-grid">
      {#each $accounts as account (account.id)}
        <AccountCard {account} />
      {/each}
    </div>
  {/if}
</section>
