async function upload({ mp3Url, userId }) {
  /*
   * name pronunciation instance
   *
   * It's unclear if this changes based on myschoolapp instance or not. I have
   * no real way of knowing -- I deduced it by watching the network requests
   * when I saved a new name pronunciation through the web GUI.
   */
  const app = 'unp-pusa01';

  // myschoolapp instance
  const instance = window.location.hostname;

  /*
   * package the mp3 pronunciation as a file with valid metadata (the only
   * part of filename that matters is the extension)
   */
  console.log('fetching mp3');
  const mp3 = await fetch(mp3Url);
  const body = new FormData();
  body.append(
    'FileContent',
    new File([await mp3.blob()], 'pronunciation.mp3', {
      type: 'audio/mpeg'
    })
  );
  console.log('mp3 packaged');

  // PUT the MP3 file to Blackbaud for the user
  console.log('fetching service token');
  const serviceToken = await (
    await fetch(`https://${instance}/api/security/servicetoken?scs=unp`)
  ).json();
  console.log(serviceToken);
  console.log('putting mp3');
  const response = await fetch(
    `https://${app}.app.blackbaud.net/namep/v1/usernamepronunciation/${userId}`,
    {
      method: 'put',
      headers: {
        Accept: 'application/json, text/plain, */*',
        Authorization: `Bearer ${await BBAuthClient.BBAuth.getToken()}`,
        'On-Scope': serviceToken.Token,
        Scs_code: 'unp'
      },
      body
    }
  );
  console.log((await response.text()) || response.status);
}

// run when extension icon clicked
chrome.action.onClicked.addListener(async (tab) => {
  chrome.scripting.executeScript({
    injectImmediately: true,
    target: { tabId: tab.id },
    world: 'MAIN',
    function: upload,
    args: [
      {
        mp3Url: 'https://example.com/pronunciation.mp3',
        userId: '1234567'
      }
    ]
  });
});

// disable action when not on a myschoolapp instance
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.disable();
  chrome.declarativeContent.onPageChanged.removeRules(undefined, async () => {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: '.myschoolapp.com' }
          })
        ],
        actions: [
          new chrome.declarativeContent.ShowAction(),
          new chrome.declarativeContent.SetIcon({
            // prettier-ignore
            imageData: await convertPathToImageData({
              '16': 'assets/images/logo-16px.png',
              '32': 'assets/images/logo-32px.png',
              '48': 'assets/images/logo-48px.png',
              '128': 'assets/images/logo-128px.png'
            })
          })
        ]
      }
    ]);
  });
});

/*
 * There's a bug in Chrome where they forgot to implement the path argument for
 * chrome.declarativeContent.SetIcon() (and thus the documentation is wrong).
 * @see https://code.google.com/p/chromium/issues/detail?id=462542
 * @see https://github.com/fregante/jdm/blob/75f4229b461880b40ceb1a39c82972561f94c89a/source/background.js/#L23-L33
 */
async function convertPathToImageData(path) {
  const imageData = {};
  for (const key in path) {
    const response = await fetch(chrome.runtime.getURL(path[key]));
    const blob = await response.blob();
    const image = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(image.width, image.height);
    const canvasContext = canvas.getContext('2d');
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    canvasContext.drawImage(image, 0, 0, canvas.width, canvas.height);
    imageData[key] = canvasContext.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
  }
  return imageData;
}
