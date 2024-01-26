(async () => {
  /*
   * URL of MP3 pronunciation file and Blackbaud User ID associated with name
   * pronunciation
   */
  const mp3Source = 'https://example.com/pronunciation.mp3';
  const userId = '1234567';

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
  const mp3 = await fetch(mp3Source);
  const body = new FormData();
  body.append(
    'FileContent',
    new File([await mp3.blob()], 'prounciation.mp3', { type: 'audio/mpeg' })
  );

  // PUT the MP3 file to Blackbaud for the user
  const serviceToken = await (
    await fetch(`https://${instance}/api/security/servicetoken?scs=unp`)
  ).json();
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

  // visual confirmation
  console.log(response);
})();
