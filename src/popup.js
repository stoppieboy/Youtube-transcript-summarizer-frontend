// 'use strict';

import './popup.css';
import axios from 'axios';

(function() {
  // We will make use of Storage API to get and store `count` value
  // More information on Storage API can we found at
  // https://developer.chrome.com/extensions/storage

  // To get storage access, we have to mention it in `permissions` property of manifest.json file
  // More information on Permissions can we found at
  // https://developer.chrome.com/extensions/declare_permissions
  const counterStorage = {
    get: cb => {
      chrome.storage.sync.get(['count'], result => {
        cb(result.count);
      });
    },
    set: (value, cb) => {
      chrome.storage.sync.set(
        {
          count: value,
        },
        () => {
          cb();
        }
      );
    },
  };

  function setupCounter(initialValue = 0) {
    document.getElementById('counter').innerHTML = initialValue;

    document.getElementById('incrementBtn').addEventListener('click', () => {
      updateCounter({
        type: 'INCREMENT',
      });
    });

    document.getElementById('decrementBtn').addEventListener('click', () => {
      updateCounter({
        type: 'DECREMENT',
      });
    });
  }

  function updateCounter({ type }) {
    counterStorage.get(count => {
      let newCount;

      if (type === 'INCREMENT') {
        newCount = count + 1;
      } else if (type === 'DECREMENT') {
        newCount = count - 1;
      } else {
        newCount = count;
      }

      counterStorage.set(newCount, () => {
        document.getElementById('counter').innerHTML = newCount;

        // Communicate with content script of
        // active tab by sending a message
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          const tab = tabs[0];

          chrome.tabs.sendMessage(
            tab.id,
            {
              type: 'COUNT',
              payload: {
                count: newCount,
              },
            },
            response => {
              console.log('Current count value passed to contentScript file');
            }
          );
        });
      });
    });
  }

  function restoreCounter() {
    // Restore count value
    counterStorage.get(count => {
      if (typeof count === 'undefined') {
        // Set counter value as 0
        counterStorage.set(0, () => {
          setupCounter(0);
        });
      } else {
        setupCounter(count);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', restoreCounter);

  // Communicate with background file by sending a message
  chrome.runtime.sendMessage(
    {
      type: 'GREETINGS',
      payload: {
        message: 'Hello, my name is Pop. I am from Popup.',
      },
    },
    response => {
      console.log(response.message);
    }
  );
  // chrome.tabs.query({lastFocusedWindow: true, active: true}, function(tabs){
  //   console.log("url",tabs[0].url);
  //   const query_string = /^[^#?]*(\?[^#]+|)/.exec(tabs[0].url)[1];
  //   const video_id = /v=([^&]*)/.exec(query_string)[1];
  //   console.log("This is something: ",query_string);
  //   console.log("this is the video id:", video_id);
  //   axios.get(`http://locahost:5000/get_transcript/${video_id}`);
  // });
  async function getTranscript() {
    let queryOptions = { active: true, lastFocusedWindow: true};
    let [tab] = await chrome.tabs.query(queryOptions);
    const query_string = /^[^#?]*(\?[^#]+|)/.exec(tab.url)[1];
    const video_id = /v=([^&]*)/.exec(query_string)[1];
    const {data} = await axios.get(`http://localhost:5000/get_transcript/${video_id}`);

    console.log("transcript recieved:",data);
    document.getElementById('transcript').innerHTML = data;
    localStorage.setItem("tabName",tab);
    return tab;
  }
  
  getTranscript().then((data) => console.log("Tab data",data)).catch(err=>console.log(err));
})();
