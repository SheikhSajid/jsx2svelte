import React, { useState } from 'react';

export default ({ comment }) => {
  const { author, text, time: timestamp } = comment;

  const [clickCounter, setclickCounter] = useState(0);
  const nameState = useState('Old Name');

  return (
    <div className="comment">
      <div className="comment-metadata">
        {author} · {timestamp}
      </div>

      <div>{nameState[0]}</div>
      <button onClick={() => nameState[1]('New Name')}>
        Click here to change name
      </button>

      <div
        className="comment-body"
        dangerouslySetInnerHTML={{ __html: text }}
      ></div>

      <button onClick={() => setclickCounter(clickCounter + 1)}>
        Click here to increase count
      </button>
    </div>
  );
};
