import {ipcRenderer} from 'electron';
import React from 'react';
import ReactDOM from 'react-dom';
import styles from './packager.css';
import appendHTML from '!raw-loader!./append.html';

const editorWindowId = +(new URLSearchParams(location.search).get('editor_id'));

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
        this.iframe.contentWindow.postMessage({
          type: 'load-project',
          data,
          name
        });
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
    this.iframe.contentDocument.write(this.props.html);
    this.iframe.contentDocument.close();
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
    const decoded = new TextDecoder().decode(raw) + appendHTML;
    ReactDOM.render(<PackagerWindow html={decoded} />, require('../app-target'));
  })
  .catch((err) => {
    console.error(err);
    alert(err);
  });
