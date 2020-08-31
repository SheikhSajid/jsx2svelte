<script>
  export let comment;
  $: ({ author, text, time: timestamp } = comment);
  let clickCounter = 0;
  let nameState = 'Old Name';
</script>

<div class="comment">
  <div class="comment-metadata">{author} · {timestamp}</div>

  <div>{nameState}</div>
  <button onClick={() => (nameState = 'New Name')}>
    Click here to change name
  </button>

  <div class="comment-body">
    {@html text}
  </div>

  <button on:click={() => (clickCounter += 1)}>Click here</button>
</div>
