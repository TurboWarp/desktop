import {ipcRenderer} from 'electron';
import React from 'react';
import ReactDOM from 'react-dom';
import styles from './packager.css';

const editorWindowId = +(new URLSearchParams(location.search).get('editor_id'));

const loadHTML = (iframe, html) => {
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();

  iframe.contentWindow.open = (url) => {
    // Electron isn't able to open blob: URIs directly, so we'll open a blank window and write the blob to it manually.
    const newWindow = window.open('about:blank');
    fetch(url)
      .then((r) => r.text())
      .then((text) => {
        newWindow.document.write(text);
      });
    return newWindow;
  };
};

const setProject = (iframe, data, name) => {
  const fileTypeRadio = iframe.contentDocument.querySelector('input[type=radio][value=file]');
  fileTypeRadio.click();

  const file = new File([data], `${name}.sb3`);
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);

  const fileInput = iframe.contentDocument.querySelector('input[type=file]');
  fileInput.files = dataTransfer.files;
  fileInput.dispatchEvent(new Event('change'));
};

class PackagerWindow extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      waitingForEditor: false
    };
    this.iframe = null;
    this.frameRef = this.frameRef.bind(this);
    this.handleCancelWaitingForEditor = this.handleCancelWaitingForEditor.bind(this);
  }
  componentDidMount () {
    ipcRenderer.on('export-project/ack', () => {
      this.setState({
        waitingForEditor: true
      });
    });
    ipcRenderer.on('export-project/done', (event, {data, name}) => {
      if (this.state.waitingForEditor) {
        setProject(this.iframe, data, name);
        this.setState({
          waitingForEditor: false
        });
      }
    });
    ipcRenderer.on('export-project/error', () => {
      this.setState({
        waitingForEditor: false
      });
    });
    ipcRenderer.sendTo(editorWindowId, 'export-project/start');
  }
  frameRef (iframe) {
    this.iframe = iframe;
    loadHTML(this.iframe, this.props.html);
  }
  handleCancelWaitingForEditor () {
    this.setState({
      waitingForEditor: false
    });
  }
  render () {
    return (
      <main>
        {this.state.waitingForEditor && (
          <div className={styles.exporting}>
            <div className={styles.exportingText}>
              Loading project
            </div>
            <button
              onClick={this.handleCancelWaitingForEditor}
              className={styles.cancel}
            >
              Cancel
            </button>
          </div>
        )}
        <iframe ref={this.frameRef} />
      </main>
    );
  }
}

ipcRenderer.invoke('get-packager-html')
  .then((raw) => {
    const decoded = new TextDecoder().decode(raw);
    ReactDOM.render((
      <PackagerWindow html={decoded} />
    ), require('../app-target'));
  })
  .catch((err) => {
    console.error(err);
    alert(err);
  });
