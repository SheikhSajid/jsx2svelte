import React, { useState } from 'react';

export default ({ comment }) => {
  const { author, text, time: timestamp } = comment;

  const [clickCounter, setclickCounter] = useState(0);

  const clickButton = (
    <button onClick={() => setclickCounter(clickCounter + 1)}>
      Click here
    </button>
  );

  const msg = <p>More than 5 clicks! No more allowed!!</p>;

  return (
    <div className="comment">
      <div className="comment-metadata">
        {author} · {timestamp}
      </div>

      <div
        className="comment-body"
        dangerouslySetInnerHTML={{ __html: text }}
      ></div>

      {clickCounter <= 5 ? { clickButton } : { msg }}
    </div>
  );
};
