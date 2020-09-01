import React, { useState } from 'react';
function dhorishNa() {
  return 'No bueno!';
}

function MyComp({ comment, kola: fruit }) {
  const { author, text, time: timestamp } = comment;

  const khabo = `Ammu ${fruit} khabo!`;

  const [clickCounter, setclickCounter] = useState(0);
  const countPlus1 = clickCounter + 1;

  return (
    <div className="comment">
      <div className="comment-metadata">
        {author} · {timestamp}
      </div>

      <div
        className="comment-body"
        dangerouslySetInnerHTML={{ __html: text }}
      ></div>

      <button onClick={() => setclickCounter(clickCounter + 1)}>
        Click here to increase count
      </button>
    </div>
  );
}

export default MyComp;
