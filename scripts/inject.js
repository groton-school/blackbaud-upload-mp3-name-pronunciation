(() => {
  const NS = 'umnptb';
  showModalFileUpload();

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
    const mp3 = await fetch(mp3Url);
    const body = new FormData();
    body.append(
      'FileContent',
      new File([await mp3.blob()], 'pronunciation.mp3', {
        type: 'audio/mpeg'
      })
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

    return { response: await response.text(), status: response.status };
  }

  function handleSubmit(e) {
    e.preventDefault();
    const file = this.querySelector('input[name="csv"]').files[0];
    Papa.parse(file, {
      header: true,
      complete: (result) => processUsers(result.data)
    });
  }

  async function processUsers(users) {
    const { progress, status } = showProgress();
    progress.max = users.length;
    for (let i = 0; i < users.length; i++) {
      const { userId, mp3Url, description } = users[i];
      if (userId && mp3Url) {
        status.innerText = description;
        users[i] = {
          ...users[i],
          ...(await upload({ userId, mp3Url }))
        };
      } else {
        users[i].error = 'missing data';
      }
      progress.value = i + 1;
    }
    showDownloadLink(users);
  }

  function showModalFileUpload() {
    const scrim = document.createElement('div');
    scrim.classList.add('scrim', NS);

    scrim.innerHTML = `
      <div class="content">
        <div class="header">
          <h1>Upload MP3 Name Pronunciations</h1>
        </div>
        <div class="body">
          <p><a href="https://groton-school.github.io/upload-mp3-name-pronunciation-to-blackbaud/template.csv">Download template</a></p>
          <form>
            <input name="csv" type="file" accept=".csv" />
            <button type="submit">Submit</button>
          </form>
          </div>
      </div>
    `;
    document.body.appendChild(scrim);

    const form = q('form');
    form.addEventListener('submit', handleSubmit.bind(form));
  }

  function showProgress() {
    q('.body').innerHTML = `
      <progress></progress>
      <div class="status"></div>
    `;
    return {
      progress: q('progress'),
      status: q('.status')
    };
  }

  function showDownloadLink(users) {
    q('.body').innerHTML = `
      <div>
        <a href="data:text/csv;base64,${btoa(
          Papa.unparse(users)
        )}" download="${new Date().toISOString()} users-mp3-upload.csv">Download report</a>
      </div>
    `;
    q('a').addEventListener('click', hideModal);
  }

  function hideModal() {
    q().remove();
  }

  function q(selector = '') {
    return document.querySelector(`.${NS} ${selector}`);
  }
})();
