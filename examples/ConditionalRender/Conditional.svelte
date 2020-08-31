<script>
  export let comment;
  $: ({ author, text, time: timestamp } = comment);
  let clickCounter = 0;
</script>

<div class="comment">
  <div class="comment-metadata">{author} · {timestamp}</div>

  <div class="comment-body">
    {@html text}
  </div>

  {#if clickCounter <= 5}
    <!-- ClickButton -->
    <button on:click={() => (clickCounter += 1)}>Click here</button>
  {:else}
    <!-- Msg -->
    <p>More than 5 clicks! No more allowed!!</p>
  {/if}
</div>
