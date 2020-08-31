<script>
  const { author, text, time: timestamp } = comment;

  const [clickCounter, setclickCounter] = useState(0);
</script>

<div className="comment">
  <div className="comment-metadata">{author} · {timestamp}</div>

  <div
    className="comment-body"
    dangerouslySetInnerHTML={{ __html: text }} />

  <button onClick={() => setclickCounter(clickCounter + 1)}>
    Click here to increase count
  </button>
</div>
