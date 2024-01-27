// run when extension icon clicked
chrome.action.onClicked.addListener(async (tab) => {
  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ['assets/css/styles.css']
  });
  chrome.scripting.executeScript({
    injectImmediately: true,
    target: { tabId: tab.id },
    world: 'MAIN',
    files: ['node_modules/papaparse/papaparse.min.js', 'scripts/inject.js']
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
