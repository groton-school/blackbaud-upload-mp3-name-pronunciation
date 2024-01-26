// run when extension icon clicked
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.match(/^https:\/\/[^.]+\.myschoolapp.com/i))
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
