<script>
  export let comment;
  export let fruit;

  $: ({ author, text, time: timestamp } = comment);
  $: khabo = `Ammu ${fruit} khabo!`;

  const clickCounter = 0;
  $: countPlus1 = clickCounter + 1;
</script>

<div className="comment">
  <div className="comment-metadata">{author} · {timestamp}</div>

  <div className="comment-body">
    {@html text}
  </div>

  <button onClick={() => clickCounter + 1}>
    Click here to increase count
  </button>
</div>
